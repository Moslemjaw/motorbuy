import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useOrders, useRole } from "@/hooks/use-motorbuy";
import { User, Package, ShoppingBag, Store, Loader2, Settings, Phone, MapPin, Mail, Camera } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKWD } from "@/lib/currency";

export default function Account() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const { data: orders, isLoading: isOrdersLoading } = useOrders();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  if (isAuthLoading || isRoleLoading) {
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

  const handleSaveSettings = () => {
    toast({ 
      title: "Settings Saved", 
      description: "Your account settings have been updated successfully." 
    });
  };

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your profile, orders, and settings.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary text-3xl font-bold">
                  {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                </div>
                <button 
                  className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg"
                  data-testid="button-change-photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <div className="font-semibold text-lg">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge variant="secondary">{roleData?.role || "customer"}</Badge>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => logout()} data-testid="button-logout">
              Logout
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input 
                id="email" 
                value={user.email || ""} 
                disabled 
                className="bg-muted"
                data-testid="input-email"
              />
              <p className="text-xs text-muted-foreground">Email is managed by your Replit account</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" /> Phone Number
              </Label>
              <Input 
                id="phone" 
                placeholder="+965 XXXX XXXX" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" /> Address
              </Label>
              <Input 
                id="address" 
                placeholder="Street address" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                data-testid="input-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-2 text-sm">
                City / Area
              </Label>
              <Input 
                id="city" 
                placeholder="e.g., Salmiya, Kuwait City" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                data-testid="input-city"
              />
            </div>

            <Button className="w-full" onClick={handleSaveSettings} data-testid="button-save-settings">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {roleData?.role !== "vendor" && (
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" /> Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOrdersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin" />
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No orders yet.</p>
                  <Link href="/products">
                    <Button variant="outline" className="mt-4" data-testid="button-start-shopping">Start Shopping</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`order-row-${order.id}`}>
                      <div>
                        <div className="font-medium">Order #{order.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatKWD(order.total)}</div>
                        <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {roleData?.role === "vendor" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" /> Vendor Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your products and view orders from your vendor dashboard.
              </p>
              <Link href="/vendor-dashboard">
                <Button className="w-full" data-testid="button-vendor-dashboard">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {roleData?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" /> Admin Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage vendors, users, and platform settings.
              </p>
              <Link href="/admin">
                <Button className="w-full" data-testid="button-admin-dashboard">Go to Admin Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
