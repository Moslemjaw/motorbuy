import { Product, Vendor } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAddToCart } from "@/hooks/use-motorbuy";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Percent } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatKWD } from "@/lib/currency";

interface ProductCardProps {
  product: Product & { vendor?: Vendor };
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCartMutation = useAddToCart();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Quick check - if we know user is not authenticated, redirect to auth page
    if (!isAuthLoading && !isAuthenticated && !user) {
      toast({ 
        title: t("product.pleaseLogin") || "Please login", 
        description: t("product.loginRequired") || "You need to be logged in to add items to cart", 
        variant: "destructive" 
      });
      setLocation("/auth");
      return;
    }
    
    addToCartMutation.mutate({ productId: product.id, quantity: 1 }, {
      onSuccess: () => {
        toast({ title: t("product.addedToCart"), description: `${product.name} ${t("product.addedToCartDesc")}` });
      },
      onError: (err: Error) => {
        // Show appropriate error message and redirect to auth
        if (err.message.includes("login") || err.message.includes("authenticated") || err.message.includes("401")) {
          toast({ 
            title: t("product.pleaseLogin") || "Please login", 
            description: t("product.loginRequired") || "You need to be logged in to add items to cart", 
            variant: "destructive" 
          });
          setLocation("/auth");
        } else {
          toast({ title: t("auth.error"), description: err.message, variant: "destructive" });
        }
      }
    });
  };
  
  const isPending = addToCartMutation.isPending;
  const mainImage = product.images?.[0] || "https://placehold.co/600x400?text=No+Image";

  const currentPrice = parseFloat(product.price) || 0;
  const comparePrice = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  const hasDiscount = comparePrice !== null && !isNaN(comparePrice) && comparePrice > currentPrice && currentPrice > 0;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100) : 0;

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-border bg-card">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          <img 
            src={mainImage} 
            alt={product.name} 
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-lg px-4 py-2 bg-destructive/80 rounded-full">{t("common.outOfStock")}</span>
            </div>
          )}
          
          {hasDiscount && (
            <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'}`}>
              <Badge className="bg-red-500 text-white font-bold shadow-lg border-0 gap-1">
                <Percent className="w-3 h-3" />
                {t("product.off").replace("{percent}", String(discountPercent))}
              </Badge>
            </div>
          )}
          
          <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} flex flex-col items-end gap-1`}>
            <Badge className="bg-white/90 text-foreground font-bold shadow-lg backdrop-blur-sm">
              {formatKWD(product.price)}
            </Badge>
            {hasDiscount && (
              <Badge variant="secondary" className="bg-white/70 text-muted-foreground font-normal line-through text-xs">
                {formatKWD(product.compareAtPrice!)}
              </Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-3 md:p-5">
          <h3 className="font-display font-bold text-base md:text-lg line-clamp-1 group-hover:text-primary transition-colors mb-1 md:mb-2">
            {product.name}
          </h3>
          
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-3 md:mb-4 leading-relaxed">
            {product.description}
          </p>
          
          {product.vendor && (
            <div className="text-xs text-muted-foreground flex items-center gap-2 pb-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                {product.vendor.storeName?.[0]}
              </div>
              <span className="font-medium text-foreground">{product.vendor.storeName}</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-3 md:p-5 pt-0">
          <Button 
            className="w-full gap-2 rounded-xl h-10 md:h-11 text-sm md:text-base shadow-md shadow-primary/10" 
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || isPending}
            data-testid={`button-add-cart-${product.id}`}
          >
            <ShoppingCart className="w-4 h-4" />
            {isPending ? t("product.adding") : t("common.addToCart")}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
