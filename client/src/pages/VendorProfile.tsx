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
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-primary/30 overflow-hidden flex items-center justify-center mx-auto md:mx-0 shrink-0">
            {vendor.logoUrl ? (
              <img src={vendor.logoUrl} alt={vendor.storeName} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-16 h-16 text-primary" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h1 className="text-2xl font-display font-bold">{vendor.storeName}</h1>
              {vendor.isApproved && (
                <Badge variant="default" className="w-fit mx-auto md:mx-0">Verified Seller</Badge>
              )}
            </div>
            
            <div className="flex justify-center md:justify-start gap-8 mb-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg">{vendorProducts.length}</div>
                <div className="text-muted-foreground">Products</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{vendorStories.length}</div>
                <div className="text-muted-foreground">Stories</div>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-4 max-w-md mx-auto md:mx-0">
              {vendor.description}
            </p>
            
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Kuwait</span>
            </div>
          </div>
        </div>

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
          <div className="grid grid-cols-3 gap-1 md:gap-3">
            {vendorProducts.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-muted-foreground">
                No products yet
              </div>
            ) : (
              vendorProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="aspect-square bg-muted relative group cursor-pointer overflow-hidden"
                  onClick={() => setSelectedProduct(product)}
                  data-testid={`product-grid-${product.id}`}
                >
                  <img 
                    src={product.images?.[0] || "https://placehold.co/300?text=Product"} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
                    <span className="font-bold text-sm text-center line-clamp-2">{product.name}</span>
                    <span className="text-sm mt-1">{formatKWD(product.price)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "stories" && (
          <div className="space-y-6">
            {vendorStories.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No stories yet
              </div>
            ) : (
              vendorStories.map((story) => (
                <div key={story.id} className="bg-card border rounded-xl overflow-hidden" data-testid={`story-${story.id}`}>
                  {story.imageUrl && (
                    <img src={story.imageUrl} alt="" className="w-full aspect-video object-cover" />
                  )}
                  <div className="p-4">
                    <p className="text-foreground">{story.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
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
