import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes, isAuthenticated } from "./auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { api } from "@shared/routes";
import { User, PaymentRequest } from "./mongodb";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  app.patch("/api/users/me", isAuthenticated, async (req: any, res) => {
    try {
      const { profileImageUrl, bio, phone, address, city } = req.body;
      const userId = req.session.userId;
      
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      if (bio !== undefined) updateData.bio = bio;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      
      const updated = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      );
      
      res.json(updated || { success: true });
    } catch (e) {
      console.error("Error updating profile:", e);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get(api.roles.get.path, isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.session.userId);
    res.json({ role });
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });

      const users = await User.find({});
      const usersWithRoles = await Promise.all(users.map(async (user: any) => {
        const id = user._id.toString();
        const userRole = await storage.getUserRole(id);
        return {
          id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: userRole
        };
      }));
      res.json(usersWithRoles);
    } catch (e) {
      console.error("Error fetching users:", e);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/role", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });

      const { userId, role: newRole } = req.body;
      if (!["customer", "vendor", "admin"].includes(newRole)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      await storage.setUserRole(userId, newRole);
      res.json({ success: true, message: `Role updated to ${newRole}` });
    } catch (e) {
      console.error("Error updating user role:", e);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.get("/api/admin/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (e) {
      console.error("Error fetching analytics:", e);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.post("/api/admin/categories", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });
      const { name, slug, imageUrl } = req.body;
      if (!name || !slug) return res.status(400).json({ message: "Name and slug are required" });
      const category = await storage.createCategory({ name, slug, imageUrl: imageUrl || `https://placehold.co/100x100?text=${encodeURIComponent(name)}` });
      res.status(201).json(category);
    } catch (e) {
      console.error("Error creating category:", e);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/admin/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });
      const updated = await storage.updateCategory(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Category not found" });
      res.json(updated);
    } catch (e) {
      console.error("Error updating category:", e);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (e) {
      console.error("Error deleting category:", e);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.post("/api/admin/vendors", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });
      const { storeName, description, userId } = req.body;
      if (!storeName) return res.status(400).json({ message: "Store name is required" });
      const vendor = await storage.createVendor({
        storeName,
        description: description || "",
        userId: userId || `admin-created-${Date.now()}`,
        isApproved: true,
        commissionType: "percentage",
        commissionValue: "5",
        grossSalesKwd: "0",
        pendingPayoutKwd: "0",
        lifetimePayoutsKwd: "0",
      });
      res.status(201).json(vendor);
    } catch (e) {
      console.error("Error creating vendor:", e);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.get(api.vendors.list.path, async (req, res) => {
    const vendors = await storage.getVendors();
    res.json(vendors);
  });

  app.get(api.vendors.get.path, async (req, res) => {
    const vendor = await storage.getVendor(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  });

  app.post(api.vendors.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.vendors.create.input.parse(req.body);
      const vendor = await storage.createVendor({ ...input, userId: req.session.userId });
      await storage.setUserRole(req.session.userId, "vendor");
      res.status(201).json(vendor);
    } catch (e) {
       res.status(400).json({ message: "Validation failed" });
    }
  });

  app.patch(api.vendors.approve.path, isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.session.userId);
    if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });

    const vendor = await storage.updateVendor(req.params.id, req.body);
    res.json(vendor);
  });

  app.patch("/api/vendors/:id", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.params.id;
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      if (vendor.userId !== req.session.userId) {
        const role = await storage.getUserRole(req.session.userId);
        if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateVendor(vendorId, req.body);
      res.json(updated);
    } catch (e) {
      console.error("Error updating vendor:", e);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.get("/api/admin/vendors/financials", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });

      const vendors = await storage.getVendors();
      const vendorsWithRequests = await Promise.all(vendors.map(async (vendor) => {
        const paymentRequests = await storage.getPaymentRequests(vendor.id);
        const pendingRequest = paymentRequests.find(r => r.status === 'pending');
        return {
          ...vendor,
          hasPendingRequest: !!pendingRequest,
          pendingRequestAmount: pendingRequest?.amount || null,
          pendingRequestId: pendingRequest?.id || null,
        };
      }));
      res.json(vendorsWithRequests);
    } catch (e) {
      console.error("Error fetching vendor financials:", e);
      res.status(500).json({ message: "Failed to fetch vendor financials" });
    }
  });

  app.patch("/api/admin/vendors/:id/commission", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });

      const { commissionType, commissionValue } = req.body;
      if (!["percentage", "fixed"].includes(commissionType)) {
        return res.status(400).json({ message: "Invalid commission type" });
      }
      if (isNaN(parseFloat(commissionValue)) || parseFloat(commissionValue) < 0) {
        return res.status(400).json({ message: "Invalid commission value" });
      }

      const vendor = await storage.updateVendor(req.params.id, { commissionType, commissionValue });
      res.json(vendor);
    } catch (e) {
      console.error("Error updating commission:", e);
      res.status(500).json({ message: "Failed to update commission" });
    }
  });

  app.post("/api/admin/vendors/:id/payout", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });

      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });

      const pendingAmount = parseFloat(vendor.pendingPayoutKwd);
      if (pendingAmount <= 0) {
        return res.status(400).json({ message: "No pending payout to process" });
      }

      const newLifetime = parseFloat(vendor.lifetimePayoutsKwd) + pendingAmount;
      await storage.updateVendor(req.params.id, {
        pendingPayoutKwd: "0",
        lifetimePayoutsKwd: newLifetime.toFixed(3),
      });

      const pendingRequests = (await storage.getPaymentRequests(vendor.id)).filter(r => r.status === 'pending');
      for (const request of pendingRequests) {
        await PaymentRequest.findByIdAndUpdate(request.id, {
          status: 'paid',
          processedBy: req.session.userId,
          processedAt: new Date(),
        });
      }

      res.json({ success: true, message: `Paid ${pendingAmount.toFixed(3)} KWD to vendor` });
    } catch (e) {
      console.error("Error processing payout:", e);
      res.status(500).json({ message: "Failed to process payout" });
    }
  });

  app.get("/api/admin/payout-requests", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });

      const requests = await PaymentRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
      const requestsWithVendor = await Promise.all(requests.map(async (req) => {
        const vendor = await storage.getVendor(req.vendorId.toString());
        return {
          id: req._id.toString(),
          vendorId: req.vendorId.toString(),
          vendorName: vendor?.storeName || 'Unknown',
          amount: req.amount,
          status: req.status,
          createdAt: req.createdAt,
        };
      }));
      res.json(requestsWithVendor);
    } catch (e) {
      console.error("Error fetching payout requests:", e);
      res.status(500).json({ message: "Failed to fetch payout requests" });
    }
  });

  app.get("/api/vendor/wallet", isAuthenticated, async (req: any, res) => {
    try {
      const vendors = await storage.getVendors();
      const vendor = vendors.find(v => v.userId === req.session.userId);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      
      const paymentRequests = await storage.getPaymentRequests(vendor.id);
      res.json({
        grossSalesKwd: vendor.grossSalesKwd,
        pendingPayoutKwd: vendor.pendingPayoutKwd,
        lifetimePayoutsKwd: vendor.lifetimePayoutsKwd,
        commissionType: vendor.commissionType,
        commissionValue: vendor.commissionValue,
        paymentRequests,
      });
    } catch (e) {
      console.error("Error getting wallet:", e);
      res.status(500).json({ message: "Failed to get wallet" });
    }
  });

  app.post("/api/vendor/wallet/request", isAuthenticated, async (req: any, res) => {
    try {
      const vendors = await storage.getVendors();
      const vendor = vendors.find(v => v.userId === req.session.userId);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      
      const pendingAmount = parseFloat(vendor.pendingPayoutKwd || "0");
      if (pendingAmount <= 0) return res.status(400).json({ message: "No pending payout available" });
      
      const existingRequests = await storage.getPaymentRequests(vendor.id);
      const hasPendingRequest = existingRequests.some(r => r.status === 'pending');
      if (hasPendingRequest) {
        return res.status(400).json({ message: "You already have a pending payout request" });
      }
      
      const request = await storage.createPaymentRequest(vendor.id, vendor.pendingPayoutKwd);
      res.status(201).json(request);
    } catch (e) {
      console.error("Error creating payment request:", e);
      res.status(500).json({ message: "Failed to create payment request" });
    }
  });

  app.get("/api/vendor/orders", isAuthenticated, async (req: any, res) => {
    try {
      const vendors = await storage.getVendors();
      const vendor = vendors.find(v => v.userId === req.session.userId);
      if (!vendor) return res.json([]);
      
      const orders = await storage.getVendorOrders(vendor.id);
      res.json(orders);
    } catch (e) {
      console.error("Error getting vendor orders:", e);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts(req.query as any);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post(api.products.create.path, isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.session.userId);
    if (role !== 'vendor') return res.status(403).json({ message: "Only vendors can add products" });

    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.cart.get.path, isAuthenticated, async (req: any, res) => {
    const items = await storage.getCartItems(req.session.userId);
    res.json(items);
  });

  app.post(api.cart.add.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.cart.add.input.parse(req.body);
      const item = await storage.addToCart({ ...input, userId: req.session.userId });
      res.status(201).json(item);
    } catch (e) {
      res.status(400).json({ message: "Error adding to cart" });
    }
  });

  app.delete(api.cart.remove.path, isAuthenticated, async (req: any, res) => {
    await storage.removeFromCart(req.params.id);
    res.status(204).send();
  });

  app.post(api.orders.create.path, isAuthenticated, async (req: any, res) => {
    const cartItems = await storage.getCartItems(req.session.userId);
    if (cartItems.length === 0) return res.status(400).json({ message: "Cart is empty" });

    let total = 0;
    const items = cartItems.map(item => {
      const price = parseFloat(item.product.price);
      total += price * item.quantity;
      return {
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      };
    });

    const order = await storage.createOrder(req.session.userId, total.toString(), items);
    await storage.clearCart(req.session.userId);
    res.status(201).json(order);
  });

  app.get(api.orders.list.path, isAuthenticated, async (req: any, res) => {
    const orders = await storage.getOrders(req.session.userId);
    res.json(orders);
  });

  app.get(api.stories.list.path, async (req, res) => {
    const stories = await storage.getStories();
    res.json(stories);
  });

  app.post(api.stories.create.path, isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.session.userId);
    if (role !== 'vendor') return res.status(403).json({ message: "Only vendors can post stories" });

    try {
      const input = api.stories.create.input.parse(req.body);
      const story = await storage.createStory(input);
      res.status(201).json(story);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.delete("/api/stories/:id", isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.session.userId);
    if (role !== 'vendor') return res.status(403).json({ message: "Only vendors can delete stories" });
    
    await storage.deleteStory(req.params.id);
    res.status(204).send();
  });

  // Seed initial categories
  const categories = await storage.getCategories();
  if (categories.length === 0) {
    await storage.createCategory({ name: "Engine Parts", slug: "engine-parts", imageUrl: "https://placehold.co/100x100?text=Engine" });
    await storage.createCategory({ name: "Brakes", slug: "brakes", imageUrl: "https://placehold.co/100x100?text=Brakes" });
    await storage.createCategory({ name: "Suspension", slug: "suspension", imageUrl: "https://placehold.co/100x100?text=Suspension" });
  }

  app.post("/api/seed", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const existingProducts = await storage.getProducts();
      if (existingProducts.length > 0) {
        return res.status(400).json({ message: "Database already has data. Clear it first before seeding." });
      }

      const { seedDatabase } = await import("./seed");
      const result = await seedDatabase();
      res.json({ 
        message: "Database seeded successfully with demo data",
        ...result
      });
    } catch (e) {
      console.error("Seeding error:", e);
      res.status(500).json({ message: "Seeding failed", error: String(e) });
    }
  });

  return httpServer;
}
