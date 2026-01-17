import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  User,
  Vendor,
  Category,
  Product,
  Order,
  OrderItem,
  PaymentRequest,
} from "./mongodb";

const demoVendors = [
  {
    userId: "demo-vendor-1",
    storeName: "Al-Faisal Auto Parts",
    description:
      "Premium OEM and aftermarket parts for all Japanese and Korean vehicles. Serving Kuwait since 2005.",
    logoUrl: "https://placehold.co/150x150?text=AFAP",
    coverImageUrl: "https://placehold.co/1200x400?text=Al-Faisal+Auto+Parts",
    bio: "Family-owned business with 20+ years of experience",
    isApproved: true,
    commissionType: "percentage",
    commissionValue: "5",
  },
  {
    userId: "demo-vendor-2",
    storeName: "Kuwait Performance Motors",
    description:
      "High-performance parts and upgrades for sports cars. Authorized dealer for major brands.",
    logoUrl: "https://placehold.co/150x150?text=KPM",
    coverImageUrl: "https://placehold.co/1200x400?text=Kuwait+Performance",
    bio: "Your destination for performance upgrades",
    isApproved: true,
    commissionType: "percentage",
    commissionValue: "8",
  },
  {
    userId: "demo-vendor-3",
    storeName: "Gulf Auto Supply",
    description:
      "Wholesale and retail auto parts. Best prices in Kuwait for genuine and OEM parts.",
    logoUrl: "https://placehold.co/150x150?text=GAS",
    coverImageUrl: "https://placehold.co/1200x400?text=Gulf+Auto+Supply",
    bio: "Lowest prices guaranteed",
    isApproved: true,
    commissionType: "fixed",
    commissionValue: "2",
  },
  {
    userId: "motorbuy-system",
    storeName: "MotorBuy",
    description: "Official MotorBuy Bundles and Offers",
    logoUrl: "https://placehold.co/150x150?text=MB",
    coverImageUrl: "https://placehold.co/1200x400?text=MotorBuy",
    bio: "Official MotorBuy Store",
    isApproved: true,
    commissionType: "percentage",
    commissionValue: "0",
  },
];

const demoUsers = [
  {
    id: "demo-vendor-1",
    email: "vendor1@demo.com",
    firstName: "Ahmed",
    lastName: "Al-Faisal",
  },
  {
    id: "demo-vendor-2",
    email: "vendor2@demo.com",
    firstName: "Khalid",
    lastName: "Al-Rashid",
  },
  {
    id: "demo-vendor-3",
    email: "vendor3@demo.com",
    firstName: "Mohammed",
    lastName: "Al-Sabah",
  },
  {
    id: "demo-customer-1",
    email: "customer1@demo.com",
    firstName: "Yusuf",
    lastName: "Ibrahim",
  },
  {
    id: "motorbuy-system",
    email: "system@motorbuy.com",
    firstName: "MotorBuy",
    lastName: "System",
  },
];

const categories = [
  {
    name: "Engine Parts",
    slug: "engine-parts",
    imageUrl: "https://placehold.co/100x100?text=Engine",
  },
  {
    name: "Brakes",
    slug: "brakes",
    imageUrl: "https://placehold.co/100x100?text=Brakes",
  },
  {
    name: "Suspension",
    slug: "suspension",
    imageUrl: "https://placehold.co/100x100?text=Suspension",
  },
  {
    name: "Electrical",
    slug: "electrical",
    imageUrl: "https://placehold.co/100x100?text=Electrical",
  },
  {
    name: "Filters",
    slug: "filters",
    imageUrl: "https://placehold.co/100x100?text=Filters",
  },
  {
    name: "Cooling System",
    slug: "cooling-system",
    imageUrl: "https://placehold.co/100x100?text=Cooling",
  },
  {
    name: "Bundles",
    slug: "bundles",
    imageUrl: "https://placehold.co/100x100?text=Bundles",
  },
];

export async function seedDatabase() {
  console.log("Starting database seeding...");

  // Create test users with passwords
  const testPassword = "test123"; // Default password for all test users
  const passwordHash = await bcrypt.hash(testPassword, 12);

  // Create or update customer@test.com
  let customerUser = await User.findOne({ email: "customer@test.com" });
  if (!customerUser) {
    customerUser = await User.create({
      email: "customer@test.com",
      passwordHash,
      firstName: "Customer",
      lastName: "Test",
      role: "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✅ Created customer@test.com user with customer role");
  } else {
    customerUser.passwordHash = passwordHash;
    customerUser.role = "customer";
    await customerUser.save();
    console.log("✅ Updated customer@test.com user with customer role");
  }

  // Create or update vendor@test.com
  let vendorUser = await User.findOne({ email: "vendor@test.com" });
  if (!vendorUser) {
    vendorUser = await User.create({
      email: "vendor@test.com",
      passwordHash,
      firstName: "Vendor",
      lastName: "Test",
      role: "vendor",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✅ Created vendor@test.com user with vendor role");
  } else {
    vendorUser.passwordHash = passwordHash;
    vendorUser.role = "vendor";
    await vendorUser.save();
    console.log("✅ Updated vendor@test.com user with vendor role");
  }

  // Create or update admin@test.com
  let adminUser = await User.findOne({ email: "admin@test.com" });
  if (!adminUser) {
    adminUser = await User.create({
      email: "admin@test.com",
      passwordHash,
      firstName: "Admin",
      lastName: "Test",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✅ Created admin@test.com user with admin role");
  } else {
    adminUser.passwordHash = passwordHash;
    adminUser.role = "admin";
    await adminUser.save();
    console.log("✅ Updated admin@test.com user with admin role");
  }

  await Category.deleteMany({});
  const createdCategories = await Category.insertMany(categories);
  console.log(`Created ${createdCategories.length} categories`);

  const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
  createdCategories.forEach((cat) => {
    categoryMap[cat.slug] = cat._id as mongoose.Types.ObjectId;
  });

  // Create demo users if they don't exist
  for (const demoUser of demoUsers) {
    const existingUser = await User.findOne({ email: demoUser.email });
    if (!existingUser) {
      const passwordHash = await bcrypt.hash("demo123", 12);
      await User.create({
        email: demoUser.email,
        passwordHash,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        role: demoUser.id.includes("vendor") ? "vendor" : "customer",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // Update role if user exists
      const role = demoUser.id.includes("vendor") ? "vendor" : "customer";
      await User.findByIdAndUpdate(existingUser._id, {
        role,
        updatedAt: new Date(),
      });
    }
  }
  console.log(`Created/updated ${demoUsers.length} demo users`);

  await Vendor.deleteMany({ userId: { $regex: /^demo-/ } });
  const createdVendors = await Vendor.insertMany(demoVendors);
  console.log(`Created ${createdVendors.length} vendors`);

  const vendorMap: Record<string, mongoose.Types.ObjectId> = {};
  createdVendors.forEach((v) => {
    vendorMap[v.userId] = v._id as mongoose.Types.ObjectId;
  });

  await Product.deleteMany({});

  const products = [
    {
      vendorId: vendorMap["demo-vendor-1"],
      categoryId: categoryMap["engine-parts"],
      name: "Toyota Camry Timing Belt Kit",
      description:
        "Complete timing belt kit for Toyota Camry 2012-2017. Includes belt, tensioner, and water pump. OEM quality.",
      price: "45.000",
      compareAtPrice: "55.000",
      stock: 25,
      brand: "Toyota OEM",
      images: [
        "/attached_assets/stock_images/car_engine_parts_aut_02ada9ec.jpg",
      ],
      warrantyInfo: "1 year warranty",
    },
    {
      vendorId: vendorMap["demo-vendor-1"],
      categoryId: categoryMap["engine-parts"],
      name: "Nissan Altima Spark Plugs Set",
      description:
        "High-performance iridium spark plugs for Nissan Altima. Set of 4. Improved fuel efficiency and power.",
      price: "28.500",
      compareAtPrice: "35.000",
      stock: 50,
      brand: "NGK",
      images: [
        "/attached_assets/stock_images/car_engine_parts_aut_6393f4c6.jpg",
      ],
      warrantyInfo: "2 years warranty",
    },
    {
      vendorId: vendorMap["demo-vendor-1"],
      categoryId: categoryMap["filters"],
      name: "Honda Accord Air Filter",
      description:
        "Premium air filter for Honda Accord 2018-2023. High flow design for better engine breathing.",
      price: "12.750",
      stock: 100,
      brand: "K&N",
      images: [
        "/attached_assets/stock_images/car_engine_parts_aut_9487a72a.jpg",
      ],
      warrantyInfo: "Million mile warranty",
    },
    {
      vendorId: vendorMap["demo-vendor-2"],
      categoryId: categoryMap["brakes"],
      name: "BMW 3 Series Performance Brake Pads",
      description:
        "High-performance ceramic brake pads for BMW 3 Series F30. Excellent stopping power with low dust.",
      price: "65.000",
      compareAtPrice: "80.000",
      stock: 30,
      brand: "Brembo",
      images: [
        "/attached_assets/stock_images/car_brake_pads_autom_65e507f7.jpg",
      ],
      warrantyInfo: "2 years warranty",
    },
    {
      vendorId: vendorMap["demo-vendor-2"],
      categoryId: categoryMap["brakes"],
      name: "Mercedes C-Class Brake Rotors",
      description:
        "Drilled and slotted brake rotors for Mercedes C-Class W205. Superior heat dissipation.",
      price: "120.000",
      compareAtPrice: "150.000",
      stock: 15,
      brand: "StopTech",
      images: [
        "/attached_assets/stock_images/car_brake_pads_autom_f0810d74.jpg",
      ],
      warrantyInfo: "3 years warranty",
    },
    {
      vendorId: vendorMap["demo-vendor-3"],
      categoryId: categoryMap["suspension"],
      name: "Universal Shock Absorbers Pair",
      description:
        "Heavy-duty shock absorbers suitable for most sedans. Front or rear application. Improved ride comfort.",
      price: "35.000",
      compareAtPrice: "42.000",
      stock: 40,
      brand: "Monroe",
      images: [
        "/attached_assets/stock_images/car_suspension_parts_b61b7c1f.jpg",
      ],
      warrantyInfo: "5 years warranty",
    },
    {
      vendorId: vendorMap["demo-vendor-3"],
      categoryId: categoryMap["suspension"],
      name: "Coilover Kit - Adjustable",
      description:
        "Fully adjustable coilover suspension kit. Fits most vehicles. 32-way damping adjustment.",
      price: "280.000",
      compareAtPrice: "350.000",
      stock: 10,
      brand: "Tein",
      images: [
        "/attached_assets/stock_images/car_suspension_parts_b82fcbb4.jpg",
      ],
      warrantyInfo: "1 year warranty",
    },
    {
      vendorId: vendorMap["demo-vendor-1"],
      categoryId: categoryMap["cooling-system"],
      name: "Radiator for Lexus ES350",
      description:
        "OEM replacement radiator for Lexus ES350 2013-2018. Aluminum core with plastic tanks.",
      price: "85.000",
      stock: 8,
      brand: "Denso",
      images: [
        "/attached_assets/stock_images/car_engine_parts_aut_02ada9ec.jpg",
      ],
      warrantyInfo: "2 years warranty",
    },
    {
      vendorId: vendorMap["demo-vendor-2"],
      categoryId: categoryMap["electrical"],
      name: "LED Headlight Bulbs H11",
      description:
        "Ultra-bright LED headlight bulbs. 6000K pure white light. Plug and play installation.",
      price: "22.000",
      compareAtPrice: "28.000",
      stock: 200,
      brand: "Philips",
      images: [
        "/attached_assets/stock_images/car_engine_parts_aut_6393f4c6.jpg",
      ],
      warrantyInfo: "3 years warranty",
    },
    {
      vendorId: vendorMap["demo-vendor-3"],
      categoryId: categoryMap["filters"],
      name: "Oil Filter Universal Pack (3)",
      description:
        "Universal oil filters compatible with most vehicles. Pack of 3. Premium filtration.",
      price: "8.500",
      stock: 150,
      brand: "Bosch",
      images: [
        "/attached_assets/stock_images/car_engine_parts_aut_9487a72a.jpg",
      ],
      warrantyInfo: "1 year warranty",
    },
  ];

  const createdProducts = await Product.insertMany(products);
  console.log(`Created ${createdProducts.length} products`);

  await Order.deleteMany({ userId: { $regex: /^demo-/ } });
  await OrderItem.deleteMany({});
  await PaymentRequest.deleteMany({});

  const order1 = await Order.create({
    userId: "demo-customer-1",
    total: "110.000",
    status: "delivered",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  });

  await OrderItem.insertMany([
    {
      orderId: order1._id,
      productId: createdProducts[0]._id,
      quantity: 1,
      price: "45.000",
    },
    {
      orderId: order1._id,
      productId: createdProducts[3]._id,
      quantity: 1,
      price: "65.000",
    },
  ]);

  const vendor1 = await Vendor.findById(vendorMap["demo-vendor-1"]);
  if (vendor1) {
    const gross1 = 45;
    const commission1 = gross1 * 0.05;
    await Vendor.findByIdAndUpdate(vendorMap["demo-vendor-1"], {
      grossSalesKwd: gross1.toFixed(3),
      pendingPayoutKwd: (gross1 - commission1).toFixed(3),
    });
  }

  const vendor2 = await Vendor.findById(vendorMap["demo-vendor-2"]);
  if (vendor2) {
    const gross2 = 65;
    const commission2 = gross2 * 0.08;
    await Vendor.findByIdAndUpdate(vendorMap["demo-vendor-2"], {
      grossSalesKwd: gross2.toFixed(3),
      pendingPayoutKwd: (gross2 - commission2).toFixed(3),
    });
  }

  const order2 = await Order.create({
    userId: "demo-customer-1",
    total: "315.000",
    status: "shipped",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });

  await OrderItem.insertMany([
    {
      orderId: order2._id,
      productId: createdProducts[5]._id,
      quantity: 1,
      price: "35.000",
    },
    {
      orderId: order2._id,
      productId: createdProducts[6]._id,
      quantity: 1,
      price: "280.000",
    },
  ]);

  const vendor3 = await Vendor.findById(vendorMap["demo-vendor-3"]);
  if (vendor3) {
    const gross3 = 315;
    const commission3 = 2;
    await Vendor.findByIdAndUpdate(vendorMap["demo-vendor-3"], {
      grossSalesKwd: gross3.toFixed(3),
      pendingPayoutKwd: (gross3 - commission3).toFixed(3),
    });
  }

  await PaymentRequest.create({
    vendorId: vendorMap["demo-vendor-1"],
    amount: "42.750",
    status: "pending",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  });

  console.log("Created demo orders and updated vendor earnings");
  console.log("Database seeding completed!");

  return {
    categories: createdCategories.length,
    vendors: createdVendors.length,
    products: createdProducts.length,
    orders: 2,
  };
}
