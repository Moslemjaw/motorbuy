import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
// Import auth models to export them
import { users } from "./models/auth";
export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const roles = pgTable("roles", {
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["customer", "vendor", "admin"] }).default("customer").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.role] }),
}));

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  storeName: text("store_name").notNull(),
  description: text("description").notNull(),
  logoUrl: text("logo_url"),
  isApproved: boolean("is_approved").default(false).notNull(),
  commissionRate: decimal("commission_rate").default("0.05").notNull(), // 5% default
  walletBalance: decimal("wallet_balance").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price").notNull(),
  stock: integer("stock").notNull().default(0),
  brand: text("brand").notNull(),
  images: jsonb("images").$type<string[]>().notNull(), // Array of image URLs
  warrantyInfo: text("warranty_info"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  total: decimal("total").notNull(),
  status: text("status", { enum: ["pending", "paid", "shipped", "delivered", "cancelled"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price").notNull(), // Price at time of purchase
});

export const vendorStories = pgTable("vendor_stories", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  content: text("content"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
});

// === RELATIONS ===
export const rolesRelations = relations(roles, ({ one }) => ({
  user: one(users, {
    fields: [roles.userId],
    references: [users.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user: one(users, {
    fields: [vendors.userId],
    references: [users.id],
  }),
  products: many(products),
  stories: many(vendorStories),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

// === INSERTS & TYPES ===
export const insertRoleSchema = createInsertSchema(roles);
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, isApproved: true, walletBalance: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, total: true, status: true }); // Total and status managed by backend
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertStorySchema = createInsertSchema(vendorStories).omit({ id: true, createdAt: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true });

export type Role = typeof roles.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type VendorStory = typeof vendorStories.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
