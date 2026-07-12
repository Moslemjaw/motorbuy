import mongoose from "mongoose";
import { connectMongoDB, Vendor } from "../server/mongodb";

async function main() {
  await connectMongoDB();
  const vendors = await Vendor.find({});
  console.log("Vendors:", vendors);
  process.exit(0);
}

main().catch(console.error);
