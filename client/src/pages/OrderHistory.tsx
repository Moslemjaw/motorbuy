import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-motorbuy";
import { Package, ShoppingBag, Loader2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatKWD } from "@/lib/currency";

export default function OrderHistory() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: orders, isLoading: isOrdersLoading } = useOrders();
  const [, setLocation] = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <Link href="/account">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-account">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Account
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold mb-2">Order History</h1>
          <p className="text-muted-foreground">View all your past orders and their status.</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" /> Your Orders
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
                <p className="text-lg mb-2">No orders yet</p>
                <p className="text-sm mb-4">Start shopping to see your orders here.</p>
                <Link href="/products">
                  <Button data-testid="button-start-shopping">Browse Products</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4" data-testid={`order-row-${order.id}`}>
                    <div className="flex-1">
                      <div className="font-medium text-lg">Order #{order.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        }) : "N/A"}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
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
