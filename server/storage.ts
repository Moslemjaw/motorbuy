import { 
  User, Vendor, Category, Product, Order, OrderItem, VendorStory, CartItem, PaymentRequest, VendorRequest, Warranty, WarrantyPurchase
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
  getSalesChartData(range: "day" | "month" | "year", vendorId?: string): Promise<any[]>;
  getAllOrders(): Promise<any[]>;
  getProducts(filters?: { categoryId?: string; vendorId?: string; search?: string; sortBy?: string }): Promise<any[]>;
  getProduct(id: string): Promise<any | undefined>;
  createProduct(product: any): Promise<any>;
  updateProduct(id: string, updates: any): Promise<any>;
  deleteProduct(id: string): Promise<void>;
  getCartItems(userId: string): Promise<any[]>;
  addToCart(item: any): Promise<any>;
  updateCartItemQuantity(id: string, quantity: number): Promise<any>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  createOrder(userId: string, total: string, items: { productId: string; quantity: number; price: string }[], customerInfo?: { name?: string; email?: string; phone?: string; address?: string; city?: string }, paymentMethod?: string, platformFee?: string, netAmount?: string): Promise<any>;
  createGuestOrder(guestEmail: string, guestName: string, guestPhone: string, total: string, items: { productId: string; quantity: number; price: string }[], paymentMethod?: string): Promise<any>;
  updateOrder(id: string, status: string): Promise<any>;
  updateOrderDetails(id: string, updates: any): Promise<any>;
  deleteOrder(id: string): Promise<void>;
  getOrders(userId: string): Promise<any[]>;
  getStories(): Promise<any[]>;
  getStory(id: string): Promise<any | undefined>;
  getStoriesByVendor(vendorId: string): Promise<any[]>;
  createStory(story: any): Promise<any>;
  updateStory(id: string, updates: any): Promise<any>;
  deleteStory(id: string): Promise<void>;
  getPaymentRequests(vendorId: string): Promise<any[]>;
  createPaymentRequest(vendorId: string, amount: string): Promise<any>;
  getVendorOrders(vendorId: string): Promise<any[]>;
  createVendorRequest(userId: string | null, companyName: string, phone: string, email: string): Promise<any>;
  getVendorRequests(): Promise<any[]>;
  getWarranties(): Promise<any[]>;
  getWarranty(id: string): Promise<any | undefined>;
  createWarranty(warranty: any): Promise<any>;
  updateWarranty(id: string, updates: any): Promise<any>;
  deleteWarranty(id: string): Promise<void>;
  getWarrantyPurchases(userId: string): Promise<any[]>;
  createWarrantyPurchase(purchase: any): Promise<any>;
}

function toPlainObject(doc: any): any {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  delete obj.__v;
  
  // Helper to safely convert ObjectId to string only if it's an ObjectId instance
  const safeIdToString = (val: any) => {
    if (val && val instanceof mongoose.Types.ObjectId) {
      return val.toString();
    }
    return val;
  };
  
  if (obj.vendorId) obj.vendorId = safeIdToString(obj.vendorId);
  if (obj.categoryId) obj.categoryId = safeIdToString(obj.categoryId);
  if (obj.productId) obj.productId = safeIdToString(obj.productId);
  if (obj.orderId) obj.orderId = safeIdToString(obj.orderId);
  if (obj.warrantyId) obj.warrantyId = safeIdToString(obj.warrantyId);
  
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
    const totalSales = totalRevenue; // Total sales is the same as total revenue
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalUsers = users.length;
    const totalVendors = vendors.length;
    const totalCategories = categories.length;
    
    // Calculate order statuses
    const pendingOrders = orders.filter((o: any) => o.status === 'pending' || !o.status).length;
    const completedOrders = orders.filter((o: any) => o.status === 'delivered').length;
    const processingOrders = orders.filter((o: any) => o.status === 'processing').length;
    
    // Calculate platform commission (sum of all platform fees)
    const totalCommission = orders.reduce((sum, o: any) => sum + parseFloat(o.platformFee || "0"), 0);
    
    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate total gross sales from vendors
    const totalGrossSales = vendors.reduce((sum, v: any) => sum + parseFloat(v.grossSalesKwd || "0"), 0);
    
    // Calculate total pending payouts
    const totalPendingPayouts = vendors.reduce((sum, v: any) => {
      const pending = parseFloat(v.pendingPayoutKwd || "0");
      return sum + (pending > 0 ? pending : 0);
    }, 0);

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

    const sortedOrders = orders
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    // Get order items for recent orders
    const recentOrders = await Promise.all(sortedOrders.map(async (order) => {
      const orderItems = await OrderItem.find({ orderId: order._id })
        .populate('productId');
      
      const orderObj = toPlainObject(order);
      orderObj.items = orderItems.map(item => {
        const itemObj = toPlainObject(item);
        if (itemObj.productId && typeof itemObj.productId === 'object') {
          itemObj.product = toPlainObject(itemObj.productId);
          delete itemObj.productId;
        }
        return itemObj;
      });
      
      return orderObj;
    }));

    return {
      totalRevenue: totalRevenue.toFixed(3),
      totalSales: totalSales.toFixed(3),
      totalOrders,
      totalProducts,
      totalUsers,
      totalVendors,
      totalCategories,
      pendingOrders,
      completedOrders,
      processingOrders,
      totalCommission: totalCommission.toFixed(3),
      averageOrderValue: averageOrderValue.toFixed(3),
      totalGrossSales: totalGrossSales.toFixed(3),
      totalPendingPayouts: totalPendingPayouts.toFixed(3),
      salesByCategory,
      salesByVendor,
      recentOrders
    };
  }

  async getSalesChartData(range: "day" | "month" | "year", vendorId?: string): Promise<any[]> {
    const now = new Date();
    let startDate: Date;
    let groupFormat: string;
    let dateFormat: (date: Date) => string;

    if (range === "day") {
      // Last 30 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      groupFormat = "%Y-%m-%d";
      dateFormat = (d: Date) => d.toISOString().split("T")[0];
    } else if (range === "month") {
      // Last 12 months
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      groupFormat = "%Y-%m";
      dateFormat = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else {
      // Last 5 years
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 5);
      groupFormat = "%Y";
      dateFormat = (d: Date) => String(d.getFullYear());
    }

    // Build query
    const query: any = {
      createdAt: { $gte: startDate },
    };

    // Filter by vendor if specified
    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      const orderItems = await OrderItem.find({}).populate("productId");
      const orderIds = orderItems
        .filter((item: any) => {
          const product = item.productId;
          return product && product.vendorId && product.vendorId.toString() === vendorId;
        })
        .map((item: any) => item.orderId);
      
      if (orderIds.length === 0) {
        return [];
      }
      query._id = { $in: orderIds };
    }

    const orders = await Order.find(query).sort({ createdAt: 1 });
    
    // Group orders by date
    const salesByDate: Record<string, number> = {};
    
    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      const dateKey = dateFormat(orderDate);
      
      // If filtering by vendor, only count items from that vendor
      if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
        const orderItems = await OrderItem.find({ orderId: order._id }).populate("productId");
        let orderTotal = 0;
        for (const item of orderItems) {
          const product = (item as any).productId;
          if (product && product.vendorId && product.vendorId.toString() === vendorId) {
            orderTotal += parseFloat((item as any).price || "0") * ((item as any).quantity || 1);
          }
        }
        salesByDate[dateKey] = (salesByDate[dateKey] || 0) + orderTotal;
      } else {
        salesByDate[dateKey] = (salesByDate[dateKey] || 0) + parseFloat(order.total || "0");
      }
    }

    // Convert to array format
    const result: { label: string; sales: number }[] = [];
    const currentDate = new Date(startDate);
    const endDate = new Date(now);

    while (currentDate <= endDate) {
      const dateKey = dateFormat(currentDate);
      result.push({
        label: dateKey,
        sales: salesByDate[dateKey] || 0,
      });

      if (range === "day") {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (range === "month") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }

    return result;
  }

  async getAllOrders(): Promise<any[]> {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    
    // Get order items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const orderItems = await OrderItem.find({ orderId: order._id })
        .populate('productId');
      
      const orderObj = toPlainObject(order);
      orderObj.items = orderItems.map(item => {
        const itemObj = toPlainObject(item);
        if (itemObj.productId && typeof itemObj.productId === 'object') {
          itemObj.product = toPlainObject(itemObj.productId);
          delete itemObj.productId;
        }
        return itemObj;
      });
      
      return orderObj;
    }));
    
    return ordersWithItems;
  }

  async getProducts(filters?: { categoryId?: string; vendorId?: string; search?: string; sortBy?: string }): Promise<any[]> {
    let query: any = {};
    
    if (filters?.categoryId && mongoose.Types.ObjectId.isValid(filters.categoryId)) {
      query.categoryId = new mongoose.Types.ObjectId(filters.categoryId);
    }
    if (filters?.vendorId && mongoose.Types.ObjectId.isValid(filters.vendorId)) {
      query.vendorId = new mongoose.Types.ObjectId(filters.vendorId);
    }
    
    // Add text search if provided
    if (filters?.search) {
       query.$or = [
         { name: { $regex: filters.search, $options: 'i' } },
         { description: { $regex: filters.search, $options: 'i' } }
       ];
    }

    let sortOption: any = {};
    if (filters?.sortBy === 'price_asc') sortOption = { price: 1 };
    else if (filters?.sortBy === 'price_desc') sortOption = { price: -1 };
    else if (filters?.sortBy === 'newest') sortOption = { createdAt: -1 };

    const products = await Product.find(query)
      .sort(sortOption)
      .populate('bundleItems.productId');

    return products.map(product => {
      const obj = toPlainObject(product);
      
      // Transform populated bundleItems
      if (obj.isBundle && obj.bundleItems) {
        obj.bundleItems = obj.bundleItems.map((item: any) => {
          const itemObj = toPlainObject(item);
          if (itemObj.productId && typeof itemObj.productId === 'object') {
             itemObj.product = toPlainObject(itemObj.productId);
             itemObj.productId = itemObj.product.id;
          }
          return itemObj;
        });
      }
      return obj;
    });
  }

  async getProduct(id: string): Promise<any | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const product = await Product.findById(id).populate('bundleItems.productId');
    
    if (!product) return undefined;

    const obj = toPlainObject(product);
    
    // Transform populated bundleItems
    if (obj.isBundle && obj.bundleItems) {
      obj.bundleItems = obj.bundleItems.map((item: any) => {
        const itemObj = toPlainObject(item);
        if (itemObj.productId && typeof itemObj.productId === 'object') {
           itemObj.product = toPlainObject(itemObj.productId);
           itemObj.productId = itemObj.product.id;
        }
        return itemObj;
      });
    }
    
    return obj;
  }

  async createProduct(product: any): Promise<any> {
    const productData = { ...product };
    if (productData.vendorId && typeof productData.vendorId === 'string') {
      productData.vendorId = new mongoose.Types.ObjectId(productData.vendorId);
    }
    if (productData.categoryId && typeof productData.categoryId === 'string') {
      productData.categoryId = new mongoose.Types.ObjectId(productData.categoryId);
    }

    // Handle bundleItems
    if (productData.bundleItems && Array.isArray(productData.bundleItems)) {
      productData.bundleItems = productData.bundleItems.map((item: any) => ({
        ...item,
        productId: new mongoose.Types.ObjectId(item.productId)
      }));
    }

    const newProduct = await Product.create(productData);
    
    // If it's a bundle, we might want to populate it for the return value, 
    // but typically creation just returns the object. 
    // For consistency with getProduct, we can return as is or populate.
    // Let's populate if it is a bundle.
    if (newProduct.isBundle && newProduct.bundleItems?.length > 0) {
      const populated = await Product.findById(newProduct._id).populate('bundleItems.productId');
      return toPlainObject(populated);
    }
    
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

    // Handle bundleItems if present
    if (updateData.bundleItems && Array.isArray(updateData.bundleItems)) {
      updateData.bundleItems = updateData.bundleItems.map((item: any) => ({
        ...item,
        productId: new mongoose.Types.ObjectId(item.productId)
      }));
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      throw new Error("Product not found");
    }
    
    if (updated.isBundle) {
       const populated = await Product.findById(updated._id).populate('bundleItems.productId');
       return toPlainObject(populated);
    }

    return toPlainObject(updated);
  }

  async deleteProduct(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid product ID");
    }
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      throw new Error("Product not found");
    }
    // Also remove from any carts that contain this product
    await CartItem.deleteMany({ productId: new mongoose.Types.ObjectId(id) });
  }

  async getCartItems(userId: string): Promise<any[]> {
    try {
      const items = await CartItem.find({ userId }).populate('productId');
      return items
        .map(item => {
          try {
            const obj = toPlainObject(item);
            // Check if productId was populated (it's an object) or if it's still an ID
            if (obj.productId) {
              // If it's a valid ObjectId (instance or string), it wasn't populated properly
              const isId = obj.productId instanceof mongoose.Types.ObjectId || 
                           (typeof obj.productId === 'string') ||
                           mongoose.Types.ObjectId.isValid(obj.productId);

              // If it is an object and NOT just an ID, it is populated
              if (typeof obj.productId === 'object' && obj.productId !== null && !isId) {
                // Product was populated successfully
                obj.product = toPlainObject(obj.productId);
                delete obj.productId;
              } else {
                // Product wasn't populated or is just an ID
                // This means product might be deleted or populate failed
                return null;
              }
            } else {
              // Product doesn't exist (was deleted)
              return null;
            }
            
            // Ensure product ID is properly set in the product object
            if (obj.product) {
               if (!obj.product.id && obj.product._id) {
                 obj.product.id = obj.product._id.toString();
               }
            }
            
            return obj;
          } catch (err) {
            console.error("Error processing cart item:", err);
            return null;
          }
        })
        .filter(item => item !== null && item.product);
    } catch (e) {
      console.error("Critical error in getCartItems:", e);
      throw e;
    }
  }

  async addToCart(item: any): Promise<any> {
    const cartData = { ...item };
    if (cartData.productId && typeof cartData.productId === 'string') {
      cartData.productId = new mongoose.Types.ObjectId(cartData.productId);
    }
    
    // Verify product exists
    const product = await Product.findById(cartData.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Check if item already exists in cart
    const existingItem = await CartItem.findOne({
      userId: cartData.userId,
      productId: cartData.productId,
    });
    
    let result;
    if (existingItem) {
      // Update quantity if item already exists
      existingItem.quantity = (existingItem.quantity || 1) + (cartData.quantity || 1);
      result = await existingItem.save();
    } else {
      // Create new item if it doesn't exist
      result = await CartItem.create(cartData);
    }
    
    // Populate product and return
    const populatedResult = await CartItem.findById(result._id).populate('productId');
    const obj = toPlainObject(populatedResult);
    if (obj.productId && typeof obj.productId === 'object') {
      obj.product = toPlainObject(obj.productId);
      delete obj.productId;
    } else {
      // Fallback: use the product we fetched earlier
      obj.product = toPlainObject(product);
    }
    return obj;
  }

  async updateCartItemQuantity(id: string, quantity: number): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid cart item ID");
    }
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }
    const updated = await CartItem.findByIdAndUpdate(
      id,
      { quantity },
      { new: true }
    ).populate('productId');
    if (!updated) {
      throw new Error("Cart item not found");
    }
    const obj = toPlainObject(updated);
    if (obj.productId && typeof obj.productId === 'object') {
      obj.product = toPlainObject(obj.productId);
      delete obj.productId;
    }
    return obj;
  }

  async removeFromCart(id: string): Promise<void> {
    await CartItem.findByIdAndDelete(id);
  }

  async clearCart(userId: string): Promise<void> {
    await CartItem.deleteMany({ userId });
  }

  async createOrder(
    userId: string, 
    total: string, 
    items: { productId: string; quantity: number; price: string }[],
    customerInfo?: { name?: string; email?: string; phone?: string; address?: string; city?: string },
    paymentMethod: string = "pay-in-store",
    platformFee: string = "0",
    netAmount: string = "0"
  ): Promise<any> {
    const orderData: any = {
      userId,
      total,
      status: "pending", 
      paymentMethod,
      platformFee,
      netAmount,
      paymentStatus: paymentMethod === "pay-in-store" ? "pending" : "paid" // Simple assumption for now
    };
    
    // Add customer information if provided
    if (customerInfo) {
      orderData.customerName = customerInfo.name;
      orderData.customerEmail = customerInfo.email;
      orderData.customerPhone = customerInfo.phone;
      orderData.customerAddress = customerInfo.address;
      orderData.customerCity = customerInfo.city;
    }
    
    const order = await Order.create(orderData);

    for (const item of items) {
      await OrderItem.create({
        orderId: order._id,
        productId: new mongoose.Types.ObjectId(item.productId),
        quantity: item.quantity,
        price: item.price
      });
    }

    return toPlainObject(order);
  }

  async createGuestOrder(guestEmail: string, guestName: string, guestPhone: string, total: string, items: { productId: string; quantity: number; price: string }[], paymentMethod: string = "pay-in-store"): Promise<any> {
    const order = await Order.create({
      userId: `guest:${guestEmail}`,
      guestEmail,
      guestName,
      guestPhone,
      total,
      status: "pending",
      paymentMethod,
      paymentStatus: paymentMethod === "pay-in-store" ? "pending" : "paid"
    });

    for (const item of items) {
      await OrderItem.create({
        orderId: order._id,
        productId: new mongoose.Types.ObjectId(item.productId),
        quantity: item.quantity,
        price: item.price
      });
    }

    return toPlainObject(order);
  }

  async updateOrder(id: string, status: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid order ID");
    }
    const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });
    return toPlainObject(updated);
  }

  async updateOrderDetails(id: string, updates: any): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid order ID");
    }
    const updated = await Order.findByIdAndUpdate(id, updates, { new: true });
    return toPlainObject(updated);
  }

  async deleteOrder(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid order ID");
    }
    await Order.findByIdAndDelete(id);
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
        obj.vendorId = String(obj.vendor.id || obj.vendorId);
      } else if (obj.vendorId) {
        obj.vendorId = String(obj.vendorId);
      }
      return obj;
    });
  }

  async getStoriesByVendor(vendorId: string): Promise<any[]> {
    if (!mongoose.Types.ObjectId.isValid(vendorId)) return [];
    const stories = await VendorStory.find({ vendorId: new mongoose.Types.ObjectId(vendorId) })
      .populate('vendorId')
      .sort({ createdAt: -1 });
    return stories.map(story => {
      const obj = toPlainObject(story);
      if (obj.vendorId && typeof obj.vendorId === 'object') {
        obj.vendor = toPlainObject(obj.vendorId);
        obj.vendorId = obj.vendor.id;
      } else if (obj.vendorId) {
        obj.vendorId = String(obj.vendorId);
      }
    return obj;
    });
  }

  async getStory(id: string): Promise<any | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return undefined;
    }
    const story = await VendorStory.findById(id).populate('vendorId');
    if (!story) {
      return undefined;
    }
    const obj = toPlainObject(story);
    
    // Handle vendorId normalization - ensure it's always a string
    if (obj.vendorId) {
      if (typeof obj.vendorId === 'object') {
        // If populated, extract the vendor object and get its ID
        const vendorObj = toPlainObject(obj.vendorId);
        obj.vendor = vendorObj;
        // Try multiple ways to get the vendor ID
        obj.vendorId = String(vendorObj.id || vendorObj._id || obj.vendorId);
      } else {
        // If it's already a string or primitive, convert to string
        obj.vendorId = String(obj.vendorId);
      }
    }
    
    return obj;
  }

  async createStory(story: any): Promise<any> {
    const storyData = { ...story };
    if (storyData.vendorId && typeof storyData.vendorId === 'string') {
      storyData.vendorId = new mongoose.Types.ObjectId(storyData.vendorId);
    }
    const newStory = await VendorStory.create(storyData);
    // Populate vendorId to ensure consistent format
    const populatedStory = await VendorStory.findById(newStory._id).populate('vendorId');
    const obj = toPlainObject(populatedStory);
    // Convert vendorId to string format (consistent with getStories)
    if (obj.vendorId && typeof obj.vendorId === 'object') {
      obj.vendor = toPlainObject(obj.vendorId);
      obj.vendorId = obj.vendor.id;
    } else if (obj.vendorId) {
      obj.vendorId = String(obj.vendorId);
    }
    return obj;
  }

  async updateStory(id: string, updates: any): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid story ID");
    }
    const updated = await VendorStory.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      throw new Error("Story not found");
    }
    return toPlainObject(updated);
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
    
    const orders = await Order.find({ _id: { $in: orderIds.map(id => new mongoose.Types.ObjectId(id)) } })
      .sort({ createdAt: -1 });
    
    // Get order items for each order and include customer info
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const orderItems = await OrderItem.find({ orderId: order._id })
        .populate('productId');
      
      const vendorOrderItems = orderItems.filter(item => {
        const productId = item.productId?._id?.toString() || item.productId?.toString();
        return productIds.some(vpId => vpId.toString() === productId);
      });
      
      const orderObj = toPlainObject(order);
      orderObj.items = vendorOrderItems.map(item => {
        const itemObj = toPlainObject(item);
        if (itemObj.productId && typeof itemObj.productId === 'object') {
          itemObj.product = toPlainObject(itemObj.productId);
          delete itemObj.productId;
        }
        return itemObj;
      });
      
      // Calculate total for this vendor's items in the order
      const vendorTotal = vendorOrderItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);
      orderObj.vendorTotal = vendorTotal.toFixed(3);
      
      return orderObj;
    }));
    
    return ordersWithItems;
  }

  async createVendorRequest(userId: string | null, companyName: string, phone: string, email: string): Promise<any> {
    const request = new VendorRequest({
      userId: userId || undefined,
      companyName,
      phone,
      email,
      status: "pending",
    });
    await request.save();
    return toPlainObject(request);
  }

  async getVendorRequests(): Promise<any[]> {
    const requests = await VendorRequest.find({}).sort({ createdAt: -1 });
    return requests.map(toPlainObject);
  }

  async getWarranties(): Promise<any[]> {
    const warranties = await Warranty.find({}).sort({ periodMonths: 1 });
    return warranties.map(toPlainObject);
  }

  async getWarranty(id: string): Promise<any | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const warranty = await Warranty.findById(id);
    return warranty ? toPlainObject(warranty) : undefined;
  }

  async createWarranty(warranty: any): Promise<any> {
    const newWarranty = await Warranty.create({
      ...warranty,
      updatedAt: new Date(),
    });
    return toPlainObject(newWarranty);
  }

  async updateWarranty(id: string, updates: any): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid warranty ID");
    }
    const updated = await Warranty.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      throw new Error("Warranty not found");
    }
    return toPlainObject(updated);
  }

  async deleteWarranty(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid warranty ID");
    }
    await Warranty.findByIdAndDelete(id);
  }

  async getWarrantyPurchases(userId: string): Promise<any[]> {
    const purchases = await WarrantyPurchase.find({ userId })
      .populate('productId')
      .populate('warrantyId')
      .sort({ createdAt: -1 });
    return purchases.map(purchase => {
      const obj = toPlainObject(purchase);
      if (obj.productId && typeof obj.productId === 'object') {
        obj.product = toPlainObject(obj.productId);
        obj.productId = obj.product.id;
      }
      if (obj.warrantyId && typeof obj.warrantyId === 'object') {
        obj.warranty = toPlainObject(obj.warrantyId);
        obj.warrantyId = obj.warranty.id;
      }
      return obj;
    });
  }

  async createWarrantyPurchase(purchase: any): Promise<any> {
    const purchaseData = { ...purchase };
    if (purchaseData.productId && typeof purchaseData.productId === 'string') {
      purchaseData.productId = new mongoose.Types.ObjectId(purchaseData.productId);
    }
    if (purchaseData.warrantyId && typeof purchaseData.warrantyId === 'string') {
      purchaseData.warrantyId = new mongoose.Types.ObjectId(purchaseData.warrantyId);
    }
    if (purchaseData.orderId && typeof purchaseData.orderId === 'string') {
      purchaseData.orderId = new mongoose.Types.ObjectId(purchaseData.orderId);
    }
    
    // Calculate end date from warranty period
    const warranty = await Warranty.findById(purchaseData.warrantyId);
    if (!warranty) {
      throw new Error("Warranty not found");
    }
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + warranty.periodMonths);
    purchaseData.startDate = startDate;
    purchaseData.endDate = endDate;
    
    const newPurchase = await WarrantyPurchase.create(purchaseData);
    const populated = await WarrantyPurchase.findById(newPurchase._id)
      .populate('productId')
      .populate('warrantyId');
    
    const obj = toPlainObject(populated);
    if (obj.productId && typeof obj.productId === 'object') {
      obj.product = toPlainObject(obj.productId);
      obj.productId = obj.product.id;
    }
    if (obj.warrantyId && typeof obj.warrantyId === 'object') {
      obj.warranty = toPlainObject(obj.warrantyId);
      obj.warrantyId = obj.warranty.id;
    }
    return obj;
  }
}

export const storage = new MongoStorage();
