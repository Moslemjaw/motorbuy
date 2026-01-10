import { Navbar } from "@/components/Navbar";
import { LoadingPage } from "@/components/LoadingPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart, useCreateOrder } from "@/hooks/use-motorbuy";
import { useLanguage } from "@/lib/i18n";
import { ShoppingBag, Loader2, ArrowRight, ArrowLeft, CheckCircle, CreditCard, Banknote } from "lucide-react";
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

  const [isSuccess, setIsSuccess] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
  });

  const [paymentMethod, setPaymentMethod] = useState("pay-in-store");

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
        title: t("checkout.missingInfo"),
        description: t("checkout.missingInfoDesc"),
        variant: "destructive",
      });
      return;
    }

    if (validCartItems.length === 0) {
      toast({
        title: t("checkout.cartEmpty"),
        description: t("checkout.cartEmptyDesc"),
        variant: "destructive",
      });
      return;
    }

    try {
      // Create order with customer information and payment method
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
          paymentMethod: paymentMethod,
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

      setSuccessOrder(order);
      setIsSuccess(true);
      window.scrollTo(0, 0);

    } catch (error: any) {
      toast({
        title: t("checkout.checkoutError"),
        description: error.message || t("checkout.failedToPlaceOrder"),
        variant: "destructive",
      });
    }
  };

  if (isCartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <LoadingPage message={t("checkout.loading")} />
      </div>
    );
  }

  if (isSuccess && successOrder) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center space-y-8"
          >
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-display font-bold text-green-600 dark:text-green-400">
              {t("checkout.orderPlacedSuccess")}
            </h1>
            
            <p className="text-muted-foreground text-lg">
              {t("checkout.orderPlacedDesc")}
            </p>

            <Card className={`${isRTL ? 'text-right' : 'text-left'} border-2 border-green-100 dark:border-green-900/30`}>
              <CardHeader>
                <CardTitle>{t("checkout.orderDetails")}</CardTitle>
                <CardDescription>{t("common.order")} #{successOrder.id.slice(-8)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex justify-between border-b pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-muted-foreground">{t("checkout.totalAmount")}</span>
                  <span className="font-bold text-lg">{formatKWD(successOrder.total)}</span>
                </div>
                <div className={`flex justify-between border-b pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-muted-foreground">{t("checkout.paymentMethodLabel")}</span>
                  <span className="font-medium capitalize">
                    {successOrder.paymentMethod === 'pay-in-store' ? t("checkout.payInStore") : t("checkout.onlinePayment")}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block mb-1">{t("checkout.shippingTo")}</span>
                  <p className="font-medium">{successOrder.customerName || successOrder.guestName}</p>
                  <p>{successOrder.customerAddress}</p>
                  <p>{successOrder.customerCity}</p>
                  <p>{successOrder.customerPhone || successOrder.guestPhone}</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {t("checkout.continueShopping")}
                </Button>
              </Link>
              <Link href="/orders">
                <Button size="lg" className="w-full sm:w-auto">
                  {t("checkout.viewMyOrders")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
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
            <h2 className="text-2xl font-display font-bold mb-3">{t("checkout.yourCartEmpty")}</h2>
            <p className="text-muted-foreground mb-8">{t("checkout.addItemsBeforeCheckout")}</p>
            <Link href="/products">
              <Button>{t("checkout.continueShopping")}</Button>
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
          className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}
        >
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">{t("checkout.title")}</h1>
          <p className="text-muted-foreground">{t("checkout.completeOrder")}</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 md:p-8 rounded-2xl shadow-xl border-2 border-primary/10">
              <CardHeader className={`pb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                <CardTitle className="text-2xl">{t("checkout.shippingInfo")}</CardTitle>
                <CardDescription>{t("checkout.shippingInfoDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className={isRTL ? 'text-right' : 'text-left'}>
                      {t("checkout.fullName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={isRTL ? "أحمد محمد" : "John Doe"}
                      required
                      disabled={isOrdering}
                      dir={isRTL ? "rtl" : "ltr"}
                      className={isRTL ? "text-right" : "text-left"}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email" className={isRTL ? 'text-right' : 'text-left'}>
                      {t("checkout.email")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={isRTL ? "ahmed@example.com" : "john@example.com"}
                      required
                      disabled={isOrdering}
                      dir="ltr"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone" className={isRTL ? 'text-right' : 'text-left'}>
                      {t("checkout.phone")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+965 1234 5678"
                      required
                      disabled={isOrdering}
                      dir="ltr"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address" className={isRTL ? 'text-right' : 'text-left'}>
                      {t("checkout.address")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder={isRTL ? "عنوان الشارع، رقم المبنى" : "Street address, Building number"}
                      required
                      disabled={isOrdering}
                      dir={isRTL ? "rtl" : "ltr"}
                      className={isRTL ? "text-right" : "text-left"}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="city" className={isRTL ? 'text-right' : 'text-left'}>
                      {t("checkout.city")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder={isRTL ? "مدينة الكويت" : "Kuwait City"}
                      required
                      disabled={isOrdering}
                      dir={isRTL ? "rtl" : "ltr"}
                      className={isRTL ? "text-right" : "text-left"}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="p-6 md:p-8 rounded-2xl shadow-xl border-2 border-primary/10">
              <CardHeader className={`pb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                <CardTitle className="text-2xl">{t("checkout.paymentMethod")}</CardTitle>
                <CardDescription>{t("checkout.paymentMethodDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="pay-in-store" id="pay-in-store" className="peer sr-only" />
                    <Label
                      htmlFor="pay-in-store"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                    >
                      <Banknote className="mb-3 h-6 w-6" />
                      <span className="font-semibold">{t("checkout.payInStore")}</span>
                      <span className="text-xs text-muted-foreground mt-1">{t("checkout.payWhenReceive")}</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="gateway" id="gateway" className="peer sr-only" />
                    <Label
                      htmlFor="gateway"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                    >
                      <CreditCard className="mb-3 h-6 w-6" />
                      <span className="font-semibold">{t("checkout.onlinePayment")}</span>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 rounded-2xl shadow-xl border-2 border-primary/10 sticky top-24">
              <CardHeader className={`pb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <CardTitle className="text-xl">{t("checkout.orderSummary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {validCartItems.map((item) => (
                    <div key={item.id} className={`flex justify-between items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right ml-4' : 'text-left'}`}>
                        <p className="font-medium truncate">{item.product.name}</p>
                        <p className="text-muted-foreground">{t("cart.qty")}: {item.quantity}</p>
                      </div>
                      <div className={`font-medium ${isRTL ? 'mr-4' : 'ml-4'}`}>
                        {formatKWD(Number(item.product.price) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-muted-foreground">{t("checkout.subtotal")}</span>
                    <span className="font-medium">{formatKWD(total)}</span>
                  </div>
                  <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-muted-foreground">{t("checkout.shipping")}</span>
                    <span className="text-green-600 font-medium">{t("checkout.free")}</span>
                  </div>
                  <div className={`border-t pt-4 flex justify-between items-baseline ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="font-bold text-lg">{t("checkout.total")}</span>
                    <span className="font-bold text-2xl text-primary">{formatKWD(total)}</span>
                  </div>
                </div>

                <Button 
                  type="submit"
                  form="checkout-form"
                  className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20 mt-6" 
                  disabled={isOrdering}
                >
                  {isOrdering ? (
                    <>
                      <Loader2 className={`animate-spin w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t("checkout.processingOrder")}
                    </>
                  ) : (
                    <>
                      {t("checkout.placeOrder")} <ArrowIcon className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
