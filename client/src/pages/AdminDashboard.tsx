import { useAuth } from "@/hooks/use-auth";
import { useRole, useProducts, useCategories, useVendors, useCreateProduct, useDeleteProduct } from "@/hooks/use-motorbuy";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Loader2,
  CheckCircle,
  XCircle,
  Store,
  FolderOpen,
  Pencil,
  Trash2,
  Save,
  X,
  Plus,
  FileText,
  Clock,
  LogOut,
  Package,
  Image,
  Percent,
  BarChart3,
  Wallet,
  Search,
  Filter,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef, useMemo } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useUpload } from "@/hooks/use-upload";
import { buildApiUrl } from "@/lib/api-config";
import { formatKWD } from "@/lib/currency";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { formatKWD } from "@/lib/currency";
import { Navbar } from "@/components/Navbar";
import { LoadingPage } from "@/components/LoadingPage";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

function buildApiUrl(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export default function AdminDashboard() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("analytics");
  const { t, isRTL, language } = useLanguage();

  // Show loading state while checking authentication and role
  if (isAuthLoading || isRoleLoading) {
    return <LoadingPage message="Loading dashboard..." />;
  }

  // Check role from both user object and roleData
  const isAdmin = user?.role === "admin" || roleData?.role === "admin";

  // Redirect if not authenticated or not admin
  if (!user || !isAdmin) {
    setLocation("/");
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const navItems = [
    { value: "analytics", label: t("admin.dashboard.tabAnalytics"), icon: TrendingUp },
    { value: "users", label: t("admin.dashboard.tabUsers"), icon: Users },
    { value: "vendors", label: t("admin.dashboard.tabVendors"), icon: Store },
    { value: "products", label: t("admin.dashboard.tabProducts") || "Products", icon: Package },
    { value: "vendor-requests", label: t("admin.dashboard.tabVendorRequests"), icon: FileText },
    { value: "orders", label: t("admin.dashboard.tabOrders"), icon: ShoppingBag },
    { value: "categories", label: t("admin.dashboard.tabCategories"), icon: FolderOpen },
    { value: "bundles", label: t("admin.dashboard.tabBundles") || "Bundles", icon: Package },
    { value: "ads", label: t("admin.dashboard.tabAds"), icon: FileText },
    { value: "payouts", label: t("admin.dashboard.tabPayouts"), icon: DollarSign },
  ];

  const getActiveTabLabel = () => {
    const item = navItems.find(i => i.value === activeTab);
    return item ? item.label : "";
  };

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
          <div className="p-2 pt-4">
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

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-2 h-16">
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
                  className={`flex flex-col items-center justify-center min-w-[70px] px-2 h-full space-y-1 transition-colors ${
                    isActive
                      ? "text-primary font-medium"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  data-testid={`nav-mobile-${item.value}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                  <span className="text-[10px] whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0 lg:pt-0">
          <div className="container mx-auto px-4 py-4 lg:py-6">
            {/* Header */}
            <div className={`mb-4 ${isRTL ? "text-right" : "text-left"}`}>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                  <h1 className={`text-2xl md:text-3xl font-display font-bold mb-1 ${isRTL ? "text-right" : "text-left"}`}>
                    {activeTab === "analytics" ? t("admin.dashboard.title") : getActiveTabLabel()}
                  </h1>
                  {activeTab === "analytics" && (
                    <p className={`text-muted-foreground text-sm md:text-base ${isRTL ? "text-right" : "text-left"}`}>{t("admin.dashboard.welcomeBack")}</p>
                  )}
                </div>
              </div>
        </div>

            <div className="space-y-4">
              {activeTab === "analytics" && (
                <>
        <TopSummaryCards />
            <AnalyticsSection />
                </>
              )}
              {activeTab === "users" && <UsersSection />}
              {activeTab === "vendors" && <VendorsSection />}
              {activeTab === "products" && <ProductsSection />}
              {activeTab === "vendor-requests" && <VendorRequestsSection />}
              {activeTab === "orders" && <OrdersSection />}
              {activeTab === "categories" && <CategoriesSection />}
              {activeTab === "bundles" && <BundlesSection />}
              {activeTab === "ads" && <AdsSection />}
              {activeTab === "payouts" && <PayoutsSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ... (Other components: TopSummaryCards, AnalyticsSection, UsersSection remain largely the same, I will check them if needed)

function TopSummaryCards() {
    const { t, isRTL } = useLanguage();
    const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
      queryFn: async () => {
        const res = await fetch(buildApiUrl("/api/admin/analytics"), {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch analytics");
        return res.json();
      },
    });
  
    if (!analytics) return null;

    const stats = [
      {
        icon: Users,
        value: analytics.totalUsers || 0,
        label: t("admin.dashboard.totalUsers"),
        color: "blue",
        bgGradient: "from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10",
        borderColor: "border-blue-200 dark:border-blue-800",
        iconBg: "bg-blue-500",
        textColor: "text-blue-700 dark:text-blue-300",
        labelColor: "text-blue-600 dark:text-blue-400",
      },
      {
        icon: TrendingUp,
        value: formatKWD(analytics.totalSales || "0"),
        label: t("admin.dashboard.totalSales"),
        color: "indigo",
        bgGradient: "from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10",
        borderColor: "border-indigo-200 dark:border-indigo-800",
        iconBg: "bg-indigo-500",
        textColor: "text-indigo-700 dark:text-indigo-300",
        labelColor: "text-indigo-600 dark:text-indigo-400",
      },
      {
        icon: ShoppingBag,
        value: analytics.totalOrders || 0,
        label: t("admin.dashboard.totalOrders"),
        color: "amber",
        bgGradient: "from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10",
        borderColor: "border-amber-200 dark:border-amber-800",
        iconBg: "bg-amber-500",
        textColor: "text-amber-700 dark:text-amber-300",
        labelColor: "text-amber-600 dark:text-amber-400",
      },
      {
        icon: Package,
        value: analytics.totalProducts || 0,
        label: t("admin.dashboard.totalProducts"),
        color: "teal",
        bgGradient: "from-teal-50 to-teal-100/50 dark:from-teal-950/20 dark:to-teal-900/10",
        borderColor: "border-teal-200 dark:border-teal-800",
        iconBg: "bg-teal-500",
        textColor: "text-teal-700 dark:text-teal-300",
        labelColor: "text-teal-600 dark:text-teal-400",
      },
      {
        icon: Clock,
        value: analytics.pendingOrders || 0,
        label: t("admin.dashboard.pendingOrders"),
        color: "orange",
        bgGradient: "from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10",
        borderColor: "border-orange-200 dark:border-orange-800",
        iconBg: "bg-orange-500",
        textColor: "text-orange-700 dark:text-orange-300",
        labelColor: "text-orange-600 dark:text-orange-400",
      },
      {
        icon: Percent,
        value: formatKWD(analytics.totalCommission || "0"),
        label: t("admin.dashboard.totalCommission"),
        color: "cyan",
        bgGradient: "from-cyan-50 to-cyan-100/50 dark:from-cyan-950/20 dark:to-cyan-900/10",
        borderColor: "border-cyan-200 dark:border-cyan-800",
        iconBg: "bg-cyan-500",
        textColor: "text-cyan-700 dark:text-cyan-300",
        labelColor: "text-cyan-600 dark:text-cyan-400",
      },
    ];

  return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card key={index} className={`border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br ${stat.bgGradient} ${stat.borderColor}`}>
                        <CardContent className="p-6">
                            <div className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                                <div className={`p-2.5 ${stat.iconBg} rounded-lg`}>
                                    <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
                            <p className={`text-3xl font-bold mb-1 ${stat.textColor}`}>
                                {stat.value}
          </p>
                            <p className={`text-sm ${stat.labelColor}`}>{stat.label}</p>
        </CardContent>
      </Card>
                );
            })}
        </div>
    )
}

function AnalyticsSection() {
  const { t, isRTL } = useLanguage();
  const { data: vendors } = useVendors();
  const [timeRange, setTimeRange] = useState<"day" | "month" | "year">("month");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");

  const { data: salesData, isLoading } = useQuery({
    queryKey: ["/api/admin/sales-chart", timeRange, selectedVendor],
    queryFn: async () => {
      const params = new URLSearchParams({
        range: timeRange,
        ...(selectedVendor !== "all" && { vendorId: selectedVendor }),
      });
      const res = await fetch(buildApiUrl(`/api/admin/sales-chart?${params}`), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch sales data");
      return res.json();
    },
  });

  const chartData = salesData?.data || [];
  const chartConfig = {
    sales: {
      label: t("admin.dashboard.totalSales") || "Sales",
      color: "hsl(var(--chart-1))",
    },
  };

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <LoadingPage message="Loading chart..." fullScreen={false} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isRTL ? "md:flex-row-reverse" : ""}`}>
          <div>
            <CardTitle>{t("admin.dashboard.salesChart") || "Sales Chart"}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t("admin.dashboard.salesChartDesc") || "Sales performance over time"}
            </p>
          </div>
          <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Select value={timeRange} onValueChange={(v: "day" | "month" | "year") => setTimeRange(v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t("admin.dashboard.day") || "Day"}</SelectItem>
                <SelectItem value="month">{t("admin.dashboard.month") || "Month"}</SelectItem>
                <SelectItem value="year">{t("admin.dashboard.year") || "Year"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("admin.dashboard.allVendors") || "All Vendors"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.dashboard.allVendors") || "All Vendors"}</SelectItem>
                {vendors?.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.storeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t("admin.dashboard.noSalesData") || "No sales data available"}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  if (timeRange === "day") return value;
                  if (timeRange === "month") return value;
                  return value;
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatKWD(value.toString())}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--color-sales)"
                fill="var(--color-sales)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function UsersSection() {
    const { t, isRTL } = useLanguage();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editRole, setEditRole] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");

    const { data: users, isLoading } = useQuery({
        queryKey: ["/api/admin/users"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/users");
            return res.json();
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
            // Update user info
            const userRes = await apiRequest("PATCH", `/api/users/${userId}`, {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
            });
            if (!userRes.ok) throw new Error("Failed to update user");
            
            // Update role if changed
            if (data.role) {
                const roleRes = await apiRequest("POST", "/api/admin/users/role", {
                    userId,
                    role: data.role,
                });
                if (!roleRes.ok) throw new Error("Failed to update role");
            }
            
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "Success", description: "User updated successfully" });
            setIsEditDialogOpen(false);
            setEditingUser(null);
        },
        onError: (err: Error) => {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setEditFirstName(user.firstName || "");
        setEditLastName(user.lastName || "");
        setEditEmail(user.email || "");
        setEditRole(user.role || "customer");
        setIsEditDialogOpen(true);
    };

    const handleUpdateUser = () => {
        if (!editingUser || !editFirstName || !editLastName || !editEmail) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }
        updateUserMutation.mutate({
            userId: editingUser.id,
            data: {
                firstName: editFirstName,
                lastName: editLastName,
                email: editEmail,
                role: editRole,
            },
        });
    };

    // Filter and search users
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        let filtered = users;

        // Filter by role
        if (roleFilter !== "all") {
            filtered = filtered.filter((user: any) => user.role === roleFilter);
        }

        // Search by name or email
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((user: any) => {
                const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
                const email = (user.email || "").toLowerCase();
                return fullName.includes(query) || email.includes(query);
            });
        }

        return filtered;
    }, [users, roleFilter, searchQuery]);

    if (isLoading) return <LoadingPage message="Loading..." fullScreen={false} />;

    return (
        <>
        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className={`flex flex-col md:flex-row gap-4 ${isRTL ? "md:flex-row-reverse" : ""}`}>
                <div className="flex-1 relative">
                  <Search className={`absolute top-1/2 transform -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} w-4 h-4 text-muted-foreground`} />
                  <Input
                    placeholder={t("admin.dashboard.searchUsers") || "Search by name or email..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${isRTL ? "pr-10" : "pl-10"}`}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.dashboard.filterRole") || "Filter by role"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.dashboard.allRoles") || "All Roles"}</SelectItem>
                      <SelectItem value="customer">{t("account.customer") || "Customer"}</SelectItem>
                      <SelectItem value="vendor">{t("account.vendor") || "Vendor"}</SelectItem>
                      <SelectItem value="admin">{t("nav.admin") || "Admin"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

        <Card className="border shadow-sm">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("common.name")}</TableHead>
                            <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("common.email")}</TableHead>
                            <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("common.role")}</TableHead>
                            <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-left" : "text-right"}`}>{t("admin.dashboard.actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!filteredUsers || filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className={`text-center text-muted-foreground py-12 ${isRTL ? "text-right" : "text-left"}`}>
                                    {searchQuery || roleFilter !== "all" 
                                      ? (t("common.noResults") || "No users match your filters")
                                      : (t("admin.dashboard.noUsers") || "No users found")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((u: any) => (
                                <TableRow key={u.id} className="hover:bg-muted/50">
                                    <TableCell className={`font-medium ${isRTL ? "text-right" : "text-left"}`}>{u.firstName} {u.lastName}</TableCell>
                                    <TableCell className={`text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{u.email}</TableCell>
                                    <TableCell className={isRTL ? "text-right" : "text-left"}>
                                        <Badge variant="outline" className="font-normal">
                                          {u.role === "customer" ? t("account.customer") || "Customer" :
                                           u.role === "vendor" ? t("account.vendor") || "Vendor" :
                                           u.role === "admin" ? t("nav.admin") || "Admin" :
                                           u.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={isRTL ? "text-left" : "text-right"}>
                                        <div className={`flex gap-1 ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleEditUser(u)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={`max-w-md ${isRTL ? "text-right" : "text-left"}`}>
          <DialogHeader className={isRTL ? "text-right" : "text-left"}>
            <DialogTitle>{t("admin.dashboard.editUser") || "Edit User"}</DialogTitle>
            <DialogDescription>{t("admin.dashboard.editUserDesc") || "Update user information and role."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("auth.firstName")} *</Label>
                <Input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("auth.lastName")} *</Label>
                <Input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("common.email")} *</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.role")} *</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.role")}>
                    {editRole === "customer" ? t("account.customer") || "Customer" :
                     editRole === "vendor" ? t("account.vendor") || "Vendor" :
                     editRole === "admin" ? t("nav.admin") || "Admin" :
                     editRole}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">{t("account.customer") || "Customer"}</SelectItem>
                  <SelectItem value="vendor">{t("account.vendor") || "Vendor"}</SelectItem>
                  <SelectItem value="admin">{t("nav.admin") || "Admin"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className={isRTL ? "flex-row-reverse" : ""}>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingUser(null); }}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </>
  );
}

function VendorsSection() {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [editingVendorDetails, setEditingVendorDetails] = useState<any | null>(null);
  const [isEditVendorDialogOpen, setIsEditVendorDialogOpen] = useState(false);
  const [editStoreName, setEditStoreName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsApproved, setEditIsApproved] = useState(false);
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("percentage");
  const [commissionValue, setCommissionValue] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const { data: vendors, isLoading: isVendorsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/vendors/financials"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/admin/vendors/financials"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: async (data: { storeName: string; description: string }) => {
      const res = await apiRequest("POST", "/api/admin/vendors", data);
      if (!res.ok) throw new Error("Failed to create vendor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/financials"] });
      toast({ title: "Success", description: "Vendor created successfully" });
      setShowCreateForm(false);
      setNewStoreName("");
      setNewDescription("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async (data: {
      vendorId: string;
      commissionType: string;
      commissionValue: string;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/vendors/${data.vendorId}/commission`,
        {
          commissionType: data.commissionType,
          commissionValue: data.commissionValue,
        }
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

  const payoutMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const res = await apiRequest("POST", `/api/admin/vendors/${vendorId}/payout`);
      if (!res.ok) throw new Error("Failed to process payout");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/financials"] });
      toast({ title: "Success", description: data.message });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: async ({ vendorId, data }: { vendorId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/vendors/${vendorId}`, data);
      if (!res.ok) throw new Error("Failed to update vendor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/financials"] });
      toast({ title: "Success", description: "Vendor updated successfully" });
      setIsEditVendorDialogOpen(false);
      setEditingVendorDetails(null);
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const approveVendorMutation = useMutation({
    mutationFn: async ({ vendorId, isApproved }: { vendorId: string; isApproved: boolean }) => {
      const res = await apiRequest("PATCH", `/api/vendors/${vendorId}`, { isApproved });
      if (!res.ok) throw new Error("Failed to update vendor approval");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/financials"] });
      toast({ title: "Success", description: "Vendor approval status updated" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const startEditing = (vendor: any) => {
    setEditingVendor(vendor.id);
    setCommissionType(vendor.commissionType || "percentage");
    setCommissionValue(vendor.commissionValue || "5");
  };

  const handleEditVendor = (vendor: any) => {
    setEditingVendorDetails(vendor);
    setEditStoreName(vendor.storeName || "");
    setEditDescription(vendor.description || "");
    setEditIsApproved(vendor.isApproved || false);
    setIsEditVendorDialogOpen(true);
  };

  const handleUpdateVendor = () => {
    if (!editingVendorDetails || !editStoreName) {
      toast({
        title: "Missing Fields",
        description: "Store name is required",
        variant: "destructive",
      });
      return;
    }
    updateVendorMutation.mutate({
      vendorId: editingVendorDetails.id,
      data: {
        storeName: editStoreName,
        description: editDescription,
        isApproved: editIsApproved,
      },
    });
  };

  const handleToggleApproval = (vendor: any) => {
    approveVendorMutation.mutate({
      vendorId: vendor.id,
      isApproved: !vendor.isApproved,
    });
  };

  if (isVendorsLoading) {
    return <LoadingPage message="Loading vendors..." fullScreen={false} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-semibold">{t("admin.dashboard.vendorManagement")}</h2>
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

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {!vendors || vendors.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              {t("admin.dashboard.noVendors") || "No vendors registered yet."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("admin.dashboard.tabVendors")}</TableHead>
                  <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("admin.dashboard.commission")}</TableHead>
                  <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-left" : "text-right"}`}>{t("admin.dashboard.grossSales")}</TableHead>
                  <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-left" : "text-right"}`}>{t("admin.dashboard.balance")}</TableHead>
                  <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("common.status")}</TableHead>
                  <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-left" : "text-right"}`}>{t("admin.dashboard.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor: any) => {
                  const balance = parseFloat(vendor.walletBalanceKwd || vendor.pendingPayoutKwd || "0");
                  const isNegative = balance < 0;

                  return (
                    <TableRow key={vendor.id} className="hover:bg-muted/50" data-testid={`vendor-row-${vendor.id}`}>
                      <TableCell>
                        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Store className="w-5 h-5 text-primary" />
                          </div>
                          <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : "text-left"}`}>
                            <div className="font-semibold text-base truncate mb-1">
                              {vendor.storeName}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {vendor.description || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={isRTL ? "text-right" : "text-left"}>
                        {editingVendor === vendor.id ? (
                          <div className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
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
                              onChange={(e) => setCommissionValue(e.target.value)}
                              className="w-16 h-8 text-xs"
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
                              {updateCommissionMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
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
                          <div className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
                            <span className="font-medium text-sm">
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
                      </TableCell>
                      <TableCell className={`font-medium ${isRTL ? "text-left" : "text-right"}`}>
                        {formatKWD(vendor.grossSalesKwd || "0")}
                      </TableCell>
                      <TableCell className={`font-medium ${isRTL ? "text-left" : "text-right"}`}>
                        <div className={`flex flex-col ${isRTL ? "items-start" : "items-end"}`}>
                          <span className={isNegative ? "text-red-600" : balance > 0 ? "text-green-600" : ""}>
                            {isNegative ? t("admin.dashboard.outstanding") : t("admin.dashboard.balance")}
                          </span>
                          <span className={`text-sm ${isNegative ? "text-red-600" : balance > 0 ? "text-green-600" : ""}`}>
                            {formatKWD(Math.abs(balance))}
                          </span>
                          {isNegative && Math.abs(balance) > 100 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="mt-1 text-xs h-7"
                              onClick={() => toast({ title: "Feature coming soon", description: "Payment request to vendor email." })}
                            >
                              {t("admin.dashboard.requestPay")}
                            </Button>
                          )}
                          {balance > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 text-xs h-7"
                              onClick={() => payoutMutation.mutate(vendor.id)}
                              disabled={payoutMutation.isPending}
                            >
                              {payoutMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <DollarSign className="w-3 h-3" />
                              )}
                              {t("admin.dashboard.processPayout")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={isRTL ? "text-right" : "text-left"}>
                        <div className={`flex items-center gap-2 flex-wrap ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
                          <Badge variant={vendor.isApproved ? "default" : "secondary"}>
                            {vendor.isApproved ? t("admin.dashboard.approved") : t("admin.dashboard.pending")}
                          </Badge>
                          {vendor.hasPendingRequest && (
                            <Badge variant="destructive" className="text-xs">
                              {t("admin.dashboard.payoutRequest")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={isRTL ? "text-left" : "text-right"}>
                        <div className={`flex gap-1 ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditVendor(vendor)}
                            title={t("common.edit")}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleApproval(vendor)}
                            disabled={approveVendorMutation.isPending}
                            title={vendor.isApproved ? t("admin.dashboard.pending") : t("admin.dashboard.approved")}
                          >
                            {approveVendorMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : vendor.isApproved ? (
                              <XCircle className="w-4 h-4 text-destructive" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditVendorDialogOpen} onOpenChange={setIsEditVendorDialogOpen}>
        <DialogContent className={`max-w-md ${isRTL ? "text-right" : "text-left"}`}>
          <DialogHeader className={isRTL ? "text-right" : "text-left"}>
            <DialogTitle>{t("admin.dashboard.editVendor") || "Edit Vendor"}</DialogTitle>
            <DialogDescription>{t("admin.dashboard.editVendorDesc") || "Update vendor information and approval status."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.dashboard.storeName")} *</Label>
              <Input
                value={editStoreName}
                onChange={(e) => setEditStoreName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.dashboard.description")}</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isApproved"
                checked={editIsApproved}
                onChange={(e) => setEditIsApproved(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isApproved" className="cursor-pointer">
                {t("admin.dashboard.approved")}
              </Label>
            </div>
          </div>
          <DialogFooter className={isRTL ? "flex-row-reverse" : ""}>
            <Button variant="outline" onClick={() => { setIsEditVendorDialogOpen(false); setEditingVendorDetails(null); }}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdateVendor} disabled={updateVendorMutation.isPending}>
              {updateVendorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VendorRequestsSection() {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/admin/vendor-requests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/vendor-requests");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/vendor-requests/${id}`, {
        status,
        notes,
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendor-requests"] });
      toast({ title: "Success", description: "Request updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return <LoadingPage message="Loading..." fullScreen={false} />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t("admin.dashboard.vendorRequests")}</h2>
      <Card>
        <CardContent className="p-0">
          {!requests || requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t("admin.dashboard.noVendorRequests")}</p>
          ) : (
            <div className="divide-y">
              {requests.map((request: any) => (
                <div key={request.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className={`space-y-1 ${isRTL ? "text-right" : "text-left"} flex-1`}>
                    <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
                      <h3 className="font-semibold">{request.companyName}</h3>
                      <Badge variant={request.status === "pending" ? "outline" : request.status === "approved" ? "default" : "destructive"}>
                        {request.status === "pending" ? t("admin.dashboard.requestStatus") : request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("admin.dashboard.requestedBy")}: {request.email} | {request.phone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    </div>
                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: request.id, status: "approved" })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t("admin.dashboard.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatusMutation.mutate({ id: request.id, status: "rejected" })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t("admin.dashboard.reject")}
                      </Button>
                  </div>
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

function OrdersSection() {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerEmail, setEditCustomerEmail] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editTotal, setEditTotal] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/orders");
      return res.json();
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${orderId}`, data);
      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Success", description: "Order updated successfully" });
      setIsEditDialogOpen(false);
      setEditingOrder(null);
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Success", description: "Order status updated" });
      setIsStatusDialogOpen(false);
      setEditingOrder(null);
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to delete order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Success", description: "Order deleted successfully" });
      setIsDeleteDialogOpen(false);
      setDeletingOrder(null);
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setEditCustomerName(order.customerName || order.guestName || "");
    setEditCustomerEmail(order.customerEmail || order.guestEmail || "");
    setEditCustomerPhone(order.customerPhone || order.guestPhone || "");
    setEditTotal(order.total || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrder = () => {
    if (!editingOrder || !editCustomerName || !editTotal) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateOrderMutation.mutate({
      orderId: editingOrder.id,
      data: {
        customerName: editCustomerName,
        customerEmail: editCustomerEmail,
        customerPhone: editCustomerPhone,
        guestName: editCustomerName,
        guestEmail: editCustomerEmail,
        guestPhone: editCustomerPhone,
        total: editTotal,
      },
    });
  };

  const handleChangeStatus = (order: any) => {
    setEditingOrder(order);
    setEditingStatus(order.status || "pending");
    setIsStatusDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!editingOrder || !editingStatus) return;
    updateStatusMutation.mutate({
      orderId: editingOrder.id,
      status: editingStatus,
    });
  };

  const handleDeleteOrder = (order: any) => {
    setDeletingOrder(order);
    setIsDeleteDialogOpen(true);
  };

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let filtered = orders;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order: any) => order.status === statusFilter);
    }

    // Search by order ID, customer name, email, or phone
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order: any) => {
        const orderId = String(order.id).toLowerCase();
        const customerName = (order.customerName || order.guestName || "").toLowerCase();
        const customerEmail = (order.customerEmail || order.guestEmail || "").toLowerCase();
        const customerPhone = (order.customerPhone || order.guestPhone || "").toLowerCase();
        return (
          orderId.includes(query) ||
          customerName.includes(query) ||
          customerEmail.includes(query) ||
          customerPhone.includes(query)
        );
      });
    }

    return filtered;
  }, [orders, statusFilter, searchQuery]);

  if (isLoading) return <LoadingPage message="Loading..." fullScreen={false} />;

  return (
    <>
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className={`flex flex-col md:flex-row gap-4 ${isRTL ? "md:flex-row-reverse" : ""}`}>
            <div className="flex-1 relative">
              <Search className={`absolute top-1/2 transform -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} w-4 h-4 text-muted-foreground`} />
              <Input
                placeholder={t("admin.dashboard.searchOrders") || "Search by order ID, customer name, email, or phone..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? "pr-10" : "pl-10"}`}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.dashboard.filterStatus") || "Filter by status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.dashboard.allStatuses") || "All Statuses"}</SelectItem>
                  <SelectItem value="pending">{t("common.pending")}</SelectItem>
                  <SelectItem value="processing">{t("common.processing")}</SelectItem>
                  <SelectItem value="shipped">{t("common.shipped")}</SelectItem>
                  <SelectItem value="delivered">{t("common.delivered")}</SelectItem>
                  <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
                  <SelectItem value="paid">{t("admin.dashboard.paid") || "Paid"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("admin.dashboard.orderId")}</TableHead>
                        <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("admin.dashboard.customer")}</TableHead>
                        <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-left" : "text-right"}`}>{t("common.total")}</TableHead>
                        <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("common.status")}</TableHead>
                        <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("common.date")}</TableHead>
                        <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-left" : "text-right"}`}>{t("admin.dashboard.actions")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {!filteredOrders || filteredOrders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className={`text-center text-muted-foreground py-12 ${isRTL ? "text-right" : "text-left"}`}>
                                {searchQuery || statusFilter !== "all" 
                                  ? (t("common.noResults") || "No orders match your filters")
                                  : (t("admin.dashboard.noOrders") || "No orders yet.")}
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredOrders.map((order: any) => (
                            <TableRow key={order.id} className="hover:bg-muted/50">
                                <TableCell className={`font-mono text-sm ${isRTL ? "text-right" : "text-left"}`}>{String(order.id).slice(-8)}</TableCell>
                                <TableCell className={`font-medium ${isRTL ? "text-right" : "text-left"}`}>{order.customerName || order.guestName || "N/A"}</TableCell>
                                <TableCell className={`text-right font-medium ${isRTL ? "text-left" : "text-right"}`}>{formatKWD(order.total)}</TableCell>
                                <TableCell className={isRTL ? "text-right" : "text-left"}>
                                    <Badge 
                                      variant={
                                        order.status === "delivered" || order.status === "paid" ? "default" :
                                        order.status === "cancelled" ? "destructive" :
                                        "outline"
                                      } 
                                      className="font-normal capitalize"
                                    >
                                      {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className={`text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className={isRTL ? "text-left" : "text-right"}>
                                  <div className={`flex gap-1 ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleEditOrder(order)}
                                      title={t("common.edit")}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleChangeStatus(order)}
                                      title={t("admin.dashboard.changeStatus") || "Change Status"}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteOrder(order)}
                                      title={t("common.delete")}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
    </div>

    {/* Edit Order Dialog */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className={`max-w-md ${isRTL ? "text-right" : "text-left"}`}>
        <DialogHeader className={isRTL ? "text-right" : "text-left"}>
          <DialogTitle>{t("admin.dashboard.editOrder") || "Edit Order"}</DialogTitle>
          <DialogDescription>{t("admin.dashboard.editOrderDesc") || "Update order information."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("admin.dashboard.customer")} *</Label>
            <Input
              value={editCustomerName}
              onChange={(e) => setEditCustomerName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("common.email")}</Label>
            <Input
              type="email"
              value={editCustomerEmail}
              onChange={(e) => setEditCustomerEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("admin.dashboard.phone") || "Phone"}</Label>
            <Input
              value={editCustomerPhone}
              onChange={(e) => setEditCustomerPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("common.total")} (KWD) *</Label>
            <Input
              type="number"
              step="0.001"
              value={editTotal}
              onChange={(e) => setEditTotal(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className={isRTL ? "flex-row-reverse" : ""}>
          <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingOrder(null); }}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleUpdateOrder} disabled={updateOrderMutation.isPending}>
            {updateOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Change Status Dialog */}
    <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
      <DialogContent className={`max-w-md ${isRTL ? "text-right" : "text-left"}`}>
        <DialogHeader className={isRTL ? "text-right" : "text-left"}>
          <DialogTitle>{t("admin.dashboard.changeStatus") || "Change Order Status"}</DialogTitle>
          <DialogDescription>{t("admin.dashboard.changeStatusDesc") || "Update the order status."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("common.status")} *</Label>
            <Select value={editingStatus} onValueChange={setEditingStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t("common.pending")}</SelectItem>
                <SelectItem value="processing">{t("common.processing")}</SelectItem>
                <SelectItem value="shipped">{t("common.shipped")}</SelectItem>
                <SelectItem value="delivered">{t("common.delivered")}</SelectItem>
                <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
                <SelectItem value="paid">{t("admin.dashboard.paid") || "Paid"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className={isRTL ? "flex-row-reverse" : ""}>
          <Button variant="outline" onClick={() => { setIsStatusDialogOpen(false); setEditingOrder(null); }}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleUpdateStatus} disabled={updateStatusMutation.isPending}>
            {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Order Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent className={isRTL ? "text-right" : "text-left"}>
        <AlertDialogHeader className={isRTL ? "text-right" : "text-left"}>
          <AlertDialogTitle>{t("admin.dashboard.deleteOrder") || "Delete Order"}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.dashboard.deleteOrderDesc") || "Are you sure you want to delete this order? This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={isRTL ? "flex-row-reverse" : ""}>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteOrderMutation.mutate(deletingOrder?.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

function CategoriesSection() {
    const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
    const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategorySlug, setNewCategorySlug] = useState("");

    const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
        queryFn: async () => {
             const res = await fetch(buildApiUrl("/api/categories"));
             return res.json();
        }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const res = await apiRequest("POST", "/api/admin/categories", data);
             if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
             setNewCategoryName("");
             setNewCategorySlug("");
      toast({ title: "Success", description: "Category created" });
        }
  });

  const updateCategoryMutation = useMutation({
        mutationFn: async (data: { id: string; name: string; slug: string }) => {
            const res = await apiRequest("PATCH", `/api/admin/categories/${data.id}`, { name: data.name, slug: data.slug });
            if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      toast({ title: "Success", description: "Category updated" });
        }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/categories/${id}`);
            if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Success", description: "Category deleted" });
        }
    });

    const startEditing = (cat: any) => {
        setEditingCategory(cat);
        setEditName(cat.name);
        setEditSlug(cat.slug);
    };

    if (isLoading) return <LoadingPage message="Loading..." fullScreen={false} />;

  return (
        <div className="space-y-6">
            <Card className="border shadow-sm">
          <CardHeader>
                    <CardTitle className="text-lg font-semibold">{t("admin.dashboard.createCategory")}</CardTitle>
          </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
            <Input
                            placeholder={t("admin.dashboard.categoryName")} 
                            value={newCategoryName} 
                            onChange={e => setNewCategoryName(e.target.value)}
                            className="flex-1"
            />
            <Input
                            placeholder={t("admin.dashboard.categorySlug")} 
                            value={newCategorySlug} 
                            onChange={e => setNewCategorySlug(e.target.value)}
                            className="flex-1"
                        />
              <Button 
                            onClick={() => createCategoryMutation.mutate({ name: newCategoryName, slug: newCategorySlug })}
                            disabled={!newCategoryName || !newCategorySlug || createCategoryMutation.isPending}
                            size="icon"
                            className="h-10 w-10"
                        >
                            {createCategoryMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
              </Button>
            </div>
          </CardContent>
        </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories?.map((cat: any) => (
                    <Card key={cat.id} className="border shadow-sm">
                        <CardContent className="p-4">
                             {editingCategory?.id === cat.id ? (
                                 <div className="flex gap-2">
                      <Input
                        value={editName}
                                         onChange={e => setEditName(e.target.value)}
                                         className="flex-1"
                      />
                      <Input
                        value={editSlug}
                                         onChange={e => setEditSlug(e.target.value)}
                                         className="flex-1"
                      />
                      <Button 
                        size="icon" 
                                         onClick={() => updateCategoryMutation.mutate({ id: cat.id, name: editName, slug: editSlug })}
                        disabled={updateCategoryMutation.isPending}
                      >
                                         {updateCategoryMutation.isPending ? (
                                             <Loader2 className="w-4 h-4 animate-spin" />
                                         ) : (
                        <Save className="w-4 h-4" />
                                         )}
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
                                 <div className="flex items-center justify-between">
                        <div>
                                        <p className="font-semibold text-base">{cat.name}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{cat.slug}</p>
                        </div>
                                    <div className="flex gap-1">
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            onClick={() => startEditing(cat)}
                                            className="h-8 w-8"
                                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                                            onClick={() => deleteCategoryMutation.mutate(cat.id)}
                          disabled={deleteCategoryMutation.isPending}
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                                            {deleteCategoryMutation.isPending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                          <Trash2 className="w-4 h-4" />
                                            )}
                        </Button>
                      </div>
                                 </div>
                             )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function AdsSection() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ads, isLoading: isAdsLoading } = useQuery<any[]>({
    queryKey: ["/api/stories"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/stories"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch ads");
      return res.json();
    },
  });

  const { data: vendors } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/vendors");
      return res.json();
    }
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (adId: string) => {
      const res = await apiRequest("DELETE", `/api/stories/${adId}`);
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

  if (isAdsLoading) {
    return <LoadingPage message="Loading ads..." fullScreen={false} />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        {t("admin.dashboard.adsManagement") || "Featured Ads Management"}
      </h2>

      <Card>
        <CardContent className="p-0">
          {!ads || ads.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {t("admin.dashboard.noAds") || "No ads found"}
            </p>
          ) : (
            <div className="divide-y">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="p-4 md:p-6"
                  data-testid={`ad-row-${ad.id}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {ad.imageUrl && (
                      <div className="w-full lg:w-48 h-32 lg:h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={ad.imageUrl}
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
                              {getVendorName(ad.vendorId)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(ad.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {ad.content && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {ad.content}
                            </p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                          onClick={() => deleteAdMutation.mutate(ad.id)}
                          disabled={deleteAdMutation.isPending}
                          data-testid={`button-delete-ad-${ad.id}`}
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
    const { t } = useLanguage();
    const { data: requests, isLoading } = useQuery({
        queryKey: ["/api/admin/payout-requests"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/payout-requests");
            return res.json();
        }
    });

    if (isLoading) return <LoadingPage message="Loading..." fullScreen={false} />;

    return (
        <Card className="border shadow-sm">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="font-medium text-muted-foreground">{t("admin.dashboard.tabVendors")}</TableHead>
                            <TableHead className="font-medium text-muted-foreground text-right">{t("dashboard.amount") || "Amount"}</TableHead>
                            <TableHead className="font-medium text-muted-foreground">{t("common.status")}</TableHead>
                            <TableHead className="font-medium text-muted-foreground">{t("common.date")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!requests || requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                                    {t("admin.dashboard.noPayoutRequests") || "No payout requests"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((req: any) => (
                                <TableRow key={req.id} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">{req.vendorName}</TableCell>
                                    <TableCell className="text-right font-medium">{formatKWD(req.amount)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal capitalize">{req.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function ProductsSection() {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: products, isLoading: isProductsLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: vendors } = useVendors();
  
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productComparePrice, setProductComparePrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productVendor, setProductVendor] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productWarranty, setProductWarranty] = useState("");
  
  const productImageRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile: uploadProductImage, isUploading: isUploadingProduct } = useUpload({
    onSuccess: (response) => {
      setProductImages([...productImages, response.objectPath]);
      toast({ title: "Image Added" });
    },
    onError: (error) => toast({ title: "Upload Failed", description: error.message, variant: "destructive" }),
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/products", data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to add product" }));
        throw new Error(error.message || "Failed to add product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product Added", description: "Product has been created successfully." });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to add product.", 
        variant: "destructive" 
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product Updated", description: "Product has been updated successfully." });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetForm();
    },
    onError: () => toast({ title: "Error", description: "Failed to update product.", variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product Deleted", description: "Product has been deleted successfully." });
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" }),
  });

  const resetForm = () => {
    setProductName("");
    setProductDesc("");
    setProductPrice("");
    setProductComparePrice("");
    setProductStock("");
    setProductBrand("");
    setProductCategory("");
    setProductVendor("");
    setProductImages([]);
    setProductWarranty("");
  };

  const handleCreateProduct = () => {
    if (!productName || !productDesc || !productPrice || !productCategory || !productVendor) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    createProductMutation.mutate({
      vendorId: productVendor,
      categoryId: productCategory,
      name: productName,
      description: productDesc,
      price: productPrice,
      compareAtPrice: productComparePrice || null,
      stock: parseInt(productStock) || 0,
      brand: productBrand,
      images: productImages.length > 0 ? productImages : ["https://placehold.co/400x300?text=Product"],
      warrantyInfo: productWarranty || null,
    });
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductName(product.name || "");
    setProductDesc(product.description || "");
    setProductPrice(product.price || "");
    setProductComparePrice(product.compareAtPrice || "");
    setProductStock(product.stock?.toString() || "");
    setProductBrand(product.brand || "");
    setProductCategory(product.categoryId || "");
    setProductVendor(product.vendorId || "");
    setProductImages(product.images || []);
    setProductWarranty(product.warrantyInfo || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = () => {
    if (!productName || !productDesc || !productPrice || !productCategory || !productVendor || !editingProduct) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    updateProductMutation.mutate({
      id: editingProduct.id,
      data: {
        vendorId: productVendor,
        categoryId: productCategory,
        name: productName,
        description: productDesc,
        price: productPrice,
        compareAtPrice: productComparePrice || null,
        stock: parseInt(productStock) || 0,
        brand: productBrand,
        images: productImages.length > 0 ? productImages : ["https://placehold.co/400x300?text=Product"],
        warrantyInfo: productWarranty || null,
      },
    });
  };

  const handleDeleteProduct = (product: any) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const getVendorName = (vendorId: string) => {
    const vendor = vendors?.find((v) => v.id === vendorId);
    return vendor?.storeName || "Unknown Vendor";
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find((c) => c.id === categoryId);
    return category?.name || "Unknown Category";
  };

  if (isProductsLoading) {
    return <LoadingPage message="Loading products..." fullScreen={false} />;
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h2 className="text-xl font-semibold">{t("admin.dashboard.tabProducts") || "Products"}</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("admin.dashboard.addProduct") || "Add Product"}
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={`font-medium text-muted-foreground w-20 ${isRTL ? "text-right" : "text-left"}`}>{t("common.image")}</TableHead>
                <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("common.name")}</TableHead>
                <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("admin.dashboard.tabVendors")}</TableHead>
                <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("admin.dashboard.tabCategories")}</TableHead>
                <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-left" : "text-right"}`}>{t("common.price")}</TableHead>
                <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{t("common.status")}</TableHead>
                <TableHead className={`font-medium text-muted-foreground ${isRTL ? "text-left" : "text-right"}`}>{t("admin.dashboard.actions") || "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products || products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className={`text-muted-foreground py-12 ${isRTL ? "text-right" : "text-center"}`}>
                    {t("admin.dashboard.noProducts")}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product: any) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    <TableCell>
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={`font-medium ${isRTL ? "text-right" : "text-left"}`}>{product.name}</TableCell>
                    <TableCell className={`text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{getVendorName(product.vendorId)}</TableCell>
                    <TableCell className={`text-muted-foreground ${isRTL ? "text-right" : "text-left"}`}>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell className={`font-medium ${isRTL ? "text-left" : "text-right"}`}>{formatKWD(product.price)}</TableCell>
                    <TableCell className={isRTL ? "text-right" : "text-left"}>
                      <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                        {product.stock > 0 ? t("common.inStock") : t("common.outOfStock")}
                      </Badge>
                    </TableCell>
                    <TableCell className={isRTL ? "text-left" : "text-right"}>
                      <div className={`flex gap-1 ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteProduct(product)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                  </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Product Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isRTL ? "text-right" : "text-left"}`}>
          <DialogHeader className={isRTL ? "text-right" : "text-left"}>
            <DialogTitle>{t("admin.dashboard.addProduct")}</DialogTitle>
            <DialogDescription>{t("admin.dashboard.addProductDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("common.name")} *</Label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.dashboard.tabVendors")} *</Label>
                <Select value={productVendor} onValueChange={setProductVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.dashboard.selectVendor")} />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors?.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.storeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.dashboard.description")} *</Label>
              <Textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("common.price")} (KWD) *</Label>
                <Input type="number" step="0.001" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.dashboard.comparePrice")} (KWD)</Label>
                <Input type="number" step="0.001" value={productComparePrice} onChange={(e) => setProductComparePrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.dashboard.stock")} *</Label>
                <Input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.dashboard.brand")}</Label>
                <Input value={productBrand} onChange={(e) => setProductBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.dashboard.tabCategories")} *</Label>
                <Select value={productCategory} onValueChange={setProductCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.dashboard.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.dashboard.warranty") || "Warranty Info"}</Label>
              <Input value={productWarranty} onChange={(e) => setProductWarranty(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("common.image")}</Label>
              <div className="flex gap-2">
                <input ref={productImageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProductImage(f); }} />
                <Button variant="outline" onClick={() => productImageRef.current?.click()} disabled={isUploadingProduct}>
                  {isUploadingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                  {t("admin.dashboard.uploadImage") || "Upload Image"}
                </Button>
              </div>
              {productImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {productImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt="" className="w-20 h-20 object-cover rounded" />
                  <Button 
                        variant="destructive"
                        size="icon"
                        className={`absolute h-6 w-6 ${isRTL ? "-top-2 -left-2" : "-top-2 -right-2"}`}
                        onClick={() => setProductImages(productImages.filter((_, i) => i !== idx))}
                      >
                        <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
          <DialogFooter className={isRTL ? "flex-row-reverse" : ""}>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateProduct} disabled={createProductMutation.isPending}>
              {createProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isRTL ? "text-right" : "text-left"}`}>
          <DialogHeader className={isRTL ? "text-right" : "text-left"}>
            <DialogTitle>{t("admin.dashboard.editProduct")}</DialogTitle>
            <DialogDescription>{t("admin.dashboard.editProductDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("common.name")} *</Label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.dashboard.tabVendors")} *</Label>
                <Select value={productVendor} onValueChange={setProductVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.dashboard.selectVendor")} />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors?.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.storeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.dashboard.description")} *</Label>
              <Textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("common.price")} (KWD) *</Label>
                <Input type="number" step="0.001" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.dashboard.comparePrice")} (KWD)</Label>
                <Input type="number" step="0.001" value={productComparePrice} onChange={(e) => setProductComparePrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.dashboard.stock")} *</Label>
                <Input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.dashboard.brand")}</Label>
                <Input value={productBrand} onChange={(e) => setProductBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.dashboard.tabCategories")} *</Label>
                <Select value={productCategory} onValueChange={setProductCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.dashboard.warranty")}</Label>
              <Input value={productWarranty} onChange={(e) => setProductWarranty(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("common.image")}</Label>
              <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <input ref={productImageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProductImage(f); }} />
                <Button variant="outline" onClick={() => productImageRef.current?.click()} disabled={isUploadingProduct}>
                  {isUploadingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                  {t("admin.dashboard.uploadImage")}
                </Button>
              </div>
              {productImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {productImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt="" className="w-20 h-20 object-cover rounded" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className={`absolute h-6 w-6 ${isRTL ? "-top-2 -left-2" : "-top-2 -right-2"}`}
                        onClick={() => setProductImages(productImages.filter((_, i) => i !== idx))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className={isRTL ? "flex-row-reverse" : ""}>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingProduct(null); resetForm(); }}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdateProduct} disabled={updateProductMutation.isPending}>
              {updateProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className={isRTL ? "text-right" : "text-left"}>
          <AlertDialogHeader className={isRTL ? "text-right" : "text-left"}>
            <AlertDialogTitle>{t("admin.dashboard.deleteProduct")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.dashboard.deleteProductDesc", { productName: deletingProduct?.name || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? "flex-row-reverse" : ""}>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductMutation.mutate(deletingProduct?.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BundlesSection() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const { data: products } = useProducts();
  const { data: vendors } = useVendors();
  const { data: categories } = useCategories();
  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [bundleName, setBundleName] = useState("");
  const [bundleDesc, setBundleDesc] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [bundleVendor, setBundleVendor] = useState("");
  const [bundleCategory, setBundleCategory] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; quantity: number }[]>([]);
  const [bundleImage, setBundleImage] = useState("");

  const { uploadFile: uploadBundleImage, isUploading: isUploadingBundle } = useUpload({
    onSuccess: (response) => {
      setBundleImage(response.objectPath);
      toast({ title: "Image Uploaded" });
    },
    onError: (error) => toast({ title: "Upload Failed", description: error.message, variant: "destructive" }),
  });

  // Pre-select default vendor and category if available
  useEffect(() => {
    if (isCreateDialogOpen) {
      if (vendors) {
        const defaultVendor = vendors.find(v => v.storeName?.toLowerCase().includes("motorbuy"));
        if (defaultVendor) setBundleVendor(defaultVendor.id);
      }
      
      if (categories) {
        const defaultCategory = categories.find(c => c.name?.toLowerCase().includes("bundles"));
        if (defaultCategory) setBundleCategory(defaultCategory.id);
      }
    }
  }, [isCreateDialogOpen, vendors, categories]);

  const bundles = products?.filter(p => p.isBundle) || [];
  const regularProducts = products?.filter(p => !p.isBundle) || [];

  const handleAddProductToBundle = (productId: string) => {
    if (selectedProducts.find(p => p.productId === productId)) return;
    setSelectedProducts([...selectedProducts, { productId, quantity: 1 }]);
  };

  const handleRemoveProductFromBundle = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  const calculateOriginalPrice = () => {
    return selectedProducts.reduce((sum, item) => {
      const product = regularProducts.find(p => p.id === item.productId);
      return sum + (parseFloat(product?.price || "0") * item.quantity);
    }, 0).toFixed(3);
  };

  const handleCreateBundle = () => {
    if (!bundleName || !bundlePrice || !bundleVendor || !bundleCategory || selectedProducts.length === 0) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    createProductMutation.mutate({
      name: bundleName,
      description: bundleDesc || "Bundle Special",
      price: bundlePrice,
      vendorId: bundleVendor,
      categoryId: bundleCategory,
      brand: "Bundle",
      stock: 100, // Default stock for bundle
      images: bundleImage ? [bundleImage] : [],
      isBundle: true,
      bundleItems: selectedProducts
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setBundleName("");
        setBundleDesc("");
        setBundlePrice("");
        setBundleVendor("");
        setBundleCategory("");
        setSelectedProducts([]);
        setBundleImage("");
        toast({ title: "Success", description: "Bundle created successfully" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("admin.dashboard.tabBundles") || "Bundles"}</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("admin.dashboard.createBundle") || "Create Bundle"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundles.map(bundle => (
          <Card key={bundle.id} className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {bundle.images?.[0] ? (
                <img src={bundle.images[0]} alt={bundle.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{bundle.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{bundle.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{bundle.price} KWD</div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Includes:</p>
                <div className="space-y-1">
                  {bundle.bundleItems?.map((item: any, i: number) => (
                    <div key={i} className="text-sm flex justify-between">
                      <span className="truncate flex-1">{item.product?.name || "Unknown Product"}</span>
                      <span className="text-muted-foreground">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="destructive" size="sm" onClick={() => {
                  if (confirm("Are you sure you want to delete this bundle?")) {
                    deleteProductMutation.mutate(bundle.id);
                  }
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Bundle</DialogTitle>
            <DialogDescription>Combine products into a special package deal</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bundle Name</Label>
                <Input value={bundleName} onChange={e => setBundleName(e.target.value)} placeholder="e.g. Summer Service Package" />
              </div>
              <div className="space-y-2">
                <Label>Bundle Price (KWD)</Label>
                <Input type="number" value={bundlePrice} onChange={e => setBundlePrice(e.target.value)} placeholder="0.000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={bundleDesc} onChange={e => setBundleDesc(e.target.value)} placeholder="Describe this bundle..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={bundleVendor} onValueChange={setBundleVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors?.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.storeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={bundleCategory} onValueChange={setBundleCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bundle Image</Label>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  if (e.target.files?.[0]) uploadBundleImage(e.target.files[0]);
                }} 
              />
            </div>

            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <Label>Included Products</Label>
                <span className="text-sm text-muted-foreground">Original Total: {calculateOriginalPrice()} KWD</span>
              </div>
              
              <div className="flex gap-2">
                <Select onValueChange={handleAddProductToBundle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add product to bundle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {regularProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.price} KWD)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {selectedProducts.map((item, i) => {
                  const product = regularProducts.find(p => p.id === item.productId);
                  return (
                    <div key={i} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        {product?.images?.[0] && (
                          <img src={product.images[0]} className="w-8 h-8 rounded object-cover" />
                        )}
                        <span className="text-sm font-medium">{product?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{product?.price} KWD</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveProductFromBundle(item.productId)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBundle} disabled={createProductMutation.isPending}>
              {createProductMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
