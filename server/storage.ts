import { 
  User, Vendor, Category, Product, Order, OrderItem, VendorStory, CartItem, PaymentRequest 
} from "./mongodb";
import mongoose from "mongoose";

export interface IStorage {
  getUserRole(userId: string): Promise<string>;
  setUserRole(userId: string, role: "customer" | "vendor" | "admin"): Promise<any>;
  getVendors(): Promise<any[]>;
  getVendor(id: string): Promise<any | undefined>;
  getVendorByUserId(userId: string): Promise<any | undefined>;
  createVendor(vendor: any): Promise<any>;
  updateVendor(id: string, updates: any): Promise<any>;
  getCategories(): Promise<any[]>;
  createCategory(category: any): Promise<any>;
  updateCategory(id: string, updates: any): Promise<any>;
  deleteCategory(id: string): Promise<void>;
  getAllUsers(): Promise<any[]>;
  getAnalytics(): Promise<any>;
  getAllOrders(): Promise<any[]>;
  getProducts(filters?: { categoryId?: string; vendorId?: string; search?: string; sortBy?: string }): Promise<any[]>;
  getProduct(id: string): Promise<any | undefined>;
  createProduct(product: any): Promise<any>;
  updateProduct(id: string, updates: any): Promise<any>;
  getCartItems(userId: string): Promise<any[]>;
  addToCart(item: any): Promise<any>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  createOrder(userId: string, total: string, items: { productId: string; quantity: number; price: string }[]): Promise<any>;
  createGuestOrder(guestEmail: string, guestName: string, guestPhone: string, total: string, items: { productId: string; quantity: number; price: string }[]): Promise<any>;
  getOrders(userId: string): Promise<any[]>;
  getStories(): Promise<any[]>;
  createStory(story: any): Promise<any>;
  deleteStory(id: string): Promise<void>;
  getPaymentRequests(vendorId: string): Promise<any[]>;
  createPaymentRequest(vendorId: string, amount: string): Promise<any>;
  getVendorOrders(vendorId: string): Promise<any[]>;
}

function toPlainObject(doc: any): any {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  delete obj.__v;
  
  if (obj.vendorId && obj.vendorId.toString) {
    obj.vendorId = obj.vendorId.toString();
  }
  if (obj.categoryId && obj.categoryId.toString) {
    obj.categoryId = obj.categoryId.toString();
  }
  if (obj.productId && obj.productId.toString) {
    obj.productId = obj.productId.toString();
  }
  if (obj.orderId && obj.orderId.toString) {
    obj.orderId = obj.orderId.toString();
  }
  
  return obj;
}

export class MongoStorage implements IStorage {
  async getUserRole(userId: string): Promise<string> {
    const user = await User.findById(userId);
    return user?.role || "customer";
  }

  async setUserRole(userId: string, role: "customer" | "vendor" | "admin"): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      { role, updatedAt: new Date() },
      { new: true }
    );
    if (!user) throw new Error("User not found");
    return toPlainObject(user);
  }

  async getVendors(): Promise<any[]> {
    const vendors = await Vendor.find({});
    return vendors.map(toPlainObject);
  }

  async getVendor(id: string): Promise<any | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const vendor = await Vendor.findById(id);
    return vendor ? toPlainObject(vendor) : undefined;
  }

  async getVendorByUserId(userId: string): Promise<any | undefined> {
    const vendor = await Vendor.findOne({ userId });
    return vendor ? toPlainObject(vendor) : undefined;
  }

  async createVendor(vendor: any): Promise<any> {
    const newVendor = await Vendor.create(vendor);
    return toPlainObject(newVendor);
  }

  async updateVendor(id: string, updates: any): Promise<any> {
    const updated = await Vendor.findByIdAndUpdate(id, updates, { new: true });
    return toPlainObject(updated);
  }

  async getCategories(): Promise<any[]> {
    const categories = await Category.find({});
    return categories.map(toPlainObject);
  }

  async createCategory(category: any): Promise<any> {
    const newCategory = await Category.create(category);
    return toPlainObject(newCategory);
  }

  async updateCategory(id: string, updates: any): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const updated = await Category.findByIdAndUpdate(id, updates, { new: true });
    return toPlainObject(updated);
  }

  async deleteCategory(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Category.findByIdAndDelete(id);
  }

  async getAllUsers(): Promise<any[]> {
    const users = await User.find({});
    return users.map((user: any) => ({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      role: user.role || "customer"
    }));
  }

  async getAnalytics(): Promise<any> {
    const orders = await Order.find({});
    const orderItems = await OrderItem.find({}).populate('productId');
    const vendors = await Vendor.find({});
    const products = await Product.find({});
    const users = await User.find({});
    const categories = await Category.find({});

    const totalRevenue = orders.reduce((sum, o: any) => sum + parseFloat(o.total || "0"), 0);
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalUsers = users.length;
    const totalVendors = vendors.length;
    const totalCategories = categories.length;

    const salesByCategory: Record<string, number> = {};
    const salesByVendor: Record<string, number> = {};
    
    for (const item of orderItems) {
      const product = item.productId as any;
      if (product) {
        const catId = product.categoryId?.toString() || 'unknown';
        const vendorId = product.vendorId?.toString() || 'unknown';
        const amount = parseFloat((item as any).price || "0") * ((item as any).quantity || 1);
        
        salesByCategory[catId] = (salesByCategory[catId] || 0) + amount;
        salesByVendor[vendorId] = (salesByVendor[vendorId] || 0) + amount;
      }
    }

    const recentOrders = orders
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(toPlainObject);

    return {
      totalRevenue: totalRevenue.toFixed(3),
      totalOrders,
      totalProducts,
      totalUsers,
      totalVendors,
      totalCategories,
      salesByCategory,
      salesByVendor,
      recentOrders
    };
  }

  async getAllOrders(): Promise<any[]> {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return orders.map(toPlainObject);
  }

  async getProducts(filters?: { categoryId?: string; vendorId?: string; search?: string; sortBy?: string }): Promise<any[]> {
    let query: any = {};
    
    if (filters?.categoryId && mongoose.Types.ObjectId.isValid(filters.categoryId)) {
      query.categoryId = new mongoose.Types.ObjectId(filters.categoryId);
    }
    if (filters?.vendorId && mongoose.Types.ObjectId.isValid(filters.vendorId)) {
      query.vendorId = new mongoose.Types.ObjectId(filters.vendorId);
    }

    let sortOption: any = {};
    if (filters?.sortBy === 'price_asc') sortOption = { price: 1 };
    else if (filters?.sortBy === 'price_desc') sortOption = { price: -1 };
    else if (filters?.sortBy === 'newest') sortOption = { createdAt: -1 };

    const products = await Product.find(query).sort(sortOption);
    return products.map(toPlainObject);
  }

  async getProduct(id: string): Promise<any | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const product = await Product.findById(id);
    return product ? toPlainObject(product) : undefined;
  }

  async createProduct(product: any): Promise<any> {
    const productData = { ...product };
    if (productData.vendorId && typeof productData.vendorId === 'string') {
      productData.vendorId = new mongoose.Types.ObjectId(productData.vendorId);
    }
    if (productData.categoryId && typeof productData.categoryId === 'string') {
      productData.categoryId = new mongoose.Types.ObjectId(productData.categoryId);
    }
    const newProduct = await Product.create(productData);
    return toPlainObject(newProduct);
  }

  async updateProduct(id: string, updates: any): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid product ID");
    }
    const updateData = { ...updates };
    if (updateData.vendorId && typeof updateData.vendorId === 'string') {
      updateData.vendorId = new mongoose.Types.ObjectId(updateData.vendorId);
    }
    if (updateData.categoryId && typeof updateData.categoryId === 'string') {
      updateData.categoryId = new mongoose.Types.ObjectId(updateData.categoryId);
    }
    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      throw new Error("Product not found");
    }
    return toPlainObject(updated);
  }

  async getCartItems(userId: string): Promise<any[]> {
    const items = await CartItem.find({ userId }).populate('productId');
    return items.map(item => {
      const obj = toPlainObject(item);
      if (obj.productId && typeof obj.productId === 'object') {
        obj.product = toPlainObject(obj.productId);
        delete obj.productId;
      }
      return obj;
    });
  }

  async addToCart(item: any): Promise<any> {
    const cartData = { ...item };
    if (cartData.productId && typeof cartData.productId === 'string') {
      cartData.productId = new mongoose.Types.ObjectId(cartData.productId);
    }
    const newItem = await CartItem.create(cartData);
    return toPlainObject(newItem);
  }

  async removeFromCart(id: string): Promise<void> {
    await CartItem.findByIdAndDelete(id);
  }

  async clearCart(userId: string): Promise<void> {
    await CartItem.deleteMany({ userId });
  }

  async createOrder(userId: string, total: string, items: { productId: string; quantity: number; price: string }[]): Promise<any> {
    const order = await Order.create({
      userId,
      total,
      status: "paid"
    });

    const vendorEarnings: Record<string, number> = {};

    for (const item of items) {
      await OrderItem.create({
        orderId: order._id,
        productId: new mongoose.Types.ObjectId(item.productId),
        quantity: item.quantity,
        price: item.price
      });

      const product = await Product.findById(item.productId);
      if (product) {
        const vendorIdStr = product.vendorId.toString();
        const lineTotal = parseFloat(item.price) * item.quantity;
        
        if (!vendorEarnings[vendorIdStr]) {
          vendorEarnings[vendorIdStr] = 0;
        }
        vendorEarnings[vendorIdStr] += lineTotal;
      }
    }

    for (const [vendorId, grossAmount] of Object.entries(vendorEarnings)) {
      const vendor = await Vendor.findById(vendorId);
      if (vendor) {
        const commissionType = vendor.commissionType || "percentage";
        const commissionValue = parseFloat(vendor.commissionValue || "5");
        
        let commission = 0;
        if (commissionType === "percentage") {
          commission = grossAmount * (commissionValue / 100);
        } else {
          commission = commissionValue;
        }
        
        const netEarning = Math.max(0, grossAmount - commission);
        const newGross = parseFloat(vendor.grossSalesKwd || "0") + grossAmount;
        const newPending = parseFloat(vendor.pendingPayoutKwd || "0") + netEarning;

        await Vendor.findByIdAndUpdate(vendorId, {
          grossSalesKwd: newGross.toFixed(3),
          pendingPayoutKwd: newPending.toFixed(3),
        });
      }
    }

    return toPlainObject(order);
  }

  async createGuestOrder(guestEmail: string, guestName: string, guestPhone: string, total: string, items: { productId: string; quantity: number; price: string }[]): Promise<any> {
    const order = await Order.create({
      userId: `guest:${guestEmail}`,
      guestEmail,
      guestName,
      guestPhone,
      total,
      status: "paid"
    });

    const vendorEarnings: Record<string, number> = {};

    for (const item of items) {
      await OrderItem.create({
        orderId: order._id,
        productId: new mongoose.Types.ObjectId(item.productId),
        quantity: item.quantity,
        price: item.price
      });

      const product = await Product.findById(item.productId);
      if (product) {
        const vendorIdStr = product.vendorId.toString();
        const lineTotal = parseFloat(item.price) * item.quantity;
        
        if (!vendorEarnings[vendorIdStr]) {
          vendorEarnings[vendorIdStr] = 0;
        }
        vendorEarnings[vendorIdStr] += lineTotal;
      }
    }

    for (const [vendorId, grossAmount] of Object.entries(vendorEarnings)) {
      const vendor = await Vendor.findById(vendorId);
      if (vendor) {
        const commissionType = vendor.commissionType || "percentage";
        const commissionValue = parseFloat(vendor.commissionValue || "5");
        
        let commission = 0;
        if (commissionType === "percentage") {
          commission = grossAmount * (commissionValue / 100);
        } else {
          commission = commissionValue;
        }
        
        const netEarning = Math.max(0, grossAmount - commission);
        const newGross = parseFloat(vendor.grossSalesKwd || "0") + grossAmount;
        const newPending = parseFloat(vendor.pendingPayoutKwd || "0") + netEarning;

        await Vendor.findByIdAndUpdate(vendorId, {
          grossSalesKwd: newGross.toFixed(3),
          pendingPayoutKwd: newPending.toFixed(3),
        });
      }
    }

    return toPlainObject(order);
  }

  async getOrders(userId: string): Promise<any[]> {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return orders.map(toPlainObject);
  }

  async getStories(): Promise<any[]> {
    const stories = await VendorStory.find({}).populate('vendorId').sort({ createdAt: -1 });
    return stories.map(story => {
      const obj = toPlainObject(story);
      if (obj.vendorId && typeof obj.vendorId === 'object') {
        obj.vendor = toPlainObject(obj.vendorId);
        obj.vendorId = obj.vendor.id;
      }
      return obj;
    });
  }

  async createStory(story: any): Promise<any> {
    const storyData = { ...story };
    if (storyData.vendorId && typeof storyData.vendorId === 'string') {
      storyData.vendorId = new mongoose.Types.ObjectId(storyData.vendorId);
    }
    const newStory = await VendorStory.create(storyData);
    return toPlainObject(newStory);
  }

  async deleteStory(id: string): Promise<void> {
    await VendorStory.findByIdAndDelete(id);
  }

  async getPaymentRequests(vendorId: string): Promise<any[]> {
    if (!mongoose.Types.ObjectId.isValid(vendorId)) return [];
    const requests = await PaymentRequest.find({ vendorId: new mongoose.Types.ObjectId(vendorId) }).sort({ createdAt: -1 });
    return requests.map(toPlainObject);
  }

  async createPaymentRequest(vendorId: string, amount: string): Promise<any> {
    const request = await PaymentRequest.create({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      amount
    });
    return toPlainObject(request);
  }

  async getVendorOrders(vendorId: string): Promise<any[]> {
    if (!mongoose.Types.ObjectId.isValid(vendorId)) return [];
    
    const vendorProducts = await Product.find({ vendorId: new mongoose.Types.ObjectId(vendorId) });
    const productIds = vendorProducts.map(p => p._id);
    
    if (productIds.length === 0) return [];
    
    const items = await OrderItem.find({ productId: { $in: productIds } });
    const orderIds = Array.from(new Set(items.map(i => i.orderId.toString())));
    
    if (orderIds.length === 0) return [];
    
    const orders = await Order.find({ _id: { $in: orderIds.map(id => new mongoose.Types.ObjectId(id)) } }).sort({ createdAt: -1 });
    return orders.map(toPlainObject);
  }
}

export const storage = new MongoStorage();
