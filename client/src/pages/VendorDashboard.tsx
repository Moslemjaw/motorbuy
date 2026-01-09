import { Navbar } from "@/components/Navbar";
import { LoadingPage } from "@/components/LoadingPage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useRole, useProducts, useCategories, useDeleteProduct } from "@/hooks/use-motorbuy";
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
  const { data: myStories = [], isLoading: isStoriesLoading } = useQuery<VendorStory[]>({
    queryKey: ["/api/vendor/stories"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/vendor/stories"), {
        credentials: "include",
      });
      if (res.status === 403) return []; // not a vendor
      if (!res.ok) throw new Error("Failed to fetch spotlights");
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
      toast({ title: "Spotlight Posted", description: "Your spotlight has been shared with customers." });
      setStoryContent("");
      setStoryImage(null);
      // Clear the file input
      if (storyImageRef.current) {
        storyImageRef.current.value = "";
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to post spotlight.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const [editingStory, setEditingStory] = useState<any | null>(null);
  const [isEditStoryDialogOpen, setIsEditStoryDialogOpen] = useState(false);

  const updateStoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/stories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Spotlight Updated", description: "Your spotlight has been updated." });
      setIsEditStoryDialogOpen(false);
      setEditingStory(null);
      setStoryContent("");
      setStoryImage(null);
      if (storyImageRef.current) {
        storyImageRef.current.value = "";
      }
    },
    onError: () => toast({ title: "Error", description: "Failed to update spotlight.", variant: "destructive" }),
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/stories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Spotlight Deleted", description: "Your spotlight has been removed." });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete spotlight.", variant: "destructive" }),
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
          return <LoadingPage message="Loading dashboard..." />;
        }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (roleData?.role !== "vendor") {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Vendor Access Required</h1>
          <p className="text-muted-foreground mb-6">You need a vendor account to access the dashboard.</p>
          <Button onClick={() => setLocation("/")} data-testid="button-go-home">Go Home</Button>
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
      toast({ title: "Empty Spotlight", description: "Add content or an image.", variant: "destructive" });
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
      toast({ title: "Empty Spotlight", description: "Add content or an image.", variant: "destructive" });
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
      <div className="min-h-screen bg-muted/30 font-body pb-20">
        <Navbar />
        
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Welcome to MotorBuy</h1>
            <p className="text-muted-foreground">Set up your vendor profile to start selling.</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Create Your Profile</CardTitle>
              <CardDescription>Fill in your details to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Business Name *</Label>
                <Input 
                  id="storeName"
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)} 
                  placeholder="e.g., AutoParts Kuwait" 
                  data-testid="input-store-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeDesc">Description</Label>
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 font-body pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground">{vendorProfile.storeName}</p>
          </div>
          <div className="flex gap-2">
            {!vendorProfile.isApproved && (
              <Badge variant="secondary">Pending Approval</Badge>
            )}
            <Link href="/vendor/wallet">
              <Button variant="outline" size="sm" data-testid="button-view-wallet">
                <Wallet className="w-4 h-4 mr-2" />
                Wallet
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300" data-testid="text-vendor-products">
                {analytics?.totalProducts || myProducts.length}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Products</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-300" data-testid="text-vendor-orders">
                {analytics?.totalOrders || 0}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">Orders</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-amber-700 dark:text-amber-300" data-testid="text-vendor-revenue">
                {analytics?.grossSalesKwd || "0"}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">Revenue (KWD)</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-purple-700 dark:text-purple-300" data-testid="text-vendor-payout">
                {analytics?.pendingPayoutKwd || "0"}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Pending (KWD)</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Create Spotlight</CardTitle>
              <CardDescription>Share updates with your customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Textarea 
                    value={storyContent} 
                    onChange={(e) => setStoryContent(e.target.value)} 
                    placeholder="Share news, promotions, or new arrivals..."
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Your Spotlights {myStories.length > 0 && `(${myStories.length})`}
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
                  <p className="text-sm text-muted-foreground mb-1">No spotlights yet</p>
                  <p className="text-xs text-muted-foreground">Create your first spotlight above</p>
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
                            title="Edit spotlight"
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
                            title="Delete spotlight"
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

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
            <TabsTrigger value="products" className="py-3" data-testid="tab-products">
              <Package className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="shop" className="py-3" data-testid="tab-shop">
              <Store className="w-4 h-4 mr-2" />
              Shop Profile
            </TabsTrigger>
            <TabsTrigger value="orders" className="py-3" data-testid="tab-orders">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5" /> Shop Branding
                  </CardTitle>
                  <CardDescription>Update your shop logo and cover image</CardDescription>
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
                      {isUploadingStoreCover ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                      Change Cover
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
                      <p className="font-medium">Shop Logo</p>
                      <p className="text-sm text-muted-foreground">Square image recommended</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5" /> Shop Details
                  </CardTitle>
                  <CardDescription>Update your shop information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Shop Name *</Label>
                    <Input 
                      value={storeName} 
                      onChange={(e) => setStoreName(e.target.value)} 
                      placeholder="Your shop name" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Input 
                      value={storeDescription} 
                      onChange={(e) => setStoreDescription(e.target.value)} 
                      placeholder="Brief description of your shop" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>About Your Shop</Label>
                    <Textarea 
                      value={storeBio} 
                      onChange={(e) => setStoreBio(e.target.value)} 
                      placeholder="Tell customers about your shop, what you specialize in..." 
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
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Shop Details
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {isOrdersLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : !vendorOrders || vendorOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No orders yet</p>
                    <p className="text-sm mt-1">Orders will appear here when customers purchase your products.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Order ID</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorOrders.map((order) => (
                          <tr key={order.id} className="border-b last:border-0" data-testid={`vendor-order-${order.id}`}>
                            <td className="py-3 px-2 text-sm font-mono">#{String(order.id).slice(-8)}</td>
                            <td className="py-3 px-2 text-sm text-muted-foreground">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="py-3 px-2 text-sm font-medium">{formatKWD(order.total)}</td>
                            <td className="py-3 px-2">
                              <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="capitalize">
                                {order.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add New Product
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Performance Brake Pads" data-testid="input-product-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Product details..." data-testid="input-product-desc" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sale Price (KWD) *</Label>
                      <Input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="0.000" data-testid="input-product-price" />
                    </div>
                    <div className="space-y-2">
                      <Label>Original Price</Label>
                      <Input type="number" value={productComparePrice} onChange={(e) => setProductComparePrice(e.target.value)} placeholder="For discounts" data-testid="input-compare-price" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} placeholder="0" data-testid="input-product-stock" />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input value={productBrand} onChange={(e) => setProductBrand(e.target.value)} placeholder="Brand name" data-testid="input-product-brand" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
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
                    <Label>Warranty Info</Label>
                    <Input value={productWarranty} onChange={(e) => setProductWarranty(e.target.value)} placeholder="e.g., 2 years" data-testid="input-warranty" />
                  </div>
                  <div className="space-y-2">
                    <Label>Product Images</Label>
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
                    {addProductMutation.isPending ? "Adding..." : "Add Product"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Products ({myProducts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {myProducts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No products yet</p>
                      <p className="text-sm mt-1">Add your first product using the form.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {myProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg" data-testid={`product-row-${product.id}`}>
                          <img src={product.images?.[0] || "https://placehold.co/50"} alt="" className="w-14 h-14 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{formatKWD(product.price)}</div>
                          </div>
                          <Badge variant="outline">{product.stock} in stock</Badge>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update your product information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product name"
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                placeholder="Product description"
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (KWD) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Compare at Price (KWD)</Label>
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
                <Label>Stock *</Label>
                <Input
                  type="number"
                  value={productStock}
                  onChange={(e) => setProductStock(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Brand *</Label>
                <Input
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  placeholder="Brand name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
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
              <Label>Warranty Information</Label>
              <Input
                value={productWarranty}
                onChange={(e) => setProductWarranty(e.target.value)}
                placeholder="e.g., 1 year warranty"
              />
            </div>

            <div className="space-y-2">
              <Label>Product Images</Label>
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
                {isUploadingProduct ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Image
              </Button>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProduct} disabled={updateProductMutation.isPending}>
                {updateProductMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Product"
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
            <DialogTitle>Edit Spotlight</DialogTitle>
            <DialogDescription>
              Update your spotlight content and image. Click save when you're done.
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
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Spotlight
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
