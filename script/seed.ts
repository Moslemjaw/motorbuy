import { readFileSync } from "fs";
import { connectMongoDB } from "../server/mongodb";
import { seedDatabase } from "../server/seed";

// Load .env file manually
try {
  const envFile = readFileSync(".env", "utf-8");
  envFile.split("\n").forEach((line) => {
    const [key, ...values] = line.split("=");
    if (key && values.length > 0) {
      const value = values.join("=").trim();
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (e) {
  console.warn("Could not load .env file, using environment variables");
}

async function runSeed() {
  try {
    console.log("Connecting to MongoDB...");
    await connectMongoDB();
    console.log("Running seed...");
    await seedDatabase();
    console.log("✅ Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

runSeed();
