import { z } from "zod";

export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Role {
  userId: string;
  role: "customer" | "vendor" | "admin";
}

export interface Vendor {
  id: string;
  userId: string;
  storeName: string;
  description: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  bio?: string | null;
  isApproved: boolean;
  commissionType: "percentage" | "fixed";
  commissionValue: string;
  grossSalesKwd: string;
  pendingPayoutKwd: string;
  lifetimePayoutsKwd: string;
  createdAt?: Date | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  compareAtPrice?: string | null;
  stock: number;
  brand: string;
  images: string[];
  warrantyInfo?: string | null;
  createdAt?: Date | null;
}

export interface Order {
  id: string;
  userId: string;
  total: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  createdAt?: Date | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: string;
}

export interface VendorStory {
  id: string;
  vendorId: string;
  content?: string | null;
  imageUrl?: string | null;
  createdAt?: Date | null;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
}

export interface PaymentRequest {
  id: string;
  vendorId: string;
  amount: string;
  status: "pending" | "approved" | "paid" | "rejected";
  notes?: string | null;
  processedBy?: string | null;
  createdAt?: Date | null;
  processedAt?: Date | null;
}

export const insertRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["customer", "vendor", "admin"]).default("customer"),
});

export const insertVendorSchema = z.object({
  storeName: z.string().min(1),
  description: z.string().min(1),
  logoUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  bio: z.string().optional(),
});

export const insertCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  imageUrl: z.string().optional(),
});

export const insertProductSchema = z.object({
  vendorId: z.string(),
  categoryId: z.string(),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.string(),
  compareAtPrice: z.string().optional().nullable(),
  stock: z.number().default(0),
  brand: z.string().min(1),
  images: z.array(z.string()).default([]),
  warrantyInfo: z.string().optional().nullable(),
});

export const insertOrderSchema = z.object({
  userId: z.string(),
});

export const insertOrderItemSchema = z.object({
  orderId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  price: z.string(),
});

export const insertStorySchema = z.object({
  vendorId: z.string(),
  content: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
});

export const insertCartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().default(1),
});

export const insertPaymentRequestSchema = z.object({
  vendorId: z.string(),
  amount: z.string(),
});

export type InsertUser = Partial<User> & { id: string };
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;
