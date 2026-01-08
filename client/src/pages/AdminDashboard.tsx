import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRole, useVendors, useProducts, useApproveVendor } from "@/hooks/use-motorbuy";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Users, Store, Package, Settings, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const [, setLocation] = useLocation();

  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  if (roleData?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage vendors, products, and platform settings.</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="vendors" className="gap-2">
              <Store className="w-4 h-4" /> Vendors
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorsTab />
          </TabsContent>

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function VendorsTab() {
  const { data: vendors, isLoading } = useVendors();
  const { mutate: approveVendor, isPending } = useApproveVendor();
  const { toast } = useToast();

  const handleApprove = (id: string, isApproved: boolean) => {
    approveVendor({ id, isApproved }, {
      onSuccess: () => {
        toast({ title: "Success", description: `Vendor ${isApproved ? "approved" : "disabled"}` });
      },
      onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5" /> Vendor Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!vendors || vendors.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No vendors registered yet.</p>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div 
                key={vendor.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
                data-testid={`vendor-row-${vendor.id}`}
              >
                <div>
                  <div className="font-semibold">{vendor.storeName}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">{vendor.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={vendor.isApproved ? "default" : "secondary"}>
                    {vendor.isApproved ? "Approved" : "Pending"}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Commission: {(Number(vendor.commissionRate) * 100).toFixed(0)}%
                  </div>
                  <div className="flex gap-2">
                    {!vendor.isApproved ? (
                      <Button 
                        size="sm" 
                        onClick={() => handleApprove(vendor.id, true)} 
                        disabled={isPending}
                        data-testid={`button-approve-${vendor.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleApprove(vendor.id, false)} 
                        disabled={isPending}
                        data-testid={`button-disable-${vendor.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Disable
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProductsTab() {
  const { data: products, isLoading } = useProducts();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" /> All Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!products || products.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No products listed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Vendor ID</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b" data-testid={`product-row-${product.id}`}>
                    <td className="py-3">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.brand}</div>
                    </td>
                    <td className="py-3">${Number(product.price).toFixed(2)}</td>
                    <td className="py-3">
                      <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>
                        {product.stock}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">#{product.vendorId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface UserWithRole {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

function UsersTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: users, isLoading } = useQuery<UserWithRole[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("POST", "/api/admin/users/role", { userId, role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User role updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleRoleChange = (userId: string, role: string) => {
    assignRoleMutation.mutate({ userId, role });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" /> User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!users || users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No users found.</p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
                data-testid={`user-row-${user.id}`}
              >
                <div>
                  <div className="font-semibold">
                    {user.firstName || user.lastName ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "User"}
                  </div>
                  <div className="text-sm text-muted-foreground">{user.email || user.id}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                    {user.role}
                  </Badge>
                  <div className="flex gap-1">
                    {["customer", "vendor", "admin"].map((role) => (
                      <Button
                        key={role}
                        size="sm"
                        variant={user.role === role ? "default" : "outline"}
                        onClick={() => handleRoleChange(user.id, role)}
                        disabled={assignRoleMutation.isPending}
                        className="capitalize text-xs"
                        data-testid={`button-assign-${role}-${user.id}`}
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" /> Platform Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Commission Rate</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Default commission rate applied to new vendors. Individual rates can be adjusted per vendor.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">5%</span>
            <Badge variant="secondary">Default</Badge>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Payment Gateway</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Payment processing is ready for integration. Configure your gateway credentials in environment variables.
          </p>
          <Badge variant="outline">Ready for Integration</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
