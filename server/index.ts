import express from "express";
import { createServer } from "http";
import path from "path";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { initializeDatabase } from "./db/index";
import { seedDatabase } from "./db/seed";
import { authRouter } from "./routes/auth";
import { productsRouter } from "./routes/products";
import { categoriesRouter } from "./routes/categories";
import { ordersRouter } from "./routes/orders";
import { settingsRouter } from "./routes/settings";
import { cmsRouter } from "./routes/cms";
import { adminRouter } from "./routes/admin";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // Database auto-migration & initial seed
  try {
    await initializeDatabase();
    await seedDatabase();
    console.log("Database initialized and seed verified.");
  } catch (dbErr) {
    console.error("Database initialization notice:", dbErr);
  }

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Mount API endpoints
  app.use("/api/auth", authRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/cms", cmsRouter);
  app.use("/api/admin", adminRouter);

  // Vite middleware in dev / static in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(process.cwd(), "client"),
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import("fs");
        let template = await fs.promises.readFile(
          path.resolve(process.cwd(), "client", "index.html"),
          "utf-8"
        );
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Illusion Streetwear Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
