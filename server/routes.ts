import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { api } from "@shared/routes";
import { User } from "./mongodb";
import { authStorage } from "./replit_integrations/auth/storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  app.patch("/api/users/me", isAuthenticated, async (req: any, res) => {
    try {
      const { profileImageUrl, bio, phone, address, city } = req.body;
      const userId = req.user.claims.sub;
      
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      if (bio !== undefined) updateData.bio = bio;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      
      const updated = await User.findOneAndUpdate(
        { id: userId },
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
    const role = await storage.getUserRole(req.user.claims.sub);
    res.json({ role });
  });

  if (process.env.NODE_ENV === "development") {
    app.post("/api/roles/switch", isAuthenticated, async (req: any, res) => {
      const { role } = req.body;
      if (!["customer", "vendor", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      await storage.setUserRole(req.user.claims.sub, role);
      res.json({ role, message: `Switched to ${role} role` });
    });
  }

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.user.claims.sub);
      if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });

      const users = await User.find({});
      const usersWithRoles = await Promise.all(users.map(async (user) => {
        const userRole = await storage.getUserRole(user.id);
        return {
          id: user.id,
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
      const role = await storage.getUserRole(req.user.claims.sub);
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
      const vendor = await storage.createVendor({ ...input, userId: req.user.claims.sub });
      await storage.setUserRole(req.user.claims.sub, "vendor");
      res.status(201).json(vendor);
    } catch (e) {
       res.status(400).json({ message: "Validation failed" });
    }
  });

  app.patch(api.vendors.approve.path, isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.user.claims.sub);
    if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });

    const vendor = await storage.updateVendor(req.params.id, req.body);
    res.json(vendor);
  });

  app.patch("/api/vendors/:id", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.params.id;
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      if (vendor.userId !== req.user.claims.sub) {
        const role = await storage.getUserRole(req.user.claims.sub);
        if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateVendor(vendorId, req.body);
      res.json(updated);
    } catch (e) {
      console.error("Error updating vendor:", e);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.get("/api/vendor/wallet", isAuthenticated, async (req: any, res) => {
    try {
      const vendors = await storage.getVendors();
      const vendor = vendors.find(v => v.userId === req.user.claims.sub);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      
      const paymentRequests = await storage.getPaymentRequests(vendor.id);
      res.json({
        balance: vendor.walletBalance,
        commissionRate: vendor.commissionRate,
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
      const vendor = vendors.find(v => v.userId === req.user.claims.sub);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      
      const balance = parseFloat(vendor.walletBalance);
      if (balance <= 0) return res.status(400).json({ message: "No balance available" });
      
      const request = await storage.createPaymentRequest(vendor.id, vendor.walletBalance);
      res.status(201).json(request);
    } catch (e) {
      console.error("Error creating payment request:", e);
      res.status(500).json({ message: "Failed to create payment request" });
    }
  });

  app.get("/api/vendor/orders", isAuthenticated, async (req: any, res) => {
    try {
      const vendors = await storage.getVendors();
      const vendor = vendors.find(v => v.userId === req.user.claims.sub);
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
    const role = await storage.getUserRole(req.user.claims.sub);
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
    const items = await storage.getCartItems(req.user.claims.sub);
    res.json(items);
  });

  app.post(api.cart.add.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.cart.add.input.parse(req.body);
      const item = await storage.addToCart({ ...input, userId: req.user.claims.sub });
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
    const cartItems = await storage.getCartItems(req.user.claims.sub);
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

    const order = await storage.createOrder(req.user.claims.sub, total.toString(), items);
    await storage.clearCart(req.user.claims.sub);
    res.status(201).json(order);
  });

  app.get(api.orders.list.path, isAuthenticated, async (req: any, res) => {
    const orders = await storage.getOrders(req.user.claims.sub);
    res.json(orders);
  });

  app.get(api.stories.list.path, async (req, res) => {
    const stories = await storage.getStories();
    res.json(stories);
  });

  app.post(api.stories.create.path, isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.user.claims.sub);
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
    const role = await storage.getUserRole(req.user.claims.sub);
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

  app.post("/api/seed", async (req, res) => {
    try {
      const existingProducts = await storage.getProducts();
      if (existingProducts.length > 0) {
        return res.json({ message: "Data already exists, skipping seed." });
      }

      const categories = await storage.getCategories();
      
      const users = await User.find({}).limit(1);
      const user = users[0];
      if (!user) {
        return res.status(400).json({ message: "Please log in first so I have a user to assign vendors to." });
      }

      const existingVendors = await storage.getVendors();
      let v1, v2;
      
      if (existingVendors.length === 0) {
        v1 = await storage.createVendor({
          userId: user.id,
          storeName: "AutoPro Parts",
          description: "Specializing in high-performance engine components.",
          logoUrl: "https://placehold.co/100x100?text=AutoPro",
        });
        await storage.updateVendor(v1.id, { isApproved: true });

        v2 = await storage.createVendor({
          userId: user.id,
          storeName: "BrakeMaster",
          description: "Your one-stop shop for everything brakes.",
          logoUrl: "https://placehold.co/100x100?text=BrakeMaster",
        });
        await storage.updateVendor(v2.id, { isApproved: true });
      } else {
        v1 = existingVendors[0];
        v2 = existingVendors[1] || existingVendors[0];
      }

      await storage.createProduct({
        vendorId: v1.id,
        categoryId: categories[0].id,
        name: "Performance V8 Piston Set",
        description: "Forged aluminum pistons for high-output engines. Compatible with most V8 engines.",
        price: "450.00",
        stock: 5,
        brand: "SpeedMaster",
        images: ["https://placehold.co/400x300?text=Pistons"],
        warrantyInfo: "2 years limited warranty",
      });

      await storage.createProduct({
        vendorId: v1.id,
        categoryId: categories[0].id,
        name: "Turbocharger Kit",
        description: "Complete turbo upgrade kit with intercooler and piping.",
        price: "1250.00",
        stock: 3,
        brand: "TurboWorks",
        images: ["https://placehold.co/400x300?text=Turbo"],
        warrantyInfo: "1 year warranty",
      });

      await storage.createProduct({
        vendorId: v2.id,
        categoryId: categories[1].id,
        name: "Ceramic Brake Pad Set",
        description: "Low-dust, high-performance ceramic brake pads for smooth stopping.",
        price: "85.00",
        stock: 20,
        brand: "StopTech",
        images: ["https://placehold.co/400x300?text=Brake+Pads"],
        warrantyInfo: "Lifetime warranty against defects",
      });

      await storage.createProduct({
        vendorId: v2.id,
        categoryId: categories[1].id,
        name: "Slotted Brake Rotors",
        description: "Performance slotted rotors for improved heat dissipation.",
        price: "180.00",
        stock: 10,
        brand: "Brembo",
        images: ["https://placehold.co/400x300?text=Rotors"],
        warrantyInfo: "2 year warranty",
      });

      await storage.createProduct({
        vendorId: v1.id,
        categoryId: categories[2].id,
        name: "Coilover Suspension Kit",
        description: "Adjustable height coilover kit for sport tuning.",
        price: "890.00",
        stock: 4,
        brand: "KW",
        images: ["https://placehold.co/400x300?text=Coilovers"],
        warrantyInfo: "1 year warranty",
      });

      await storage.createStory({
        vendorId: v1.id,
        content: "New performance pistons just arrived! Upgrade your engine today with our best-selling forged aluminum piston sets.",
        imageUrl: "https://placehold.co/600x400?text=New+Arrivals",
      });

      await storage.createStory({
        vendorId: v2.id,
        content: "Brake sale this weekend! 15% off all ceramic brake pads. Dont miss out on this limited offer.",
        imageUrl: "https://placehold.co/600x400?text=Brake+Sale",
      });

      res.json({ message: "Seeded successfully with products and stories" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Seeding failed" });
    }
  });

  return httpServer;
}
