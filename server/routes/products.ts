import { Router } from "express";
import { db } from "../db/index";
import { products, productVariants, categories } from "../db/schema";
import { eq, and, sql, asc, desc } from "drizzle-orm";

export const productsRouter = Router();

// GET /api/products
productsRouter.get("/", async (req, res) => {
  try {
    const { category, search, sort, featured, newDrop, promo } = req.query;

    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.isPublished, 1))
      .orderBy(asc(products.order), desc(products.createdAt));

    const allVariants = await db.select().from(productVariants);

    // Group variants by productId
    const variantsByProduct = new Map<string, typeof allVariants>();
    for (const v of allVariants) {
      if (!variantsByProduct.has(v.productId)) {
        variantsByProduct.set(v.productId, []);
      }
      variantsByProduct.get(v.productId)!.push(v);
    }

    let results = allProducts.map((p) => {
      const vars = variantsByProduct.get(p.id) || [];
      const totalStock = vars.reduce((sum, v) => sum + v.stock, 0);
      const isSoldOut = totalStock <= 0;
      const sizes = Array.from(new Set(vars.map((v) => v.size)));

      return {
        id: p.id,
        slug: p.slug,
        name: p.namePt,
        namePt: p.namePt,
        nameEn: p.nameEn,
        category: p.categorySlug,
        categorySlug: p.categorySlug,
        price: p.price,
        promoPrice: p.promoPrice,
        currency: p.currency,
        color: p.color,
        description: p.descriptionPt,
        descriptionPt: p.descriptionPt,
        descriptionEn: p.descriptionEn,
        material: p.materialPt,
        materialPt: p.materialPt,
        materialEn: p.materialEn,
        image: p.image,
        alt: p.altPt,
        altPt: p.altPt,
        altEn: p.altEn,
        badge: p.badge,
        collection: p.collection,
        isSoldOut,
        totalStock,
        sizes: sizes.length > 0 ? sizes : ["S", "M", "L", "XL"],
        variants: vars.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          stock: v.stock,
          isAvailable: v.isAvailable && v.stock > 0,
        })),
        isFeatured: p.isFeatured === 1,
        isNewDrop: p.isNewDrop === 1,
        isPromo: p.isPromo === 1,
        createdAt: p.createdAt,
      };
    });

    // Category filter
    if (category && category !== "all") {
      const catLower = String(category).toLowerCase();
      results = results.filter((p) => p.categorySlug.toLowerCase() === catLower);
    }

    // Search filter
    if (search) {
      const q = String(search).toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.namePt.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.descriptionPt.toLowerCase().includes(q) ||
          p.descriptionEn.toLowerCase().includes(q) ||
          p.categorySlug.toLowerCase().includes(q)
      );
    }

    // Flags
    if (featured === "true") {
      results = results.filter((p) => p.isFeatured);
    }
    if (newDrop === "true") {
      results = results.filter((p) => p.isNewDrop);
    }
    if (promo === "true") {
      results = results.filter((p) => p.isPromo);
    }

    // Sort
    if (sort === "price-asc") {
      results.sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));
    } else if (sort === "price-desc") {
      results.sort((a, b) => (b.promoPrice || b.price) - (a.promoPrice || a.price));
    }

    res.json(results);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to load products" });
  }
});

// GET /api/products/:slug
productsRouter.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const productList = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isPublished, 1)))
      .limit(1);

    if (productList.length === 0) {
      res.status(404).json({ error: "Product not found", errorKey: "productNotFound" });
      return;
    }

    const p = productList[0];
    const vars = await db.select().from(productVariants).where(eq(productVariants.productId, p.id));
    const totalStock = vars.reduce((sum, v) => sum + v.stock, 0);
    const sizes = Array.from(new Set(vars.map((v) => v.size)));

    res.json({
      id: p.id,
      slug: p.slug,
      name: p.namePt,
      namePt: p.namePt,
      nameEn: p.nameEn,
      category: p.categorySlug,
      categorySlug: p.categorySlug,
      price: p.price,
      promoPrice: p.promoPrice,
      currency: p.currency,
      color: p.color,
      description: p.descriptionPt,
      descriptionPt: p.descriptionPt,
      descriptionEn: p.descriptionEn,
      material: p.materialPt,
      materialPt: p.materialPt,
      materialEn: p.materialEn,
      image: p.image,
      alt: p.altPt,
      altPt: p.altPt,
      altEn: p.altEn,
      badge: p.badge,
      collection: p.collection,
      isSoldOut: totalStock <= 0,
      totalStock,
      sizes: sizes.length > 0 ? sizes : ["S", "M", "L", "XL"],
      variants: vars.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        stock: v.stock,
        isAvailable: v.isAvailable && v.stock > 0,
      })),
      isFeatured: p.isFeatured === 1,
      isNewDrop: p.isNewDrop === 1,
      isPromo: p.isPromo === 1,
      createdAt: p.createdAt,
    });
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    res.status(500).json({ error: "Failed to load product" });
  }
});
