import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useOrders, useRole, useCreateVendor } from "@/hooks/use-motorbuy";
import { User, Package, ShoppingBag, Store, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Account() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const { data: orders, isLoading: isOrdersLoading } = useOrders();
  const [, setLocation] = useLocation();

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

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your profile, orders, and settings.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary text-2xl font-bold">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
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

            <Button variant="outline" className="w-full" onClick={() => logout()}>
              Logout
            </Button>
          </CardContent>
        </Card>

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
                  <Button variant="outline" className="mt-4">Start Shopping</Button>
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
                      <div className="font-bold">${Number(order.total).toFixed(2)}</div>
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

        {roleData?.role === "customer" && <BecomeVendorCard />}

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
                <Button className="w-full">Go to Dashboard</Button>
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
                <Button className="w-full">Go to Admin Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function BecomeVendorCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const { mutate: createVendor, isPending } = useCreateVendor();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!storeName.trim() || !description.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    createVendor({ storeName, description }, {
      onSuccess: () => {
        setIsOpen(false);
        toast({ title: "Application Submitted", description: "Your vendor application is pending approval." });
      },
      onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5" /> Become a Vendor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Start selling car parts on MotorBuy. Apply to become a vendor today.
        </p>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" data-testid="button-become-vendor">Apply Now</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vendor Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                placeholder="Store Name" 
                value={storeName} 
                onChange={(e) => setStoreName(e.target.value)}
                data-testid="input-store-name"
              />
              <Textarea 
                placeholder="Tell us about your business..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-store-description"
              />
              <Button 
                className="w-full" 
                onClick={handleSubmit} 
                disabled={isPending}
                data-testid="button-submit-vendor"
              >
                {isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
