import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVendor, useProducts, useStories } from "@/hooks/use-motorbuy";
import { useRoute, Link } from "wouter";
import { Store, MapPin, Loader2, ImageIcon } from "lucide-react";
import { useState } from "react";
import { formatKWD } from "@/lib/currency";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import type { VendorStory } from "@shared/schema";

export default function VendorProfile() {
  const [, params] = useRoute("/vendor/:id");
  const vendorId = params?.id || "";
  
  const { data: vendor, isLoading: isVendorLoading } = useVendor(vendorId);
  const { data: allProducts, isLoading: isProductsLoading } = useProducts({ vendorId });
  const { data: allStories } = useStories();
  const [selectedStory, setSelectedStory] = useState<VendorStory | null>(null);

  const vendorProducts = allProducts?.filter(p => p.vendorId === vendorId) || [];
  const vendorStories = allStories?.filter(s => s.vendorId === vendorId) || [];

  if (isVendorLoading || isProductsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Vendor not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      
      <div className="relative gradient-dark text-white py-8 md:py-16 mb-6 md:mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center md:items-start">
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-primary to-accent p-1 shadow-2xl shadow-primary/30 shrink-0">
              <div className="w-full h-full rounded-full bg-background overflow-hidden flex items-center justify-center">
                {vendor.logoUrl ? (
                  <img src={vendor.logoUrl} alt={vendor.storeName} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-12 h-12 text-primary" />
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-display font-bold">{vendor.storeName}</h1>
                {vendor.isApproved && (
                  <Badge className="w-fit mx-auto md:mx-0 bg-white/20 text-white border-white/30">Verified Seller</Badge>
                )}
              </div>
              
              <div className="flex justify-center md:justify-start gap-8 mb-4">
                <div className="text-center">
                  <div className="font-bold text-xl">{vendorProducts.length}</div>
                  <div className="text-white/60 text-sm">Products</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{vendorStories.length}</div>
                  <div className="text-white/60 text-sm">Stories</div>
                </div>
              </div>
              
              <p className="text-white/70 mb-4 max-w-lg mx-auto md:mx-0 leading-relaxed text-sm">
                {vendor.description}
              </p>
              
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-white/50">
                <MapPin className="w-4 h-4" />
                <span>Kuwait</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {vendorStories.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" /> Latest Stories
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {vendorStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="shrink-0 cursor-pointer group"
                  onClick={() => setSelectedStory(story)}
                  data-testid={`story-thumb-${story.id}`}
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-accent p-0.5 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full overflow-hidden bg-card">
                      {story.imageUrl ? (
                        <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2 max-w-20 md:max-w-24 line-clamp-1">
                    {story.createdAt ? new Date(story.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Story"}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
            <Store className="w-5 h-5" /> All Products
          </h2>
          
          {vendorProducts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Store className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No products yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {vendorProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard product={{ ...product, vendor }} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {selectedStory && (
            <div>
              {selectedStory.imageUrl && (
                <div className="aspect-square bg-muted">
                  <img src={selectedStory.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {vendor.logoUrl ? (
                      <img src={vendor.logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{vendor.storeName}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedStory.createdAt ? new Date(selectedStory.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      }) : ""}
                    </div>
                  </div>
                </div>
                <p className="text-foreground leading-relaxed">{selectedStory.content}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
