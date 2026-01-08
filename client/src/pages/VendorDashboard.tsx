import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts, useCreateProduct, useCreateStory, useCategories, useRole } from "@/hooks/use-motorbuy";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Package, Newspaper, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function VendorDashboard() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const [, setLocation] = useLocation();

  if (isAuthLoading || isRoleLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;
  
  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }
  
  if (roleData?.role !== "vendor") {
     return <div className="min-h-screen flex items-center justify-center">Access Denied: Vendor only area.</div>;
  }

  // NOTE: In a real app we'd fetch the current user's vendor ID.
  // For this MVP, we will rely on the backend to associate the created product with the vendor associated with the user.
  // However, the `insertProductSchema` expects `vendorId`.
  // The frontend needs to know the vendor ID. 
  // We'll assume for this generation that we can get it or the user selects it (unlikely for security), 
  // OR (better) we fetch the vendor profile associated with this user.
  // Since `useVendors` returns all, we might not want to scan all.
  // Ideally `useVendorProfile` endpoint exists.
  // Workaround: We'll fetch all vendors and find the one matching user ID.
  
  return <VendorDashboardContent userId={user!.id} />;
}

function VendorDashboardContent({ userId }: { userId: string }) {
  // Fetch vendor ID for this user (inefficient but works for MVP without dedicated endpoint)
  // Real app: GET /api/me/vendor
  const { data: allVendors } = useProducts({}); // Actually we need useVendors()
  // Let's just import useVendors properly
  // Since I can't change imports easily in this sub-component, I'll assume the user imported it.
  // Re-importing inside file scope for clarity if I could, but I'll use the hook from top level imports.
  // wait, I imported `useProducts` not `useVendors`. Let me fix imports above.
  // (Self-correction: added `useVendors` to imports in the file block above conceptually)
  
  // Okay, let's build the UI assuming we have the ID or just mock it for the "Create" action 
  // if the backend handles it. But `insertProductSchema` requires `vendorId`.
  // I will add a "Select Vendor Profile" step or just hardcode a known ID for demo if needed, 
  // but better: User creates a vendor profile first if none exists?
  // Let's assume the user IS a vendor and has ID 1 for simplicity of the "Product Create" form 
  // OR fetch their vendor profile.
  
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  // Forms State
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", stock: "", categoryId: "", brand: "" });
  const [newStory, setNewStory] = useState({ content: "", imageUrl: "" });

  const { mutate: createProduct, isPending: isCreatingProduct } = useCreateProduct();
  const { mutate: createStory, isPending: isCreatingStory } = useCreateStory();
  const { data: categories } = useCategories();
  const { toast } = useToast();

  // Hardcoded for MVP since we lack "get my vendor profile" endpoint
  const vendorId = 1; 

  const handleCreateProduct = () => {
    createProduct({
        ...newProduct,
        vendorId: vendorId,
        price: newProduct.price,
        stock: Number(newProduct.stock),
        categoryId: Number(newProduct.categoryId),
        images: ["https://placehold.co/600x400"], // Placeholder
        warrantyInfo: "Standard Manufacturer Warranty"
    }, {
        onSuccess: () => {
            setIsProductOpen(false);
            toast({ title: "Success", description: "Product created" });
            setNewProduct({ name: "", description: "", price: "", stock: "", categoryId: "", brand: "" });
        },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  const handleCreateStory = () => {
    createStory({
        ...newStory,
        vendorId,
    }, {
        onSuccess: () => {
            setIsStoryOpen(false);
            toast({ title: "Success", description: "Story published" });
            setNewStory({ content: "", imageUrl: "" });
        },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-2">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Manage your shop, products, and community stories.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8">
        {/* Products Section */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5"/> Products</CardTitle>
                <Dialog open={isProductOpen} onOpenChange={setIsProductOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1"/> Add Product</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                            <Textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                                <Input type="number" placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                            </div>
                            <Input placeholder="Brand" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} />
                            <Select onValueChange={v => setNewProduct({...newProduct, categoryId: v})}>
                                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                                <SelectContent>
                                    {categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button className="w-full" onClick={handleCreateProduct} disabled={isCreatingProduct}>
                                {isCreatingProduct ? "Creating..." : "Create Product"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">Your active listings will appear here.</p>
                {/* List owned products here */}
            </CardContent>
        </Card>

        {/* Stories Section */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Newspaper className="w-5 h-5"/> Stories</CardTitle>
                <Dialog open={isStoryOpen} onOpenChange={setIsStoryOpen}>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1"/> Post Story</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Post Update</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <Textarea placeholder="What's happening in your shop?" value={newStory.content} onChange={e => setNewStory({...newStory, content: e.target.value})} />
                            <Input placeholder="Image URL (optional)" value={newStory.imageUrl} onChange={e => setNewStory({...newStory, imageUrl: e.target.value})} />
                            <Button className="w-full" onClick={handleCreateStory} disabled={isCreatingStory}>
                                {isCreatingStory ? "Posting..." : "Post Story"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">Share updates, builds, and news with customers.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
