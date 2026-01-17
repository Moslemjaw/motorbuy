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

  // Update user by ID (admin only)
  app.patch("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });

      const { firstName, lastName, email } = req.body;
      const userId = req.params.id;

      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email.toLowerCase();

      const updated = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      });

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updated);
    } catch (e) {
      console.error("Error updating user:", e);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get(api.roles.get.path, isAuthenticated, async (req: any, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const role = await storage.getUserRole(req.session.userId);
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

  app.get("/api/admin/sales-chart", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
      
      const range = (req.query.range as "day" | "month" | "year") || "month";
      const vendorId = req.query.vendorId as string | undefined;
      
      const data = await storage.getSalesChartData(range, vendorId);
      res.json({ data });
    } catch (e) {
      console.error("Error fetching sales chart:", e);
      res.status(500).json({ message: "Failed to fetch sales chart data" });
    }
  });

  app.get("/api/vendor/sales-chart", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "vendor")
        return res.status(403).json({ message: "Forbidden" });
      
      const vendor = await storage.getVendorByUserId(req.session.userId);
      if (!vendor)
        return res.status(404).json({ message: "Vendor not found" });
      
      const range = (req.query.range as "day" | "month" | "year") || "month";
      
      const data = await storage.getSalesChartData(range, vendor.id);
      res.json({ data });
    } catch (e) {
      console.error("Error fetching vendor sales chart:", e);
      res.status(500).json({ message: "Failed to fetch sales chart data" });
    }
  });

  // Export Analytics Endpoints
  app.get("/api/admin/export/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
      
      const format = req.query.format as "excel" | "pdf" || "excel";
      const vendorIdsParam = req.query.vendorIds;
      const vendorIds = vendorIdsParam 
        ? (Array.isArray(vendorIdsParam) ? vendorIdsParam : [vendorIdsParam])
        : [];
      
      const { Order, OrderItem, Vendor, Product } = await import("./mongodb");
      const mongoose = await import("mongoose");
      
      // Get all orders and order items
      const allOrders = await Order.find({}) || [];
      const allOrderItems = await OrderItem.find({}).populate("productId") || [];
      
      // Filter orders by vendor if vendor IDs provided
      let filteredOrderIds: any[] = [];
      if (vendorIds.length > 0 && vendorIds[0]) {
        try {
          const vendorObjectIds = vendorIds
            .filter((id: string) => id && mongoose.default.Types.ObjectId.isValid(id))
            .map((id: string) => new mongoose.default.Types.ObjectId(id));
          
          if (vendorObjectIds.length > 0) {
            const products = await Product.find({ vendorId: { $in: vendorObjectIds } });
            const productIds = products.map((p: any) => p._id);
            
            if (productIds.length > 0) {
              filteredOrderIds = allOrderItems
                .filter((item: any) => item.productId && productIds.some((pid: any) => pid.toString() === item.productId?._id?.toString()))
                .map((item: any) => item.orderId);
            }
          }
        } catch (err) {
          console.error("Error filtering by vendors:", err);
        }
      }
      
      const orders = vendorIds.length > 0 && filteredOrderIds.length > 0
        ? allOrders.filter((o: any) => filteredOrderIds.some((oid: any) => oid && oid.toString() === o._id.toString()))
        : allOrders;
      
      let vendors;
      if (vendorIds.length > 0 && vendorIds[0]) {
        try {
          const validVendorIds = vendorIds
            .filter((id: string) => id && mongoose.default.Types.ObjectId.isValid(id))
            .map((id: string) => new mongoose.default.Types.ObjectId(id));
          vendors = validVendorIds.length > 0 
            ? await Vendor.find({ _id: { $in: validVendorIds } })
            : [];
        } catch (err) {
          console.error("Error fetching vendors:", err);
          vendors = [];
        }
      } else {
        vendors = await Vendor.find({}) || [];
      }
      
      // Get sales chart data for graphs
      const salesChartData = await storage.getSalesChartData("month");
      
      const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum: number, o: any) => sum + parseFloat(o.total || "0"), 0),
        totalProducts: (await Product.find({})).length,
        totalVendors: vendors.length,
        vendors: vendors.map((v: any) => ({
          name: v.storeName,
          totalSales: parseFloat(v.grossSalesKwd || "0"),
          pendingPayout: parseFloat(v.pendingPayoutKwd || "0"),
          lifetimePayouts: parseFloat(v.lifetimePayoutsKwd || "0"),
        })),
        orders: orders.map((o: any) => ({
          id: o._id.toString(),
          total: parseFloat(o.total || "0"),
          status: o.status,
          createdAt: o.createdAt,
        })),
        salesChartData,
      };
      
      if (format === "excel") {
        try {
          const ExcelJS = await import("exceljs");
          const workbook = new ExcelJS.Workbook();
          workbook.creator = "MotorBuy";
          workbook.created = new Date();
          workbook.modified = new Date();
          
          // Summary Sheet with Professional Formatting
          const summarySheet = workbook.addWorksheet("Summary");
          summarySheet.columns = [
            { width: 30 },
            { width: 20 },
          ];
          
          // Header
          const headerRow = summarySheet.addRow(["MotorBuy Analytics Report", ""]);
          headerRow.getCell(1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
          headerRow.getCell(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1E40AF" },
          };
          headerRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
          summarySheet.mergeCells("A1:B1");
          summarySheet.addRow([]);
          
          // Report Date
          const dateRow = summarySheet.addRow(["Report Generated", new Date().toLocaleString()]);
          dateRow.getCell(1).font = { bold: true };
          summarySheet.addRow([]);
          
          // Metrics with styling
          const metrics = [
            ["Total Orders", analytics.totalOrders],
            ["Total Revenue (KWD)", parseFloat(analytics.totalRevenue.toFixed(3))],
            ["Total Products", analytics.totalProducts],
            ["Total Vendors", analytics.totalVendors],
          ];
          
          metrics.forEach(([label, value], index) => {
            const row = summarySheet.addRow([label, value]);
            if (index === 0) {
              row.getCell(1).font = { bold: true, size: 12 };
              row.getCell(2).font = { bold: true, size: 12 };
              row.getCell(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE5E7EB" },
              };
              row.getCell(2).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE5E7EB" },
              };
            }
            if (index === 1) {
              row.getCell(2).numFmt = "#,##0.000";
            } else {
              row.getCell(2).numFmt = "#,##0";
            }
            row.height = 25;
          });
          
          // Sales Chart Data Sheet
          if (analytics.salesChartData && analytics.salesChartData.length > 0) {
            const chartSheet = workbook.addWorksheet("Sales Trend");
            chartSheet.columns = [
              { width: 20 },
              { width: 20 },
            ];
            
            const chartHeader = chartSheet.addRow(["Month", "Sales (KWD)"]);
            chartHeader.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
            chartHeader.getCell(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
            chartHeader.getCell(1).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF059669" },
            };
            chartHeader.getCell(2).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF059669" },
            };
            chartHeader.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
            chartHeader.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
            chartHeader.height = 30;
            
            analytics.salesChartData.forEach((item: any) => {
              const row = chartSheet.addRow([item.label, item.sales]);
              row.getCell(2).numFmt = "#,##0.000";
              row.height = 20;
            });
            
            // Add borders
            chartSheet.eachRow((row, rowNumber) => {
              if (rowNumber > 0) {
                row.eachCell((cell) => {
                  cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                  };
                });
              }
            });
          }
          
          // Vendors Sheet with Professional Formatting
          if (analytics.vendors.length > 0) {
            const vendorsSheet = workbook.addWorksheet("Vendors");
            vendorsSheet.columns = [
              { width: 30 },
              { width: 20 },
              { width: 20 },
              { width: 20 },
            ];
            
            const vendorHeader = vendorsSheet.addRow([
              "Vendor Name",
              "Total Sales (KWD)",
              "Pending Payout (KWD)",
              "Lifetime Payouts (KWD)",
            ]);
            vendorHeader.eachCell((cell, colNumber) => {
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF7C3AED" },
              };
              cell.alignment = { horizontal: "center", vertical: "middle" };
            });
            vendorHeader.height = 30;
            
            analytics.vendors.forEach((v: any) => {
              const row = vendorsSheet.addRow([
                v.name,
                parseFloat(v.totalSales.toFixed(3)),
                parseFloat(v.pendingPayout.toFixed(3)),
                parseFloat(v.lifetimePayouts.toFixed(3)),
              ]);
              row.getCell(2).numFmt = "#,##0.000";
              row.getCell(3).numFmt = "#,##0.000";
              row.getCell(4).numFmt = "#,##0.000";
              row.height = 20;
            });
            
            // Add borders
            vendorsSheet.eachRow((row, rowNumber) => {
              if (rowNumber > 0) {
                row.eachCell((cell) => {
                  cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                  };
                });
              }
            });
          }
          
          // Orders Sheet with Professional Formatting
          if (analytics.orders.length > 0) {
            const ordersSheet = workbook.addWorksheet("Orders");
            ordersSheet.columns = [
              { width: 25 },
              { width: 15 },
              { width: 15 },
              { width: 20 },
            ];
            
            const orderHeader = ordersSheet.addRow([
              "Order ID",
              "Total (KWD)",
              "Status",
              "Date",
            ]);
            orderHeader.eachCell((cell, colNumber) => {
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFDC2626" },
              };
              cell.alignment = { horizontal: "center", vertical: "middle" };
            });
            orderHeader.height = 30;
            
            analytics.orders.forEach((o: any) => {
              const row = ordersSheet.addRow([
                o.id,
                parseFloat(o.total.toFixed(3)),
                o.status || "pending",
                o.createdAt ? new Date(o.createdAt) : null,
              ]);
              row.getCell(2).numFmt = "#,##0.000";
              if (o.createdAt) {
                row.getCell(4).numFmt = "mm/dd/yyyy";
              }
              row.height = 20;
            });
            
            // Add borders
            ordersSheet.eachRow((row, rowNumber) => {
              if (rowNumber > 0) {
                row.eachCell((cell) => {
                  cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                  };
                });
              }
            });
          }
          
          const buffer = await workbook.xlsx.writeBuffer();
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Content-Disposition", `attachment; filename=analytics_${Date.now()}.xlsx`);
          res.send(Buffer.from(buffer));
        } catch (excelError: any) {
          console.error("Excel export error:", excelError);
          // Fallback to simple XLSX if ExcelJS fails
          const XLSX = await import("xlsx");
          const workbook = XLSX.utils.book_new();
          
          const summaryData = [
            ["Metric", "Value"],
            ["Total Orders", analytics.totalOrders],
            ["Total Revenue (KWD)", analytics.totalRevenue.toFixed(3)],
            ["Total Products", analytics.totalProducts],
            ["Total Vendors", analytics.totalVendors],
          ];
          const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
          
          if (analytics.vendors.length > 0) {
            const vendorsData = [
              ["Vendor Name", "Total Sales (KWD)", "Pending Payout (KWD)", "Lifetime Payouts (KWD)"],
              ...analytics.vendors.map((v: any) => [v.name, v.totalSales.toFixed(3), v.pendingPayout.toFixed(3), v.lifetimePayouts.toFixed(3)]),
            ];
            const vendorsSheet = XLSX.utils.aoa_to_sheet(vendorsData);
            XLSX.utils.book_append_sheet(workbook, vendorsSheet, "Vendors");
          }
          
          if (analytics.orders.length > 0) {
            const ordersData = [
              ["Order ID", "Total (KWD)", "Status", "Date"],
              ...analytics.orders.map((o: any) => [
                o.id,
                o.total.toFixed(3),
                o.status || "pending",
                o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A",
              ]),
            ];
            const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
            XLSX.utils.book_append_sheet(workbook, ordersSheet, "Orders");
          }
          
          const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Content-Disposition", `attachment; filename=analytics_${Date.now()}.xlsx`);
          res.send(buffer);
        }
      } else {
        // Enhanced PDF export
        const PDFDocument = await import("pdfkit");
        const { ChartJSNodeCanvas } = await import("chartjs-node-canvas");
        const doc = new PDFDocument.default({ margin: 50, size: "A4" });
        
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=analytics_${Date.now()}.pdf`);
        
        doc.pipe(res);
        
        // Header
        doc.rect(0, 0, doc.page.width, 80).fill("#1E40AF");
        doc.fillColor("#FFFFFF")
          .fontSize(24)
          .font("Helvetica-Bold")
          .text("MotorBuy Analytics Report", 50, 30, { align: "center" });
        doc.fontSize(10)
          .text(`Generated: ${new Date().toLocaleString()}`, 50, 60, { align: "center" });
        
        let yPos = 100;
        doc.fillColor("#000000");
        
        // Summary Section
        doc.fontSize(18).font("Helvetica-Bold").text("Executive Summary", 50, yPos);
        yPos += 30;
        
        const summaryBoxY = yPos;
        doc.rect(50, yPos, 495, 120)
          .fillAndStroke("#F3F4F6", "#E5E7EB")
          .stroke();
        
        yPos += 20;
        const metrics = [
          ["Total Orders", analytics.totalOrders.toString()],
          ["Total Revenue", `${analytics.totalRevenue.toFixed(3)} KWD`],
          ["Total Products", analytics.totalProducts.toString()],
          ["Total Vendors", analytics.totalVendors.toString()],
        ];
        
        let colX = 70;
        metrics.forEach(([label, value], index) => {
          if (index === 2) {
            colX = 70;
            yPos += 50;
          }
          doc.fontSize(10).font("Helvetica").fillColor("#6B7280").text(label, colX, yPos);
          doc.fontSize(14).font("Helvetica-Bold").fillColor("#111827").text(value, colX, yPos + 15);
          colX += 240;
        });
        
        yPos += 80;
        
        // Sales Chart
        if (analytics.salesChartData && analytics.salesChartData.length > 0) {
          try {
            const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 600, height: 300 });
            const chartConfig = {
              type: "line" as const,
              data: {
                labels: analytics.salesChartData.map((d: any) => d.label),
                datasets: [{
                  label: "Sales (KWD)",
                  data: analytics.salesChartData.map((d: any) => d.sales),
                  borderColor: "#1E40AF",
                  backgroundColor: "rgba(30, 64, 175, 0.1)",
                  tension: 0.4,
                  fill: true,
                }],
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: "Monthly Sales Performance",
                    font: { size: 16 },
                  },
                  legend: {
                    display: true,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value: any) {
                        return value.toFixed(0) + " KWD";
                      },
                    },
                  },
                },
              },
            };
            
            const chartImage = await chartJSNodeCanvas.renderToBuffer(chartConfig);
            doc.image(chartImage, 50, yPos, { width: 495 });
            yPos += 320;
          } catch (chartError) {
            console.error("Chart generation error:", chartError);
            doc.fontSize(14).text("Sales Chart", 50, yPos);
            yPos += 20;
            analytics.salesChartData.slice(0, 10).forEach((item: any) => {
              doc.fontSize(10).text(`${item.label}: ${item.sales.toFixed(2)} KWD`, 70, yPos);
              yPos += 15;
            });
            yPos += 10;
          }
        }
        
        // Vendors Section
        if (analytics.vendors.length > 0) {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
          
          doc.fontSize(18).font("Helvetica-Bold").text("Vendor Performance", 50, yPos);
          yPos += 25;
          
          analytics.vendors.forEach((v: any, index: number) => {
            if (yPos > 750) {
              doc.addPage();
              yPos = 50;
            }
            
            doc.rect(50, yPos, 495, 40)
              .fillAndStroke(index % 2 === 0 ? "#FFFFFF" : "#F9FAFB", "#E5E7EB")
              .stroke();
            
            doc.fontSize(12).font("Helvetica-Bold").fillColor("#111827")
              .text(v.name, 60, yPos + 10);
            doc.fontSize(10).font("Helvetica").fillColor("#6B7280")
              .text(`Sales: ${v.totalSales.toFixed(3)} KWD | Pending: ${v.pendingPayout.toFixed(3)} KWD | Lifetime: ${v.lifetimePayouts.toFixed(3)} KWD`, 60, yPos + 25);
            
            yPos += 45;
          });
        }
        
        // Footer
        const pageCount = doc.bufferedPageRange();
        for (let i = 0; i < pageCount.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor("#6B7280")
            .text(`Page ${i + 1} of ${pageCount.count}`, 50, doc.page.height - 30, { align: "center" });
          doc.text("MotorBuy Marketplace - Confidential", 50, doc.page.height - 20, { align: "center" });
        }
        
        doc.end();
      }
    } catch (e: any) {
      console.error("Error exporting analytics:", e);
      res.status(500).json({ message: "Failed to export analytics", error: e.message });
    }
  });

  app.get("/api/vendor/export/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "vendor")
        return res.status(403).json({ message: "Forbidden" });
      
      const format = req.query.format as "excel" | "pdf" || "excel";
      const vendor = await storage.getVendorByUserId(req.session.userId);
      if (!vendor)
        return res.status(404).json({ message: "Vendor not found" });
      
      const products = await storage.getProducts({ vendorId: vendor.id });
      const orders = await storage.getVendorOrders(vendor.id);
      
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total || "0"), 0);
      
      // Get sales chart data for this vendor
      const salesChartData = await storage.getSalesChartData("month", vendor.id);
      
      const analytics = {
        vendorName: vendor.storeName,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue.toFixed(3),
        totalSales: parseFloat(vendor.grossSalesKwd || "0").toFixed(3),
        walletBalance: parseFloat(vendor.walletBalanceKwd || "0").toFixed(3),
        pendingPayout: parseFloat(vendor.pendingPayoutKwd || "0").toFixed(3),
        lifetimePayouts: parseFloat(vendor.lifetimePayoutsKwd || "0").toFixed(3),
        orders: orders.map((o: any) => ({
          id: o.id,
          total: parseFloat(o.total || "0").toFixed(3),
          status: o.status,
          createdAt: o.createdAt,
        })),
        salesChartData,
      };
      
      if (format === "excel") {
        try {
          const ExcelJS = await import("exceljs");
          const workbook = new ExcelJS.Workbook();
          workbook.creator = "MotorBuy";
          workbook.created = new Date();
          workbook.modified = new Date();
          
          // Summary Sheet
          const summarySheet = workbook.addWorksheet("Summary");
          summarySheet.columns = [
            { width: 30 },
            { width: 20 },
          ];
          
          // Header
          const headerRow = summarySheet.addRow([`${analytics.vendorName} - Analytics Report`, ""]);
          headerRow.getCell(1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
          headerRow.getCell(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF059669" },
          };
          headerRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
          summarySheet.mergeCells("A1:B1");
          summarySheet.addRow([]);
          
          const dateRow = summarySheet.addRow(["Report Generated", new Date().toLocaleString()]);
          dateRow.getCell(1).font = { bold: true };
          summarySheet.addRow([]);
          
          const metrics = [
            ["Total Products", analytics.totalProducts],
            ["Total Orders", analytics.totalOrders],
            ["Total Revenue (KWD)", parseFloat(analytics.totalRevenue)],
            ["Total Sales (KWD)", parseFloat(analytics.totalSales)],
            ["Wallet Balance (KWD)", parseFloat(analytics.walletBalance)],
            ["Pending Payout (KWD)", parseFloat(analytics.pendingPayout)],
            ["Lifetime Payouts (KWD)", parseFloat(analytics.lifetimePayouts)],
          ];
          
          metrics.forEach(([label, value], index) => {
            const row = summarySheet.addRow([label, value]);
            if (index === 0) {
              row.getCell(1).font = { bold: true, size: 12 };
              row.getCell(2).font = { bold: true, size: 12 };
              row.getCell(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE5E7EB" },
              };
              row.getCell(2).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE5E7EB" },
              };
            }
            row.getCell(2).numFmt = index >= 2 ? "#,##0.000" : "#,##0";
            row.height = 25;
          });
          
          // Sales Chart Data Sheet
          if (analytics.salesChartData && analytics.salesChartData.length > 0) {
            const chartSheet = workbook.addWorksheet("Sales Trend");
            chartSheet.columns = [
              { width: 20 },
              { width: 20 },
            ];
            
            const chartHeader = chartSheet.addRow(["Month", "Sales (KWD)"]);
            chartHeader.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
            chartHeader.getCell(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
            chartHeader.getCell(1).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF059669" },
            };
            chartHeader.getCell(2).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF059669" },
            };
            chartHeader.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
            chartHeader.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
            chartHeader.height = 30;
            
            analytics.salesChartData.forEach((item: any) => {
              const row = chartSheet.addRow([item.label, item.sales]);
              row.getCell(2).numFmt = "#,##0.000";
              row.height = 20;
            });
            
            // Add borders
            chartSheet.eachRow((row, rowNumber) => {
              if (rowNumber > 0) {
                row.eachCell((cell) => {
                  cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                  };
                });
              }
            });
          }
          
          // Orders Sheet
          if (analytics.orders.length > 0) {
            const ordersSheet = workbook.addWorksheet("Orders");
            ordersSheet.columns = [
              { width: 25 },
              { width: 15 },
              { width: 15 },
              { width: 20 },
            ];
          
            const orderHeader = ordersSheet.addRow([
              "Order ID",
              "Total (KWD)",
              "Status",
              "Date",
            ]);
            orderHeader.eachCell((cell, colNumber) => {
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFDC2626" },
              };
              cell.alignment = { horizontal: "center", vertical: "middle" };
            });
            orderHeader.height = 30;
            
            analytics.orders.forEach((o: any) => {
              const row = ordersSheet.addRow([
                o.id,
                parseFloat(o.total),
                o.status || "pending",
                o.createdAt ? new Date(o.createdAt) : null,
              ]);
              row.getCell(2).numFmt = "#,##0.000";
              if (o.createdAt) {
                row.getCell(4).numFmt = "mm/dd/yyyy";
              }
              row.height = 20;
            });
            
            ordersSheet.eachRow((row, rowNumber) => {
              if (rowNumber > 0) {
                row.eachCell((cell) => {
                  cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                  };
                });
              }
            });
          }
          
          const buffer = await workbook.xlsx.writeBuffer();
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Content-Disposition", `attachment; filename=vendor_analytics_${Date.now()}.xlsx`);
          res.send(Buffer.from(buffer));
        } catch (excelError: any) {
          console.error("Excel export error:", excelError);
          // Fallback to simple XLSX
          const XLSX = await import("xlsx");
          const workbook = XLSX.utils.book_new();
          
          const summaryData = [
            ["Metric", "Value"],
            ["Vendor Name", analytics.vendorName],
            ["Total Products", analytics.totalProducts],
            ["Total Orders", analytics.totalOrders],
            ["Total Revenue (KWD)", analytics.totalRevenue],
            ["Total Sales (KWD)", analytics.totalSales],
            ["Wallet Balance (KWD)", analytics.walletBalance],
            ["Pending Payout (KWD)", analytics.pendingPayout],
            ["Lifetime Payouts (KWD)", analytics.lifetimePayouts],
          ];
          const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
          
          if (analytics.orders.length > 0) {
            const ordersData = [
              ["Order ID", "Total (KWD)", "Status", "Date"],
              ...analytics.orders.map((o: any) => [
                o.id,
                o.total,
                o.status || "pending",
                o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A",
              ]),
            ];
            const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
            XLSX.utils.book_append_sheet(workbook, ordersSheet, "Orders");
          }
          
          const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Content-Disposition", `attachment; filename=vendor_analytics_${Date.now()}.xlsx`);
          res.send(buffer);
        }
      } else {
        // Enhanced PDF export
        const PDFDocument = await import("pdfkit");
        const { ChartJSNodeCanvas } = await import("chartjs-node-canvas");
        const doc = new PDFDocument.default({ margin: 50, size: "A4" });
        
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=vendor_analytics_${Date.now()}.pdf`);
        
        doc.pipe(res);
        
        // Header
        doc.rect(0, 0, doc.page.width, 80).fill("#059669");
        doc.fillColor("#FFFFFF")
          .fontSize(24)
          .font("Helvetica-Bold")
          .text(`${analytics.vendorName} - Analytics Report`, 50, 30, { align: "center" });
        doc.fontSize(10)
          .text(`Generated: ${new Date().toLocaleString()}`, 50, 60, { align: "center" });
        
        let yPos = 100;
        doc.fillColor("#000000");
        
        // Summary Section
        doc.fontSize(18).font("Helvetica-Bold").text("Performance Summary", 50, yPos);
        yPos += 30;
        
        doc.rect(50, yPos, 495, 180)
          .fillAndStroke("#F3F4F6", "#E5E7EB")
          .stroke();
        
        yPos += 20;
        const metrics = [
          ["Total Products", analytics.totalProducts],
          ["Total Orders", analytics.totalOrders],
          ["Total Revenue", `${analytics.totalRevenue} KWD`],
          ["Total Sales", `${analytics.totalSales} KWD`],
          ["Wallet Balance", `${analytics.walletBalance} KWD`],
          ["Pending Payout", `${analytics.pendingPayout} KWD`],
          ["Lifetime Payouts", `${analytics.lifetimePayouts} KWD`],
        ];
        
        let colX = 70;
        metrics.forEach(([label, value], index) => {
          if (index === 3) {
            colX = 70;
            yPos += 50;
          }
          doc.fontSize(10).font("Helvetica").fillColor("#6B7280").text(label, colX, yPos);
          doc.fontSize(14).font("Helvetica-Bold").fillColor("#111827").text(value.toString(), colX, yPos + 15);
          colX += 240;
        });
        
        yPos += 100;
        
        // Sales Chart
        if (analytics.salesChartData && analytics.salesChartData.length > 0) {
          try {
            const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 600, height: 300 });
            const chartConfig = {
              type: "line" as const,
              data: {
                labels: analytics.salesChartData.map((d: any) => d.label),
                datasets: [{
                  label: "Sales (KWD)",
                  data: analytics.salesChartData.map((d: any) => d.sales),
                  borderColor: "#059669",
                  backgroundColor: "rgba(5, 150, 105, 0.1)",
                  tension: 0.4,
                  fill: true,
                }],
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: "Monthly Sales Performance",
                    font: { size: 16 },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value: any) {
                        return value.toFixed(0) + " KWD";
                      },
                    },
                  },
                },
              },
            };
            
            const chartImage = await chartJSNodeCanvas.renderToBuffer(chartConfig);
            doc.image(chartImage, 50, yPos, { width: 495 });
            yPos += 320;
          } catch (chartError) {
            console.error("Chart generation error:", chartError);
            doc.fontSize(14).text("Sales Chart", 50, yPos);
            yPos += 20;
            analytics.salesChartData.slice(0, 10).forEach((item: any) => {
              doc.fontSize(10).text(`${item.label}: ${item.sales.toFixed(2)} KWD`, 70, yPos);
              yPos += 15;
            });
            yPos += 10;
          }
        }
        
        // Orders Section
        if (analytics.orders.length > 0) {
          if (yPos > 650) {
            doc.addPage();
            yPos = 50;
          }
          
          doc.fontSize(18).font("Helvetica-Bold").text("Recent Orders", 50, yPos);
          yPos += 25;
          
          analytics.orders.slice(0, 15).forEach((o: any, index: number) => {
            if (yPos > 750) {
              doc.addPage();
              yPos = 50;
            }
            
            doc.rect(50, yPos, 495, 35)
              .fillAndStroke(index % 2 === 0 ? "#FFFFFF" : "#F9FAFB", "#E5E7EB")
              .stroke();
            
            doc.fontSize(10).font("Helvetica-Bold").fillColor("#111827")
              .text(`Order ${o.id.slice(-8)}`, 60, yPos + 8);
            doc.fontSize(9).font("Helvetica").fillColor("#6B7280")
              .text(`${o.total} KWD | ${o.status || "pending"} | ${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A"}`, 60, yPos + 20);
            
            yPos += 40;
          });
        }
        
        // Footer
        const pageCount = doc.bufferedPageRange();
        for (let i = 0; i < pageCount.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor("#6B7280")
            .text(`Page ${i + 1} of ${pageCount.count}`, 50, doc.page.height - 30, { align: "center" });
          doc.text("MotorBuy Marketplace - Confidential", 50, doc.page.height - 20, { align: "center" });
        }
        
        doc.end();
      }
    } catch (e: any) {
      console.error("Error exporting vendor analytics:", e);
      res.status(500).json({ message: "Failed to export analytics", error: e.message });
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

  // Warranty Management Endpoints
  app.get("/api/warranties", async (req: any, res) => {
    try {
      const warranties = await storage.getWarranties();
      res.json(warranties.filter((w: any) => w.isActive));
    } catch (e) {
      console.error("Error fetching warranties:", e);
      res.status(500).json({ message: "Failed to fetch warranties" });
    }
  });

  app.get("/api/admin/warranties", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
      const warranties = await storage.getWarranties();
      res.json(warranties);
    } catch (e) {
      console.error("Error fetching warranties:", e);
      res.status(500).json({ message: "Failed to fetch warranties" });
    }
  });

  app.post("/api/admin/warranties", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
      const { name, periodMonths, price, isActive } = req.body;
      if (!name || !periodMonths || !price)
        return res.status(400).json({ message: "Name, periodMonths, and price are required" });
      const warranty = await storage.createWarranty({
        name,
        periodMonths: parseInt(periodMonths),
        price,
        isActive: isActive !== undefined ? isActive : true,
      });
      res.status(201).json(warranty);
    } catch (e) {
      console.error("Error creating warranty:", e);
      res.status(500).json({ message: "Failed to create warranty" });
    }
  });

  app.patch("/api/admin/warranties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
      const updates: any = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.periodMonths !== undefined) updates.periodMonths = parseInt(req.body.periodMonths);
      if (req.body.price) updates.price = req.body.price;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
      const updated = await storage.updateWarranty(req.params.id, updates);
      if (!updated)
        return res.status(404).json({ message: "Warranty not found" });
      res.json(updated);
    } catch (e) {
      console.error("Error updating warranty:", e);
      res.status(500).json({ message: "Failed to update warranty" });
    }
  });

  app.delete("/api/admin/warranties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
      await storage.deleteWarranty(req.params.id);
      res.json({ message: "Warranty deleted" });
    } catch (e) {
      console.error("Error deleting warranty:", e);
      res.status(500).json({ message: "Failed to delete warranty" });
    }
  });

  // Warranty Purchase Endpoints
  app.get("/api/warranty-purchases", isAuthenticated, async (req: any, res) => {
    try {
      const purchases = await storage.getWarrantyPurchases(req.session.userId);
      res.json(purchases);
    } catch (e) {
      console.error("Error fetching warranty purchases:", e);
      res.status(500).json({ message: "Failed to fetch warranty purchases" });
    }
  });

  app.post("/api/warranty-purchases", isAuthenticated, async (req: any, res) => {
    try {
      const { productId, warrantyId, orderId, price } = req.body;
      if (!productId || !warrantyId || !price)
        return res.status(400).json({ message: "Product ID, warranty ID, and price are required" });
      const purchase = await storage.createWarrantyPurchase({
        userId: req.session.userId,
        productId,
        warrantyId,
        orderId: orderId || null,
        price,
      });
      res.status(201).json(purchase);
    } catch (e) {
      console.error("Error creating warranty purchase:", e);
      res.status(500).json({ message: "Failed to create warranty purchase" });
    }
  });

  // Vendor Requests Management
  app.get("/api/admin/vendor-requests", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const requests = await storage.getVendorRequests();
      res.json(requests);
    } catch (e) {
      console.error("Error fetching vendor requests:", e);
      res.status(500).json({ message: "Failed to fetch vendor requests" });
    }
  });

  app.patch("/api/admin/vendor-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { status, notes } = req.body;
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Get the request
      const requests = await storage.getVendorRequests();
      const request = requests.find(r => r.id === req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Update the request
      const { VendorRequest } = await import("./mongodb");
      const updated = await VendorRequest.findByIdAndUpdate(
        req.params.id,
        {
          status,
          notes,
          processedBy: req.session.userId,
          processedAt: new Date(),
        },
        { new: true }
      );

      // If approved, create vendor profile and update user role
      if (status === "approved") {
        const user = await (await import("./mongodb")).User.findById(request.userId);
        if (user) {
          await storage.setUserRole(request.userId, "vendor");
          
          // Check if vendor profile already exists
          const existingVendor = await storage.getVendorByUserId(request.userId);
          if (!existingVendor) {
            await storage.createVendor({
              userId: request.userId,
              storeName: request.companyName,
              description: `Contact: ${request.phone}, ${request.email}`,
              isApproved: true,
            });
          }
        }
      }

      res.json(updated ? {
        id: updated._id.toString(),
        userId: updated.userId,
        companyName: updated.companyName,
        phone: updated.phone,
        email: updated.email,
        status: updated.status,
        notes: updated.notes,
        createdAt: updated.createdAt,
        processedAt: updated.processedAt,
      } : null);
    } catch (e: any) {
      console.error("Error updating vendor request:", e);
      res.status(500).json({ message: e.message || "Failed to update vendor request" });
    }
  });

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

  // Vendor Registration Request (allows both authenticated and non-authenticated users)
  app.post("/api/vendor/request", async (req: any, res) => {
    try {
      const { companyName, phone, email } = req.body;
      if (!companyName || !phone || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // If user is authenticated, check role and existing requests
      let userId: string | null = null;
      if (req.session?.userId) {
        userId = req.session.userId;
        const role = await storage.getUserRole(userId);
        if (role && role !== "customer") {
          return res
            .status(403)
            .json({ message: "Only customers can request to become vendors" });
        }

        // Check if user already has a pending request
        const existingRequests = await storage.getVendorRequests();
        const userRequest = existingRequests.find(
          (r) => r.userId === userId && r.status === "pending"
        );
        if (userRequest) {
          return res
            .status(400)
            .json({ message: "You already have a pending vendor request" });
        }
      } else {
        // For non-authenticated users, check if email already has a pending request
        const existingRequests = await storage.getVendorRequests();
        const emailRequest = existingRequests.find(
          (r) => r.email === email && r.status === "pending"
        );
        if (emailRequest) {
          return res
            .status(400)
            .json({ message: "A pending vendor request already exists for this email" });
        }
      }

      const request = await storage.createVendorRequest(
        userId,
        companyName,
        phone,
        email
      );
      res.status(201).json(request);
    } catch (e: any) {
      console.error("Error creating vendor request:", e);
      // Handle duplicate email error
      if (e.code === 11000 || e.message?.includes("duplicate")) {
        return res
          .status(400)
          .json({ message: "A vendor request with this email already exists" });
      }
      res
        .status(500)
        .json({ message: e.message || "Failed to create vendor request" });
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

      // Get vendor commission rate (default 10% if not set)
      const commissionRate = parseFloat(vendor.commissionRate || "0.10");
      const orderTotal = parseFloat(total);
      const commission = orderTotal * commissionRate;
      const netAmount = orderTotal - commission;

      // Update Vendor Balance Logic
      // 1. Pay in Store: Vendor got full cash. They owe us commission. Balance decreases.
      // 2. Gateway: We got full cash. We owe them net amount. Balance increases.
      
      const currentBalance = parseFloat(vendor.walletBalanceKwd || "0");
      let newBalance = currentBalance;

      if (paymentMethod === "pay-in-store") {
        newBalance -= commission;
      } else if (paymentMethod === "gateway") {
        newBalance += netAmount;
      }

      // Update vendor wallet balance
      await storage.updateVendor(vendor.id, {
        walletBalanceKwd: newBalance.toFixed(3),
        // Also update gross sales
        grossSalesKwd: (parseFloat(vendor.grossSalesKwd || "0") + orderTotal).toFixed(3)
      });

      // Create order
      const order = await storage.createOrder(
        req.session.userId,
        total,
        items,
        {
          name: customerName,
          phone: customerPhone,
        },
        paymentMethod || "pay-in-store",
        commission.toFixed(3),
        netAmount.toFixed(3)
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
            // Mock payment link for now
            link: `https://motorbuy.com/pay/${order.id}` 
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
        commission: commission.toFixed(3),
        netAmount: netAmount.toFixed(3),
        updatedBalance: newBalance.toFixed(3)
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
      const totalSales = parseFloat(vendor.grossSalesKwd || "0");
      const pendingOrders = orders.filter(
        (o: any) => o.status === "pending" || o.status === "processing"
      ).length;
      const completedOrders = orders.filter(
        (o: any) => o.status === "delivered"
      ).length;
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      const walletBalance = parseFloat(vendor.walletBalanceKwd || "0");
      const lifetimePayouts = parseFloat(vendor.lifetimePayoutsKwd || "0");
      
      // Calculate net revenue after commission
      const commissionRate = parseFloat(vendor.commissionRate || "0.10");
      const totalCommission = totalSales * commissionRate;
      const netRevenue = totalSales - totalCommission;
      
      // Calculate outstanding payment (negative balance - vendor owes MotorBuy)
      const outstandingPayment = walletBalance < 0 ? Math.abs(walletBalance) : 0;
      
      // Calculate pending payment (positive balance that can be paid out)
      const pendingPayment = walletBalance > 0 ? walletBalance : 0;

      res.json({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue.toFixed(3),
        totalSales: totalSales.toFixed(3),
        netRevenue: netRevenue.toFixed(3),
        pendingOrders,
        completedOrders,
        averageOrderValue: averageOrderValue.toFixed(3),
        walletBalance: walletBalance.toFixed(3),
        lifetimePayouts: lifetimePayouts.toFixed(3),
        pendingPayoutKwd: pendingPayment.toFixed(3),
        outstandingPayment: outstandingPayment.toFixed(3),
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
    if (role !== "vendor" && role !== "admin")
      return res.status(403).json({ message: "Only vendors and admins can add products" });

    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (e: any) {
      console.error("Error creating product:", e);
      res.status(400).json({ message: e.message || "Validation error" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "vendor" && role !== "admin")
        return res
          .status(403)
          .json({ message: "Only vendors and admins can update products" });

      const productId = req.params.id;
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Admins can edit any product, vendors can only edit their own
      if (role !== "admin") {
        const vendors = await storage.getVendors();
        const vendor = vendors.find((v) => v.userId === req.session.userId);
        if (!vendor || existingProduct.vendorId !== vendor.id) {
          return res
            .status(403)
            .json({ message: "You can only edit your own products" });
        }
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
      if (role !== "vendor" && role !== "admin")
        return res
          .status(403)
          .json({ message: "Only vendors and admins can delete products" });

      const productId = req.params.id;
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Admins can delete any product, vendors can only delete their own
      if (role !== "admin") {
        const vendors = await storage.getVendors();
        const vendor = vendors.find((v) => v.userId === req.session.userId);
        if (!vendor || existingProduct.vendorId !== vendor.id) {
          return res
            .status(403)
            .json({ message: "You can only delete your own products" });
        }
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
      const warrantyTotal = parseFloat(req.body.warrantyTotal || "0");
      
      if (cartItems.length === 0 && warrantyTotal === 0)
        return res.status(400).json({ message: "Cart is empty" });

      let total = warrantyTotal; // Start with warranty total
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

      const paymentMethod = req.body.paymentMethod || "pay-in-store";

      // Commission Logic
      // Group items by vendor to handle commission updates per vendor
      const itemsByVendor: Record<string, typeof items> = {};
      const vendorTotals: Record<string, number> = {};

      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          if (!itemsByVendor[product.vendorId]) {
            itemsByVendor[product.vendorId] = [];
            vendorTotals[product.vendorId] = 0;
          }
          itemsByVendor[product.vendorId].push(item);
          vendorTotals[product.vendorId] += parseFloat(item.price) * item.quantity;
        }
      }

      // Update each vendor's balance
      for (const vendorId of Object.keys(vendorTotals)) {
        const vendor = await storage.getVendor(vendorId);
        if (vendor) {
          const vTotal = vendorTotals[vendorId];
          const commissionRate = parseFloat(vendor.commissionRate || "0.10");
          const commission = vTotal * commissionRate;
          const netAmount = vTotal - commission;

          let currentBalance = parseFloat(vendor.walletBalanceKwd || "0");
          let newBalance = currentBalance;

          if (paymentMethod === "pay-in-store") {
            // Vendor got cash, they owe us commission
            newBalance -= commission;
          } else if (paymentMethod === "gateway" || paymentMethod === "online") {
            // We got cash (gateway), we owe them net amount
            newBalance += netAmount;
          }

          await storage.updateVendor(vendorId, {
            walletBalanceKwd: newBalance.toFixed(3),
            grossSalesKwd: (parseFloat(vendor.grossSalesKwd || "0") + vTotal).toFixed(3)
          });
        }
      }

      const order = await storage.createOrder(
        req.session.userId,
        total.toFixed(3),
        items,
        customerInfo,
        paymentMethod
      );
      await storage.clearCart(req.session.userId);
      
      // Create warranty purchase if provided
      if (warrantyTotal > 0 && req.body.warrantyData) {
        try {
          const warrantyData = typeof req.body.warrantyData === 'string' 
            ? JSON.parse(req.body.warrantyData) 
            : req.body.warrantyData;
          await storage.createWarrantyPurchase({
            userId: req.session.userId,
            productId: warrantyData.productId,
            warrantyId: warrantyData.warrantyId,
            orderId: order.id,
            price: warrantyData.price,
          });
        } catch (warrantyError) {
          console.error("Error creating warranty purchase:", warrantyError);
          // Don't fail the order if warranty creation fails
        }
      }
      
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
      const itemsByVendor: Record<string, { productId: string, quantity: number, price: string }[]> = {};
      const vendorTotals: Record<string, number> = {};

      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res
            .status(400)
            .json({ message: `Product ${item.productId} not found` });
        }
        const price = parseFloat(product.price);
        total += price * item.quantity;
        const orderItem = {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        };
        orderItems.push(orderItem);

        // Group for commission calculation
        if (!itemsByVendor[product.vendorId.toString()]) {
          itemsByVendor[product.vendorId.toString()] = [];
          vendorTotals[product.vendorId.toString()] = 0;
        }
        itemsByVendor[product.vendorId.toString()].push(orderItem);
        vendorTotals[product.vendorId.toString()] += price * item.quantity;
      }

      // Assuming Guest checkout is Pay in Store for now or Gateway logic similar to auth
      // For now, let's treat guest as "pay-in-store" unless specified
      const paymentMethod = req.body.paymentMethod || "pay-in-store";

      // Update vendor balances
      for (const vendorId of Object.keys(vendorTotals)) {
        const vendor = await storage.getVendor(vendorId);
        if (vendor) {
          const vTotal = vendorTotals[vendorId];
          const commissionRate = parseFloat(vendor.commissionRate || "0.10");
          const commission = vTotal * commissionRate;
          const netAmount = vTotal - commission;

          let currentBalance = parseFloat(vendor.walletBalanceKwd || "0");
          let newBalance = currentBalance;

          if (paymentMethod === "pay-in-store") {
            newBalance -= commission;
          } else if (paymentMethod === "gateway" || paymentMethod === "online") {
            newBalance += netAmount;
          }

          await storage.updateVendor(vendorId, {
            walletBalanceKwd: newBalance.toFixed(3),
            grossSalesKwd: (parseFloat(vendor.grossSalesKwd || "0") + vTotal).toFixed(3)
          });
        }
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

  // Update order details (admin only)
  app.patch("/api/admin/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updates = req.body;
      const updated = await storage.updateOrderDetails(req.params.id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(updated);
    } catch (e: any) {
      console.error("Error updating order:", e);
      res.status(500).json({ message: e.message || "Failed to update order" });
    }
  });

  // Delete order (admin only)
  app.delete("/api/admin/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getUserRole(req.session.userId);
      if (role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteOrder(req.params.id);
      res.status(204).send();
    } catch (e: any) {
      console.error("Error deleting order:", e);
      res.status(500).json({ message: e.message || "Failed to delete order" });
    }
  });

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
    { name: "Bundles", slug: "bundles", icon: "Package" },
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

      // Check if MotorBuy vendor exists, if not create it
      const existingVendor = await storage.getVendorByUserId("motorbuy-system");
      if (!existingVendor) {
        // Create system user first
        const { User, Vendor } = await import("./mongodb");
        
        let systemUser = await User.findOne({ email: "system@motorbuy.com" });
        if (!systemUser) {
           const { hash } = await import("bcryptjs");
           const passwordHash = await hash("system123", 12);
           systemUser = await User.create({
             email: "system@motorbuy.com",
             passwordHash,
             firstName: "MotorBuy",
             lastName: "System",
             role: "vendor",
             createdAt: new Date(),
             updatedAt: new Date(),
           });
        }
        
        await Vendor.create({
           userId: "motorbuy-system", // using the string ID as identifier for now
           storeName: "MotorBuy",
           description: "Official MotorBuy Bundles and Offers",
           logoUrl: "https://placehold.co/150x150?text=MB",
           coverImageUrl: "https://placehold.co/1200x400?text=MotorBuy",
           bio: "Official MotorBuy Store",
           isApproved: true,
           commissionType: "percentage",
           commissionValue: "0",
        });
      }

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
