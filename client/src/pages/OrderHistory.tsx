import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-motorbuy";
import { useLanguage } from "@/lib/i18n";
import { Package, ShoppingBag, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatKWD } from "@/lib/currency";
import { useEffect } from "react";

export default function OrderHistory() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: orders, isLoading: isOrdersLoading } = useOrders();
  const [, setLocation] = useLocation();
  const { t, isRTL, language } = useLanguage();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <Link href="/account">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-account">
              <BackIcon className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t("orders.backToAccount")}
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold mb-2">{t("orders.title")}</h1>
          <p className="text-muted-foreground">{t("orders.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" /> {t("orders.yourOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isOrdersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">{t("orders.noOrders")}</p>
                <p className="text-sm mb-4">{t("orders.noOrdersDesc")}</p>
                <Link href="/products">
                  <Button data-testid="button-start-shopping">{t("orders.browseProducts")}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4" data-testid={`order-row-${order.id}`}>
                    <div className="flex-1">
                      <div className="font-medium text-lg">{t("orders.order")} #{order.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString(language === "ar" ? "ar-KW" : "en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        }) : "N/A"}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={isRTL ? "text-left" : "text-right"}>
                        <div className="font-bold text-lg">{formatKWD(order.total)}</div>
                      </div>
                      <Badge variant={
                        order.status === "delivered" ? "default" :
                        order.status === "shipped" ? "secondary" :
                        order.status === "cancelled" ? "destructive" : "outline"
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
