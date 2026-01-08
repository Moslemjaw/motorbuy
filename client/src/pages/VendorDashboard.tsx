import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts, useCreateProduct, useCreateStory, useCategories, useRole, useStories, useVendors } from "@/hooks/use-motorbuy";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Package, Newspaper, Loader2, LayoutDashboard, ShoppingCart, TrendingUp, DollarSign, Image } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatKWD } from "@/lib/currency";

type TabType = "overview" | "orders" | "products" | "stories";

export default function VendorDashboard() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

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
  
  if (roleData?.role !== "vendor") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">This area is for vendors only.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "overview" as TabType, label: "Overview", icon: LayoutDashboard },
    { key: "orders" as TabType, label: "Orders", icon: ShoppingCart },
    { key: "products" as TabType, label: "Products", icon: Package },
    { key: "stories" as TabType, label: "Stories", icon: Newspaper },
  ];

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      
      <div className="gradient-dark text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-2">Vendor Dashboard</h1>
          <p className="text-white/70">Manage your shop, products, and community stories.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              onClick={() => setActiveTab(tab.key)}
              className="gap-2"
              data-testid={`tab-${tab.key}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === "overview" && <OverviewTab userId={user!.id} />}
        {activeTab === "orders" && <OrdersTab userId={user!.id} />}
        {activeTab === "products" && <ProductsTab userId={user!.id} />}
        {activeTab === "stories" && <StoriesTab userId={user!.id} />}
      </div>
    </div>
  );
}

function OverviewTab({ userId }: { userId: string }) {
  const { data: vendors } = useVendors();
  const { data: products } = useProducts({});
  const { data: stories } = useStories();
  
  const myVendor = vendors?.find(v => v.userId === userId);
  const myProducts = products?.filter(p => myVendor && p.vendorId === myVendor.id) || [];
  const myStories = stories?.filter(s => myVendor && s.vendorId === myVendor.id) || [];

  const stats = [
    { label: "Total Products", value: myProducts.length, icon: Package, color: "text-blue-500" },
    { label: "Total Stories", value: myStories.length, icon: Newspaper, color: "text-purple-500" },
    { label: "Total Sales", value: "0", icon: DollarSign, color: "text-green-500" },
    { label: "Pending Orders", value: "0", icon: ShoppingCart, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
          <Button variant="outline" className="gap-2">
            <Newspaper className="w-4 h-4" /> Post Story
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersTab({ userId }: { userId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" /> Customer Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No orders yet</p>
          <p className="text-sm">When customers purchase your products, orders will appear here.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductsTab({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", stock: "", categoryId: "", brand: "" });
  
  const { data: vendors } = useVendors();
  const { data: products } = useProducts({});
  const { data: categories } = useCategories();
  const { mutate: createProduct, isPending } = useCreateProduct();
  const { toast } = useToast();

  const myVendor = vendors?.find(v => v.userId === userId);
  const vendorId = myVendor?.id || 1;
  const myProducts = products?.filter(p => myVendor && p.vendorId === myVendor.id) || [];

  const handleCreate = () => {
    createProduct({
      ...newProduct,
      vendorId,
      price: newProduct.price,
      stock: Number(newProduct.stock),
      categoryId: Number(newProduct.categoryId),
      images: ["https://placehold.co/600x400"],
      warrantyInfo: "Standard Manufacturer Warranty"
    }, {
      onSuccess: () => {
        setIsOpen(false);
        toast({ title: "Success", description: "Product created" });
        setNewProduct({ name: "", description: "", price: "", stock: "", categoryId: "", brand: "" });
      },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">My Products ({myProducts.length})</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-product">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                placeholder="Product Name" 
                value={newProduct.name} 
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                data-testid="input-product-name"
              />
              <Textarea 
                placeholder="Description" 
                value={newProduct.description} 
                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                data-testid="input-product-description"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  type="number" 
                  placeholder="Price (KWD)" 
                  value={newProduct.price} 
                  onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                  data-testid="input-product-price"
                />
                <Input 
                  type="number" 
                  placeholder="Stock" 
                  value={newProduct.stock} 
                  onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                  data-testid="input-product-stock"
                />
              </div>
              <Input 
                placeholder="Brand" 
                value={newProduct.brand} 
                onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                data-testid="input-product-brand"
              />
              <Select onValueChange={v => setNewProduct({...newProduct, categoryId: v})}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                className="w-full" 
                onClick={handleCreate} 
                disabled={isPending}
                data-testid="button-create-product"
              >
                {isPending ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {myProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No products yet</p>
            <p className="text-sm">Add your first product to start selling.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myProducts.map((product) => (
            <Card key={product.id} data-testid={`product-card-${product.id}`}>
              <CardContent className="p-4">
                <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Image className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-semibold truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-primary">{formatKWD(product.price)}</span>
                  <Badge variant="secondary">{product.stock} in stock</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StoriesTab({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newStory, setNewStory] = useState({ content: "", imageUrl: "" });
  
  const { data: vendors } = useVendors();
  const { data: stories } = useStories();
  const { mutate: createStory, isPending } = useCreateStory();
  const { toast } = useToast();

  const myVendor = vendors?.find(v => v.userId === userId);
  const vendorId = myVendor?.id || 1;
  const myStories = stories?.filter(s => myVendor && s.vendorId === myVendor.id) || [];

  const handleCreate = () => {
    createStory({ ...newStory, vendorId }, {
      onSuccess: () => {
        setIsOpen(false);
        toast({ title: "Success", description: "Story published" });
        setNewStory({ content: "", imageUrl: "" });
      },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">My Stories ({myStories.length})</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-story">
              <Plus className="w-4 h-4" /> Post Story
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post a Story</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea 
                placeholder="What's happening in your shop?" 
                value={newStory.content} 
                onChange={e => setNewStory({...newStory, content: e.target.value})}
                data-testid="input-story-content"
              />
              <Input 
                placeholder="Image URL (optional)" 
                value={newStory.imageUrl} 
                onChange={e => setNewStory({...newStory, imageUrl: e.target.value})}
                data-testid="input-story-image"
              />
              <Button 
                className="w-full" 
                onClick={handleCreate} 
                disabled={isPending}
                data-testid="button-create-story"
              >
                {isPending ? "Posting..." : "Post Story"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {myStories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No stories yet</p>
            <p className="text-sm">Share updates, builds, and news with customers.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {myStories.map((story) => (
            <Card key={story.id} data-testid={`story-card-${story.id}`}>
              <CardContent className="p-4">
                {story.imageUrl && (
                  <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                    <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-sm">{story.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
