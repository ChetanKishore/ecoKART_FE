import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  totalPoints: integer("total_points").default(0),
  totalCo2Saved: decimal("total_co2_saved", { precision: 10, scale: 2 }).default("0"),
  companyId: integer("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  domain: varchar("domain").notNull().unique(),
  industry: varchar("industry"),
  logoUrl: varchar("logo_url"),
  totalPoints: integer("total_points").default(0),
  totalCo2Saved: decimal("total_co2_saved", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companyPointsHistory = pgTable("company_points_history", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  action: varchar("action").notNull(), // 'earned' or 'redeemed'
  points: integer("points").notNull(),
  description: varchar("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: varchar("business_name").notNull(),
  certificationType: varchar("certification_type").notNull(),
  certificateUrl: varchar("certificate_url"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  icon: varchar("icon"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  name: varchar("name").notNull(),
  description: text("description"),
  price: varchar("price").notNull(),
  imageUrl: varchar("image_url"),
  co2SavedPerUnit: varchar("co2_saved_per_unit").notNull(),
  ecoRating: varchar("eco_rating").default("0"),
  stock: integer("stock").default(0),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  verificationNotes: text("verification_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  totalCo2Saved: decimal("total_co2_saved", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"),
  shippingAddress: text("shipping_address"),
  paymentMethod: varchar("payment_method"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  co2Saved: decimal("co2_saved", { precision: 10, scale: 2 }).notNull(),
});

export const co2Contributions = pgTable("co2_contributions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  co2Amount: decimal("co2_amount", { precision: 10, scale: 2 }).notNull(),
  pointsEarned: integer("points_earned").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  seller: one(sellers, {
    fields: [users.id],
    references: [sellers.userId],
  }),
  carts: many(carts),
  orders: many(orders),
  co2Contributions: many(co2Contributions),
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
}));

export const sellersRelations = relations(sellers, ({ one, many }) => ({
  user: one(users, {
    fields: [sellers.userId],
    references: [users.id],
  }),
  products: many(products),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  employees: many(users),
  pointsHistory: many(companyPointsHistory),
}));

export const companyPointsHistoryRelations = relations(companyPointsHistory, ({ one }) => ({
  company: one(companies, {
    fields: [companyPointsHistory.companyId],
    references: [companies.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(sellers, {
    fields: [products.sellerId],
    references: [sellers.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  cartItems: many(carts),
  orderItems: many(orderItems),
}));

export const cartsRelations = relations(carts, ({ one }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [carts.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  co2Contribution: one(co2Contributions, {
    fields: [orders.id],
    references: [co2Contributions.orderId],
  }),
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

export const co2ContributionsRelations = relations(co2Contributions, ({ one }) => ({
  user: one(users, {
    fields: [co2Contributions.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [co2Contributions.orderId],
    references: [orders.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSellerSchema = createInsertSchema(sellers).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
}).extend({
  price: z.string().or(z.number().transform(String)),
  co2SavedPerUnit: z.string().or(z.number().transform(String))
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertCo2ContributionSchema = createInsertSchema(co2Contributions).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyPointsHistorySchema = createInsertSchema(companyPointsHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertSeller = z.infer<typeof insertSellerSchema>;
export type Seller = typeof sellers.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;
export type Cart = typeof carts.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertCo2Contribution = z.infer<typeof insertCo2ContributionSchema>;
export type Co2Contribution = typeof co2Contributions.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompanyPointsHistory = z.infer<typeof insertCompanyPointsHistorySchema>;
export type CompanyPointsHistory = typeof companyPointsHistory.$inferSelect;
export type Category = typeof categories.$inferSelect;
