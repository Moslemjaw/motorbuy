import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart, useRemoveFromCart, useCreateOrder } from "@/hooks/use-motorbuy";
import { Trash2, ShoppingBag, ArrowRight, Loader2, ShieldCheck, Truck, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { formatKWD } from "@/lib/currency";
import { motion } from "framer-motion";

export default function Cart() {
  const { data: cartItems, isLoading } = useCart();
  const { mutate: removeItem } = useRemoveFromCart();
  const { mutate: createOrder, isPending: isOrdering } = useCreateOrder();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const total = cartItems?.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0) || 0;

  const handleCheckout = () => {
    createOrder(undefined, {
      onSuccess: () => {
        toast({ title: "Order Placed!", description: "Your parts are on the way." });
        setLocation("/account");
      },
      onError: () => {
        toast({ title: "Checkout Simulation", description: "Order placement logic would go here." });
      }
    });
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin w-10 h-10 text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {cartItems?.length ? `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in your cart` : 'Your cart is empty'}
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
            <h2 className="text-2xl font-display font-bold mb-3">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Looks like you haven't added any parts yet. Start exploring our collection!
            </p>
            <Link href="/products">
              <Button size="lg" className="rounded-full px-8" data-testid="button-start-shopping">
                Start Shopping <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-5 p-5 bg-card border rounded-2xl items-center hover:shadow-lg transition-shadow"
                  data-testid={`cart-item-${item.id}`}
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-xl shrink-0 overflow-hidden">
                    <img 
                      src={item.product.images?.[0] || "https://placehold.co/100"} 
                      alt={item.product.name}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg truncate">{item.product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">Qty: {item.quantity}</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-xl mb-2">{formatKWD(Number(item.product.price) * item.quantity)}</div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item.id)}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="lg:col-span-1">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border rounded-2xl p-6 sticky top-24 shadow-lg"
              >
                <h3 className="font-display font-bold text-xl mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatKWD(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-baseline">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-2xl text-primary">{formatKWD(total)}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20" 
                  onClick={handleCheckout} 
                  disabled={isOrdering}
                  data-testid="button-checkout"
                >
                  {isOrdering ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </Button>

                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Truck className="w-5 h-5 text-primary" />
                    <span>Free shipping on all orders</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span>Multiple payment options</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
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
