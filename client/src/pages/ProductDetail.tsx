import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProduct, useAddToCart } from "@/hooks/use-motorbuy";
import { useRoute } from "wouter";
import { ShoppingCart, Truck, ShieldCheck, ArrowLeft, Store, Package, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { formatKWD } from "@/lib/currency";
import { motion } from "framer-motion";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const id = params ? parseInt(params.id) : 0;
  
  const { data: product, isLoading } = useProduct(id);
  const addToCartMutation = useAddToCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const isPending = addToCartMutation.isPending;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
        toast({ title: "Please login", description: "You need to be logged in to add items to cart", variant: "destructive" });
        return;
    }
    if (!product) return;
    
    addToCartMutation.mutate({ productId: product.id, quantity: 1 }, {
      onSuccess: () => toast({ title: "Added to cart", description: `${product.name} added` }),
      onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );
  
  if (!product) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Package className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Product not found</h2>
      <Link href="/products">
        <Button variant="outline" className="mt-4">Back to Products</Button>
      </Link>
    </div>
  );

  const mainImage = product.images?.[0] || "https://placehold.co/800x600?text=No+Image";

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Products
          </Link>
        </motion.div>
        
        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 rounded-3xl overflow-hidden border border-border shadow-2xl">
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.slice(0, 4).map((img, i) => (
                  <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {product.stock > 0 ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" /> In Stock ({product.stock})
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
              {product.brand && (
                <Badge variant="outline">{product.brand}</Badge>
              )}
            </div>

            <h1 className="text-3xl lg:text-4xl font-display font-bold mb-4">{product.name}</h1>
            
            <div className="text-4xl font-bold text-primary mb-6">
              {formatKWD(product.price)}
            </div>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {product.description}
            </p>

            <div className="flex gap-4 mb-8">
              <Button 
                size="lg" 
                className="flex-1 h-14 text-lg rounded-xl gap-2 shadow-lg shadow-primary/20" 
                onClick={handleAddToCart} 
                disabled={isPending || product.stock <= 0}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {isPending ? "Adding..." : "Add to Cart"}
              </Button>
            </div>

            <div className="space-y-4 pt-6 border-t">
              {product.vendorId && (
                <Link href={`/vendor/${product.vendorId}`}>
                  <div className="flex items-center gap-4 bg-card p-5 rounded-2xl border hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white">
                      <Store className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Sold by</div>
                      <div className="font-bold text-lg group-hover:text-primary transition-colors">
                        {product.vendor?.storeName || `Vendor #${product.vendorId}`}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      Visit Shop
                    </Button>
                  </div>
                </Link>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <div className="font-medium text-sm">Secure Payment</div>
                    <div className="text-xs text-muted-foreground">Protected checkout</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <Truck className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <div className="font-medium text-sm">Fast Shipping</div>
                    <div className="text-xs text-muted-foreground">Kuwait delivery</div>
                  </div>
                </div>
              </div>

              {product.warrantyInfo && (
                <div className="p-4 bg-accent/20 rounded-xl">
                  <div className="font-medium text-sm mb-1">Warranty</div>
                  <div className="text-sm text-muted-foreground">{product.warrantyInfo}</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <footer className="gradient-dark text-white py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="font-display font-bold text-2xl mb-2">MotorBuy</div>
          <p className="text-white/50 text-sm">Kuwait's premier auto parts marketplace</p>
        </div>
      </footer>
    </div>
  );
}
