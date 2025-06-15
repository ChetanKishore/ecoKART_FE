import {
  users,
  sellers,
  categories,
  products,
  carts,
  orders,
  orderItems,
  co2Contributions,
  companies,
  companyPointsHistory,
  type User,
  type UpsertUser,
  type InsertSeller,
  type Seller,
  type InsertProduct,
  type Product,
  type Category,
  type InsertCart,
  type Cart,
  type InsertOrder,
  type Order,
  type InsertOrderItem,
  type OrderItem,
  type InsertCo2Contribution,
  type Co2Contribution,
  type InsertCompany,
  type Company,
  type InsertCompanyPointsHistory,
  type CompanyPointsHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPoints(userId: string, points: number, co2Saved: string): Promise<void>;

  // Seller operations
  createSeller(seller: InsertSeller): Promise<Seller>;
  getSellerByUserId(userId: string): Promise<Seller | undefined>;
  updateSellerVerification(sellerId: number, isVerified: boolean): Promise<void>;

  // Category operations
  getCategories(): Promise<Category[]>;

  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProducts(filters?: { categoryId?: number; sellerId?: number; priceRange?: [number, number] }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsBySeller(sellerId: number): Promise<Product[]>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<void>;
  deleteProduct(id: number): Promise<void>;
  verifyProduct(id: number, approved: boolean, notes: string): Promise<void>;

  // Cart operations
  addToCart(cart: InsertCart): Promise<Cart>;
  getCartItems(userId: string): Promise<Array<Cart & { product: Product }>>;
  updateCartItem(userId: string, productId: number, quantity: number): Promise<void>;
  removeFromCart(userId: string, productId: number): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrders(userId: string): Promise<Array<Order & { items: Array<OrderItem & { product: Product }> }>>;
  getOrdersBySeller(sellerId: number): Promise<Array<Order & { items: Array<OrderItem & { product: Product }> }>>;
  updateOrderStatus(orderId: number, status: string): Promise<void>;

  // CO2 tracking
  createCo2Contribution(contribution: InsertCo2Contribution): Promise<Co2Contribution>;
  getUserCo2Stats(userId: string): Promise<{ totalCo2Saved: string; totalPoints: number }>;
  getGlobalCo2Stats(): Promise<{ totalCo2Saved: string; treesPlanted: number; activeUsers: number }>;
  getCompanyCo2Stats(domain: string): Promise<{ totalCo2Saved: string }>;

  // Company operations
  createCompany(company: InsertCompany): Promise<Company>;
  getCompanyByDomain(domain: string): Promise<Company | undefined>;
  getCompanyByUserId(userId: string): Promise<Company | undefined>;
  updateCompanyStats(companyId: number, points: number, co2Saved: string): Promise<void>;
  getCompanyEmployees(companyId: number): Promise<Array<User & { orderCount: number }>>;
  getCompanyStats(companyId: number): Promise<{ totalEmployees: number; totalOrders: number; totalCo2Saved: string; totalPoints: number; pointsRedeemed: number }>;
  addEmployeeToCompany(userId: string, companyId: number): Promise<void>;
  createCompanyPointsHistory(history: InsertCompanyPointsHistory): Promise<CompanyPointsHistory>;
  getCompanyPointsHistory(companyId: number): Promise<CompanyPointsHistory[]>;
  redeemCompanyPoints(companyId: number, points: number, description: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPoints(userId: string, points: number, co2Saved: string): Promise<void> {
    await db
      .update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${points}`,
        totalCo2Saved: sql`${users.totalCo2Saved} + ${co2Saved}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Seller operations
  async createSeller(seller: InsertSeller): Promise<Seller> {
    const [newSeller] = await db.insert(sellers).values(seller).returning();
    return newSeller;
  }

  async getSellerByUserId(userId: string): Promise<Seller | undefined> {
    const [seller] = await db.select().from(sellers).where(eq(sellers.userId, userId));
    return seller;
  }

  async updateSellerVerification(sellerId: number, isVerified: boolean): Promise<void> {
    await db.update(sellers).set({ isVerified }).where(eq(sellers.id, sellerId));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  // Product operations
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getProducts(filters?: { categoryId?: number; sellerId?: number; priceRange?: [number, number] }): Promise<Product[]> {
    let whereConditions = [eq(products.isActive, true)];

    if (filters?.categoryId) {
      whereConditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.sellerId) {
      whereConditions.push(eq(products.sellerId, filters.sellerId));
    }
    if (filters?.priceRange) {
      whereConditions.push(
        and(
          sql`${products.price} >= ${filters.priceRange[0]}`,
          sql`${products.price} <= ${filters.priceRange[1]}`
        )!
      );
    }

    return await db.select().from(products)
      .where(and(...whereConditions))
      .orderBy(desc(products.co2SavedPerUnit));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsBySeller(sellerId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.sellerId, sellerId));
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<void> {
    await db.update(products).set(updates).where(eq(products.id, id));
  }

  async deleteProduct(id: number): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }

  // Cart operations
  async addToCart(cart: InsertCart): Promise<Cart> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.userId, cart.userId), eq(carts.productId, cart.productId)));

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(carts)
        .set({ quantity: (existingItem.quantity || 0) + (cart.quantity || 1) })
        .where(eq(carts.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Insert new item
      const [newItem] = await db.insert(carts).values(cart).returning();
      return newItem;
    }
  }

  async getCartItems(userId: string): Promise<Array<Cart & { product: Product }>> {
    return await db
      .select()
      .from(carts)
      .innerJoin(products, eq(carts.productId, products.id))
      .where(eq(carts.userId, userId))
      .then(rows => rows.map(row => ({ ...row.carts, product: row.products })));
  }

  async updateCartItem(userId: string, productId: number, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeFromCart(userId, productId);
    } else {
      await db
        .update(carts)
        .set({ quantity })
        .where(and(eq(carts.userId, userId), eq(carts.productId, productId)));
    }
  }

  async removeFromCart(userId: string, productId: number): Promise<void> {
    await db
      .delete(carts)
      .where(and(eq(carts.userId, userId), eq(carts.productId, productId)));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(carts).where(eq(carts.userId, userId));
  }

  // Order operations
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    // Insert order items
    await db.insert(orderItems).values(
      items.map(item => ({ ...item, orderId: newOrder.id }))
    );

    return newOrder;
  }

  async getOrders(userId: string): Promise<Array<Order & { items: Array<OrderItem & { product: Product }> }>> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items: items.map(item => ({ ...item.order_items, product: item.products })),
        };
      })
    );

    return ordersWithItems;
  }

  async getOrdersBySeller(sellerId: number): Promise<Array<Order & { items: Array<OrderItem & { product: Product }> }>> {
    const sellerOrders = await db
      .select({ order: orders })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(products.sellerId, sellerId))
      .groupBy(orders.id)
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      sellerOrders.map(async ({ order }) => {
        const items = await db
          .select()
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(and(eq(orderItems.orderId, order.id), eq(products.sellerId, sellerId)));

        return {
          ...order,
          items: items.map(item => ({ ...item.order_items, product: item.products })),
        };
      })
    );

    return ordersWithItems;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<void> {
    await db.update(orders).set({ status }).where(eq(orders.id, orderId));
  }

  // CO2 tracking
  async createCo2Contribution(contribution: InsertCo2Contribution): Promise<Co2Contribution> {
    const [newContribution] = await db.insert(co2Contributions).values(contribution).returning();
    return newContribution;
  }

  async getUserCo2Stats(userId: string): Promise<{ totalCo2Saved: string; totalPoints: number }> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return {
      totalCo2Saved: user?.totalCo2Saved || "0",
      totalPoints: user?.totalPoints || 0,
    };
  }

  async getGlobalCo2Stats(): Promise<{ totalCo2Saved: string; treesPlanted: number; activeUsers: number }> {
    const [co2Stats] = await db
      .select({
        totalCo2Saved: sql<string>`COALESCE(SUM(${co2Contributions.co2Amount}), 0)`,
      })
      .from(co2Contributions);

    const [userStats] = await db
      .select({
        activeUsers: sql<number>`COUNT(DISTINCT ${users.id})`,
      })
      .from(users)
      .where(sql`${users.totalPoints} > 0`);

    // Calculate trees planted (assuming 50 points = 1 tree)
    const treesPlanted = Math.floor((await db
      .select({ totalPoints: sql<number>`COALESCE(SUM(${users.totalPoints}), 0)` })
      .from(users))[0].totalPoints / 50);

    return {
      totalCo2Saved: co2Stats.totalCo2Saved || "0",
      treesPlanted,
      activeUsers: userStats.activeUsers || 0,
    };
  }

  async getCompanyCo2Stats(domain: string): Promise<{ totalCo2Saved: string }> {
    const [stats] = await db
      .select({
        totalCo2Saved: sql<string>`COALESCE(SUM(${users.totalCo2Saved}), 0)`,
      })
      .from(users)
      .where(sql`${users.email} LIKE ${'%@' + domain}`);

    return {
      totalCo2Saved: stats?.totalCo2Saved || "0",
    };
  }

  async verifyProduct(id: number, approved: boolean, notes: string): Promise<void> {
    await db
      .update(products)
      .set({
        isVerified: approved,
        verificationNotes: notes,
      })
      .where(eq(products.id, id));
  }

  // Company operations
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    return newCompany;
  }

  async getCompanyByDomain(domain: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.domain, domain));
    return company;
  }

  async getCompanyByUserId(userId: string): Promise<Company | undefined> {
    const [result] = await db
      .select({
        id: companies.id,
        name: companies.name,
        domain: companies.domain,
        industry: companies.industry,
        logoUrl: companies.logoUrl,
        totalPoints: companies.totalPoints,
        totalCo2Saved: companies.totalCo2Saved,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt,
      })
      .from(companies)
      .innerJoin(users, eq(users.companyId, companies.id))
      .where(eq(users.id, userId));
    return result;
  }

  async updateCompanyStats(companyId: number, points: number, co2Saved: string): Promise<void> {
    await db
      .update(companies)
      .set({
        totalPoints: sql`${companies.totalPoints} + ${points}`,
        totalCo2Saved: sql`${companies.totalCo2Saved} + ${co2Saved}`,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));
  }

  async getCompanyEmployees(companyId: number): Promise<Array<User & { orderCount: number }>> {
    const employees = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        totalPoints: users.totalPoints,
        totalCo2Saved: users.totalCo2Saved,
        companyId: users.companyId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        orderCount: sql<number>`COALESCE(COUNT(${orders.id}), 0)`,
      })
      .from(users)
      .leftJoin(orders, eq(orders.userId, users.id))
      .where(eq(users.companyId, companyId))
      .groupBy(users.id);
    
    return employees;
  }

  async getCompanyStats(companyId: number): Promise<{ totalEmployees: number; totalOrders: number; totalCo2Saved: string; totalPoints: number; pointsRedeemed: number }> {
    const [employeeStats] = await db
      .select({
        totalEmployees: sql<number>`COUNT(DISTINCT ${users.id})`,
        totalOrders: sql<number>`COUNT(${orders.id})`,
        totalCo2Saved: sql<string>`COALESCE(SUM(${users.totalCo2Saved}), 0)`,
        totalPoints: sql<number>`COALESCE(SUM(${users.totalPoints}), 0)`,
      })
      .from(users)
      .leftJoin(orders, eq(orders.userId, users.id))
      .where(eq(users.companyId, companyId));

    const [redeemedStats] = await db
      .select({
        pointsRedeemed: sql<number>`COALESCE(SUM(${companyPointsHistory.points}), 0)`,
      })
      .from(companyPointsHistory)
      .where(and(
        eq(companyPointsHistory.companyId, companyId),
        eq(companyPointsHistory.action, 'redeemed')
      ));

    return {
      totalEmployees: employeeStats?.totalEmployees || 0,
      totalOrders: employeeStats?.totalOrders || 0,
      totalCo2Saved: employeeStats?.totalCo2Saved || "0",
      totalPoints: employeeStats?.totalPoints || 0,
      pointsRedeemed: redeemedStats?.pointsRedeemed || 0,
    };
  }

  async addEmployeeToCompany(userId: string, companyId: number): Promise<void> {
    await db
      .update(users)
      .set({ companyId })
      .where(eq(users.id, userId));
  }

  async createCompanyPointsHistory(history: InsertCompanyPointsHistory): Promise<CompanyPointsHistory> {
    const [newHistory] = await db
      .insert(companyPointsHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  async getCompanyPointsHistory(companyId: number): Promise<CompanyPointsHistory[]> {
    return await db
      .select()
      .from(companyPointsHistory)
      .where(eq(companyPointsHistory.companyId, companyId))
      .orderBy(desc(companyPointsHistory.createdAt));
  }

  async redeemCompanyPoints(companyId: number, points: number, description: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Deduct points from company
      await tx
        .update(companies)
        .set({
          totalPoints: sql`${companies.totalPoints} - ${points}`,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId));

      // Record the redemption
      await tx
        .insert(companyPointsHistory)
        .values({
          companyId,
          action: 'redeemed',
          points,
          description,
        });
    });
  }
}

export const storage = new DatabaseStorage();
