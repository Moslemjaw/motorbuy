import { connectMongoDB, User, Role } from "../server/mongodb";

async function setRoles() {
  try {
    await connectMongoDB();
    console.log("Connected to MongoDB");

    // Set vendor role for vendor@test.com
    const vendorUser = await User.findOne({ email: "vendor@test.com" });
    if (vendorUser) {
      await Role.deleteMany({ userId: vendorUser._id.toString() });
      await Role.create({ userId: vendorUser._id.toString(), role: "vendor" });
      console.log("✅ Set vendor role for vendor@test.com");
    } else {
      console.log("❌ User vendor@test.com not found");
    }

    // Set admin role for admin@test.com
    const adminUser = await User.findOne({ email: "admin@test.com" });
    if (adminUser) {
      await Role.deleteMany({ userId: adminUser._id.toString() });
      await Role.create({ userId: adminUser._id.toString(), role: "admin" });
      console.log("✅ Set admin role for admin@test.com");
    } else {
      console.log("❌ User admin@test.com not found");
    }

    console.log("\n✅ Role assignment complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error setting roles:", error);
    process.exit(1);
  }
}

setRoles();
