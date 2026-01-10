import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRole, useVendors } from "@/hooks/use-motorbuy";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
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
  FileText,
} from "lucide-react";
import { Link } from "wouter";
import carLogo from "@assets/image_2026-01-09_142631252-removebg-preview_1767958016384.png";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { Vendor } from "@shared/schema";
import { buildApiUrl } from "@/lib/api-config";
import { formatKWD } from "@/lib/currency";

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
  const { t, isRTL, language } = useLanguage();

  // Get active tab from URL hash or default to "analytics"
  const getActiveTab = () => {
    const hash = window.location.hash.replace("#", "");
    if (
      hash &&
      [
        "analytics",
        "vendors",
        "users",
        "categories",
        "ads",
        "orders",
        "payouts",
        "vendor-requests",
      ].includes(hash)
    ) {
      return hash;
    }
    return "analytics";
  };
  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Update tab when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getActiveTab());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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

  const navItems = [
    {
      value: "analytics",
      icon: BarChart3,
      label: t("admin.dashboard.tabAnalytics"),
    },
    { value: "vendors", icon: Store, label: t("admin.dashboard.tabVendors") },
    { value: "users", icon: Users, label: t("admin.dashboard.tabUsers") },
    {
      value: "categories",
      icon: FolderOpen,
      label: t("admin.dashboard.tabCategories"),
    },
    { value: "ads", icon: BookOpen, label: t("admin.dashboard.tabAds") },
    {
      value: "orders",
      icon: ShoppingCart,
      label: t("admin.dashboard.tabOrders"),
    },
    {
      value: "payouts",
      icon: DollarSign,
      label: t("admin.dashboard.tabPayouts"),
    },
    {
      value: "vendor-requests",
      icon: FileText,
      label: t("admin.dashboard.tabVendorRequests"),
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 font-body">
      <Navbar />
      <div className="flex">
        {/* Left Sidebar Navigation */}
        <aside
          className={`hidden lg:block w-64 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto ${
            isRTL ? "border-l border-r-0" : ""
          }`}
        >
          {/* Logo at top of sidebar */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/" className="font-display font-bold text-lg md:text-xl flex items-center gap-2">
              <img src={carLogo} alt="MotorBuy" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
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
            </Link>
          </div>
          
          <div className="p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => {
                    setActiveTab(item.value);
                    window.location.hash = item.value;
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-yellow-100 text-yellow-900 font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  data-testid={`nav-${item.value}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0 lg:pt-16">
          <div className="container mx-auto px-4 py-6 lg:py-8">
            {/* Header */}
            <div className={`mb-8 ${isRTL ? "text-right" : "text-left"}`}>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                {t("admin.dashboard.title")}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                {t("admin.dashboard.manage")}
              </p>
            </div>

            {/* Content Sections */}
            <div className="mt-6 lg:mt-10 space-y-6">
              {activeTab === "analytics" && (
                <>
                  <TopSummaryCards />
                  <AnalyticsSection />
                </>
              )}
              {activeTab === "vendors" && <VendorSection />}
              {activeTab === "users" && <UsersSection />}
              {activeTab === "categories" && <CategoriesSection />}
              {activeTab === "ads" && <AdsSection />}
              {activeTab === "orders" && <OrdersSection />}
              {activeTab === "payouts" && <PayoutsSection />}
              {activeTab === "vendor-requests" && <VendorRequestsSection />}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50 ${
          isRTL ? "border-b" : ""
        }`}
      >
        <div className="flex items-center justify-around h-16 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => {
                  setActiveTab(item.value);
                  window.location.hash = item.value;
                }}
                className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-[60px] h-full transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`mobile-nav-${item.value}`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "scale-110" : ""
                  } transition-transform`}
                />
                <span className="text-[10px] font-medium leading-tight text-center px-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function TopSummaryCards() {
  const { t } = useLanguage();
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
      <Card className="border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-blue-500 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <p
            className="text-3xl font-bold mb-1 text-blue-700 dark:text-blue-300"
            data-testid="text-total-users"
          >
            {totalUsers}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {t("admin.dashboard.totalUsers")}
          </p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-green-500 rounded-lg">
              <Store className="w-5 h-5 text-white" />
            </div>
          </div>
          <p
            className="text-3xl font-bold mb-1 text-green-700 dark:text-green-300"
            data-testid="text-total-vendors"
          >
            {totalVendors}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            {t("admin.dashboard.totalVendors")} ({approvedVendors}{" "}
            {t("admin.dashboard.approved")})
          </p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-amber-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p
            className="text-3xl font-bold mb-1 text-amber-700 dark:text-amber-300"
            data-testid="text-pending-payouts"
          >
            {totalPendingAmount.toFixed(3)}
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {t("admin.dashboard.pendingPayout")} (KWD)
          </p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-purple-500 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
          </div>
          <p
            className="text-3xl font-bold mb-1 text-purple-700 dark:text-purple-300"
            data-testid="text-payout-requests"
          >
            {pendingPayouts}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            {t("admin.dashboard.payoutRequests")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsSection() {
  const { t } = useLanguage();
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
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("admin.dashboard.totalRevenue")}
                </p>
                <p className="font-bold text-lg">
                  {analytics.totalRevenue} KWD
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("admin.dashboard.totalOrders")}
                </p>
                <p className="font-bold text-lg">{analytics.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("admin.dashboard.totalProducts")}
                </p>
                <p className="font-bold text-lg">{analytics.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("admin.dashboard.totalVendors")}
                </p>
                <p className="font-bold text-lg">{analytics.totalVendors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("admin.dashboard.totalUsers")}
                </p>
                <p className="font-bold text-lg">{analytics.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("admin.dashboard.totalCategories")}
                </p>
                <p className="font-bold text-lg">{analytics.totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dashboard.recentOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {t("admin.dashboard.noOrders")}
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.recentOrders.map((order: any) => (
                <Card key={order.id} className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Order #{order.id.slice(-8)}
                        </p>
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

                    {(order.customerName || order.guestName) && (
                      <div className="border-t pt-3 space-y-1 text-sm">
                        <div className="font-medium">Customer Information:</div>
                        <div className="text-muted-foreground">
                          <div>
                            Name: {order.customerName || order.guestName}
                          </div>
                          {(order.customerEmail || order.guestEmail) && (
                            <div>
                              Email: {order.customerEmail || order.guestEmail}
                            </div>
                          )}
                          {(order.customerPhone || order.guestPhone) && (
                            <div>
                              Phone: {order.customerPhone || order.guestPhone}
                            </div>
                          )}
                          {order.customerAddress && (
                            <div>Address: {order.customerAddress}</div>
                          )}
                          {order.customerCity && (
                            <div>City: {order.customerCity}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {order.items && order.items.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium mb-2">Items:</div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx}>
                              {item.product?.name || "Unknown"} - Qty:{" "}
                              {item.quantity} × {item.price} KWD
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VendorSection() {
  const { t, isRTL } = useLanguage();
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
          <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {t("admin.dashboard.addVendor")}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.dashboard.createVendor")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder={t("admin.dashboard.storeName")}
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              data-testid="input-vendor-name"
            />
            <Input
              placeholder={t("admin.dashboard.description")}
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
                  <Loader2
                    className={`w-4 h-4 ${
                      isRTL ? "ml-2" : "mr-2"
                    } animate-spin`}
                  />
                ) : null}
                {t("admin.dashboard.create")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                {t("common.cancel")}
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

function AdsSection() {
  const { t } = useLanguage();
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
      if (!res.ok) throw new Error("Failed to fetch ads");
      return res.json();
    },
  });

  const { data: vendors } = useVendors();

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const res = await apiRequest("DELETE", `/api/stories/${storyId}`);
      if (!res.ok) throw new Error("Failed to delete ad");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Success", description: "Ad deleted" });
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
      <h2 className="text-xl font-semibold">
        {t("admin.dashboard.adsManagement")}
      </h2>

      <Card>
        <CardContent className="p-0">
          {!stories || stories.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {t("admin.dashboard.noAds")}
            </p>
          ) : (
            <div className="divide-y">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="p-4 md:p-6"
                  data-testid={`ad-row-${story.id}`}
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
                          data-testid={`button-delete-ad-${story.id}`}
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

function OrdersSection() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: orders, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/admin/orders"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, {
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      toast({
        title: "Order status updated",
        description: "The order status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
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

  const filteredOrders = orders?.filter(
    (order) => statusFilter === "all" || order.status === statusFilter
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Orders Management</h2>
        <div className="w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {!filteredOrders || filteredOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No orders found.
            </p>
          ) : (
            <div className="divide-y">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        Order #{order.id.slice(-8)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Customer:</span>{" "}
                      {order.customerName || order.guestName || "Guest"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {order.items?.length || 0} items • Total:{" "}
                      {formatKWD(order.total)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select
                      defaultValue={order.status}
                      onValueChange={(value) =>
                        updateStatusMutation.mutate({
                          orderId: order.id,
                          status: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
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

function VendorRequestsSection() {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  interface VendorRequest {
    id: string;
    userId: string;
    companyName: string;
    phone: string;
    email: string;
    status: string;
    notes?: string;
    createdAt: string;
    processedAt?: string;
  }

  const { data: requests, isLoading } = useQuery<VendorRequest[]>({
    queryKey: ["/api/admin/vendor-requests"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/admin/vendor-requests"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch vendor requests");
      return res.json();
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/vendor-requests/${id}`, { status, notes });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to update request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendor-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/financials"] });
      toast({
        title: t("admin.dashboard.requestUpdated"),
        description: t("admin.dashboard.requestUpdatedDesc"),
      });
    },
    onError: (err: Error) => {
      toast({
        title: t("admin.dashboard.error"),
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

  const pendingRequests = requests?.filter(r => r.status === "pending") || [];
  const processedRequests = requests?.filter(r => r.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-2">{t("admin.dashboard.vendorRequests")}</h2>
        <p className="text-muted-foreground">{t("admin.dashboard.vendorRequestsDesc")}</p>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dashboard.pendingRequests")} ({pendingRequests.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {t("admin.dashboard.noPendingRequests")}
            </p>
          ) : (
            <div className="divide-y">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{request.companyName}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t("admin.dashboard.phone")}:</span>
                          <span>{request.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t("admin.dashboard.email")}:</span>
                          <span>{request.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t("admin.dashboard.requestedOn")}:</span>
                          <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{t("admin.dashboard.pending")}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateRequestMutation.mutate({ id: request.id, status: "approved" })}
                      disabled={updateRequestMutation.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {t("admin.dashboard.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateRequestMutation.mutate({ id: request.id, status: "rejected" })}
                      disabled={updateRequestMutation.isPending}
                      className="flex-1"
                    >
                      <X className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {t("admin.dashboard.reject")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.dashboard.processedRequests")} ({processedRequests.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {processedRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{request.companyName}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>{request.phone}</div>
                        <div>{request.email}</div>
                        <div className="text-xs">
                          {t("admin.dashboard.requestedOn")}: {new Date(request.createdAt).toLocaleDateString()}
                          {request.processedAt && (
                            <> • {t("admin.dashboard.processedOn")}: {new Date(request.processedAt).toLocaleDateString()}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={request.status === "approved" ? "default" : "destructive"}>
                      {request.status === "approved" ? t("admin.dashboard.approved") : t("admin.dashboard.rejected")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
