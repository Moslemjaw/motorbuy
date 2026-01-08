import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

  // === APP ROUTES ===

  // Roles
  app.get(api.roles.get.path, isAuthenticated, async (req: any, res) => {
    const role = await storage.getUserRole(req.user.claims.sub);
    res.json({ role });
  });

  // Vendors
  app.get(api.vendors.list.path, async (req, res) => {
    const vendors = await storage.getVendors();
    res.json(vendors);
  });

  app.get(api.vendors.get.path, async (req, res) => {
    const vendor = await storage.getVendor(Number(req.params.id));
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  });

  app.post(api.vendors.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.vendors.create.input.parse(req.body);
      const vendor = await storage.createVendor({ ...input, userId: req.user.claims.sub });
      // Also set user role to vendor
      await storage.setUserRole(req.user.claims.sub, "vendor");
      res.status(201).json(vendor);
    } catch (e) {
       res.status(400).json({ message: "Validation failed" });
    }
  });

  app.patch(api.vendors.approve.path, isAuthenticated, async (req: any, res) => {
    // Check if admin (omitted for speed, assume simple check later)
    const role = await storage.getUserRole(req.user.claims.sub);
    if (role !== 'admin') return res.status(403).json({ message: "Forbidden" });

    const vendor = await storage.updateVendor(Number(req.params.id), req.body);
    res.json(vendor);
  });

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts(req.query as any);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post(api.products.create.path, isAuthenticated, async (req: any, res) => {
    // Verify vendor ownership
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

  // Categories
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // Cart
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
    await storage.removeFromCart(Number(req.params.id));
    res.status(204).send();
  });

  // Orders
  app.post(api.orders.create.path, isAuthenticated, async (req: any, res) => {
    // Get cart items to convert to order
    const cartItems = await storage.getCartItems(req.user.claims.sub);
    if (cartItems.length === 0) return res.status(400).json({ message: "Cart is empty" });

    let total = 0;
    const items = cartItems.map(item => {
      const price = parseFloat(item.product.price);
      total += price * item.quantity;
      return {
        productId: item.productId,
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

  // Stories
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

  // Seed Data
  if ((await storage.getCategories()).length === 0) {
    await storage.createCategory({ name: "Engine Parts", slug: "engine-parts", imageUrl: "https://placehold.co/100x100?text=Engine" });
    await storage.createCategory({ name: "Brakes", slug: "brakes", imageUrl: "https://placehold.co/100x100?text=Brakes" });
    await storage.createCategory({ name: "Suspension", slug: "suspension", imageUrl: "https://placehold.co/100x100?text=Suspension" });
  }

  async function seedMore() {
    const existingVendors = await storage.getVendors();
    if (existingVendors.length === 0) {
      // Create some vendors (using placeholder user IDs as they'll likely be created on first login, 
      // but for seeding we'll assume some IDs or just create vendors tied to no-one if schema allows, 
      // actually schema needs userId. We'll use a dummy ID for now or skip if we can't find a user)
      // Better: Create them when we have a user, or just provide a dedicated seed route.
    }
  }
  
  app.post("/api/seed", async (req, res) => {
    try {
      const cats = await storage.getCategories();
      if (cats.length === 0) {
        await storage.createCategory({ name: "Engine Parts", slug: "engine-parts", imageUrl: "https://placehold.co/100x100?text=Engine" });
        await storage.createCategory({ name: "Brakes", slug: "brakes", imageUrl: "https://placehold.co/100x100?text=Brakes" });
        await storage.createCategory({ name: "Suspension", slug: "suspension", imageUrl: "https://placehold.co/100x100?text=Suspension" });
      }
      
      const categories = await storage.getCategories();
      
      // We need a user to tie vendors to. Let's see if there are any users.
      // Since this is a dev tool, we'll try to find any user or just wait.
      // For now, I'll create a few vendors if a user exists.
      
      const [user] = await db.select().from(users).limit(1);
      if (!user) {
        return res.status(400).json({ message: "Please log in first so I have a user to assign vendors to." });
      }

      const v1 = await storage.createVendor({
        userId: user.id,
        storeName: "AutoPro Parts",
        description: "Specializing in high-performance engine components.",
        logoUrl: "https://placehold.co/100x100?text=AutoPro",
      });

      const v2 = await storage.createVendor({
        userId: user.id,
        storeName: "BrakeMaster",
        description: "Your one-stop shop for everything brakes.",
        logoUrl: "https://placehold.co/100x100?text=BrakeMaster",
      });

      await storage.createProduct({
        vendorId: v1.id,
        categoryId: categories[0].id,
        name: "Performance V8 Piston Set",
        description: "Forged aluminum pistons for high-output engines.",
        price: "450.00",
        stock: 5,
        brand: "SpeedMaster",
        images: ["https://placehold.co/400x300?text=Pistons"],
        warrantyInfo: "2 years limited warranty",
      });

      await storage.createProduct({
        vendorId: v2.id,
        categoryId: categories[1].id,
        name: "Ceramic Brake Pad Set",
        description: "Low-dust, high-performance ceramic brake pads.",
        price: "85.00",
        stock: 20,
        brand: "StopTech",
        images: ["https://placehold.co/400x300?text=Brake+Pads"],
        warrantyInfo: "Lifetime warranty against defects",
      });

      await storage.createStory({
        vendorId: v1.id,
        content: "New performance pistons just arrived! Upgrade your engine today.",
        imageUrl: "https://placehold.co/600x400?text=New+Arrivals",
      });

      res.json({ message: "Seeded successfully" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Seeding failed" });
    }
  });

  return httpServer;
}
