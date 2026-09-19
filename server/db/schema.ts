import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["CUSTOMER", "ADMIN"] }).default("CUSTOMER").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  index("users_email_idx").on(table.email),
]);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("sessions_token_idx").on(table.token),
]);

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  namePt: text("name_pt").notNull(),
  nameEn: text("name_en").notNull(),
  image: text("image"),
  order: integer("order").default(0).notNull(),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  index("categories_slug_idx").on(table.slug),
]);

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  namePt: text("name_pt").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionPt: text("description_pt").notNull(),
  descriptionEn: text("description_en").notNull(),
  price: integer("price").notNull(),
  promoPrice: integer("promo_price"),
  currency: text("currency").default("MZN").notNull(),
  categorySlug: text("category_slug").notNull(),
  color: text("color").default("Default").notNull(),
  materialPt: text("material_pt").default("").notNull(),
  materialEn: text("material_en").default("").notNull(),
  image: text("image").notNull(),
  altPt: text("alt_pt").default("").notNull(),
  altEn: text("alt_en").default("").notNull(),
  badge: text("badge"),
  collection: text("collection").default("SS—26 / Drop 01").notNull(),
  isPublished: integer("is_published").default(1).notNull(),
  isFeatured: integer("is_featured").default(0).notNull(),
  isNewDrop: integer("is_new_drop").default(0).notNull(),
  isPromo: integer("is_promo").default(0).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  index("products_slug_idx").on(table.slug),
  index("products_category_idx").on(table.categorySlug),
]);

export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  color: text("color").default("").notNull(),
  size: text("size").notNull(),
  sku: text("sku").notNull(),
  stock: integer("stock").default(0).notNull(),
  isAvailable: integer("is_available").default(1).notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  index("variants_product_id_idx").on(table.productId),
  index("variants_sku_idx").on(table.sku),
]);

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orderCode: text("order_code").notNull().unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").default("").notNull(),
  deliveryAddress: text("delivery_address").default("").notNull(),
  city: text("city").default("Maputo").notNull(),
  postalCode: text("postal_code").default("").notNull(),
  notes: text("notes").default("").notNull(),
  subtotal: integer("subtotal").notNull(),
  total: integer("total").notNull(),
  status: text("status", {
    enum: ["NEW", "AWAITING_PAYMENT", "PAYMENT_CONFIRMED", "PREPARING", "SHIPPED", "COMPLETED", "CANCELLED"]
  }).default("NEW").notNull(),
  whatsappUrl: text("whatsapp_url").notNull(),
  whatsappMessage: text("whatsapp_message").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  index("orders_code_idx").on(table.orderCode),
  index("orders_user_idx").on(table.userId),
  index("orders_status_idx").on(table.status),
  index("orders_email_idx").on(table.customerEmail),
]);

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  variantId: text("variant_id"),
  nameAtPurchase: text("name_at_purchase").notNull(),
  nameEnAtPurchase: text("name_en_at_purchase").notNull(),
  skuAtPurchase: text("sku_at_purchase").notNull(),
  colorAtPurchase: text("color_at_purchase").notNull(),
  sizeAtPurchase: text("size_at_purchase").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceAtPurchase: integer("unit_price_at_purchase").notNull(),
  promoPriceAtPurchase: integer("promo_price_at_purchase"),
  subtotal: integer("subtotal").notNull(),
  imageAtPurchase: text("image_at_purchase").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
]);

export const orderStatusHistory = sqliteTable("order_status_history", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  previousStatus: text("previous_status").notNull(),
  newStatus: text("new_status").notNull(),
  changedByUserId: text("changed_by_user_id"),
  changedByName: text("changed_by_name").notNull(),
  note: text("note").default("").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("status_history_order_id_idx").on(table.orderId),
]);

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const homepageSections = sqliteTable("homepage_sections", {
  id: text("id").primaryKey(),
  sectionKey: text("section_key").notNull().unique(),
  titlePt: text("title_pt").notNull(),
  titleEn: text("title_en").notNull(),
  subtitlePt: text("subtitle_pt").notNull(),
  subtitleEn: text("subtitle_en").notNull(),
  content: text("content").default("{}").notNull(),
  order: integer("order").default(0).notNull(),
  isActive: integer("is_active").default(1).notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const banners = sqliteTable("banners", {
  id: text("id").primaryKey(),
  titlePt: text("title_pt").notNull(),
  titleEn: text("title_en").notNull(),
  textPt: text("text_pt").notNull(),
  textEn: text("text_en").notNull(),
  buttonTextPt: text("button_text_pt").notNull(),
  buttonTextEn: text("button_text_en").notNull(),
  link: text("link").notNull(),
  imageUrl: text("image_url").notNull(),
  order: integer("order").default(0).notNull(),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const adminAuditLogs = sqliteTable("admin_audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  details: text("details").default("").notNull(),
  ipAddress: text("ip_address").default("").notNull(),
  createdAt: integer("created_at").notNull(),
});
