import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRole, useVendors } from "@/hooks/use-motorbuy";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  Store,
  DollarSign,
  Bell,
  CheckCircle,
  Loader2,
  Pencil,
  X,
  Save,
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Package,
  FolderOpen,
  Plus,
  Trash2,
  UserCog,
  BookOpen,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { Vendor } from "@shared/schema";
import { buildApiUrl } from "@/lib/api-config";

interface VendorFinancials extends Vendor {
  hasPendingRequest: boolean;
  pendingRequestAmount: string | null;
  pendingRequestId: string | null;
}

interface PayoutRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: string;
  status: string;
  createdAt: string;
}

interface Analytics {
  totalRevenue: string;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalVendors: number;
  totalCategories: number;
  salesByCategory: Record<string, number>;
  salesByVendor: Record<string, number>;
  recentOrders: any[];
}

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isAuthLoading, setLocation]);

  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
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
    <div className="min-h-screen bg-muted/30 font-body pb-20">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your marketplace
          </p>
        </div>

        <TopSummaryCards />

        <Tabs defaultValue="analytics" className="space-y-6 mt-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-1 h-auto p-1">
            <TabsTrigger
              value="analytics"
              className="gap-2 py-2"
              data-testid="tab-analytics"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger
              value="vendors"
              className="gap-2 py-2"
              data-testid="tab-vendors"
            >
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Vendors</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="gap-2 py-2"
              data-testid="tab-users"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="gap-2 py-2"
              data-testid="tab-categories"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger
              value="spotlights"
              className="gap-2 py-2"
              data-testid="tab-spotlights"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Spotlights</span>
            </TabsTrigger>
            <TabsTrigger
              value="payouts"
              className="gap-2 py-2"
              data-testid="tab-payouts"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Payouts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsSection />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorSection />
          </TabsContent>

          <TabsContent value="users">
            <UsersSection />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesSection />
          </TabsContent>

          <TabsContent value="spotlights">
            <SpotlightsSection />
          </TabsContent>

          <TabsContent value="payouts">
            <PayoutsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TopSummaryCards() {
  const { data: vendors } = useQuery<VendorFinancials[]>({
    queryKey: ["/api/admin/vendors/financials"],
  });
  const { data: payoutRequests } = useQuery<PayoutRequest[]>({
    queryKey: ["/api/admin/payout-requests"],
  });
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/admin/analytics"],
  });

  const totalVendors = vendors?.length || 0;
  const approvedVendors = vendors?.filter((v) => v.isApproved).length || 0;
  const pendingPayouts = payoutRequests?.length || 0;
  const totalPendingAmount =
    vendors?.reduce(
      (sum, v) => sum + parseFloat(v.pendingPayoutKwd || "0"),
      0
    ) || 0;
  const totalUsers = analytics?.totalUsers || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Store className="w-5 h-5 text-white" />
            </div>
          </div>
          <p
            className="text-2xl md:text-3xl font-bold text-amber-700 dark:text-amber-300"
            data-testid="text-total-vendors"
          >
            {totalVendors}
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Vendors ({approvedVendors} approved)
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
          </div>
          <p
            className="text-2xl md:text-3xl font-bold text-red-700 dark:text-red-300"
            data-testid="text-payout-requests"
          >
            {pendingPayouts}
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Payout Requests
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p
            className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-300"
            data-testid="text-pending-payouts"
          >
            {totalPendingAmount.toFixed(3)}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Pending (KWD)
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <p
            className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300"
            data-testid="text-total-users"
          >
            {totalUsers}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">Users</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsSection() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/admin/analytics"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Failed to load analytics.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="font-bold text-lg">
                  {analytics.totalRevenue} KWD
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="font-bold text-lg">{analytics.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Products</p>
                <p className="font-bold text-lg">{analytics.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Store className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendors</p>
                <p className="font-bold text-lg">{analytics.totalVendors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Users</p>
                <p className="font-bold text-lg">{analytics.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <FolderOpen className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Categories</p>
                <p className="font-bold text-lg">{analytics.totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No orders yet.
            </p>
          ) : (
            <div className="space-y-2">
              {analytics.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">Order #{order.id.slice(-8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{order.total} KWD</p>
                    <Badge
                      variant={
                        order.status === "paid" ? "default" : "secondary"
                      }
                    >
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
  );
}

function VendorSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [commissionType, setCommissionType] = useState<string>("percentage");
  const [commissionValue, setCommissionValue] = useState<string>("");

  const { data: vendors, isLoading } = useQuery<VendorFinancials[]>({
    queryKey: ["/api/admin/vendors/financials"],
  });

  const createVendorMutation = useMutation({
    mutationFn: async (data: { storeName: string; description: string }) => {
      const res = await apiRequest("POST", "/api/admin/vendors", data);
      if (!res.ok) throw new Error("Failed to create vendor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/vendors/financials"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      setShowCreateForm(false);
      setNewStoreName("");
      setNewDescription("");
      toast({ title: "Success", description: "Vendor created successfully" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async ({
      vendorId,
      commissionType,
      commissionValue,
    }: {
      vendorId: string;
      commissionType: string;
      commissionValue: string;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/vendors/${vendorId}/commission`,
        { commissionType, commissionValue }
      );
      if (!res.ok) throw new Error("Failed to update commission");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/vendors/financials"],
      });
      setEditingVendor(null);
      toast({ title: "Success", description: "Commission updated" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const payVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/vendors/${vendorId}/payout`,
        {}
      );
      if (!res.ok) throw new Error("Failed to process payout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/vendors/financials"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/payout-requests"],
      });
      toast({ title: "Success", description: "Payout processed" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const startEditing = (vendor: VendorFinancials) => {
    setEditingVendor(vendor.id);
    setCommissionType(vendor.commissionType || "percentage");
    setCommissionValue(vendor.commissionValue || "5");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-semibold">Vendor Management</h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          data-testid="button-add-vendor"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Store name"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              data-testid="input-vendor-name"
            />
            <Input
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              data-testid="input-vendor-description"
            />
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  createVendorMutation.mutate({
                    storeName: newStoreName,
                    description: newDescription,
                  })
                }
                disabled={!newStoreName || createVendorMutation.isPending}
                data-testid="button-save-vendor"
              >
                {createVendorMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Create Vendor
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {!vendors || vendors.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No vendors registered yet.
            </p>
          ) : (
            <div className="divide-y">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="p-4 md:p-6"
                  data-testid={`vendor-row-${vendor.id}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Store className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-base truncate">
                            {vendor.storeName}
                          </h3>
                          <Badge
                            variant={
                              vendor.isApproved ? "default" : "secondary"
                            }
                          >
                            {vendor.isApproved ? "Approved" : "Pending"}
                          </Badge>
                          {vendor.hasPendingRequest && (
                            <Badge variant="destructive">Payout Request</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {vendor.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          Commission
                        </div>
                        {editingVendor === vendor.id ? (
                          <div className="flex items-center gap-1 justify-center">
                            <Select
                              value={commissionType}
                              onValueChange={setCommissionType}
                            >
                              <SelectTrigger className="w-16 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">%</SelectItem>
                                <SelectItem value="fixed">KWD</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={commissionValue}
                              onChange={(e) =>
                                setCommissionValue(e.target.value)
                              }
                              className="w-14 h-8 text-xs"
                              min="0"
                              step="0.01"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() =>
                                updateCommissionMutation.mutate({
                                  vendorId: vendor.id,
                                  commissionType,
                                  commissionValue,
                                })
                              }
                              disabled={updateCommissionMutation.isPending}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setEditingVendor(null)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-semibold text-sm">
                              {vendor.commissionValue || "5"}
                              {vendor.commissionType === "fixed" ? " KWD" : "%"}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => startEditing(vendor)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          Gross Sales
                        </div>
                        <div className="font-semibold text-sm">
                          {parseFloat(vendor.grossSalesKwd || "0").toFixed(3)}
                          <span className="text-xs text-muted-foreground ml-1">
                            KWD
                          </span>
                        </div>
                      </div>

                      <div
                        className={`rounded-lg p-3 text-center ${
                          parseFloat(vendor.pendingPayoutKwd || "0") > 0
                            ? "bg-amber-100 dark:bg-amber-950/30"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          Pending
                        </div>
                        <div
                          className={`font-semibold text-sm ${
                            parseFloat(vendor.pendingPayoutKwd || "0") > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : ""
                          }`}
                        >
                          {parseFloat(vendor.pendingPayoutKwd || "0").toFixed(
                            3
                          )}
                          <span className="text-xs text-muted-foreground ml-1">
                            KWD
                          </span>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          Lifetime
                        </div>
                        <div className="font-semibold text-sm text-green-600 dark:text-green-400">
                          {parseFloat(vendor.lifetimePayoutsKwd || "0").toFixed(
                            3
                          )}
                          <span className="text-xs text-muted-foreground ml-1">
                            KWD
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end lg:justify-center">
                      <Button
                        onClick={() => payVendorMutation.mutate(vendor.id)}
                        disabled={
                          payVendorMutation.isPending ||
                          parseFloat(vendor.pendingPayoutKwd || "0") <= 0
                        }
                        className="w-full md:w-auto"
                        data-testid={`button-pay-vendor-${vendor.id}`}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Process Payout
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UsersSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("POST", "/api/admin/users/role", {
        userId,
        role,
      });
      if (!res.ok) throw new Error("Failed to update role");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      toast({ title: "Success", description: "User role updated" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">User Management</h2>

      <Card>
        <CardContent className="p-0">
          {!users || users.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No users found.
            </p>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 flex items-center justify-between gap-4 flex-wrap"
                  data-testid={`user-row-${user.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCog className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.email}</p>
                      {(user.firstName || user.lastName) && (
                        <p className="text-sm text-muted-foreground">
                          {user.firstName} {user.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={user.role}
                      onValueChange={(role) =>
                        updateRoleMutation.mutate({ userId: user.id, role })
                      }
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger
                        className="w-32"
                        data-testid={`select-role-${user.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge
                      variant={
                        user.role === "admin"
                          ? "default"
                          : user.role === "vendor"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CategoriesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const res = await apiRequest("POST", "/api/admin/categories", data);
      if (!res.ok) throw new Error("Failed to create category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      setShowCreateForm(false);
      setNewName("");
      setNewSlug("");
      toast({ title: "Success", description: "Category created" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      slug,
    }: {
      id: string;
      name: string;
      slug: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/categories/${id}`, {
        name,
        slug,
      });
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      toast({ title: "Success", description: "Category updated" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/categories/${id}`);
      if (!res.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      toast({ title: "Success", description: "Category deleted" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const startEditing = (category: Category) => {
    setEditingCategory(category.id);
    setEditName(category.name);
    setEditSlug(category.slug);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-semibold">Category Management</h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          data-testid="button-add-category"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Category name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              }}
              data-testid="input-category-name"
            />
            <Input
              placeholder="Slug (e.g., engine-parts)"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              data-testid="input-category-slug"
            />
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  createCategoryMutation.mutate({
                    name: newName,
                    slug: newSlug,
                  })
                }
                disabled={
                  !newName || !newSlug || createCategoryMutation.isPending
                }
                data-testid="button-save-category"
              >
                {createCategoryMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Create Category
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {!categories || categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No categories found.
            </p>
          ) : (
            <div className="divide-y">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 flex items-center justify-between gap-4 flex-wrap"
                  data-testid={`category-row-${category.id}`}
                >
                  {editingCategory === category.id ? (
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-40"
                        placeholder="Name"
                      />
                      <Input
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="w-40"
                        placeholder="Slug"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          updateCategoryMutation.mutate({
                            id: category.id,
                            name: editName,
                            slug: editSlug,
                          })
                        }
                        disabled={updateCategoryMutation.isPending}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingCategory(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.slug}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditing(category)}
                          data-testid={`button-edit-category-${category.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            deleteCategoryMutation.mutate(category.id)
                          }
                          disabled={deleteCategoryMutation.isPending}
                          data-testid={`button-delete-category-${category.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface VendorStory {
  id: string;
  vendorId: string;
  content?: string;
  imageUrl?: string;
  createdAt: string;
}

function SpotlightsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stories, isLoading: isStoriesLoading } = useQuery<
    VendorStory[]
  >({
    queryKey: ["/api/stories"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/stories"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch spotlights");
      return res.json();
    },
  });

  const { data: vendors } = useVendors();

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const res = await apiRequest("DELETE", `/api/stories/${storyId}`);
      if (!res.ok) throw new Error("Failed to delete spotlight");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Success", description: "Spotlight deleted" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const getVendorName = (vendorId: string) => {
    const vendor = vendors?.find((v) => v.id === vendorId);
    return vendor?.storeName || "Unknown Vendor";
  };

  if (isStoriesLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Spotlight Management</h2>

      <Card>
        <CardContent className="p-0">
          {!stories || stories.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No spotlights found.
            </p>
          ) : (
            <div className="divide-y">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="p-4 md:p-6"
                  data-testid={`spotlight-row-${story.id}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {story.imageUrl && (
                      <div className="w-full lg:w-48 h-32 lg:h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={story.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">
                              {getVendorName(story.vendorId)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(story.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {story.content && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {story.content}
                            </p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                          onClick={() => deleteStoryMutation.mutate(story.id)}
                          disabled={deleteStoryMutation.isPending}
                          data-testid={`button-delete-spotlight-${story.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: payoutRequests, isLoading } = useQuery<PayoutRequest[]>({
    queryKey: ["/api/admin/payout-requests"],
  });

  const payVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/vendors/${vendorId}/payout`,
        {}
      );
      if (!res.ok) throw new Error("Failed to process payout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/payout-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/vendors/financials"],
      });
      toast({ title: "Success", description: "Payout processed successfully" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Payout Requests</h2>

      <Card>
        <CardContent className="p-0">
          {!payoutRequests || payoutRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No pending payout requests.
            </p>
          ) : (
            <div className="divide-y">
              {payoutRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 flex items-center justify-between gap-4 flex-wrap bg-amber-50 dark:bg-amber-950/20"
                  data-testid={`payout-request-${request.id}`}
                >
                  <div>
                    <p className="font-semibold">{request.vendorName}</p>
                    <p className="text-sm text-muted-foreground">
                      Requested: {parseFloat(request.amount).toFixed(3)} KWD
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => payVendorMutation.mutate(request.vendorId)}
                    disabled={payVendorMutation.isPending}
                    data-testid={`button-pay-${request.vendorId}`}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Pay Vendor
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
