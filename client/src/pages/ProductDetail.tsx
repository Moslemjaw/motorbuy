import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProduct, useAddToCart } from "@/hooks/use-motorbuy";
import { useRoute } from "wouter";
import { ShoppingCart, Truck, ShieldCheck, ArrowLeft, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { formatKWD } from "@/lib/currency";

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

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="min-h-screen bg-background flex items-center justify-center">Product not found</div>;

  const mainImage = product.images?.[0] || "https://placehold.co/800x600?text=No+Image";

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
        </Link>
        
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-muted rounded-2xl overflow-hidden border border-border">
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {/* Future: Thumbnail gallery here */}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-primary font-medium px-3 py-1">
                In Stock: {product.stock}
              </Badge>
              {product.categoryId && (
                <Badge variant="outline" className="text-muted-foreground">
                  Category #{product.categoryId}
                </Badge>
              )}
            </div>

            <h1 className="text-4xl font-display font-bold mb-2">{product.name}</h1>
            <div className="text-3xl font-bold text-primary mb-6">
              {formatKWD(product.price)}
            </div>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {product.description}
            </p>

            <div className="flex gap-4 mb-8 pb-8 border-b border-border">
              <Button size="lg" className="w-full h-14 text-lg rounded-xl gap-2" onClick={handleAddToCart} disabled={isPending || product.stock <= 0}>
                <ShoppingCart className="w-5 h-5" />
                {isPending ? "Adding..." : "Add to Cart"}
              </Button>
            </div>

            {/* Meta */}
            <div className="grid gap-6">
              {product.vendorId && (
                <div className="flex items-center gap-4 bg-accent/20 p-4 rounded-xl">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Sold by</div>
                    <div className="font-bold text-lg">Vendor #{product.vendorId}</div>
                  </div>
                  <Link href={`/vendors/${product.vendorId}`} className="ml-auto">
                    <Button variant="ghost" size="sm">Visit Shop</Button>
                  </Link>
                </div>
              )}

              <div className="flex gap-8 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="w-5 h-5 text-primary" />
                  <span>Fast Shipping</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
