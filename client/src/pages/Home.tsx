import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useCategories, useStories, useProducts } from "@/hooks/use-motorbuy";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, Star, Settings, Wrench, Shield, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  const { data: categories } = useCategories();
  const { data: products } = useProducts({ sortBy: 'newest' });
  const { data: stories } = useStories();

  const featuredProducts = products?.slice(0, 4);
  const featuredStories = stories?.slice(0, 3);

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-foreground text-white py-24 lg:py-32">
        {/* Abstract shapes/gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 z-0" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 -skew-x-12 translate-x-1/4 z-0" />
        
        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-7xl font-display font-bold mb-6 tracking-tight leading-none"
            >
              Drive Your <span className="text-primary">Passion</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-300 mb-8 max-w-lg"
            >
              The premium marketplace for automotive parts. Connect with expert vendors and find exactly what your ride needs.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              <Link href="/products">
                <Button size="lg" className="text-lg px-8 h-14 rounded-full">
                  Shop Parts <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/vendors">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white">
                  Find Shops
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-accent/30">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold mb-2">Shop by Category</h2>
              <p className="text-muted-foreground">Find the right part for the right system</p>
            </div>
            <Link href="/products" className="text-primary font-medium hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {categories?.map((cat) => (
              <Link key={cat.id} href={`/products?categoryId=${cat.id}`}>
                <div className="group cursor-pointer bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all border border-border/50 hover:border-primary/50">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{cat.name}</h3>
                </div>
              </Link>
            ))}
            {(!categories || categories.length === 0) && (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                No categories found. Admin needs to add categories.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-display font-bold mb-12 text-center">New Arrivals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Vendor Stories */}
      {featuredStories && featuredStories.length > 0 && (
        <section className="py-20 bg-foreground text-white overflow-hidden">
          <div className="container px-4 mx-auto">
            <h2 className="text-3xl font-display font-bold mb-12 text-center">Community Stories</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {featuredStories.map((story) => (
                <div key={story.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold">
                      {story.vendor?.storeName?.[0] || "V"}
                    </div>
                    <div>
                      <h4 className="font-semibold">{story.vendor?.storeName}</h4>
                      <p className="text-xs text-gray-400">Verified Vendor</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">{story.content}</p>
                  {story.imageUrl && (
                    <img 
                      src={story.imageUrl} 
                      alt="Story" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/stories">
                <Button className="rounded-full">Read More Stories</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trust Section */}
      <section className="py-20 bg-accent/20">
        <div className="container px-4 mx-auto grid md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-xl mb-3">Verified Vendors</h3>
            <p className="text-muted-foreground">Every shop on our platform is vetted for quality and reliability.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
              <Settings className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-xl mb-3">Exact Fitment</h3>
            <p className="text-muted-foreground">Detailed specifications ensure you get the part that fits perfectly.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-xl mb-3">Community Rated</h3>
            <p className="text-muted-foreground">Read real reviews from other enthusiasts before you buy.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container px-4 mx-auto text-center text-muted-foreground text-sm">
          <div className="font-display font-bold text-2xl text-primary mb-4">MotorBuy</div>
          <p>© 2025 MotorBuy Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
