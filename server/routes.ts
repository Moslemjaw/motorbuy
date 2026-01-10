import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes, isAuthenticated } from "./auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { api } from "@shared/routes";
import { User, PaymentRequest } from "./mongodb";

// Helper function to normalize IDs for comparison
function normalizeId(id: any): string {
  if (!id) return "";
  if (typeof id === "string") return id.trim();
  if (typeof id === "object" && id.toString) {
    const str = String(id.toString()).trim();
    // Handle MongoDB ObjectId format - extract just the hex string
    if (str.startsWith("ObjectId(") && str.endsWith(")")) {
      return str.slice(9, -1).trim();
    }
    return str;
  }
  if (typeof id === "object" && id.id) return String(id.id).trim();
  if (typeof id === "object" && id._id) return String(id._id).trim();
  return String(id).trim();
}

// Helper function to compare IDs with multiple fallback strategies
function compareIds(id1: any, id2: any): boolean {
  const normalized1 = normalizeId(id1);
  const normalized2 = normalizeId(id2);

  // Direct string comparison
  if (normalized1 && normalized2 && normalized1 === normalized2) {
    return true;
  }

  // If both are ObjectIds, compare their hex strings
  if (id1 && id2 && id1.toString && id2.toString) {
    const str1 = String(id1.toString()).trim();
    const str2 = String(id2.toString()).trim();
    if (str1 === str2) return true;
  }

  return false;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  // Health check endpoint for keepalive pings
  app.get("/api/health", async (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // One-time setup endpoint to seed database (no auth required for initial setup)
  app.post("/api/setup/seed", async (req: any, res) => {
    try {
      const { seedDatabase } = await import("./seed");
      const result = await seedDatabase();
      res.json({
        message: "Database seeded successfully!",
        testUsers: {
          vendor: {
            email: "vendor@test.com",
            password: "test123",
            role: "vendor",
          },
          admin: {
            email: "admin@test.com",
            password: "test123",
            role: "admin",
          },
        },
        ...result,
      });
    } catch (e) {
      console.error("Seeding error:", e);
      res.status(500).json({ message: "Seeding failed", error: String(e) });
    }
  });

  // One-time setup endpoint to assign initial roles (no auth required for setup)
  app.post("/api/setup/roles", async (req: any, res) => {
    try {
      const { email, role } = req.body;

      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }

      if (!["customer", "vendor", "admin"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role. Must be: customer, vendor, or admin",
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res
          .status(404)
          .json({ message: `User with email ${email} not found` });
      }

      await storage.setUserRole(user._id.toString(), role);
      res.json({
        success: true,
        message: `Role '${role}' assigned to ${email}`,
        userId: user._id.toString(),
        email: user.email,
        role: role,
      });
    } catch (e) {
      console.error("Error setting role:", e);
      res.status(500).json({ message: "Failed to set role", error: String(e) });
    }
  });

  app.patch("/api/users/me", isAuthenticated, async (req: any, res) => {
    try {
      const { profileImageUrl, bio, phone, address, city } = req.body;
      const userId = req.session.userId;

      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (profileImageUrl !== undefined)
        updateData.profileImageUrl = profileImageUrl;
      if (bio !== undefined) updateData.bio = bio;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;

      const updated = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      });

      res.json(updated || { success: true });
    } catch (e) {
      console.error("Error updating profile:", e);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get(api.roles.get.path, isAuthenticated, async (req: any, res) => {
    try {
      console.log("Role endpoint - Session ID:", req.sessionID);
      console.log("Role endpoint - Session userId:", req.session.userId);
      console.log("Role endpoint - Session exists:", !!req.session);

      if (!req.session || !req.session.userId) {
        console.log("Role endpoint - No session or userId");
        return res.status(401).json({ message: "Not authenticated" });
      }
      const role = await storage.getUserRole(req.session.userId);
      console.log("Role endpoint - userId:", req.session.userId, "role:", role);
      res.json({ role: role || "customer" });
    } catch (error) {
      console.error("Error fetching role:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch role", error: String(error) });
    }
  });

  // Get all users with roles (admin only)
  app.get("/api/admin/roles", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });

      const users = await User.find({});
      const usersWithRoles = users.map((user: any) => ({
        id: user._id.toString(),
        userId: user._id.toString(),
        role: user.role || "customer",
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      }));
      res.json(usersWithRoles);
    } catch (e) {
      console.error("Error fetching roles:", e);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });

      const users = await User.find({});
      const usersWithRoles = await Promise.all(
        users.map(async (user: any) => {
          const id = user._id.toString();
          const userRole = await storage.getUserRole(id);
          return {
            id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: userRole,
          };
        })
      );
      res.json(usersWithRoles);
    } catch (e) {
      console.error("Error fetching users:", e);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/role", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });

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

  // Set role by email (for initial setup - admin only)
  app.post(
    "/api/admin/users/role-by-email",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const role = await storage.getUserRole(req.session.userId);
        if (role !== "admin")
          return res.status(403).json({ message: "Forbidden" });

        const { email, role: newRole } = req.body;
        if (!email || !newRole) {
          return res
            .status(400)
            .json({ message: "Email and role are required" });
        }
        if (!["customer", "vendor", "admin"].includes(newRole)) {
          return res.status(400).json({ message: "Invalid role" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        await storage.setUserRole(user._id.toString(), newRole);
        res.json({
          success: true,
          message: `Role updated to ${newRole} for ${email}`,
        });
      } catch (e) {
        console.error("Error updating user role by email:", e);
        res.status(500).json({ message: "Failed to update role" });
      }
    }
  );

  app.get("/api/admin/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
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
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
      const { name, slug, imageUrl } = req.body;
      if (!name || !slug)
        return res.status(400).json({ message: "Name and slug are required" });
      const category = await storage.createCategory({
        name,
        slug,
        imageUrl:
          imageUrl ||
          `https://placehold.co/100x100?text=${encodeURIComponent(name)}`,
      });
      res.status(201).json(category);
    } catch (e) {
      console.error("Error creating category:", e);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch(
    "/api/admin/categories/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const role = await storage.getUserRole(req.session.userId);
        if (role !== "admin")
          return res.status(403).json({ message: "Forbidden" });
        const updated = await storage.updateCategory(req.params.id, req.body);
        if (!updated)
          return res.status(404).json({ message: "Category not found" });
        res.json(updated);
      } catch (e) {
        console.error("Error updating category:", e);
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  );

  app.delete(
    "/api/admin/categories/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const role = await storage.getUserRole(req.session.userId);
        if (role !== "admin")
          return res.status(403).json({ message: "Forbidden" });
        await storage.deleteCategory(req.params.id);
        res.status(204).send();
      } catch (e) {
        console.error("Error deleting category:", e);
        res.status(500).json({ message: "Failed to delete category" });
      }
    }
  );

  app.post("/api/admin/vendors", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
      const { storeName, description, userId } = req.body;
      if (!storeName)
        return res.status(400).json({ message: "Store name is required" });
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
      const vendor = await storage.createVendor({
        ...input,
        userId: req.session.userId,
      });
      await storage.setUserRole(req.session.userId, "vendor");
      res.status(201).json(vendor);
    } catch (e) {
      res.status(400).json({ message: "Validation failed" });
    }
  });

  app.patch(
    api.vendors.approve.path,
    isAuthenticated,
    async (req: any, res) => {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });

      const vendor = await storage.updateVendor(req.params.id, req.body);
      res.json(vendor);
    }
  );

  app.patch("/api/vendors/:id", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.params.id;
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      if (vendor.userId !== req.session.userId) {
        const role = await storage.getUserRole(req.session.userId);
        if (role !== "admin")
          return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateVendor(vendorId, req.body);
      res.json(updated);
    } catch (e) {
      console.error("Error updating vendor:", e);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.get(
    "/api/admin/vendors/financials",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const role = await storage.getUserRole(req.session.userId);
        if (role !== "admin")
          return res.status(403).json({ message: "Forbidden" });

        const vendors = await storage.getVendors();
        const vendorsWithRequests = await Promise.all(
          vendors.map(async (vendor) => {
            const paymentRequests = await storage.getPaymentRequests(vendor.id);
            const pendingRequest = paymentRequests.find(
              (r) => r.status === "pending"
            );
            return {
              ...vendor,
              hasPendingRequest: !!pendingRequest,
              pendingRequestAmount: pendingRequest?.amount || null,
              pendingRequestId: pendingRequest?.id || null,
            };
          })
        );
        res.json(vendorsWithRequests);
      } catch (e) {
        console.error("Error fetching vendor financials:", e);
        res.status(500).json({ message: "Failed to fetch vendor financials" });
      }
    }
  );

  app.patch(
    "/api/admin/vendors/:id/commission",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const role = await storage.getUserRole(req.session.userId);
        if (role !== "admin")
          return res.status(403).json({ message: "Forbidden" });

        const { commissionType, commissionValue } = req.body;
        if (!["percentage", "fixed"].includes(commissionType)) {
          return res.status(400).json({ message: "Invalid commission type" });
        }
        if (
          isNaN(parseFloat(commissionValue)) ||
          parseFloat(commissionValue) < 0
        ) {
          return res.status(400).json({ message: "Invalid commission value" });
        }

        const vendor = await storage.updateVendor(req.params.id, {
          commissionType,
          commissionValue,
        });
        res.json(vendor);
      } catch (e) {
        console.error("Error updating commission:", e);
        res.status(500).json({ message: "Failed to update commission" });
      }
    }
  );

  app.post(
    "/api/admin/vendors/:id/payout",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const role = await storage.getUserRole(req.session.userId);
        if (role !== "admin")
          return res.status(403).json({ message: "Forbidden" });

        const vendor = await storage.getVendor(req.params.id);
        if (!vendor)
          return res.status(404).json({ message: "Vendor not found" });

        const pendingAmount = parseFloat(vendor.pendingPayoutKwd);
        if (pendingAmount <= 0) {
          return res
            .status(400)
            .json({ message: "No pending payout to process" });
        }

        const newLifetime =
          parseFloat(vendor.lifetimePayoutsKwd) + pendingAmount;
        await storage.updateVendor(req.params.id, {
          pendingPayoutKwd: "0",
          lifetimePayoutsKwd: newLifetime.toFixed(3),
        });

        const pendingRequests = (
          await storage.getPaymentRequests(vendor.id)
        ).filter((r) => r.status === "pending");
        for (const request of pendingRequests) {
          await PaymentRequest.findByIdAndUpdate(request.id, {
            status: "paid",
            processedBy: req.session.userId,
            processedAt: new Date(),
          });
        }

        res.json({
          success: true,
          message: `Paid ${pendingAmount.toFixed(3)} KWD to vendor`,
        });
      } catch (e) {
        console.error("Error processing payout:", e);
        res.status(500).json({ message: "Failed to process payout" });
      }
    }
  );

  app.get(
    "/api/admin/payout-requests",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const role = await storage.getUserRole(req.session.userId);
        if (role !== "admin")
          return res.status(403).json({ message: "Forbidden" });

        const requests = await PaymentRequest.find({ status: "pending" }).sort({
          createdAt: -1,
        });
        const requestsWithVendor = await Promise.all(
          requests.map(async (req) => {
            const vendor = await storage.getVendor(req.vendorId.toString());
            return {
              id: req._id.toString(),
              vendorId: req.vendorId.toString(),
              vendorName: vendor?.storeName || "Unknown",
              amount: req.amount,
              status: req.status,
              createdAt: req.createdAt,
            };
          })
        );
        res.json(requestsWithVendor);
      } catch (e) {
        console.error("Error fetching payout requests:", e);
        res.status(500).json({ message: "Failed to fetch payout requests" });
      }
    }
  );

  app.get("/api/vendor/wallet", isAuthenticated, async (req: any, res) => {
    try {
      const vendors = await storage.getVendors();
      const vendor = vendors.find((v) => v.userId === req.session.userId);
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

  app.post(
    "/api/vendor/wallet/request",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const vendors = await storage.getVendors();
        const vendor = vendors.find((v) => v.userId === req.session.userId);
        if (!vendor)
          return res.status(404).json({ message: "Vendor not found" });

        const pendingAmount = parseFloat(vendor.pendingPayoutKwd || "0");
        if (pendingAmount <= 0)
          return res
            .status(400)
            .json({ message: "No pending payout available" });

        const existingRequests = await storage.getPaymentRequests(vendor.id);
        const hasPendingRequest = existingRequests.some(
          (r) => r.status === "pending"
        );
        if (hasPendingRequest) {
          return res
            .status(400)
            .json({ message: "You already have a pending payout request" });
        }

        const request = await storage.createPaymentRequest(
          vendor.id,
          vendor.pendingPayoutKwd
        );
        res.status(201).json(request);
      } catch (e) {
        console.error("Error creating payment request:", e);
        res.status(500).json({ message: "Failed to create payment request" });
      }
    }
  );

  app.get("/api/vendor/orders", isAuthenticated, async (req: any, res) => {
    try {
      const vendors = await storage.getVendors();
      const vendor = vendors.find((v) => v.userId === req.session.userId);
      if (!vendor) return res.json([]);

      const orders = await storage.getVendorOrders(vendor.id);
      res.json(orders);
    } catch (e) {
      console.error("Error getting vendor orders:", e);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.post("/api/vendor/orders", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "vendor") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const vendors = await storage.getVendors();
      const vendor = vendors.find((v) => v.userId === req.session.userId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      const { customerName, customerPhone, items, total, paymentMethod } =
        req.body;

      if (!customerName || !customerPhone || !items || items.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify all products belong to this vendor
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product || product.vendorId.toString() !== vendor.id.toString()) {
          return res
            .status(403)
            .json({ message: "Product does not belong to vendor" });
        }
      }

      // Create order
      const order = await storage.createOrder(
        req.session.userId,
        total,
        items,
        {
          name: customerName,
          phone: customerPhone,
        },
        paymentMethod || "cash"
      );

      let qrCodeUrl = null;

      // Generate QR code if payment method is gateway
      if (paymentMethod === "gateway") {
        try {
          const QRCode = (await import("qrcode")).default;
          const paymentData = {
            orderId: order.id,
            amount: total,
            vendorId: vendor.id,
            customerName,
            customerPhone,
            timestamp: new Date().toISOString(),
          };

          // Generate QR code as data URL
          qrCodeUrl = await QRCode.toDataURL(JSON.stringify(paymentData), {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 300,
          });
        } catch (qrError) {
          console.error("Error generating QR code:", qrError);
          // Continue without QR code
        }
      }

      res.status(201).json({
        ...order,
        qrCodeUrl,
      });
    } catch (e: any) {
      console.error("Error creating vendor order:", e);
      res.status(500).json({ message: e.message || "Failed to create order" });
    }
  });

  app.get("/api/vendor/profile", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "vendor")
        return res.status(403).json({ message: "Not a vendor" });

      const vendor = await storage.getVendorByUserId(req.session.userId);
      if (!vendor) return res.json(null);
      res.json(vendor);
    } catch (e) {
      console.error("Error getting vendor profile:", e);
      res.status(500).json({ message: "Failed to get vendor profile" });
    }
  });

  app.post("/api/vendor/profile", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "vendor")
        return res.status(403).json({ message: "Not a vendor" });

      const existingVendor = await storage.getVendorByUserId(
        req.session.userId
      );
      if (existingVendor) {
        return res
          .status(400)
          .json({ message: "Vendor profile already exists" });
      }

      const { storeName, description, logoUrl, bio } = req.body;
      if (!storeName)
        return res.status(400).json({ message: "Store name is required" });

      const vendor = await storage.createVendor({
        userId: req.session.userId,
        storeName,
        description: description || "",
        logoUrl:
          logoUrl ||
          `https://placehold.co/150x150?text=${encodeURIComponent(
            storeName.charAt(0)
          )}`,
        bio: bio || "",
        isApproved: false,
        commissionType: "percentage",
        commissionValue: "10",
        grossSalesKwd: "0",
        pendingPayoutKwd: "0",
        lifetimePayoutsKwd: "0",
      });

      res.status(201).json(vendor);
    } catch (e) {
      console.error("Error creating vendor profile:", e);
      res.status(500).json({ message: "Failed to create vendor profile" });
    }
  });

  app.patch("/api/vendor/profile", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "vendor")
        return res.status(403).json({ message: "Not a vendor" });

      const vendor = await storage.getVendorByUserId(req.session.userId);
      if (!vendor)
        return res.status(404).json({ message: "Vendor profile not found" });

      const { storeName, description, logoUrl, coverImageUrl, bio } = req.body;
      const updates: any = {};
      if (storeName !== undefined) updates.storeName = storeName;
      if (description !== undefined) updates.description = description;
      if (logoUrl !== undefined) updates.logoUrl = logoUrl;
      if (coverImageUrl !== undefined) updates.coverImageUrl = coverImageUrl;
      if (bio !== undefined) updates.bio = bio;

      const updated = await storage.updateVendor(vendor.id, updates);
      res.json(updated);
    } catch (e) {
      console.error("Error updating vendor profile:", e);
      res.status(500).json({ message: "Failed to update vendor profile" });
    }
  });

  app.get("/api/vendor/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "vendor")
        return res.status(403).json({ message: "Not a vendor" });

      const vendor = await storage.getVendorByUserId(req.session.userId);
      if (!vendor)
        return res.json({
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: "0",
          pendingOrders: 0,
        });

      const products = await storage.getProducts({ vendorId: vendor.id });
      const orders = await storage.getVendorOrders(vendor.id);

      const totalRevenue = orders.reduce(
        (sum: number, o: any) => sum + parseFloat(o.total || "0"),
        0
      );
      const pendingOrders = orders.filter(
        (o: any) => o.status === "pending" || o.status === "processing"
      ).length;

      res.json({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue.toFixed(3),
        pendingOrders,
        pendingPayoutKwd: vendor.pendingPayoutKwd || "0",
        grossSalesKwd: vendor.grossSalesKwd || "0",
      });
    } catch (e) {
      console.error("Error getting vendor analytics:", e);
      res.status(500).json({ message: "Failed to get vendor analytics" });
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
    if (role !== "vendor")
      return res.status(403).json({ message: "Only vendors can add products" });

    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (e) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "vendor")
        return res
          .status(403)
          .json({ message: "Only vendors can update products" });

      const productId = req.params.id;
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Verify the product belongs to the vendor
      const vendors = await storage.getVendors();
      const vendor = vendors.find((v) => v.userId === req.session.userId);
      if (!vendor || existingProduct.vendorId !== vendor.id) {
        return res
          .status(403)
          .json({ message: "You can only edit your own products" });
      }

      const updates = req.body;
      const updatedProduct = await storage.updateProduct(productId, updates);
      res.json(updatedProduct);
    } catch (e: any) {
      console.error("Error updating product:", e);
      res
        .status(500)
        .json({ message: e.message || "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "vendor")
        return res
          .status(403)
          .json({ message: "Only vendors can delete products" });

      const productId = req.params.id;
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Verify the product belongs to the vendor
      const vendors = await storage.getVendors();
      const vendor = vendors.find((v) => v.userId === req.session.userId);
      if (!vendor || existingProduct.vendorId !== vendor.id) {
        return res
          .status(403)
          .json({ message: "You can only delete your own products" });
      }

      await storage.deleteProduct(productId);
      res.status(204).send();
    } catch (e: any) {
      console.error("Error deleting product:", e);
      res
        .status(500)
        .json({ message: e.message || "Failed to delete product" });
    }
  });

  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.cart.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getCartItems(req.session.userId);
      console.log(
        "Cart GET - userId:",
        req.session.userId,
        "items count:",
        items.length
      );
      res.json(items);
    } catch (e: any) {
      console.error("Error fetching cart:", e);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post(api.cart.add.path, isAuthenticated, async (req: any, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const input = api.cart.add.input.parse(req.body);
      console.log("Adding to cart:", { userId: req.session.userId, input });
      const item = await storage.addToCart({
        ...input,
        userId: req.session.userId,
      });
      console.log("Item added to cart:", item);
      res.status(201).json(item);
    } catch (e: any) {
      console.error("Error adding to cart:", e);
      if (e.message && e.message.includes("validation")) {
        return res.status(400).json({ message: e.message });
      }
      res.status(400).json({ message: e.message || "Error adding to cart" });
    }
  });

  app.patch("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { quantity } = req.body;
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      const updated = await storage.updateCartItemQuantity(
        req.params.id,
        quantity
      );
      res.json(updated);
    } catch (e: any) {
      console.error("Error updating cart item:", e);
      res
        .status(400)
        .json({ message: e.message || "Failed to update cart item" });
    }
  });

  app.delete(api.cart.remove.path, isAuthenticated, async (req: any, res) => {
    await storage.removeFromCart(req.params.id);
    res.status(204).send();
  });

  app.post(api.orders.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const cartItems = await storage.getCartItems(req.session.userId);
      if (cartItems.length === 0)
        return res.status(400).json({ message: "Cart is empty" });

      let total = 0;
      const items = cartItems.map((item) => {
        const price = parseFloat(item.product.price);
        total += price * item.quantity;
        return {
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        };
      });

      // Extract customer information from request body
      const customerInfo = {
        name: req.body.customerName,
        email: req.body.customerEmail,
        phone: req.body.customerPhone,
        address: req.body.customerAddress,
        city: req.body.customerCity,
      };

      const paymentMethod = req.body.paymentMethod || "cod";

      const order = await storage.createOrder(
        req.session.userId,
        total.toFixed(3),
        items,
        customerInfo,
        paymentMethod
      );
      await storage.clearCart(req.session.userId);
      res.status(201).json(order);
    } catch (e: any) {
      console.error("Error creating order:", e);
      res.status(500).json({ message: e.message || "Failed to create order" });
    }
  });

  // Guest checkout - allows purchase without authentication
  app.post("/api/orders/guest", async (req: any, res) => {
    try {
      const { items, guestEmail, guestName, guestPhone } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      if (!guestEmail) {
        return res
          .status(400)
          .json({ message: "Email is required for guest checkout" });
      }

      // Validate items and get prices from database (never trust client prices)
      let total = 0;
      const orderItems = [];
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res
            .status(400)
            .json({ message: `Product ${item.productId} not found` });
        }
        const price = parseFloat(product.price);
        total += price * item.quantity;
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price, // Use database price, not client-provided price
        });
      }

      const order = await storage.createGuestOrder(
        guestEmail,
        guestName || "Guest",
        guestPhone || "",
        total.toString(),
        orderItems
      );
      res.status(201).json(order);
    } catch (e) {
      console.error("Guest checkout error:", e);
      res.status(500).json({ message: "Failed to process guest order" });
    }
  });

  app.get(api.orders.list.path, isAuthenticated, async (req: any, res) => {
    const orders = await storage.getOrders(req.session.userId);
    res.json(orders);
  });

  app.get("/api/admin/orders", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (e: any) {
      console.error("Error fetching admin orders:", e);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.patch(
    "/api/orders/:id/status",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const role = await storage.getUserRole(req.session.userId);
        // Allow vendors and admins to update order status
        if (role !== "vendor" && role !== "admin") {
          return res.status(403).json({ message: "Forbidden" });
        }

        const { status } = req.body;
        if (!status) {
          return res.status(400).json({ message: "Status is required" });
        }

        // If vendor, check if order contains their products (optional but good for security)
        // For now, assuming vendors can update status of orders they see in their dashboard

        const updated = await storage.updateOrder(req.params.id, status);
        res.json(updated);
      } catch (e: any) {
        console.error("Error updating order status:", e);
        res
          .status(500)
          .json({ message: e.message || "Failed to update order status" });
      }
    }
  );

  app.get(api.stories.list.path, async (req, res) => {
    const stories = await storage.getStories();
    res.json(stories);
  });

  // Vendor-only stories list
  app.get("/api/vendor/stories", isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.session.userId);
    if (role !== "vendor") {
      return res
        .status(403)
        .json({ message: "Only vendors can view their spotlights" });
    }
    try {
      const vendor = await storage.getVendorByUserId(req.session.userId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }
      const stories = await storage.getStoriesByVendor(vendor.id);
      res.json(stories);
    } catch (e: any) {
      console.error("Error fetching vendor stories:", e);
      res
        .status(500)
        .json({ message: e.message || "Failed to fetch vendor stories" });
    }
  });

  app.post(api.stories.create.path, isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.session.userId);
    if (role !== "vendor")
      return res.status(403).json({ message: "Only vendors can post stories" });

    try {
      // Get vendor profile to ensure vendor exists and use correct vendorId
      const vendor = await storage.getVendorByUserId(req.session.userId);
      if (!vendor) {
        return res.status(404).json({
          message:
            "Vendor profile not found. Please create your vendor profile first.",
        });
      }

      const input = api.stories.create.input.parse(req.body);
      // Ensure the vendorId matches the authenticated vendor
      const story = await storage.createStory({
        ...input,
        vendorId: vendor.id,
      });
      res.status(201).json(story);
    } catch (e: any) {
      console.error("Error creating story:", e);
      res.status(400).json({ message: e.message || "Validation error" });
    }
  });

  app.patch("/api/stories/:id", isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.session.userId);
    if (role !== "vendor")
      return res
        .status(403)
        .json({ message: "Only vendors can update stories" });

    try {
      // Get vendor profile first
      const vendor = await storage.getVendorByUserId(req.session.userId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }

      // Get story directly from database to check vendorId without population issues
      const { VendorStory } = await import("./mongodb");
      const mongoose = await import("mongoose");

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }

      const storyDoc = await VendorStory.findById(req.params.id).lean();
      if (!storyDoc) {
        return res.status(404).json({ message: "Story not found" });
      }

      // Extract vendorId from the raw document (it's an ObjectId)
      const storyVendorIdRaw = storyDoc.vendorId;
      const vendorIdRaw = vendor.id || vendor._id;

      // Normalize both IDs for comparison
      const storyVendorId = normalizeId(storyVendorIdRaw);
      const vendorId = normalizeId(vendorIdRaw);

      const idsMatch = compareIds(storyVendorIdRaw, vendorIdRaw);

      console.log("Story update - Comparing IDs:", {
        storyVendorId,
        vendorId,
        storyId: req.params.id,
        storyVendorIdRaw: storyVendorIdRaw?.toString(),
        storyVendorIdType: typeof storyVendorIdRaw,
        vendorIdRaw: vendorIdRaw,
        vendorIdType: typeof vendorIdRaw,
        vendorObject: { id: vendor.id, _id: vendor._id },
        match: idsMatch,
      });

      if (!idsMatch) {
        return res.status(403).json({
          message: "You can only update your own stories",
          debug: {
            storyVendorId,
            vendorId,
            error: "VendorId mismatch",
          },
        });
      }

      const updates = req.body;
      const updatedStory = await storage.updateStory(req.params.id, updates);
      res.json(updatedStory);
    } catch (e: any) {
      console.error("Error updating story:", e);
      res.status(400).json({ message: e.message || "Failed to update story" });
    }
  });

  app.delete("/api/stories/:id", isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.session.userId);

    try {
      // Admins can delete any story
      if (role === "admin") {
        await storage.deleteStory(req.params.id);
        res.status(204).send();
        return;
      }

      if (role !== "vendor") {
        return res
          .status(403)
          .json({ message: "Only vendors and admins can delete stories" });
      }

      // Get vendor profile first
      const vendor = await storage.getVendorByUserId(req.session.userId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }

      // Get story directly from database to check vendorId without population issues
      const { VendorStory } = await import("./mongodb");
      const mongoose = await import("mongoose");

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }

      const storyDoc = await VendorStory.findById(req.params.id).lean();
      if (!storyDoc) {
        return res.status(404).json({ message: "Story not found" });
      }

      // Extract vendorId from the raw document (it's an ObjectId)
      const storyVendorIdRaw = storyDoc.vendorId;
      const vendorIdRaw = vendor.id || vendor._id;

      // Normalize both IDs for comparison
      const storyVendorId = normalizeId(storyVendorIdRaw);
      const vendorId = normalizeId(vendorIdRaw);

      const idsMatch = compareIds(storyVendorIdRaw, vendorIdRaw);

      console.log("Story delete - Comparing IDs:", {
        storyVendorId,
        vendorId,
        storyId: req.params.id,
        storyVendorIdRaw: storyVendorIdRaw?.toString(),
        storyVendorIdType: typeof storyVendorIdRaw,
        vendorIdRaw: vendorIdRaw,
        vendorIdType: typeof vendorIdRaw,
        vendorObject: { id: vendor.id, _id: vendor._id },
        match: idsMatch,
      });

      if (!idsMatch) {
        return res.status(403).json({
          message: "You can only delete your own stories",
          debug: {
            storyVendorId,
            vendorId,
            error: "VendorId mismatch",
          },
        });
      }

      await storage.deleteStory(req.params.id);
      res.status(204).send();
    } catch (e: any) {
      console.error("Error deleting story:", e);
      res.status(500).json({ message: e.message || "Failed to delete story" });
    }
  });

  // Seed initial categories (update existing or create new)
  const defaultCategories = [
    { name: "Engine Parts", slug: "engine-parts", icon: "Cog" },
    { name: "Transmission System", slug: "transmission", icon: "Settings" },
    { name: "Braking System", slug: "brakes", icon: "CircleStop" },
    {
      name: "Suspension & Steering",
      slug: "suspension-steering",
      icon: "Gauge",
    },
    { name: "Electrical System", slug: "electrical", icon: "Zap" },
    { name: "Cooling System", slug: "cooling", icon: "Thermometer" },
    { name: "Fuel System", slug: "fuel-system", icon: "Fuel" },
    { name: "Exhaust System", slug: "exhaust", icon: "Wind" },
    { name: "Body & Structure", slug: "body-structure", icon: "Car" },
    { name: "Interior Parts", slug: "interior", icon: "Armchair" },
    { name: "Wheels & Tires", slug: "wheels-tires", icon: "Circle" },
    { name: "Lighting", slug: "lighting", icon: "Lightbulb" },
    { name: "Fluids & Chemicals", slug: "fluids-chemicals", icon: "Droplets" },
  ];
  const categories = await storage.getCategories();
  if (categories.length < defaultCategories.length) {
    // Clear old categories and seed new ones
    for (const cat of categories) {
      await storage.deleteCategory(cat.id);
    }
    for (const cat of defaultCategories) {
      await storage.createCategory(cat);
    }
  }

  app.post("/api/seed", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { clearFirst } = req.body;

      // Optionally clear existing data if requested
      if (clearFirst) {
        const {
          Product,
          Order,
          OrderItem,
          Vendor,
          Category,
          PaymentRequest,
          VendorStory,
          CartItem,
        } = await import("./mongodb");
        await Product.deleteMany({});
        await Order.deleteMany({});
        await OrderItem.deleteMany({});
        await Vendor.deleteMany({});
        await Category.deleteMany({});
        await PaymentRequest.deleteMany({});
        await VendorStory.deleteMany({});
        await CartItem.deleteMany({});
        console.log("Cleared existing data");
      }

      const { seedDatabase } = await import("./seed");
      const result = await seedDatabase();
      res.json({
        message: "Database seeded successfully with demo data and test users",
        testUsers: {
          customer: {
            email: "customer@test.com",
            password: "test123",
            role: "customer",
          },
          vendor: {
            email: "vendor@test.com",
            password: "test123",
            role: "vendor",
          },
          admin: {
            email: "admin@test.com",
            password: "test123",
            role: "admin",
          },
        },
        ...result,
      });
    } catch (e) {
      console.error("Seeding error:", e);
      res.status(500).json({ message: "Seeding failed", error: String(e) });
    }
  });

  return httpServer;
}
