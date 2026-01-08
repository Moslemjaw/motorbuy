import { Product, Vendor } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAddToCart } from "@/hooks/use-motorbuy";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ProductCardProps {
  product: Product & { vendor?: Vendor };
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCartMutation = useAddToCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
        toast({ title: "Please login", description: "You need to be logged in to add items to cart", variant: "destructive" });
        return;
    }
    
    addToCartMutation.mutate({ productId: product.id, quantity: 1 }, {
      onSuccess: () => {
        toast({ title: "Added to cart", description: `${product.name} added to your cart` });
      },
      onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };
  
  const isPending = addToCartMutation.isPending;

  const mainImage = product.images?.[0] || "https://placehold.co/600x400?text=No+Image";

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 bg-card">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img 
            src={mainImage} 
            alt={product.name} 
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <Badge variant="secondary" className="font-mono ml-2 shrink-0">
              ${Number(product.price).toFixed(2)}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>
          
          {product.vendor && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span>Sold by</span>
              <span className="font-medium text-foreground">{product.vendor.storeName}</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full gap-2" 
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || isPending}
          >
            <ShoppingCart className="w-4 h-4" />
            {isPending ? "Adding..." : "Add to Cart"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
