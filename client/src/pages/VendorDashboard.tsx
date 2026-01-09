import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useRole, useProducts, useCategories } from "@/hooks/use-motorbuy";
import { 
  Package, ShoppingCart, Loader2, Plus, Image, Trash2, BookOpen, 
  Store, TrendingUp, DollarSign, Clock, LayoutDashboard
} from "lucide-react";
import { useLocation } from "wouter";
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

  const { data: stories, isLoading: isStoriesLoading } = useQuery<VendorStory[]>({
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
      toast({ title: "Shop Created", description: "Your vendor shop has been set up!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to create shop.", variant: "destructive" }),
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
      toast({ title: "Story Posted" });
      setStoryContent(""); setStoryImage(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to post story.", variant: "destructive" }),
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/stories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story Deleted" });
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
      toast({ title: "Store Name Required", variant: "destructive" });
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
      toast({ title: "Empty Story", description: "Add content or an image.", variant: "destructive" });
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
      <div className="min-h-screen bg-background font-body pb-20">
        <Navbar />
        
        <div className="bg-primary/10 py-8 md:py-12 border-b border-primary/20">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Set Up Your Shop</h1>
            <p className="text-muted-foreground">Create your vendor profile to start selling on MotorBuy.</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Create Your Shop
              </CardTitle>
              <CardDescription>
                Fill in your store details to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name *</Label>
                <Input 
                  id="storeName"
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)} 
                  placeholder="e.g., AutoParts Kuwait" 
                  data-testid="input-store-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeDesc">Store Description</Label>
                <Textarea 
                  id="storeDesc"
                  value={storeDescription} 
                  onChange={(e) => setStoreDescription(e.target.value)} 
                  placeholder="Tell customers about your shop..."
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
                  <>
                    <Store className="w-4 h-4 mr-2" />
                    Create My Shop
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-6 md:py-12 mb-6 md:mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-6 h-6 md:w-8 md:h-8" />
            <h1 className="text-2xl md:text-3xl font-display font-bold">Vendor Dashboard</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">{vendorProfile.storeName}</p>
          {!vendorProfile.isApproved && (
            <Badge variant="secondary" className="mt-2">Pending Approval</Badge>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="font-bold text-lg" data-testid="text-vendor-products">{analytics?.totalProducts || myProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="font-bold text-lg" data-testid="text-vendor-orders">{analytics?.totalOrders || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="font-bold text-lg" data-testid="text-vendor-revenue">{analytics?.grossSalesKwd || "0"} KWD</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending Payout</p>
                  <p className="font-bold text-lg" data-testid="text-vendor-payout">{analytics?.pendingPayoutKwd || "0"} KWD</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
            <TabsTrigger value="orders" className="py-3 text-xs md:text-sm" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="products" className="py-3 text-xs md:text-sm" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="stories" className="py-3 text-xs md:text-sm" data-testid="tab-stories">Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isOrdersLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : !vendorOrders || vendorOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No orders yet</p>
                    <p className="text-sm mt-1">Orders will appear here when customers purchase your products.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vendorOrders.map((order) => (
                      <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 md:p-4 border rounded-lg" data-testid={`vendor-order-${order.id}`}>
                        <div>
                          <div className="font-medium text-sm md:text-base">Order #{String(order.id).slice(-8)}</div>
                          <div className="text-xs md:text-sm text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                          <span className="font-bold text-sm md:text-base">{formatKWD(order.total)}</span>
                          <Badge variant={order.status === "delivered" ? "default" : "secondary"}>{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <div className="grid md:grid-cols-2 gap-6">
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
                      <Label>Original Price (KWD)</Label>
                      <Input type="number" value={productComparePrice} onChange={(e) => setProductComparePrice(e.target.value)} placeholder="For discounts" data-testid="input-compare-price" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} placeholder="0" data-testid="input-product-stock" />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Input value={productBrand} onChange={(e) => setProductBrand(e.target.value)} placeholder="Brand name" data-testid="input-product-brand" />
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
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" /> Your Products ({myProducts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {myProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No products yet</p>
                      <p className="text-sm mt-1">Add your first product using the form.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {myProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 p-3 border rounded-lg" data-testid={`product-row-${product.id}`}>
                          <img src={product.images?.[0] || "https://placehold.co/50"} alt="" className="w-12 h-12 object-cover rounded" />
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

          <TabsContent value="stories">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Post a Story
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea value={storyContent} onChange={(e) => setStoryContent(e.target.value)} placeholder="Share updates, new arrivals, promotions..." className="min-h-[100px]" data-testid="input-story-content" />
                  </div>
                  <div className="space-y-2">
                    <Label>Image</Label>
                    <input ref={storyImageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadStoryImage(f); }} />
                    {storyImage ? (
                      <div className="relative">
                        <img src={storyImage} alt="" className="w-full h-40 object-cover rounded-lg" />
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setStoryImage(null)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full" onClick={() => storyImageRef.current?.click()} disabled={isUploadingStory} data-testid="button-add-story-image">
                        {isUploadingStory ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Image className="w-4 h-4 mr-2" />}
                        Add Image
                      </Button>
                    )}
                  </div>
                  <Button className="w-full" onClick={handlePostStory} disabled={addStoryMutation.isPending} data-testid="button-post-story">
                    {addStoryMutation.isPending ? "Posting..." : "Post Story"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Your Stories ({myStories.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isStoriesLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                  ) : myStories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No stories yet</p>
                      <p className="text-sm mt-1">Share updates with your customers.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {myStories.map((story) => (
                        <div key={story.id} className="p-3 border rounded-lg" data-testid={`story-row-${story.id}`}>
                          {story.imageUrl && (
                            <img src={story.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                          )}
                          <p className="text-sm">{story.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : ""}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => deleteStoryMutation.mutate(story.id)} data-testid={`button-delete-story-${story.id}`}>
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
    </div>
  );
}
