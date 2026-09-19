import { Router } from "express";
import { z } from "zod";
import { put } from "@vercel/blob";
import { db } from "../db/index";
import {
  products,
  productVariants,
  categories,
  orders,
  orderItems,
  orderStatusHistory,
  users,
  siteSettings,
  homepageSections,
  banners,
  adminAuditLogs,
} from "../db/schema";
import { eq, desc, asc, like, or, and, sql } from "drizzle-orm";
import { requireAdmin, type AuthRequest } from "../auth";

export const adminRouter = Router();

// Apply admin protection to all routes in this router
adminRouter.use(requireAdmin);

// Helper for audit logging
async function logAudit(req: AuthRequest, action: string, details: string) {
  try {
    await db.insert(adminAuditLogs).values({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: req.user?.id || null,
      userName: req.user?.name || "Admin",
      action,
      details,
      ipAddress: req.ip || "",
      createdAt: Date.now(),
    });
  } catch (e) {
    console.error("Failed to log audit:", e);
  }
}

// -------------------------------------------------------------
// 1. PRODUCTS
// -------------------------------------------------------------
adminRouter.get("/products", async (req, res) => {
  try {
    const allProducts = await db.select().from(products).orderBy(asc(products.order), desc(products.createdAt));
    const allVariants = await db.select().from(productVariants);

    const variantsByProd = new Map<string, typeof allVariants>();
    for (const v of allVariants) {
      if (!variantsByProd.has(v.productId)) variantsByProd.set(v.productId, []);
      variantsByProd.get(v.productId)!.push(v);
    }

    const result = allProducts.map((p) => {
      const vars = variantsByProd.get(p.id) || [];
      const stock = vars.reduce((sum, v) => sum + v.stock, 0);
      return {
        id: p.id,
        slug: p.slug,
        name: p.namePt,
        namePt: p.namePt,
        nameEn: p.nameEn,
        category: p.categorySlug,
        price: p.price,
        promoPrice: p.promoPrice,
        stock,
        status: p.isPublished ? ("published" as const) : ("draft" as const),
        image: p.image,
        sku: vars[0]?.sku || `ILL-${p.slug}`,
        collection: p.collection,
        variants: vars,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Admin products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

adminRouter.post("/products", async (req: AuthRequest, res) => {
  try {
    const { name, category, price, stock, status, image, sku, collection, description } = req.body;
    if (!name || price == null) {
      res.status(400).json({ error: "Name and price are required" });
      return;
    }

    const now = Date.now();
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-") + `-${Date.now().toString().slice(-4)}`;

    const productId = `prod_${Date.now()}`;
    const defaultSizes = ["XS", "S", "M", "L", "XL"];

    await db.insert(products).values({
      id: productId,
      slug,
      namePt: name,
      nameEn: name,
      descriptionPt: description || "Peça de alfaiataria urbana com acabamento superior.",
      descriptionEn: description || "Urban tailoring piece with superior architectural finish.",
      price: Number(price),
      promoPrice: null,
      currency: "MZN",
      categorySlug: category || "outerwear",
      color: "Charcoal",
      image: image || "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=85",
      collection: collection || "SS—26 / Drop 01",
      isPublished: status === "published" ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });

    const parsedStock = Math.max(0, Number(stock) || 0);
    const stockPerSize = Math.floor(parsedStock / defaultSizes.length);

    for (let i = 0; i < defaultSizes.length; i++) {
      const size = defaultSizes[i];
      const s = i === 0 ? stockPerSize + (parsedStock % defaultSizes.length) : stockPerSize;
      await db.insert(productVariants).values({
        id: `var_${productId}_${size.toLowerCase()}`,
        productId,
        size,
        sku: `${sku || "ILL-NEW"}-${size}`,
        stock: s,
        isAvailable: s > 0 ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    await logAudit(req, "CREATE_PRODUCT", `Created product ${name} (${slug})`);
    res.status(201).json({ id: productId, slug, success: true });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

adminRouter.put("/products/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, status, image, collection, stock } = req.body;

    const prod = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (prod.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const now = Date.now();
    await db
      .update(products)
      .set({
        namePt: name || prod[0].namePt,
        categorySlug: category || prod[0].categorySlug,
        price: price != null ? Number(price) : prod[0].price,
        isPublished: status === "published" ? 1 : 0,
        image: image || prod[0].image,
        collection: collection || prod[0].collection,
        updatedAt: now,
      })
      .where(eq(products.id, id));

    if (stock != null) {
      // distribute stock across variants
      const vars = await db.select().from(productVariants).where(eq(productVariants.productId, id));
      if (vars.length > 0) {
        const perVar = Math.floor(Number(stock) / vars.length);
        for (let i = 0; i < vars.length; i++) {
          const s = i === 0 ? perVar + (Number(stock) % vars.length) : perVar;
          await db
            .update(productVariants)
            .set({ stock: s, isAvailable: s > 0 ? 1 : 0, updatedAt: now })
            .where(eq(productVariants.id, vars[i].id));
        }
      }
    }

    await logAudit(req, "UPDATE_PRODUCT", `Updated product ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

adminRouter.delete("/products/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await db.delete(productVariants).where(eq(productVariants.productId, id));
    await db.delete(products).where(eq(products.id, id));
    await logAudit(req, "DELETE_PRODUCT", `Deleted product ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

adminRouter.patch("/products/:id/toggle", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const prod = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (prod.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const nextStatus = prod[0].isPublished === 1 ? 0 : 1;
    await db.update(products).set({ isPublished: nextStatus, updatedAt: Date.now() }).where(eq(products.id, id));
    await logAudit(req, "TOGGLE_PRODUCT", `Toggled publish state for ${id} to ${nextStatus}`);
    res.json({ isPublished: nextStatus === 1 });
  } catch (error) {
    console.error("Toggle product error:", error);
    res.status(500).json({ error: "Failed to toggle product status" });
  }
});

adminRouter.patch("/products/:id/stock", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body;
    const vars = await db.select().from(productVariants).where(eq(productVariants.productId, id));
    if (vars.length === 0) {
      res.status(404).json({ error: "No variants found" });
      return;
    }

    const targetVar = vars[0];
    const newStock = Math.max(0, targetVar.stock + Number(delta));
    await db
      .update(productVariants)
      .set({ stock: newStock, isAvailable: newStock > 0 ? 1 : 0, updatedAt: Date.now() })
      .where(eq(productVariants.id, targetVar.id));

    res.json({ success: true, stock: newStock });
  } catch (error) {
    console.error("Stock error:", error);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

// -------------------------------------------------------------
// 2. ORDERS MANAGEMENT
// -------------------------------------------------------------
adminRouter.get("/orders", async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = db.select().from(orders).orderBy(desc(orders.createdAt));

    const allOrders = await query;
    let filtered = allOrders;

    if (status && status !== "All") {
      filtered = filtered.filter((o) => o.status === status);
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      filtered = filtered.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q)
      );
    }

    res.json(
      filtered.map((o) => ({
        id: o.orderCode,
        rawId: o.id,
        customer: o.customerName,
        email: o.customerEmail,
        total: o.total,
        status: o.status,
        date: new Date(o.createdAt).toLocaleDateString("pt-MZ", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: o.createdAt,
      }))
    );
  } catch (error) {
    console.error("Admin orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

adminRouter.get("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const orderList = await db
      .select()
      .from(orders)
      .where(or(eq(orders.id, id), eq(orders.orderCode, id)))
      .limit(1);

    if (orderList.length === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = orderList[0];
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const history = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(desc(orderStatusHistory.createdAt));

    res.json({ order, items, history });
  } catch (error) {
    console.error("Admin order detail error:", error);
    res.status(500).json({ error: "Failed to fetch order detail" });
  }
});

adminRouter.patch("/orders/:id/status", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const orderList = await db
      .select()
      .from(orders)
      .where(or(eq(orders.id, id), eq(orders.orderCode, id)))
      .limit(1);

    if (orderList.length === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = orderList[0];
    const previousStatus = order.status;
    const now = Date.now();

    // Map UI statuses if needed:
    // UI may pass "Paid" -> "PAYMENT_CONFIRMED", "Processing" -> "PREPARING", "Shipped" -> "SHIPPED", "Cancelled" -> "CANCELLED"
    let standardizedStatus = status;
    if (status === "Paid") standardizedStatus = "PAYMENT_CONFIRMED";
    else if (status === "Processing") standardizedStatus = "PREPARING";
    else if (status === "Shipped") standardizedStatus = "SHIPPED";
    else if (status === "Cancelled") standardizedStatus = "CANCELLED";

    await db
      .update(orders)
      .set({ status: standardizedStatus, updatedAt: now })
      .where(eq(orders.id, order.id));

    // Record Status History
    await db.insert(orderStatusHistory).values({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId: order.id,
      previousStatus,
      newStatus: standardizedStatus,
      changedByUserId: req.user?.id || null,
      changedByName: req.user?.name || "Admin",
      note: note || "",
      createdAt: now,
    });

    // If changing to CANCELLED and was not previously cancelled, replenish inventory
    if (standardizedStatus === "CANCELLED" && previousStatus !== "CANCELLED") {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      for (const item of items) {
        if (item.variantId) {
          const v = await db.select().from(productVariants).where(eq(productVariants.id, item.variantId)).limit(1);
          if (v.length > 0) {
            await db
              .update(productVariants)
              .set({
                stock: v[0].stock + item.quantity,
                isAvailable: 1,
                updatedAt: now,
              })
              .where(eq(productVariants.id, item.variantId));
          }
        }
      }
    }

    await logAudit(
      req,
      "UPDATE_ORDER_STATUS",
      `Changed order ${order.orderCode} from ${previousStatus} to ${standardizedStatus}`
    );

    res.json({ success: true, status: standardizedStatus });
  } catch (error) {
    console.error("Order status update error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// -------------------------------------------------------------
// 3. CUSTOMERS
// -------------------------------------------------------------
adminRouter.get("/customers", async (req, res) => {
  try {
    const custList = await db.select().from(users).where(eq(users.role, "CUSTOMER")).orderBy(desc(users.createdAt));
    const allOrders = await db.select().from(orders);

    const ordersByUser = new Map<string, number>();
    for (const o of allOrders) {
      if (o.userId) {
        ordersByUser.set(o.userId, (ordersByUser.get(o.userId) || 0) + 1);
      }
    }

    res.json(
      custList.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        orders: ordersByUser.get(c.id) || 0,
        joined: new Date(c.createdAt).toLocaleDateString("pt-MZ", { month: "short", year: "numeric" }),
      }))
    );
  } catch (error) {
    console.error("Customers error:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// -------------------------------------------------------------
// 4. SETTINGS & WHATSAPP
// -------------------------------------------------------------
adminRouter.get("/settings", async (req, res) => {
  try {
    const row = await db.select().from(siteSettings).where(eq(siteSettings.key, "store_config")).limit(1);
    if (row.length === 0) {
      res.json({});
      return;
    }
    res.json(JSON.parse(row[0].value));
  } catch (error) {
    console.error("Admin settings error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

adminRouter.put("/settings", async (req: AuthRequest, res) => {
  try {
    const now = Date.now();
    await db
      .insert(siteSettings)
      .values({
        key: "store_config",
        value: JSON.stringify(req.body),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: JSON.stringify(req.body), updatedAt: now },
      });

    await logAudit(req, "UPDATE_SETTINGS", "Updated site settings and WhatsApp configuration");
    res.json({ success: true });
  } catch (error) {
    console.error("Settings save error:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// -------------------------------------------------------------
// 5. CMS (HOMEPAGE SECTIONS & BANNERS)
// -------------------------------------------------------------
adminRouter.get("/cms/sections", async (req, res) => {
  try {
    const list = await db.select().from(homepageSections).orderBy(asc(homepageSections.order));
    res.json(list);
  } catch (error) {
    console.error("CMS sections error:", error);
    res.status(500).json({ error: "Failed to fetch sections" });
  }
});

adminRouter.patch("/cms/sections/:id/toggle", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const sec = await db.select().from(homepageSections).where(eq(homepageSections.id, id)).limit(1);
    if (sec.length === 0) {
      res.status(404).json({ error: "Section not found" });
      return;
    }

    const nextActive = sec[0].isActive === 1 ? 0 : 1;
    await db.update(homepageSections).set({ isActive: nextActive, updatedAt: Date.now() }).where(eq(homepageSections.id, id));
    res.json({ success: true, isActive: nextActive === 1 });
  } catch (error) {
    console.error("CMS toggle error:", error);
    res.status(500).json({ error: "Failed to toggle section" });
  }
});

// -------------------------------------------------------------
// 6. IMAGE UPLOAD (VERCEL BLOB HOBBY)
// -------------------------------------------------------------
adminRouter.post("/upload", async (req: AuthRequest, res) => {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const { filename, base64Data, folder } = req.body;

    if (!base64Data || !filename) {
      res.status(400).json({ error: "Missing filename or base64Data" });
      return;
    }

    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");
    if (buffer.length > 4.5 * 1024 * 1024) {
      res.status(400).json({ error: "File exceeds 4.5MB free tier upload limit." });
      return;
    }

    if (token) {
      const pathname = `${folder || "products"}/${Date.now()}-${filename}`;
      const blob = await put(pathname, buffer, {
        access: "public",
        token,
      });
      await logAudit(req, "UPLOAD_BLOB", `Uploaded image ${pathname}`);
      res.json({ url: blob.url });
    } else {
      // In local dev/container without BLOB token, return data URL or placeholder
      res.json({
        url: base64Data.startsWith("data:") ? base64Data : `data:image/jpeg;base64,${base64Data}`,
        note: "Local preview mode: configure BLOB_READ_WRITE_TOKEN for remote Vercel Blob storage.",
      });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    if (error?.message?.includes("quota") || error?.message?.includes("limit")) {
      res.status(429).json({
        error: "Vercel Blob free storage limit reached. Please remove old media or check your Vercel quota.",
      });
      return;
    }
    res.status(500).json({ error: "Image upload failed" });
  }
});
