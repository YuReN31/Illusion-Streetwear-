import { Router } from "express";
import { db } from "../db/index";
import { siteSettings } from "../db/schema";
import { eq } from "drizzle-orm";

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get("/", async (req, res) => {
  try {
    const row = await db.select().from(siteSettings).where(eq(siteSettings.key, "store_config")).limit(1);

    if (row.length === 0) {
      res.json({
        whatsapp: {
          number: "+258840000000",
          active: true,
          defaultMessagePt: "Olá! Fiz um pedido no site Illusion Streetwear.\n\nCódigo do pedido: {ORDER_CODE}\nNome: {CUSTOMER_NAME}\nTotal: {TOTAL}\n\nGostaria de saber os meios de pagamento e os próximos passos.",
          defaultMessageEn: "Hello! I placed an order on Illusion Streetwear.\n\nOrder code: {ORDER_CODE}\nName: {CUSTOMER_NAME}\nTotal: {TOTAL}\n\nI would like to know the payment methods and next steps.",
        },
        store: {
          currency: "MT",
          freeShippingThreshold: 8000,
          maintenanceMode: false,
          operationalAlerts: true,
        },
        announcement: {
          textPt: "Frete grátis para pedidos acima de 8.000 MT • Drop 01 live",
          textEn: "Free shipping on orders over 8,000 MT • Drop 01 live",
          active: true,
        },
        theme: {
          logoUrl: "/logo.svg",
          primaryColor: "#ffffff",
          backgroundColor: "#0d0d0d",
          textColor: "#ffffff",
        },
      });
      return;
    }

    try {
      const config = JSON.parse(row[0].value);
      res.json(config);
    } catch {
      res.status(500).json({ error: "Failed to parse site settings" });
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to load settings" });
  }
});
