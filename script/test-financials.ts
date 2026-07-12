import mongoose from "mongoose";
import { connectMongoDB, Vendor, PaymentRequest } from "../server/mongodb";
import { storage } from "../server/storage";

async function main() {
  await connectMongoDB();
  try {
    const vendors = await storage.getVendors();
    console.log("storage.getVendors length:", vendors.length);
    
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
    console.log("Successfully processed vendors. Length:", vendorsWithRequests.length);
    console.log(JSON.stringify(vendorsWithRequests, null, 2));
  } catch (err) {
    console.error("Error in processing:", err);
  }
  process.exit(0);
}

main().catch(console.error);
