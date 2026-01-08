import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, useCategories } from "@/hooks/use-motorbuy";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Search, Loader2, Package, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ProductList() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const { data: categories } = useCategories();
  
  const filters = {
    search: search || undefined,
    categoryId: categoryId === "all" ? undefined : Number(categoryId),
    sortBy: sortBy as any
  };

  const { data: products, isLoading } = useProducts(filters);

  const hasFilters = search || categoryId !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategoryId("all");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="relative gradient-dark text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <Badge className="bg-white/10 border-white/20 text-white">
                {products?.length || 0} Products
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">Browse Parts</h1>
            <p className="text-white/70 text-lg max-w-xl">
              Find exactly what you need for your vehicle from trusted vendors.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8 bg-card p-5 rounded-2xl shadow-sm border border-border sticky top-4 z-20"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Search parts by name or brand..." 
              className="pl-12 h-12 rounded-xl bg-background border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
          
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full md:w-[200px] h-12 rounded-xl" data-testid="select-category">
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
            <SelectTrigger className="w-full md:w-[200px] h-12 rounded-xl" data-testid="select-sort">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest Arrivals</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearFilters}
              className="h-12 w-12 rounded-xl shrink-0"
              data-testid="button-clear-filters"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : products?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-card rounded-2xl border"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">No products found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Try adjusting your search or filter criteria to find what you're looking for.
            </p>
            <Button variant="outline" onClick={clearFilters} className="rounded-full px-6" data-testid="button-clear-all-filters">
              Clear All Filters
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products?.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <footer className="gradient-dark text-white py-12 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="font-display font-bold text-2xl mb-2">MotorBuy</div>
          <p className="text-white/50 text-sm">Kuwait's premier auto parts marketplace</p>
        </div>
      </footer>
    </div>
  );
}
