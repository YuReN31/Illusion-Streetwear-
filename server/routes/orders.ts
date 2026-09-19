import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index";
import {
  orders,
  orderItems,
  orderStatusHistory,
  products,
  productVariants,
  siteSettings,
} from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { optionalAuth, requireAuth, rateLimiter, type AuthRequest } from "../auth";

export const ordersRouter = Router();

function generateOrderCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // removed easily confused 0, 1, I, O
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PED-${result}`;
}

const createOrderSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional().default(""),
  deliveryAddress: z.string().min(3, "Delivery address is required"),
  city: z.string().optional().default("Maputo"),
  postalCode: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  items: z.array(
    z.object({
      slug: z.string(),
      size: z.string(),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    })
  ).min(1, "Order must contain at least one item"),
});

// POST /api/orders (Create order)
ordersRouter.post("/", rateLimiter(10, 60 * 1000), optionalAuth, async (req: AuthRequest, res) => {
  try {
    const parse = createOrderSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message, errorKey: "validationError" });
      return;
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      city,
      postalCode,
      notes,
      items,
    } = parse.data;

    // Load WhatsApp & store settings
    const settingsRow = await db.select().from(siteSettings).where(eq(siteSettings.key, "store_config")).limit(1);
    let storeConfig = {
      whatsapp: {
        number: "+258840000000",
        active: true,
        defaultMessagePt: "Olá! Fiz um pedido no site Illusion Streetwear.\n\nCódigo do pedido: {ORDER_CODE}\nNome: {CUSTOMER_NAME}\nTotal: {TOTAL}\n\nGostaria de saber os meios de pagamento e os próximos passos.",
        defaultMessageEn: "Hello! I placed an order on Illusion Streetwear.\n\nOrder code: {ORDER_CODE}\nName: {CUSTOMER_NAME}\nTotal: {TOTAL}\n\nI would like to know the payment methods and next steps.",
      },
    };

    if (settingsRow.length > 0) {
      try {
        storeConfig = JSON.parse(settingsRow[0].value);
      } catch (e) {
        console.error("Failed to parse store config:", e);
      }
    }

    // Server-side validation of stock and prices
    const validatedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const prodList = await db.select().from(products).where(eq(products.slug, item.slug)).limit(1);
      if (prodList.length === 0) {
        res.status(400).json({
          error: `Product "${item.slug}" not found`,
          errorKey: "productNotFound",
        });
        return;
      }
      const prod = prodList[0];

      // Find variant for the requested size
      const varList = await db
        .select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.productId, prod.id),
            eq(productVariants.size, item.size)
          )
        )
        .limit(1);

      if (varList.length === 0) {
        res.status(400).json({
          error: `Size "${item.size}" unavailable for "${prod.namePt}"`,
          errorKey: "sizeUnavailable",
        });
        return;
      }

      const variant = varList[0];

      // Check stock
      if (variant.stock < item.quantity) {
        res.status(400).json({
          error: `Insufficient stock for "${prod.namePt}" (${item.size}). Available: ${variant.stock}`,
          errorKey: "insufficientStock",
          availableStock: variant.stock,
          productName: prod.namePt,
          size: item.size,
        });
        return;
      }

      const effectivePrice = prod.promoPrice ?? prod.price;
      const lineSubtotal = effectivePrice * item.quantity;
      calculatedSubtotal += lineSubtotal;

      validatedItems.push({
        product: prod,
        variant,
        quantity: item.quantity,
        effectivePrice,
        lineSubtotal,
      });
    }

    const calculatedTotal = calculatedSubtotal;
    const now = Date.now();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days retention

    // Generate unique order code
    let orderCode = generateOrderCode();
    let collisionCheck = await db.select().from(orders).where(eq(orders.orderCode, orderCode)).limit(1);
    while (collisionCheck.length > 0) {
      orderCode = generateOrderCode();
      collisionCheck = await db.select().from(orders).where(eq(orders.orderCode, orderCode)).limit(1);
    }

    // Build WhatsApp message
    const formattedTotal = `${calculatedTotal.toLocaleString("pt-MZ")} MT`;
    const messageTemplate = storeConfig.whatsapp?.defaultMessagePt ||
      "Olá! Fiz um pedido no site Illusion Streetwear.\n\nCódigo do pedido: {ORDER_CODE}\nNome: {CUSTOMER_NAME}\nTotal: {TOTAL}\n\nGostaria de saber os meios de pagamento e os próximos passos.";

    const whatsappMessage = messageTemplate
      .replace(/{ORDER_CODE}/g, orderCode)
      .replace(/{CUSTOMER_NAME}/g, customerName)
      .replace(/{TOTAL}/g, formattedTotal);

    const rawPhone = storeConfig.whatsapp?.number || "+258840000000";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    const isWhatsappActive = storeConfig.whatsapp?.active !== false;

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Create Order
    await db.insert(orders).values({
      id: orderId,
      orderCode,
      userId: req.user?.id || null,
      customerName,
      customerEmail: customerEmail.toLowerCase().trim(),
      customerPhone: customerPhone || "",
      deliveryAddress,
      city: city || "Maputo",
      postalCode: postalCode || "",
      notes: notes || "",
      subtotal: calculatedSubtotal,
      total: calculatedTotal,
      status: "NEW",
      whatsappUrl,
      whatsappMessage,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    // Create Immutable Order Items Snapshot & Decrement Stock
    for (const item of validatedItems) {
      await db.insert(orderItems).values({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        orderId,
        productId: item.product.id,
        variantId: item.variant.id,
        nameAtPurchase: item.product.namePt,
        nameEnAtPurchase: item.product.nameEn,
        skuAtPurchase: item.variant.sku,
        colorAtPurchase: item.variant.color || item.product.color,
        sizeAtPurchase: item.variant.size,
        quantity: item.quantity,
        unitPriceAtPurchase: item.product.price,
        promoPriceAtPurchase: item.product.promoPrice,
        subtotal: item.lineSubtotal,
        imageAtPurchase: item.product.image,
        createdAt: now,
      });

      // Safely decrement stock
      const newStock = Math.max(0, item.variant.stock - item.quantity);
      await db
        .update(productVariants)
        .set({
          stock: newStock,
          isAvailable: newStock > 0 ? 1 : 0,
          updatedAt: now,
        })
        .where(eq(productVariants.id, item.variant.id));
    }

    // Record initial status history
    await db.insert(orderStatusHistory).values({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId,
      previousStatus: "NONE",
      newStatus: "NEW",
      changedByUserId: req.user?.id || null,
      changedByName: customerName,
      note: "Order placed by customer",
      createdAt: now,
    });

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        orderCode,
        total: calculatedTotal,
        subtotal: calculatedSubtotal,
        customerName,
        customerEmail,
        status: "NEW",
        createdAt: now,
        whatsappUrl,
        whatsappMessage,
        whatsappActive: isWhatsappActive,
        itemsCount: validatedItems.length,
      },
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order", errorKey: "serverError" });
  }
});

// GET /api/orders/my (Customer's own orders)
ordersRouter.get("/my", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, req.user!.id))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = [];
    for (const o of userOrders) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
      ordersWithItems.push({
        ...o,
        items,
      });
    }

    res.json(ordersWithItems);
  } catch (error) {
    console.error("Error fetching my orders:", error);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// GET /api/orders/:orderCode (Lookup by code)
ordersRouter.get("/lookup/:orderCode", async (req, res) => {
  try {
    const { orderCode } = req.params;
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.orderCode, orderCode.toUpperCase().trim()))
      .limit(1);

    if (orderList.length === 0) {
      res.status(404).json({ error: "Order not found", errorKey: "orderNotFound" });
      return;
    }

    const order = orderList[0];
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const history = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(desc(orderStatusHistory.createdAt));

    res.json({
      order,
      items,
      history,
    });
  } catch (error) {
    console.error("Lookup error:", error);
    res.status(500).json({ error: "Failed to load order" });
  }
});
