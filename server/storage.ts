import { db } from "./db";
import { 
  roles, vendors, categories, products, orders, orderItems, vendorStories, cartItems, paymentRequests,
  type Role, type Vendor, type Category, type Product, type Order, type OrderItem, type VendorStory, type CartItem, type PaymentRequest,
  type InsertRole, type InsertVendor, type InsertCategory, type InsertProduct, type InsertOrder, type InsertOrderItem, type InsertStory, type InsertCartItem
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth";

export interface IStorage {
  // Auth
  getUserRole(userId: string): Promise<string>;
  setUserRole(userId: string, role: "customer" | "vendor" | "admin"): Promise<Role>;

  // Vendors
  getVendors(): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  getVendorByUserId(userId: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor & { userId: string }): Promise<Vendor>;
  updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Products
  getProducts(filters?: { categoryId?: number; vendorId?: number; search?: string; sortBy?: string }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Cart
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem & { userId: string }): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Orders
  createOrder(userId: string, total: string, items: { productId: number; quantity: number; price: string }[]): Promise<Order>;
  getOrders(userId: string): Promise<Order[]>;

  // Stories
  getStories(): Promise<(VendorStory & { vendor: Vendor })[]>;
  createStory(story: InsertStory): Promise<VendorStory>;
  deleteStory(id: number): Promise<void>;

  // Payment Requests
  getPaymentRequests(vendorId: number): Promise<PaymentRequest[]>;
  createPaymentRequest(vendorId: number, amount: string): Promise<PaymentRequest>;

  // Vendor Orders
  getVendorOrders(vendorId: number): Promise<Order[]>;
}

export class DatabaseStorage implements IStorage {
  async getUserRole(userId: string): Promise<string> {
    const [role] = await db.select().from(roles).where(eq(roles.userId, userId));
    return role?.role || "customer";
  }

  async setUserRole(userId: string, role: "customer" | "vendor" | "admin"): Promise<Role> {
    await db.delete(roles).where(eq(roles.userId, userId));
    const [newRole] = await db.insert(roles).values({ userId, role }).returning();
    return newRole;
  }

  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors);
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async getVendorByUserId(userId: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId));
    return vendor;
  }

  async createVendor(vendor: InsertVendor & { userId: string }): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  async updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor> {
    const [updated] = await db.update(vendors).set(updates).where(eq(vendors.id, id)).returning();
    return updated;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async getProducts(filters?: { categoryId?: number; vendorId?: number; search?: string; sortBy?: string }): Promise<Product[]> {
    let query = db.select().from(products);
    
    const conditions = [];
    if (filters?.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
    if (filters?.vendorId) conditions.push(eq(products.vendorId, filters.vendorId));
    
    let q: any = conditions.length ? query.where(sql`${sql.join(conditions, sql` AND `)}`) : query;

    if (filters?.sortBy === 'price_asc') q = q.orderBy(products.price);
    else if (filters?.sortBy === 'price_desc') q = q.orderBy(desc(products.price));
    else if (filters?.sortBy === 'newest') q = q.orderBy(desc(products.createdAt));

    return await q;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product as any).returning();
    return newProduct;
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const items = await db.select({
      cartItem: cartItems,
      product: products
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));
    
    return items.map(i => ({ ...i.cartItem, product: i.product }));
  }

  async addToCart(item: InsertCartItem & { userId: string }): Promise<CartItem> {
    const [newItem] = await db.insert(cartItems).values(item).returning();
    return newItem;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  async createOrder(userId: string, total: string, items: { productId: number; quantity: number; price: string }[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        userId,
        total,
        status: "paid" // Simulating immediate payment
      }).returning();

      for (const item of items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        });
      }
      return order;
    });
  }

  async getOrders(userId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getStories(): Promise<(VendorStory & { vendor: Vendor })[]> {
    const results = await db.select({
      story: vendorStories,
      vendor: vendors
    })
    .from(vendorStories)
    .innerJoin(vendors, eq(vendorStories.vendorId, vendors.id))
    .orderBy(desc(vendorStories.createdAt));

    return results.map(r => ({ ...r.story, vendor: r.vendor }));
  }

  async createStory(story: InsertStory): Promise<VendorStory> {
    const [newStory] = await db.insert(vendorStories).values(story).returning();
    return newStory;
  }

  async deleteStory(id: number): Promise<void> {
    await db.delete(vendorStories).where(eq(vendorStories.id, id));
  }

  async getPaymentRequests(vendorId: number): Promise<PaymentRequest[]> {
    return await db.select().from(paymentRequests)
      .where(eq(paymentRequests.vendorId, vendorId))
      .orderBy(desc(paymentRequests.createdAt));
  }

  async createPaymentRequest(vendorId: number, amount: string): Promise<PaymentRequest> {
    const [request] = await db.insert(paymentRequests).values({
      vendorId,
      amount,
    }).returning();
    return request;
  }

  async getVendorOrders(vendorId: number): Promise<Order[]> {
    const vendorProducts = await db.select().from(products).where(eq(products.vendorId, vendorId));
    const productIds = vendorProducts.map(p => p.id);
    
    if (productIds.length === 0) return [];
    
    const items = await db.select().from(orderItems).where(
      sql`${orderItems.productId} IN ${productIds}`
    );
    
    const orderIds = [...new Set(items.map(i => i.orderId))];
    if (orderIds.length === 0) return [];
    
    return await db.select().from(orders)
      .where(sql`${orders.id} IN ${orderIds}`)
      .orderBy(desc(orders.createdAt));
  }
}

export const storage = new DatabaseStorage();
