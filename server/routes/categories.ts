import { Router } from "express";
import { db } from "../db/index";
import { categories } from "../db/schema";
import { eq, asc } from "drizzle-orm";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (req, res) => {
  try {
    const list = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, 1))
      .orderBy(asc(categories.order));

    res.json(list);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to load categories" });
  }
});
