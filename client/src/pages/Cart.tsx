import { Navbar } from "@/components/Navbar";
import { LoadingPage } from "@/components/LoadingPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, useRemoveFromCart, useCreateOrder, useUpdateCartQuantity } from "@/hooks/use-motorbuy";
import { useLanguage } from "@/lib/i18n";
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Truck, CreditCard, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { formatKWD } from "@/lib/currency";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const { data: cartItems, isLoading, error } = useCart();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveFromCart();
  const { mutate: updateQuantity, isPending: isUpdating } = useUpdateCartQuantity();
  const { mutate: createOrder, isPending: isOrdering } = useCreateOrder();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t, isRTL } = useLanguage();

  // Redirect to auth if not authenticated
  if (!isAuthenticated && !isLoading) {
    setLocation("/auth");
    return null;
  }

  const total = cartItems?.reduce((sum, item) => {
    if (!item.product) return sum;
    return sum + (Number(item.product.price) * item.quantity);
  }, 0) || 0;

  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) {
      toast({ 
        title: t("cart.empty"), 
        description: t("cart.emptyDesc"), 
        variant: "destructive" 
      });
      return;
    }

    createOrder(undefined, {
      onSuccess: () => {
        toast({ 
          title: t("cart.orderPlaced"), 
          description: t("cart.orderPlacedDesc") 
        });
        setTimeout(() => {
          setLocation("/orders");
        }, 1000);
      },
      onError: (error: any) => {
        const message = error?.message || t("cart.checkoutSimDesc");
        toast({ 
          title: t("cart.checkoutSim") || "Checkout Error", 
          description: message, 
          variant: "destructive" 
        });
      }
    });
  };

  const handleRemoveItem = (itemId: string, productName: string) => {
    removeItem(itemId, {
      onSuccess: () => {
        toast({ 
          title: t("cart.itemRemoved") || "Item Removed", 
          description: `${productName} ${t("cart.removedFromCart") || "removed from cart"}` 
        });
      },
      onError: () => {
        toast({ 
          title: t("auth.error"), 
          description: t("cart.removeError") || "Failed to remove item", 
          variant: "destructive" 
        });
      }
    });
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      toast({ 
        title: t("cart.invalidQuantity") || "Invalid Quantity", 
        description: t("cart.quantityMustBePositive") || "Quantity must be at least 1", 
        variant: "destructive" 
      });
      return;
    }
    updateQuantity({ id: itemId, quantity: newQuantity }, {
      onError: () => {
        toast({ 
          title: t("auth.error"), 
          description: t("cart.updateError") || "Failed to update quantity", 
          variant: "destructive" 
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <LoadingPage message="Loading cart..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <div className="text-center py-24">
            <h2 className="text-2xl font-display font-bold mb-3">{t("auth.error")}</h2>
            <p className="text-muted-foreground mb-8">{String(error)}</p>
            <Link href="/products">
              <Button>{t("cart.startShopping")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">{t("cart.title")}</h1>
          <p className="text-muted-foreground">
            {cartItems && cartItems.length > 0
              ? `${cartItems.length} ${cartItems.length > 1 ? t("cart.items") : t("cart.item")}` 
              : t("cart.empty")}
          </p>
        </motion.div>

        {!cartItems || cartItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-card rounded-2xl border"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3">{t("cart.empty")}</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t("cart.emptyDesc")}
            </p>
            <Link href="/products">
              <Button size="lg" className="rounded-full px-8" data-testid="button-start-shopping">
                {t("cart.startShopping")} <ArrowIcon className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              {cartItems.map((item, index) => {
                if (!item.product) return null;
                
                return (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-3 md:gap-5 p-3 md:p-5 bg-card border rounded-xl md:rounded-2xl items-center hover:shadow-lg transition-shadow"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-muted to-muted/50 rounded-lg md:rounded-xl shrink-0 overflow-hidden">
                      <img 
                        src={item.product.images?.[0] || "https://placehold.co/100"} 
                        alt={item.product.name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product.id}`}>
                        <h3 className="font-display font-bold text-sm md:text-lg truncate hover:text-primary transition-colors cursor-pointer">
                          {item.product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              handleUpdateQuantity(item.id, qty);
                            }}
                            className="w-16 h-8 text-center border-0 focus-visible:ring-0"
                            disabled={isUpdating}
                            data-testid={`input-quantity-${item.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={isUpdating}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="font-bold text-base md:hidden mt-2">
                        {formatKWD(Number(item.product.price) * item.quantity)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <div className="font-bold text-xl hidden md:block">
                        {formatKWD(Number(item.product.price) * item.quantity)}
                      </div>
                      <div className="text-sm text-muted-foreground hidden md:block">
                        {formatKWD(item.product.price)} each
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 h-11 w-11"
                        onClick={() => handleRemoveItem(item.id, item.product.name)}
                        disabled={isRemoving}
                        data-testid={`button-remove-${item.id}`}
                      >
                        {isRemoving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="lg:col-span-1">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border rounded-2xl p-6 sticky top-24 shadow-lg"
              >
                <h3 className="font-display font-bold text-xl mb-6">{t("cart.orderSummary")}</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                    <span className="font-medium">{formatKWD(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("cart.shipping")}</span>
                    <span className="text-green-600 font-medium">{t("cart.free")}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-baseline">
                    <span className="font-bold text-lg">{t("cart.total")}</span>
                    <span className="font-bold text-2xl text-primary">{formatKWD(total)}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20" 
                  onClick={handleCheckout} 
                  disabled={isOrdering || cartItems.length === 0}
                  data-testid="button-checkout"
                >
                  {isOrdering ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5 mr-2" />
                      {t("cart.processing") || "Processing..."}
                    </>
                  ) : (
                    <>{t("cart.checkout")} <ArrowIcon className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} /></>
                  )}
                </Button>

                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <span>{t("cart.secureCheckout")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Truck className="w-5 h-5 text-primary" />
                    <span>{t("cart.freeShipping")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span>{t("cart.paymentOptions")}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      <footer className="gradient-dark text-white py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="font-display font-bold text-2xl mb-2">{t("brand.name")}</div>
          <p className="text-white/50 text-sm">{t("products.tagline")}</p>
        </div>
      </footer>
    </div>
  );
}
