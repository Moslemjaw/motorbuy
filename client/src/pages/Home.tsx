import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useCategories, useStories, useProducts, useVendors } from "@/hooks/use-motorbuy";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, Star, Settings, Wrench, Shield, ChevronRight, Users, Package, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  const { data: categories } = useCategories();
  const { data: products } = useProducts({ sortBy: 'newest' });
  const { data: stories } = useStories();
  const { data: vendors } = useVendors();

  const featuredProducts = products?.slice(0, 4);
  const featuredStories = stories?.slice(0, 3);

  const stats = [
    { icon: Package, label: "Products", value: products?.length || 0 },
    { icon: Users, label: "Vendors", value: vendors?.length || 0 },
    { icon: TrendingUp, label: "Categories", value: categories?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />

      <section className="relative overflow-hidden gradient-dark text-white py-10 md:py-16 lg:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/20 to-transparent -skew-x-12 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold mb-4 md:mb-6 tracking-tight leading-[1.1] text-shadow-lg"
            >
              Find the Perfect Parts for Your <span className="text-primary">Ride</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-xl text-white/70 mb-6 md:mb-10 max-w-xl leading-relaxed"
            >
              Connect with trusted vendors, discover quality parts, and build your dream machine. All in one marketplace.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3 md:gap-4"
            >
              <Link href="/products">
                <Button size="default" className="text-sm md:text-lg px-4 md:px-8 h-10 md:h-14 rounded-full shadow-lg shadow-primary/30" data-testid="button-shop-parts">
                  Shop Parts <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </Link>
              <Link href="/vendors">
                <Button size="default" variant="outline" className="text-sm md:text-lg px-4 md:px-8 h-10 md:h-14 rounded-full border-white/30 text-white bg-white/5 backdrop-blur-sm" data-testid="button-browse-vendors">
                  Browse Vendors
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-4 md:gap-8 mt-8 md:mt-14 pt-6 md:pt-8 border-t border-white/10"
            >
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-lg md:text-2xl font-bold">{stat.value}+</div>
                    <div className="text-xs md:text-sm text-white/60">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4 mb-8 md:mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-1 md:mb-2">Shop by Category</h2>
              <p className="text-muted-foreground text-sm md:text-lg">Find exactly what your vehicle needs</p>
            </div>
            <Link href="/products" className="text-primary font-semibold flex items-center gap-1 group">
              View All Categories <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {categories?.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/products?categoryId=${cat.id}`}>
                  <div className="group cursor-pointer bg-card rounded-xl md:rounded-2xl p-4 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 md:w-32 h-20 md:h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/20">
                      <Wrench className="w-5 h-5 md:w-8 md:h-8" />
                    </div>
                    <h3 className="font-display font-bold text-sm md:text-xl mb-1 md:mb-2 group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-muted-foreground text-xs md:text-sm hidden md:block">Browse {cat.name.toLowerCase()} parts</p>
                  </div>
                </Link>
              </motion.div>
            ))}
            {(!categories || categories.length === 0) && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                No categories available yet
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-muted/50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-8 md:mb-14">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-2 md:mb-3">New Arrivals</h2>
            <p className="text-muted-foreground text-sm md:text-lg">Fresh stock from our top vendors</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {featuredProducts?.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
          {(!featuredProducts || featuredProducts.length === 0) && (
            <div className="text-center py-16 text-muted-foreground">
              No products available yet
            </div>
          )}
          <div className="text-center mt-8 md:mt-14">
            <Link href="/products">
              <Button size="default" variant="outline" className="rounded-full px-6 md:px-10 h-10 md:h-12" data-testid="button-view-all-products">
                View All Products <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4 mb-8 md:mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-1 md:mb-2">Vendor Spotlight</h2>
              <p className="text-muted-foreground text-sm md:text-lg">Featured promotions and updates from our vendors</p>
            </div>
            <Link href="/stories" className="text-primary font-semibold flex items-center gap-1 group">
              View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {stories && stories.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.slice(0, 6).map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl border overflow-hidden group hover:shadow-lg transition-shadow"
                >
                  {story.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={story.imageUrl} 
                        alt="Story" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center font-bold text-white text-sm">
                        {story.vendor?.storeName?.[0] || "V"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{story.vendor?.storeName || "Vendor"}</h4>
                        <p className="text-xs text-muted-foreground">
                          {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : "Recently"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{story.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No vendor posts yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-24 bg-card">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold mb-3">Why Choose MotorBuy?</h2>
            <p className="text-muted-foreground text-lg">The trusted marketplace for automotive enthusiasts</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Verified Vendors", desc: "Every shop is vetted for quality and reliability before joining our platform." },
              { icon: Settings, title: "Exact Fitment", desc: "Detailed specifications ensure you always get the part that fits perfectly." },
              { icon: Star, title: "Community Rated", desc: "Real reviews from fellow enthusiasts help you make informed decisions." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-8"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center text-white mb-6 mx-auto shadow-xl shadow-primary/20">
                  <item.icon className="w-10 h-10" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="gradient-dark text-white py-16">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <div className="font-display font-bold text-3xl mb-2">MotorBuy</div>
              <p className="text-white/60">Kuwait's premier auto parts marketplace</p>
            </div>
            <div className="flex gap-6">
              <Link href="/products" className="text-white/70 hover:text-white transition-colors">Products</Link>
              <Link href="/vendors" className="text-white/70 hover:text-white transition-colors">Vendors</Link>
              <Link href="/stories" className="text-white/70 hover:text-white transition-colors">Stories</Link>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-8 text-center text-white/50 text-sm">
            © 2025 MotorBuy Marketplace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
