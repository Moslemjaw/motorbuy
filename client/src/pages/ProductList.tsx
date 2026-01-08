import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, useCategories } from "@/hooks/use-motorbuy";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductList() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const { data: categories } = useCategories();
  
  // Convert "all" to undefined for the API hook
  const filters = {
    search: search || undefined,
    categoryId: categoryId === "all" ? undefined : Number(categoryId),
    sortBy: sortBy as any
  };

  const { data: products, isLoading } = useProducts(filters);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <div className="bg-foreground text-white py-12 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-display font-bold mb-4">Browse Parts</h1>
          <p className="text-gray-400">Find exactly what you need for your vehicle</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card p-4 rounded-xl shadow-sm border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search parts..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest Arrivals</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
            <h3 className="text-xl font-bold text-muted-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search filters</p>
            <Button variant="outline" onClick={() => { setSearch(""); setCategoryId("all"); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
