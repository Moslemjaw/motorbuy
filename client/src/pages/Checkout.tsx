import { Navbar } from "@/components/Navbar";
import { LoadingPage } from "@/components/LoadingPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCart, useCreateOrder } from "@/hooks/use-motorbuy";
import { useLanguage } from "@/lib/i18n";
import { ShoppingBag, Loader2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { formatKWD } from "@/lib/currency";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { buildApiUrl } from "@/lib/api-config";

export default function Checkout() {
  const { isAuthenticated, user } = useAuth();
  const { data: cartItems, isLoading: isCartLoading } = useCart();
  const { mutate: createOrder, isPending: isOrdering } = useCreateOrder();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
  });

  // Redirect to auth if not authenticated
  if (!isAuthenticated && !isCartLoading) {
    setLocation("/auth");
    return null;
  }

  // Filter out items without products (deleted products)
  const validCartItems = cartItems?.filter(item => item.product && item.product.id) || [];
  
  const total = validCartItems.reduce((sum, item) => {
    if (!item.product || !item.product.price) return sum;
    return sum + (Number(item.product.price) * item.quantity);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (validCartItems.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Add items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create order with customer information
      const res = await fetch(buildApiUrl(api.orders.create.path), {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          customerCity: formData.city,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create order");
      }

      const order = await res.json();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.cart.get.path] });

      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been received and will be processed soon.",
      });

      setTimeout(() => {
        setLocation("/orders");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    }
  };

  if (isCartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <LoadingPage message="Loading checkout..." />
      </div>
    );
  }

  if (validCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <div className="text-center py-24">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display font-bold mb-3">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Add items to your cart before checkout</p>
            <Link href="/products">
              <Button>Continue Shopping</Button>
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
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your order</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8 rounded-2xl shadow-xl border-2 border-primary/10">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl">Shipping Information</CardTitle>
                <CardDescription>Please provide your delivery details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                      disabled={isOrdering}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                      disabled={isOrdering}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+965 1234 5678"
                      required
                      disabled={isOrdering}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street address, Building number"
                      required
                      disabled={isOrdering}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Kuwait City"
                      required
                      disabled={isOrdering}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20 mt-6" 
                    disabled={isOrdering}
                  >
                    {isOrdering ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5 mr-2" />
                        Processing Order...
                      </>
                    ) : (
                      <>
                        Place Order <ArrowIcon className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 rounded-2xl shadow-xl border-2 border-primary/10 sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {validCartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product.name}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-medium ml-4">
                        {formatKWD(Number(item.product.price) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

