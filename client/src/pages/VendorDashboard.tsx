import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useRole, useProducts, useCategories } from "@/hooks/use-motorbuy";
import { 
  Package, ShoppingCart, Loader2, Plus, Image, Trash2, BookOpen, 
  Store, TrendingUp, DollarSign, Clock, Wallet, Send
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatKWD } from "@/lib/currency";
import { useUpload } from "@/hooks/use-upload";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

  const { data: vendorProfile, isLoading: isProfileLoading } = useQuery<Vendor | null>({
    queryKey: ["/api/vendor/profile"],
    enabled: !!user && roleData?.role === "vendor",
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

  const { data: stories } = useQuery<VendorStory[]>({
    queryKey: ["/api/stories"],
  });
  const myStories = stories?.filter(s => s.vendorId === vendorProfile?.id) || [];

  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productComparePrice, setProductComparePrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productWarranty, setProductWarranty] = useState("");

  const [storyContent, setStoryContent] = useState("");
  const [storyImage, setStoryImage] = useState<string | null>(null);

  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");

  const productImageRef = useRef<HTMLInputElement>(null);
  const storyImageRef = useRef<HTMLInputElement>(null);

  const { uploadFile: uploadProductImage, isUploading: isUploadingProduct } = useUpload({
    onSuccess: (response) => {
      setProductImages([...productImages, response.objectPath]);
      toast({ title: "Image Added" });
    },
    onError: (error) => toast({ title: "Upload Failed", description: error.message, variant: "destructive" }),
  });

  const { uploadFile: uploadStoryImage, isUploading: isUploadingStory } = useUpload({
    onSuccess: (response) => {
      setStoryImage(response.objectPath);
      toast({ title: "Image Uploaded" });
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

  const addStoryMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/stories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Spotlight Posted" });
      setStoryContent(""); setStoryImage(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to post spotlight.", variant: "destructive" }),
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/stories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Spotlight Deleted" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  if (isAuthLoading || isRoleLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
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

  const handlePostStory = () => {
    if (!storyContent && !storyImage) {
      toast({ title: "Empty Spotlight", description: "Add content or an image.", variant: "destructive" });
      return;
    }
    addStoryMutation.mutate({
      vendorId: vendorProfile?.id,
      content: storyContent,
      imageUrl: storyImage,
    });
  };

  if (!vendorProfile) {
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
                Your Spotlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myStories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No spotlights yet</p>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {myStories.slice(0, 5).map((story) => (
                    <div key={story.id} className="text-sm p-3 bg-muted/50 rounded-lg" data-testid={`story-row-${story.id}`}>
                      {story.imageUrl && (
                        <img src={story.imageUrl} alt="" className="w-full h-20 object-cover rounded mb-2" />
                      )}
                      <p className="line-clamp-2">{story.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : ""}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => deleteStoryMutation.mutate(story.id)}
                          data-testid={`button-delete-story-${story.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-auto">
            <TabsTrigger value="orders" className="py-3" data-testid="tab-orders">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="py-3" data-testid="tab-products">
              <Package className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
          </TabsList>

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
    </div>
  );
}
