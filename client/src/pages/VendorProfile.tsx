import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVendor, useProducts, useStories, useAddToCart } from "@/hooks/use-motorbuy";
import { useRoute, Link } from "wouter";
import { Store, MapPin, ShoppingCart, Grid3X3, Newspaper, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatKWD } from "@/lib/currency";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import type { Product } from "@shared/schema";

export default function VendorProfile() {
  const [, params] = useRoute("/vendor/:id");
  const vendorId = params ? parseInt(params.id) : 0;
  
  const { data: vendor, isLoading: isVendorLoading } = useVendor(vendorId);
  const { data: allProducts, isLoading: isProductsLoading } = useProducts({ vendorId });
  const { data: allStories } = useStories();
  const [activeTab, setActiveTab] = useState<"products" | "stories">("products");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
      
      <div className="relative gradient-dark text-white py-20 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-primary to-accent p-1 shadow-2xl shadow-primary/30 shrink-0">
              <div className="w-full h-full rounded-full bg-background overflow-hidden flex items-center justify-center">
                {vendor.logoUrl ? (
                  <img src={vendor.logoUrl} alt={vendor.storeName} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-16 h-16 text-primary" />
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                <h1 className="text-3xl font-display font-bold">{vendor.storeName}</h1>
                {vendor.isApproved && (
                  <Badge className="w-fit mx-auto md:mx-0 bg-white/20 text-white border-white/30">Verified Seller</Badge>
                )}
              </div>
              
              <div className="flex justify-center md:justify-start gap-10 mb-5">
                <div className="text-center">
                  <div className="font-bold text-2xl">{vendorProducts.length}</div>
                  <div className="text-white/60 text-sm">Products</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl">{vendorStories.length}</div>
                  <div className="text-white/60 text-sm">Stories</div>
                </div>
              </div>
              
              <p className="text-white/70 mb-5 max-w-md mx-auto md:mx-0 leading-relaxed">
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

      <div className="max-w-4xl mx-auto px-4 pb-8">

        <div className="flex border-b mb-6">
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "products" 
                ? "border-foreground text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("products")}
            data-testid="tab-products"
          >
            <Grid3X3 className="w-4 h-4" />
            Products
          </button>
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "stories" 
                ? "border-foreground text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("stories")}
            data-testid="tab-stories"
          >
            <Newspaper className="w-4 h-4" />
            Stories
          </button>
        </div>

        {activeTab === "products" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {vendorProducts.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                No products yet
              </div>
            ) : (
              vendorProducts.map((product, index) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="aspect-square bg-card rounded-xl relative group cursor-pointer overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                  onClick={() => setSelectedProduct(product)}
                  data-testid={`product-grid-${product.id}`}
                >
                  <img 
                    src={product.images?.[0] || "https://placehold.co/300?text=Product"} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end text-white p-4">
                    <span className="font-bold text-sm text-center line-clamp-2 mb-1">{product.name}</span>
                    <Badge className="bg-white/20 text-white border-0">{formatKWD(product.price)}</Badge>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === "stories" && (
          <div className="space-y-6">
            {vendorStories.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No stories yet
              </div>
            ) : (
              vendorStories.map((story, index) => (
                <motion.div 
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow" 
                  data-testid={`story-${story.id}`}
                >
                  {story.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img src={story.imageUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-foreground leading-relaxed">{story.content}</p>
                    <p className="text-xs text-muted-foreground mt-4">
                      {story.createdAt ? new Date(story.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ""}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      <ProductModal 
        product={selectedProduct} 
        vendor={vendor}
        onClose={() => setSelectedProduct(null)} 
      />
    </div>
  );
}

function ProductModal({ product, vendor, onClose }: { 
  product: Product | null; 
  vendor: { storeName: string };
  onClose: () => void;
}) {
  const addToCartMutation = useAddToCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  if (!product) return null;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({ title: "Please login", description: "You need to be logged in to add items to cart", variant: "destructive" });
      return;
    }
    
    addToCartMutation.mutate({ productId: product.id, quantity: 1 }, {
      onSuccess: () => {
        toast({ title: "Added to cart", description: `${product.name} added to your cart` });
        onClose();
      },
      onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            <img 
              src={product.images?.[0] || "https://placehold.co/400"} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl">{product.name}</DialogTitle>
            </DialogHeader>
            
            <div className="text-2xl font-bold text-primary my-2">
              {formatKWD(product.price)}
            </div>
            
            <p className="text-muted-foreground text-sm flex-1">
              {product.description}
            </p>
            
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Store className="w-4 h-4" />
                <span>Sold by {vendor.storeName}</span>
              </div>
              
              {product.brand && (
                <Badge variant="secondary">Brand: {product.brand}</Badge>
              )}
              
              <div className="text-sm">
                <span className={product.stock > 0 ? "text-green-600" : "text-destructive"}>
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <Button 
                className="flex-1 gap-2" 
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || addToCartMutation.isPending}
                data-testid="button-add-to-cart-modal"
              >
                <ShoppingCart className="w-4 h-4" />
                {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
              </Button>
              <Link href={`/products/${product.id}`}>
                <Button variant="outline">View Details</Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
