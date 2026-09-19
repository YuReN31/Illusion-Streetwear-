import bcrypt from "bcryptjs";
import { db } from "./index";
import { users, categories, products, productVariants, siteSettings, homepageSections, banners } from "./schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const existingProducts = await db.select().from(products).limit(1);
  if (existingProducts.length > 0) {
    return; // Already seeded
  }

  const now = Date.now();

  // 1. Seed Users (Admin & Customer)
  const adminPasswordHash = await bcrypt.hash("illusion2026!", 10);
  const customerPasswordHash = await bcrypt.hash("illusion2026!", 10);

  await db.insert(users).values([
    {
      id: "usr_admin_01",
      email: "admin@illusion.com",
      passwordHash: adminPasswordHash,
      name: "Illusion Admin",
      role: "ADMIN",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "usr_cust_01",
      email: "customer@illusion.com",
      passwordHash: customerPasswordHash,
      name: "Amélia Mondlane",
      role: "CUSTOMER",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // 2. Seed Categories
  const categoryData = [
    { id: "cat_outerwear", slug: "outerwear", namePt: "Outerwear", nameEn: "Outerwear", image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=85", order: 1 },
    { id: "cat_tshirts", slug: "t-shirts", namePt: "T-Shirts", nameEn: "T-Shirts", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85", order: 2 },
    { id: "cat_sweats", slug: "sweats", namePt: "Sweats", nameEn: "Sweats", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85", order: 3 },
    { id: "cat_trousers", slug: "trousers", namePt: "Calças", nameEn: "Trousers", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85", order: 4 },
    { id: "cat_knitwear", slug: "knitwear", namePt: "Malhas", nameEn: "Knitwear", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85", order: 5 },
  ];

  for (const cat of categoryData) {
    await db.insert(categories).values({
      ...cat,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 3. Seed Products and Variants
  const productsToSeed = [
    {
      id: "prod_01",
      slug: "signal-overshirt",
      namePt: "Signal Overshirt",
      nameEn: "Signal Overshirt",
      descriptionPt: "Uma camada estruturada com presença silenciosa. Corte amplo, algodão encorpado e fecho metálico aparente.",
      descriptionEn: "A structured layer with quiet presence. Boxy cut, heavyweight cotton and exposed metallic hardware.",
      price: 8900,
      promoPrice: null,
      currency: "MZN",
      categorySlug: "outerwear",
      color: "Charcoal",
      materialPt: "100% algodão pesado",
      materialEn: "100% heavyweight cotton",
      image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=85",
      altPt: "Casaco escuro pendurado num espaço editorial",
      altEn: "Dark structured overshirt hanging in an architectural studio",
      badge: "New drop",
      collection: "SS—26 / Drop 01",
      isPublished: 1,
      isFeatured: 1,
      isNewDrop: 1,
      isPromo: 0,
      order: 1,
      sizes: ["XS", "S", "M", "L", "XL"],
      stockPerSize: [3, 4, 3, 2, 0],
    },
    {
      id: "prod_02",
      slug: "afterimage-tee",
      namePt: "Afterimage Tee",
      nameEn: "Afterimage Tee",
      descriptionPt: "T-shirt de corte boxy em jersey pesado. A base neutra para construir o uniforme do dia.",
      descriptionEn: "Boxy fit heavyweight tee. The neutral base to build your daily uniform.",
      price: 4200,
      promoPrice: null,
      currency: "MZN",
      categorySlug: "t-shirts",
      color: "Bone",
      materialPt: "Jersey de algodão 240gsm",
      materialEn: "240gsm combed cotton jersey",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85",
      altPt: "T-shirt branca minimalista sobre fundo claro",
      altEn: "Bone white minimalist tee on neutral backdrop",
      badge: null,
      collection: "SS—26 / Drop 01",
      isPublished: 1,
      isFeatured: 1,
      isNewDrop: 0,
      isPromo: 0,
      order: 2,
      sizes: ["XS", "S", "M", "L", "XL"],
      stockPerSize: [2, 5, 8, 4, 1],
    },
    {
      id: "prod_03",
      slug: "rose-noise-hoodie",
      namePt: "Rose Noise Hoodie",
      nameEn: "Rose Noise Hoodie",
      descriptionPt: "Volume generoso e toque macio. O tom rose ash introduz uma frequência quente na paleta urbana.",
      descriptionEn: "Generous silhouette and plush touch. The rose ash tone injects warm frequency into urban grays.",
      price: 7600,
      promoPrice: null,
      currency: "MZN",
      categorySlug: "sweats",
      color: "Rose ash",
      materialPt: "Fleece de algodão escovado",
      materialEn: "Heavyweight brushed cotton fleece",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85",
      altPt: "Sweatshirt em tom rosa suave",
      altEn: "Rose ash relaxed hoodie with clean seams",
      badge: "Limited",
      collection: "SS—26 / Drop 01",
      isPublished: 1,
      isFeatured: 1,
      isNewDrop: 1,
      isPromo: 0,
      order: 3,
      sizes: ["S", "M", "L", "XL"],
      stockPerSize: [2, 4, 3, 1],
    },
    {
      id: "prod_04",
      slug: "concrete-cargo",
      namePt: "Concrete Cargo",
      nameEn: "Concrete Cargo",
      descriptionPt: "Calça cargo de perna larga com bolsos utilitários e ajuste interno na cintura.",
      descriptionEn: "Wide-leg utility cargo pant with discreet accordion pockets and internal waist drawstring.",
      price: 6800,
      promoPrice: null,
      currency: "MZN",
      categorySlug: "trousers",
      color: "Concrete grey",
      materialPt: "Sarja de algodão lavada",
      materialEn: "Washed cotton twill",
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85",
      altPt: "Look urbano com calça de corte largo",
      altEn: "Architectural cargo trousers in concrete washed cotton",
      badge: null,
      collection: "SS—26 / Drop 01",
      isPublished: 1,
      isFeatured: 0,
      isNewDrop: 0,
      isPromo: 0,
      order: 4,
      sizes: ["28", "30", "32", "34", "36"],
      stockPerSize: [1, 2, 4, 3, 0],
    },
    {
      id: "prod_05",
      slug: "low-light-denim",
      namePt: "Low Light Denim",
      nameEn: "Low Light Denim",
      descriptionPt: "Jeans 13oz de corte recto e lavagem profunda. Uma peça contínua pensada para ganhar carácter.",
      descriptionEn: "13oz raw-look straight denim with deep wash. Built to age with character over years of wear.",
      price: 7200,
      promoPrice: null,
      currency: "MZN",
      categorySlug: "trousers",
      color: "Raw indigo",
      materialPt: "13oz denim 100% algodão",
      materialEn: "13oz 100% cotton Japanese denim",
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=85",
      altPt: "Jeans escuros dobrados com textura visível",
      altEn: "Deep indigo straight jeans with visible selvedge finish",
      badge: null,
      collection: "SS—26 / Drop 01",
      isPublished: 1,
      isFeatured: 0,
      isNewDrop: 0,
      isPromo: 0,
      order: 5,
      sizes: ["28", "30", "32", "34", "36"],
      stockPerSize: [4, 6, 8, 4, 2],
    },
    {
      id: "prod_06",
      slug: "archive-rib-knit",
      namePt: "Archive Rib Knit",
      nameEn: "Archive Rib Knit",
      descriptionPt: "Camisola canelada com peso substancial. Acabamentos limpos que funcionam sozinhos ou sob um casaco.",
      descriptionEn: "Substantial ribbed knit sweater with tactile handfeel and architectural neckline.",
      price: 8400,
      promoPrice: 7900,
      currency: "MZN",
      categorySlug: "knitwear",
      color: "Off black",
      materialPt: "Lã merino e algodão",
      materialEn: "Merino wool and cotton blend",
      image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85",
      altPt: "Camisola de malha escura dobrada",
      altEn: "Textured rib knit in off-black folded with clean shadow",
      badge: "Promo",
      collection: "Archive / 01",
      isPublished: 1,
      isFeatured: 1,
      isNewDrop: 0,
      isPromo: 1,
      order: 6,
      sizes: ["S", "M", "L", "XL"],
      stockPerSize: [2, 3, 2, 1],
    },
  ];

  for (let i = 0; i < productsToSeed.length; i++) {
    const p = productsToSeed[i];
    await db.insert(products).values({
      id: p.id,
      slug: p.slug,
      namePt: p.namePt,
      nameEn: p.nameEn,
      descriptionPt: p.descriptionPt,
      descriptionEn: p.descriptionEn,
      price: p.price,
      promoPrice: p.promoPrice,
      currency: p.currency,
      categorySlug: p.categorySlug,
      color: p.color,
      materialPt: p.materialPt,
      materialEn: p.materialEn,
      image: p.image,
      altPt: p.altPt,
      altEn: p.altEn,
      badge: p.badge,
      collection: p.collection,
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
      isNewDrop: p.isNewDrop,
      isPromo: p.isPromo,
      order: p.order,
      createdAt: now,
      updatedAt: now,
    });

    for (let s = 0; s < p.sizes.length; s++) {
      const size = p.sizes[s];
      const stock = p.stockPerSize[s] ?? 4;
      await db.insert(productVariants).values({
        id: `var_${p.slug}_${size.toLowerCase()}`,
        productId: p.id,
        color: p.color,
        size,
        sku: `ILL-${String(i + 1).padStart(3, "0")}-${size}`,
        stock,
        isAvailable: stock > 0 ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 4. Seed Settings
  const defaultSettings = {
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
  };

  await db.insert(siteSettings).values({
    key: "store_config",
    value: JSON.stringify(defaultSettings),
    updatedAt: now,
  });

  // 5. Seed Homepage Sections
  await db.insert(homepageSections).values([
    {
      id: "sec_hero",
      sectionKey: "hero",
      titlePt: "A cidade não fica parada.",
      titleEn: "The city doesn't stand still.",
      subtitlePt: "SS—26 / Uniforms for the in-between",
      subtitleEn: "SS—26 / Uniforms for the in-between",
      content: JSON.stringify({
        heroImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=85",
        ctaTextPt: "Explorar catálogo",
        ctaTextEn: "Explore catalog",
        ctaLink: "/shop",
      }),
      order: 1,
      isActive: 1,
      updatedAt: now,
    },
    {
      id: "sec_new_drop",
      sectionKey: "new_drop",
      titlePt: "Novas chegadas",
      titleEn: "New arrivals",
      subtitlePt: "01 / Catálogo de estreia",
      subtitleEn: "01 / Debut catalog",
      content: JSON.stringify({ maxItems: 6 }),
      order: 2,
      isActive: 1,
      updatedAt: now,
    },
    {
      id: "sec_manifesto",
      sectionKey: "manifesto",
      titlePt: "Rigor no corte. Liberdade na rua.",
      titleEn: "Precision in tailoring. Freedom in the street.",
      subtitlePt: "02 / Manifesto",
      subtitleEn: "02 / Manifesto",
      content: JSON.stringify({
        copyPt: "A Illusion nasce da intersecção entre proporção escultural e utilidade contemporânea. Roupas sem ruído desnecessário, prontas para o movimento contínuo da cidade.",
        copyEn: "Illusion emerges at the intersection of sculptural proportion and contemporary utility. Garments stripped of excess noise, ready for continuous urban motion.",
      }),
      order: 3,
      isActive: 1,
      updatedAt: now,
    },
  ]);
}
