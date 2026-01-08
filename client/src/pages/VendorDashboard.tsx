import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useRole, useVendors, useProducts, useCategories } from "@/hooks/use-motorbuy";
import { Package, ShoppingCart, Loader2, ArrowLeft, Plus, Image, Trash2, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatKWD } from "@/lib/currency";
import { useUpload } from "@/hooks/use-upload";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, VendorStory } from "@shared/schema";

export default function VendorDashboard() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const { data: vendors } = useVendors();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const myVendor = vendors?.find(v => v.userId === user?.id);
  const myProducts = products?.filter(p => p.vendorId === myVendor?.id) || [];

  const { data: vendorOrders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/vendor/orders", myVendor?.id],
    enabled: !!myVendor?.id,
  });

  const { data: stories, isLoading: isStoriesLoading } = useQuery<VendorStory[]>({
    queryKey: ["/api/stories"],
  });
  const myStories = stories?.filter(s => s.vendorId === myVendor?.id) || [];

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

  const addProductMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/stories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story Deleted" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated || !user || roleData?.role !== "vendor") {
    setLocation("/");
    return null;
  }

  const handleAddProduct = () => {
    if (!productName || !productDesc || !productPrice || !productCategory || !myVendor) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    addProductMutation.mutate({
      vendorId: myVendor.id,
      categoryId: parseInt(productCategory),
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
      vendorId: myVendor?.id,
      content: storyContent,
      imageUrl: storyImage,
    });
  };

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <Link href="/vendor/account">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Account
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold mb-2">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Manage orders, products, and stories.</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Add Products</TabsTrigger>
            <TabsTrigger value="stories" data-testid="tab-stories">Stories</TabsTrigger>
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
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vendorOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`vendor-order-${order.id}`}>
                        <div>
                          <div className="font-medium">Order #{order.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">{formatKWD(order.total)}</span>
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
