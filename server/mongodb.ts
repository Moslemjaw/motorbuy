import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

export async function connectMongoDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI must be set in environment variables");
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  bio: String,
  phone: String,
  address: String,
  city: String,
  role: { type: String, enum: ["customer", "vendor", "admin"], default: "customer" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const vendorSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  storeName: { type: String, required: true },
  description: { type: String, required: true },
  logoUrl: String,
  coverImageUrl: String,
  bio: String,
  isApproved: { type: Boolean, default: false },
  commissionType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
  commissionValue: { type: String, default: "5" },
  commissionRate: { type: String, default: "0.10" }, // New: Default 10%
  grossSalesKwd: { type: String, default: "0" },
  pendingPayoutKwd: { type: String, default: "0" }, // Legacy: Consider migrating to walletBalanceKwd
  walletBalanceKwd: { type: String, default: "0" }, // New: Tracks net balance (positive = owed to vendor, negative = owed to platform)
  lifetimePayoutsKwd: { type: String, default: "0" },
  createdAt: { type: Date, default: Date.now },
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  imageUrl: String,
  icon: String,
});

const productSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, required: true },
  compareAtPrice: String,
  stock: { type: Number, default: 0 },
  brand: { type: String, required: true },
  images: { type: [String], default: [] },
  warrantyInfo: String,
  isBundle: { type: Boolean, default: false },
  bundleItems: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 }
  }],
  warrantyEligible: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guestEmail: { type: String },
  guestName: { type: String },
  guestPhone: { type: String },
  // Customer information for authenticated users
  customerName: { type: String },
  customerEmail: { type: String },
  customerPhone: { type: String },
  customerAddress: { type: String },
  customerCity: { type: String },
  paymentMethod: { type: String, enum: ["cod", "online", "pay-in-store", "gateway"], default: "pay-in-store" }, // Updated enums
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" }, // New
  platformFee: { type: String, default: "0" }, // New
  netAmount: { type: String, default: "0" }, // New: Vendor earnings for this order
  total: { type: String, required: true },
  status: { type: String, enum: ["pending", "paid", "shipped", "delivered", "cancelled"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const orderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  price: { type: String, required: true },
});

const vendorStorySchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  content: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const cartItemSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, default: 1 },
});

const paymentRequestSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  amount: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "paid", "rejected"], default: "pending" },
  notes: String,
  processedBy: String,
  createdAt: { type: Date, default: Date.now },
  processedAt: Date,
});

const vendorRequestSchema = new mongoose.Schema({
  userId: { type: String, required: false },
  companyName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  notes: String,
  processedBy: String,
  createdAt: { type: Date, default: Date.now },
  processedAt: Date,
});

const warrantySchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "3 Months", "6 Months", "1 Year"
  periodMonths: { type: Number, required: true }, // Duration in months
  price: { type: String, required: true }, // Price in KWD
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const warrantyPurchaseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  warrantyId: { type: mongoose.Schema.Types.ObjectId, ref: "Warranty", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // Link to order if purchased
  price: { type: String, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema({
  sid: { type: String, required: true, unique: true },
  sess: { type: Object, required: true },
  expire: { type: Date, required: true },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
export const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export const OrderItem = mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema);
export const VendorStory = mongoose.models.VendorStory || mongoose.model("VendorStory", vendorStorySchema);
export const CartItem = mongoose.models.CartItem || mongoose.model("CartItem", cartItemSchema);
export const PaymentRequest = mongoose.models.PaymentRequest || mongoose.model("PaymentRequest", paymentRequestSchema);
export const VendorRequest = mongoose.models.VendorRequest || mongoose.model("VendorRequest", vendorRequestSchema);
export const Warranty = mongoose.models.Warranty || mongoose.model("Warranty", warrantySchema);
export const WarrantyPurchase = mongoose.models.WarrantyPurchase || mongoose.model("WarrantyPurchase", warrantyPurchaseSchema);
export const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
