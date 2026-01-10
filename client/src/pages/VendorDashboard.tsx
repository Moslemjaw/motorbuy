import { LoadingPage } from "@/components/LoadingPage";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useRole, useProducts, useCategories, useDeleteProduct } from "@/hooks/use-motorbuy";
import { useLanguage } from "@/lib/i18n";
import { 
  Package, ShoppingCart, Loader2, Plus, Image, Trash2, BookOpen, 
  Store, TrendingUp, DollarSign, Clock, Wallet, Send, Camera, Save, Edit, AlertTriangle, X
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatKWD } from "@/lib/currency";
import { useUpload } from "@/hooks/use-upload";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { buildApiUrl } from "@/lib/api-config";
import type { Order, VendorStory, Vendor } from "@shared/schema";

interface VendorAnalytics {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: string;
  pendingOrders: number;
  pendingPayoutKwd: string;
  grossSalesKwd: string;
}

export default function VendorDashboard() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, isRTL } = useLanguage();
  const [location] = useLocation();
  
  // Get active tab from URL hash or default to "products"
  const getActiveTab = () => {
    const hash = window.location.hash.replace("#", "");
    if (hash && ["products", "shop", "orders"].includes(hash)) {
      return hash;
    }
    return "products";
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/orders"] });
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

  const { data: vendorProfile, isLoading: isProfileLoading } = useQuery<Vendor | null>({
    queryKey: ["/api/vendor/profile"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/vendor/profile"), { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch vendor profile: ${res.status}`);
      }
      const data = await res.json();
      return data || null;
    },
    enabled: !!user && roleData?.role === "vendor",
    retry: false,
  });

  const { data: analytics } = useQuery<VendorAnalytics>({
    queryKey: ["/api/vendor/analytics"],
    enabled: !!vendorProfile,
  });

  const myProducts = products?.filter(p => p.vendorId === vendorProfile?.id) || [];

  const { data: vendorOrders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/vendor/orders"],
    enabled: !!vendorProfile,
  });

  // Fetch stories for this vendor from backend
  const STORIES_QUERY_KEY = ["/api/vendor/stories"];

  const { data: myStories = [], isLoading: isStoriesLoading } = useQuery<VendorStory[]>({
    queryKey: STORIES_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/vendor/stories"), {
        credentials: "include",
  });
      if (res.status === 403) return []; // not a vendor
      if (!res.ok) throw new Error("Failed to fetch ads");
      return res.json();
    },
    enabled: !!user && roleData?.role === "vendor",
  });

  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productComparePrice, setProductComparePrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productWarranty, setProductWarranty] = useState("");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [storyContent, setStoryContent] = useState("");
  const [storyImage, setStoryImage] = useState<string | null>(null);

  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeBio, setStoreBio] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);
  const [storeCoverImageUrl, setStoreCoverImageUrl] = useState<string | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  const productImageRef = useRef<HTMLInputElement>(null);
  const storyImageRef = useRef<HTMLInputElement>(null);
  const storeLogoRef = useRef<HTMLInputElement>(null);
  const storeCoverRef = useRef<HTMLInputElement>(null);

  const { uploadFile: uploadProductImage, isUploading: isUploadingProduct } = useUpload({
    onSuccess: (response) => {
      setProductImages([...productImages, response.objectPath]);
      toast({ title: "Image Added" });
    },
    onError: (error) => toast({ title: "Upload Failed", description: error.message, variant: "destructive" }),
  });

  const { uploadFile: uploadStoryImage, isUploading: isUploadingStory } = useUpload({
    onSuccess: (response) => {
      // Convert objectPath to full URL if needed
      const imageUrl = response.objectPath.startsWith('http') 
        ? response.objectPath 
        : buildApiUrl(response.objectPath);
      setStoryImage(imageUrl);
      toast({ title: "Image Uploaded" });
    },
    onError: (error) => toast({ title: "Upload Failed", description: error.message, variant: "destructive" }),
  });

  const { uploadFile: uploadStoreLogo, isUploading: isUploadingStoreLogo } = useUpload({
    onSuccess: (response) => {
      setStoreLogoUrl(response.objectPath);
      toast({ title: "Logo Uploaded" });
    },
    onError: (error) => toast({ title: "Upload Failed", description: error.message, variant: "destructive" }),
  });

  const { uploadFile: uploadStoreCover, isUploading: isUploadingStoreCover } = useUpload({
    onSuccess: (response) => {
      setStoreCoverImageUrl(response.objectPath);
      toast({ title: "Cover Image Uploaded" });
    },
    onError: (error) => toast({ title: "Upload Failed", description: error.message, variant: "destructive" }),
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/vendor/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Profile Created", description: "Your vendor profile has been set up!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to create profile.", variant: "destructive" }),
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/analytics"] });
      toast({ title: "Product Added" });
      setProductName(""); setProductDesc(""); setProductPrice(""); setProductComparePrice("");
      setProductStock(""); setProductBrand(""); setProductCategory(""); setProductImages([]); setProductWarranty("");
    },
    onError: () => toast({ title: "Error", description: "Failed to add product.", variant: "destructive" }),
  });

  const deleteProductMutation = useDeleteProduct();

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/analytics"] });
      toast({ title: "Product Updated" });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      setProductName(""); setProductDesc(""); setProductPrice(""); setProductComparePrice("");
      setProductStock(""); setProductBrand(""); setProductCategory(""); setProductImages([]); setProductWarranty("");
    },
    onError: () => toast({ title: "Error", description: "Failed to update product.", variant: "destructive" }),
  });

  const addStoryMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/stories", data),
    onSuccess: async () => {
      // Invalidate and refetch stories to ensure the new one appears
      await queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      await queryClient.refetchQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Ad Posted", description: "Your ad has been shared with customers." });
      setStoryContent("");
      setStoryImage(null);
      // Clear the file input
      if (storyImageRef.current) {
        storyImageRef.current.value = "";
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to post ad.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const [editingStory, setEditingStory] = useState<any | null>(null);
  const [isEditStoryDialogOpen, setIsEditStoryDialogOpen] = useState(false);

  const updateStoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/stories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
      toast({ title: "Ad Updated", description: "Your ad has been updated." });
      setIsEditStoryDialogOpen(false);
      setEditingStory(null);
      setStoryContent("");
      setStoryImage(null);
      if (storyImageRef.current) {
        storyImageRef.current.value = "";
      }
    },
    onError: () => toast({ title: "Error", description: "Failed to update ad.", variant: "destructive" }),
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/stories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
      toast({ title: "Ad Deleted", description: "Your ad has been removed." });
      },
    onError: () => toast({ title: "Error", description: "Failed to delete ad.", variant: "destructive" }),
  });

  const updateShopMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("PATCH", `/api/vendor/profile`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Shop Updated", description: "Your shop details have been saved." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update shop.", variant: "destructive" }),
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (vendorProfile) {
      setStoreName(vendorProfile.storeName || "");
      setStoreDescription(vendorProfile.description || "");
      setStoreBio(vendorProfile.bio || "");
      setStoreLogoUrl(vendorProfile.logoUrl || null);
      setStoreCoverImageUrl(vendorProfile.coverImageUrl || null);
    }
  }, [vendorProfile]);

  if (isAuthLoading || isRoleLoading || isProfileLoading) {
          return <LoadingPage message={t("vendor.dashboard.loading")} />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (roleData?.role !== "vendor") {
    return (
      <div className="min-h-screen bg-background font-body">
        <div className="flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">{t("vendor.dashboard.vendorAccess")}</h1>
            <p className="text-muted-foreground mb-6">{t("vendor.dashboard.needVendor")}</p>
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">{t("vendor.dashboard.goHome")}</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateProfile = () => {
    if (!storeName.trim()) {
      toast({ title: "Business Name Required", variant: "destructive" });
      return;
    }
    createProfileMutation.mutate({
      storeName: storeName.trim(),
      description: storeDescription.trim(),
    });
  };

  const handleAddProduct = () => {
    if (!productName || !productDesc || !productPrice || !productCategory || !vendorProfile) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    addProductMutation.mutate({
      vendorId: vendorProfile.id,
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
    setProductImages(product.images || []);
    setProductWarranty(product.warrantyInfo || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = () => {
    if (!productName || !productDesc || !productPrice || !productCategory || !editingProduct) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    updateProductMutation.mutate({
      id: editingProduct.id,
      data: {
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

  const confirmDeleteProduct = () => {
    if (!deletingProduct) return;
    deleteProductMutation.mutate(deletingProduct.id, {
      onSuccess: () => {
        toast({ title: "Product Deleted", description: `${deletingProduct.name} has been deleted.` });
        setIsDeleteDialogOpen(false);
        setDeletingProduct(null);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
      },
    });
  };

  const handlePostStory = () => {
    if (!storyContent && !storyImage) {
      toast({ title: "Empty Ad", description: "Add content or an image.", variant: "destructive" });
      return;
    }
    if (!vendorProfile?.id) {
      toast({ title: "Error", description: "Vendor profile not found.", variant: "destructive" });
      return;
    }
    addStoryMutation.mutate({
      vendorId: vendorProfile.id,
      content: storyContent || undefined,
      imageUrl: storyImage || null,
    });
  };

  const handleEditStory = (story: any) => {
    setEditingStory(story);
    setStoryContent(story.content || "");
    setStoryImage(story.imageUrl || null);
    setIsEditStoryDialogOpen(true);
  };

  const handleUpdateStory = () => {
    if (!editingStory) return;
    if (!storyContent && !storyImage) {
      toast({ title: "Empty Ad", description: "Add content or an image.", variant: "destructive" });
      return;
    }
    updateStoryMutation.mutate({
      id: editingStory.id,
      data: {
        content: storyContent || null,
        imageUrl: storyImage || null,
      },
    });
  };

  // Show profile creation form if vendor profile doesn't exist
  if (!vendorProfile && !isProfileLoading) {
    return (
      <div className="min-h-screen bg-muted/30 font-body">
        <div className="flex items-center justify-center">
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">{t("vendor.dashboard.welcome")}</h1>
            <p className="text-muted-foreground">{t("vendor.dashboard.setupProfile")}</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{t("vendor.dashboard.createProfile")}</CardTitle>
              <CardDescription>{t("vendor.dashboard.fillDetails")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">{t("vendor.dashboard.businessName")} *</Label>
                <Input 
                  id="storeName"
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)} 
                  placeholder="e.g., AutoParts Kuwait" 
                  data-testid="input-store-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeDesc">{t("vendor.dashboard.description")}</Label>
                <Textarea 
                  id="storeDesc"
                  value={storeDescription} 
                  onChange={(e) => setStoreDescription(e.target.value)} 
                  placeholder="Tell customers about your business..."
                  className="min-h-[100px]"
                  data-testid="input-store-description"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateProfile} 
                disabled={createProfileMutation.isPending}
                data-testid="button-create-shop"
              >
                {createProfileMutation.isPending ? (
                  <>
                    <Loader2 className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} animate-spin`} />
                    {t("vendor.dashboard.creating")}
                  </>
                ) : (
                  t("vendor.dashboard.getStarted")
                )}
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      value: "products",
      icon: Package,
      label: t("vendor.dashboard.tabProducts"),
    },
    {
      value: "shop",
      icon: Store,
      label: t("vendor.dashboard.tabShop"),
    },
    {
      value: "orders",
      icon: ShoppingCart,
      label: t("vendor.dashboard.tabOrders"),
    },
    {
      value: "wallet",
      icon: Wallet,
      label: t("wallet.title"),
      isLink: true,
      href: "/vendor/wallet",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 font-body">
      <Navbar />
      <div className="flex">
        {/* Left Sidebar Navigation */}
        <aside
          className={`hidden lg:block w-64 bg-card border-r shadow-sm sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto ${
            isRTL ? "border-l border-r-0" : ""
          }`}
        >
          <div className="p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isLink ? false : activeTab === item.value;
              if (item.isLink) {
                return (
                  <Link
                    key={item.value}
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground`}
                    data-testid={`nav-${item.value}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              }
              return (
                <button
                  key={item.value}
                  onClick={() => {
                    setActiveTab(item.value);
                    window.location.hash = item.value;
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 lg:py-8">
            {/* Header */}
            <div className={`mb-8 ${isRTL ? "text-right" : "text-left"}`}>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                {t("vendor.dashboard.title")}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">{vendorProfile?.storeName || ""}</p>
            </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-blue-500 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1 text-blue-700 dark:text-blue-300" data-testid="text-vendor-products">
                {analytics?.totalProducts || myProducts.length}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">{t("vendor.dashboard.products")}</p>
            </CardContent>
          </Card>
          
          <Card className="border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-green-500 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1 text-green-700 dark:text-green-300" data-testid="text-vendor-orders">
                {analytics?.totalOrders || 0}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">{t("vendor.dashboard.orders")}</p>
            </CardContent>
          </Card>
          
          <Card className="border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-amber-500 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1 text-amber-700 dark:text-amber-300" data-testid="text-vendor-revenue">
                {analytics?.grossSalesKwd || "0"}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">{t("vendor.dashboard.revenue")}</p>
            </CardContent>
          </Card>
          
          <Card className="border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-purple-500 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1 text-purple-700 dark:text-purple-300" data-testid="text-vendor-payout">
                {analytics?.pendingPayoutKwd || "0"}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400">{t("vendor.dashboard.pending")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">{t("vendor.dashboard.createAd")}</CardTitle>
              <CardDescription className="text-sm">{t("vendor.dashboard.shareUpdates")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Textarea 
                    value={storyContent} 
                    onChange={(e) => setStoryContent(e.target.value)} 
                    placeholder={t("vendor.dashboard.sharePlaceholder")}
                    className="min-h-[80px] resize-none"
                    data-testid="input-story-content"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <input ref={storyImageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadStoryImage(f); }} />
                  <Button variant="outline" size="icon" onClick={() => storyImageRef.current?.click()} disabled={isUploadingStory} data-testid="button-add-story-image">
                    {isUploadingStory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                  </Button>
                  <Button size="icon" onClick={handlePostStory} disabled={addStoryMutation.isPending || (!storyContent && !storyImage)} data-testid="button-post-story">
                    {addStoryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {storyImage && (
                <div className="mt-3 relative inline-block">
                  <img src={storyImage} alt="" className="h-20 rounded-lg object-cover" />
                  <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => setStoryImage(null)} data-testid="button-remove-story-image">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {t("vendor.dashboard.yourAds")} {myStories.length > 0 && `(${myStories.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isStoriesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : myStories.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-1">{t("vendor.dashboard.noAds")}</p>
                  <p className="text-xs text-muted-foreground">{t("vendor.dashboard.createFirst")}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {myStories.map((story) => (
                    <div key={story.id} className="text-sm p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors border border-border/50" data-testid={`story-row-${story.id}`}>
                      {story.imageUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden">
                          <img src={story.imageUrl} alt="" className="w-full h-32 object-cover" />
                        </div>
                      )}
                      {story.content && (
                        <p className="line-clamp-3 mb-3 text-foreground">{story.content}</p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                        <p className="text-xs text-muted-foreground">
                          {story.createdAt ? new Date(story.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }) : "Recently"}
                        </p>
                        <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                            className="h-8 w-8" 
                            onClick={() => handleEditStory(story)}
                            data-testid={`button-edit-story-${story.id}`}
                            title="Edit ad"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                          onClick={() => deleteStoryMutation.mutate(story.id)}
                            disabled={deleteStoryMutation.isPending}
                          data-testid={`button-delete-story-${story.id}`}
                            title="Delete ad"
                          >
                            {deleteStoryMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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

            {/* Mobile Tabs */}
            <div className="lg:hidden mb-6">
              <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); window.location.hash = value; }} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="products" className="py-3" data-testid="tab-products">
                    <Package className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t("vendor.dashboard.tabProducts")}
                  </TabsTrigger>
                  <TabsTrigger value="shop" className="py-3" data-testid="tab-shop">
                    <Store className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t("vendor.dashboard.tabShop")}
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="py-3" data-testid="tab-orders">
                    <ShoppingCart className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t("vendor.dashboard.tabOrders")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content based on active tab */}
            {activeTab === "shop" && (
              <div>
                <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Store className="w-5 h-5 text-primary" /> {t("vendor.dashboard.shopBranding")}
                  </CardTitle>
                  <CardDescription className="text-sm">{t("vendor.dashboard.updateLogo")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative h-48 bg-muted rounded-lg overflow-hidden">
                    {storeCoverImageUrl ? (
                      <img src={storeCoverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Image className="w-12 h-12" />
                      </div>
                    )}
                    <input ref={storeCoverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadStoreCover(f); }} />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="absolute bottom-3 right-3"
                      onClick={() => storeCoverRef.current?.click()}
                      disabled={isUploadingStoreCover}
                    >
                      {isUploadingStoreCover ? <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? "ml-2" : "mr-2"}`} /> : <Camera className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />}
                      {t("vendor.dashboard.changeCover")}
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {storeLogoUrl ? (
                        <img src={storeLogoUrl} alt="Logo" className="w-24 h-24 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border">
                          <Store className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <input ref={storeLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadStoreLogo(f); }} />
                      <button 
                        onClick={() => storeLogoRef.current?.click()}
                        disabled={isUploadingStoreLogo}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
                      >
                        {isUploadingStoreLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      </button>
                    </div>
                    <div>
                      <p className="font-medium">{t("vendor.dashboard.shopLogo")}</p>
                      <p className="text-sm text-muted-foreground">{t("vendor.dashboard.squareImage")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5" /> {t("vendor.dashboard.shopDetails")}
                  </CardTitle>
                  <CardDescription>{t("vendor.dashboard.updateInfo")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("vendor.dashboard.shopName")} *</Label>
                    <Input 
                      value={storeName} 
                      onChange={(e) => setStoreName(e.target.value)} 
                      placeholder="Your shop name" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("vendor.dashboard.shortDescription")}</Label>
                    <Input 
                      value={storeDescription} 
                      onChange={(e) => setStoreDescription(e.target.value)} 
                      placeholder="Brief description of your shop" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("vendor.dashboard.aboutShop")}</Label>
                    <Textarea 
                      value={storeBio} 
                      onChange={(e) => setStoreBio(e.target.value)} 
                      placeholder={t("vendor.dashboard.tellCustomers")}
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => {
                      const updates: any = {};
                      if (storeName) updates.storeName = storeName;
                      if (storeDescription) updates.description = storeDescription;
                      if (storeBio) updates.bio = storeBio;
                      if (storeLogoUrl) updates.logoUrl = storeLogoUrl;
                      if (storeCoverImageUrl) updates.coverImageUrl = storeCoverImageUrl;
                      updateShopMutation.mutate(updates);
                    }}
                    disabled={updateShopMutation.isPending || !storeName.trim()}
                  >
                    {updateShopMutation.isPending ? (
                      <>
                        <Loader2 className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} animate-spin`} />
                        {t("vendor.dashboard.saving")}
                      </>
                    ) : (
                      <>
                        <Save className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {t("vendor.dashboard.saveShop")}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div>
                <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold">{t("vendor.dashboard.recentOrders")}</CardTitle>
                <div className="w-[200px]">
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.dashboard.filterStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.dashboard.allStatuses")}</SelectItem>
                      <SelectItem value="pending">{t("common.pending")}</SelectItem>
                      <SelectItem value="processing">{t("common.processing")}</SelectItem>
                      <SelectItem value="shipped">{t("common.shipped")}</SelectItem>
                      <SelectItem value="delivered">{t("common.delivered")}</SelectItem>
                      <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isOrdersLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : !vendorOrders || vendorOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{t("vendor.dashboard.noOrders")}</p>
                    <p className="text-sm mt-1">{t("vendor.dashboard.ordersWillAppear")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vendorOrders
                      .filter(order => orderStatusFilter === "all" || order.status === orderStatusFilter)
                      .map((order: any) => (
                      <Card key={order.id} className="p-4 border shadow-sm" data-testid={`vendor-order-${order.id}`}>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono text-sm text-muted-foreground">{t("vendor.dashboard.order")} #{String(order.id).slice(-8)}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                              <div className="font-bold text-lg">{formatKWD(order.vendorTotal || order.total)}</div>
                              <Select
                                defaultValue={order.status}
                                onValueChange={(value) => updateStatusMutation.mutate({ orderId: order.id, status: value })}
                              >
                                <SelectTrigger className="w-[130px] h-8 capitalize">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">{t("common.pending")}</SelectItem>
                                  <SelectItem value="processing">{t("common.processing")}</SelectItem>
                                  <SelectItem value="shipped">{t("common.shipped")}</SelectItem>
                                  <SelectItem value="delivered">{t("common.delivered")}</SelectItem>
                                  <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {(order.customerName || order.guestName) && (
                            <div className="border-t pt-3 space-y-1 text-sm">
                              <div className="font-medium">{t("vendor.dashboard.customerInfo")}:</div>
                              <div className="text-muted-foreground">
                                <div>{t("vendor.dashboard.name")}: {order.customerName || order.guestName}</div>
                                {(order.customerEmail || order.guestEmail) && (
                                  <div>{t("vendor.dashboard.email")}: {order.customerEmail || order.guestEmail}</div>
                                )}
                                {(order.customerPhone || order.guestPhone) && (
                                  <div>{t("vendor.dashboard.phone")}: {order.customerPhone || order.guestPhone}</div>
                                )}
                                {order.customerAddress && (
                                  <div>{t("vendor.dashboard.address")}: {order.customerAddress}</div>
                                )}
                                {order.customerCity && (
                                  <div>{t("vendor.dashboard.city")}: {order.customerCity}</div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {order.items && order.items.length > 0 && (
                            <div className="border-t pt-3">
                              <div className="text-sm font-medium mb-2">{t("vendor.dashboard.items")}:</div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                {order.items.map((item: any, idx: number) => (
                                  <div key={idx}>
                                    {item.product?.name || "Unknown"} - Qty: {item.quantity} × {formatKWD(item.price)}
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
            )}

            {activeTab === "products" && (
              <div>
                <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Plus className="w-5 h-5 text-primary" /> {t("vendor.dashboard.addNewProduct")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("vendor.dashboard.productName")} *</Label>
                    <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Performance Brake Pads" data-testid="input-product-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("vendor.dashboard.description")} *</Label>
                    <Textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Product details..." data-testid="input-product-desc" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("vendor.dashboard.originalPrice")} *</Label>
                      <Input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="0.000" data-testid="input-product-price" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("vendor.dashboard.salePrice")}</Label>
                      <Input type="number" value={productComparePrice} onChange={(e) => setProductComparePrice(e.target.value)} placeholder="For discounts" data-testid="input-compare-price" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("vendor.dashboard.stock")}</Label>
                      <Input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} placeholder="0" data-testid="input-product-stock" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("vendor.dashboard.brand")}</Label>
                      <Input value={productBrand} onChange={(e) => setProductBrand(e.target.value)} placeholder="Brand name" data-testid="input-product-brand" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("vendor.dashboard.category")} *</Label>
                    <Select value={productCategory} onValueChange={setProductCategory}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("vendor.dashboard.warranty")}</Label>
                    <Input value={productWarranty} onChange={(e) => setProductWarranty(e.target.value)} placeholder="e.g., 2 years" data-testid="input-warranty" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("vendor.dashboard.productImages")}</Label>
                    <input ref={productImageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProductImage(f); }} />
                    <div className="flex gap-2 flex-wrap">
                      {productImages.map((img, i) => (
                        <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded border" />
                      ))}
                      <Button variant="outline" size="icon" onClick={() => productImageRef.current?.click()} disabled={isUploadingProduct} data-testid="button-add-image">
                        {isUploadingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleAddProduct} disabled={addProductMutation.isPending} data-testid="button-add-product">
                    {addProductMutation.isPending ? t("common.loading") : t("vendor.dashboard.addProduct")}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">{t("vendor.dashboard.yourProducts")} ({myProducts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {myProducts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">{t("vendor.dashboard.noProducts")}</p>
                      <p className="text-sm mt-1">{t("vendor.dashboard.addFirst")}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {myProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:border-primary/30 transition-colors" data-testid={`product-row-${product.id}`}>
                          <img src={product.images?.[0] || "https://placehold.co/50"} alt="" className="w-14 h-14 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{formatKWD(product.price)}</div>
                          </div>
                          <Badge variant="outline">{product.stock} {t("vendor.dashboard.inStock")}</Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditProduct(product)}
                              data-testid={`button-edit-product-${product.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteProduct(product)}
                              data-testid={`button-delete-product-${product.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("vendor.dashboard.editProduct")}</DialogTitle>
            <DialogDescription>{t("vendor.dashboard.updateProduct")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("vendor.dashboard.productName")} *</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product name"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("vendor.dashboard.description")} *</Label>
              <Textarea
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                placeholder="Product description"
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("vendor.dashboard.originalPrice")} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vendor.dashboard.salePrice")} (KWD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productComparePrice}
                  onChange={(e) => setProductComparePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("vendor.dashboard.stock")} *</Label>
                <Input
                  type="number"
                  value={productStock}
                  onChange={(e) => setProductStock(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vendor.dashboard.brand")} *</Label>
                <Input
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  placeholder="Brand name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("vendor.dashboard.category")} *</Label>
              <Select value={productCategory} onValueChange={setProductCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("vendor.dashboard.warranty")}</Label>
              <Input
                value={productWarranty}
                onChange={(e) => setProductWarranty(e.target.value)}
                placeholder="e.g., 1 year warranty"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("vendor.dashboard.productImages")}</Label>
              <div className="flex gap-2 flex-wrap">
                {productImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt="" className="w-20 h-20 object-cover rounded" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setProductImages(productImages.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <input ref={productImageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProductImage(f); }} />
              <Button variant="outline" onClick={() => productImageRef.current?.click()} disabled={isUploadingProduct}>
                {isUploadingProduct ? <Loader2 className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} animate-spin`} /> : <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />}
                {t("common.add")} {t("common.image")}
              </Button>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleUpdateProduct} disabled={updateProductMutation.isPending}>
                {updateProductMutation.isPending ? (
                  <>
                    <Loader2 className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} animate-spin`} />
                    {t("vendor.dashboard.updating")}
                  </>
                ) : (
                  t("vendor.dashboard.updateProduct")
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone and will also remove this product from all customer carts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingProduct(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              disabled={deleteProductMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Story Dialog */}
      <Dialog open={isEditStoryDialogOpen} onOpenChange={setIsEditStoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("vendor.dashboard.editAd")}</DialogTitle>
            <DialogDescription>
              {t("vendor.dashboard.updateAd")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editStoryContent">Content</Label>
              <Textarea
                id="editStoryContent"
                value={storyContent}
                onChange={(e) => setStoryContent(e.target.value)}
                placeholder="Share news, promotions, or new arrivals..."
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <input 
                ref={storyImageRef} 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => { 
                  const f = e.target.files?.[0]; 
                  if (f) uploadStoryImage(f); 
                }} 
              />
              <div className="flex gap-2 flex-wrap">
                {storyImage && (
                  <div className="relative">
                    <img src={storyImage} alt="" className="w-32 h-32 object-cover rounded border" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute -top-2 -right-2 h-6 w-6" 
                      onClick={() => setStoryImage(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => storyImageRef.current?.click()} 
                  disabled={isUploadingStory}
                >
                  {isUploadingStory ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Image className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditStoryDialogOpen(false);
              setEditingStory(null);
              setStoryContent("");
              setStoryImage(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStory} disabled={updateStoryMutation.isPending}>
              {updateStoryMutation.isPending ? (
                <>
                  <Loader2 className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} animate-spin`} />
                  {t("vendor.dashboard.updating")}
                </>
              ) : (
                <>
                  <Save className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t("vendor.dashboard.updateAdBtn")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
