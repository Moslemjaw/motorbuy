import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { Link, useLocation } from "wouter";
import { ShoppingBag, ArrowRight, ArrowLeft, Loader2, ShieldCheck, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatKWD } from "@/lib/currency";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import carLogo from "@assets/image_2026-01-09_142631252-removebg-preview_1767958016384.png";

interface GuestCartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  image?: string;
}

export default function GuestCheckout() {
  const { t, isRTL, language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
  });

  const [cartItems, setCartItems] = useState<GuestCartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("guestCart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse guest cart");
      }
    }
  }, []);

  const total = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast({ title: t("cart.empty"), variant: "destructive" });
      return;
    }

    if (!formData.email) {
      toast({ title: t("auth.error"), description: t("guest.emailRequired"), variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/orders/guest", {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        guestEmail: formData.email,
        guestName: formData.name,
        guestPhone: formData.phone,
      });

      localStorage.removeItem("guestCart");
      setOrderComplete(true);
      toast({ title: t("cart.orderPlaced"), description: t("cart.orderPlacedDesc") });
    } catch (error) {
      toast({ title: t("auth.error"), description: t("auth.genericError"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-4">{t("guest.orderSuccess")}</h1>
            <p className="text-muted-foreground mb-8">{t("guest.orderSuccessDesc")}</p>
            <Link href="/products">
              <Button size="lg" className="rounded-full px-8">
                {t("cart.startShopping")} <ArrowIcon className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-card rounded-2xl border max-w-lg mx-auto"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3">{t("cart.empty")}</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto px-4">
              {t("cart.emptyDesc")}
            </p>
            <Link href="/products">
              <Button size="lg" className="rounded-full px-8" data-testid="button-start-shopping">
                {t("cart.startShopping")} <ArrowIcon className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="inline-flex items-center gap-2 font-display font-bold text-2xl mb-4 cursor-pointer">
              <img src={carLogo} alt="MotorBuy" className="w-12 h-12 object-contain" />
              {language === "ar" ? (
                <span>
                  <span className="text-[hsl(var(--logo-accent))]">موتور</span>
                  <span className="text-primary">باي</span>
                </span>
              ) : (
                <span>
                  <span className="text-primary">motor</span>
                  <span className="text-[hsl(var(--logo-accent))]">buy</span>
                </span>
              )}
            </span>
          </Link>
          <h1 className="text-3xl font-display font-bold mb-2">{t("auth.guestCheckout")}</h1>
          <p className="text-muted-foreground">{t("auth.guestCheckoutDesc")}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{t("guest.contactInfo")}</CardTitle>
              <CardDescription>{t("guest.contactInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")} *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-guest-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{t("guest.fullName")}</Label>
                  <Input
                    id="name"
                    placeholder={isRTL ? "الاسم الكامل" : "Full name"}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="input-guest-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("account.phone")}</Label>
                  <Input
                    id="phone"
                    placeholder="+965 XXXX XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-guest-phone"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg rounded-xl" 
                  disabled={isSubmitting}
                  data-testid="button-place-order"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>{t("guest.placeOrder")} <ArrowIcon className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} /></>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>{t("cart.secureCheckout")}</span>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("cart.orderSummary")}</CardTitle>
              <CardDescription>{cartItems.length} {cartItems.length > 1 ? t("cart.items") : t("cart.item")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex gap-3 items-center">
                    <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden shrink-0">
                      <img 
                        src={item.image || "https://placehold.co/50"} 
                        alt={item.name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{t("cart.qty")}: {item.quantity}</Badge>
                      </div>
                    </div>
                    <div className="font-bold text-sm">{formatKWD(Number(item.price) * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                  <span className="font-medium">{formatKWD(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("cart.shipping")}</span>
                  <span className="text-green-600 font-medium">{t("cart.free")}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-lg">{t("cart.total")}</span>
                  <span className="font-bold text-2xl text-primary">{formatKWD(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground mb-2">{t("guest.haveAccount")}</p>
          <Link href="/auth">
            <Button variant="ghost">{t("auth.signIn")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
