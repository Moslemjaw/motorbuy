import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useCategories, useStories, useProducts, useVendors } from "@/hooks/use-motorbuy";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, Star, Settings, Wrench, Shield, ChevronRight, Zap, Users, Package, TrendingUp } from "lucide-react";
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

      <section className="relative overflow-hidden gradient-dark text-white py-28 lg:py-40">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/20 to-transparent -skew-x-12 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
                <Zap className="w-4 h-4 text-accent" />
                Kuwait's Premier Auto Parts Marketplace
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-display font-bold mb-6 tracking-tight leading-[1.1] text-shadow-lg"
            >
              Find the Perfect Parts for Your <span className="text-primary">Ride</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-white/70 mb-10 max-w-xl leading-relaxed"
            >
              Connect with trusted vendors, discover quality parts, and build your dream machine. All in one marketplace.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/products">
                <Button size="lg" className="text-lg px-8 h-14 rounded-full shadow-lg shadow-primary/30" data-testid="button-shop-parts">
                  Shop Parts <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/vendors">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-full border-white/30 text-white bg-white/5 backdrop-blur-sm" data-testid="button-browse-vendors">
                  Browse Vendors
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-8 mt-14 pt-8 border-t border-white/10"
            >
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}+</div>
                    <div className="text-sm text-white/60">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-display font-bold mb-2">Shop by Category</h2>
              <p className="text-muted-foreground text-lg">Find exactly what your vehicle needs</p>
            </div>
            <Link href="/products" className="text-primary font-semibold flex items-center gap-1 group">
              View All Categories <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories?.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/products?categoryId=${cat.id}`}>
                  <div className="group cursor-pointer bg-card rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/20">
                      <Wrench className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-bold text-xl mb-2 group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-muted-foreground text-sm">Browse {cat.name.toLowerCase()} parts</p>
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

      <section className="py-20 bg-muted/50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-display font-bold mb-3">New Arrivals</h2>
            <p className="text-muted-foreground text-lg">Fresh stock from our top vendors</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div className="text-center mt-14">
            <Link href="/products">
              <Button size="lg" variant="outline" className="rounded-full px-10 h-12" data-testid="button-view-all-products">
                View All Products <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {featuredStories && featuredStories.length > 0 && (
        <section className="py-24 gradient-dark text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="container px-4 mx-auto relative z-10">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-display font-bold mb-3">Community Stories</h2>
              <p className="text-white/60 text-lg">Updates and announcements from our vendors</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-dark rounded-2xl overflow-hidden group"
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
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white">
                        {story.vendor?.storeName?.[0] || "V"}
                      </div>
                      <div>
                        <h4 className="font-semibold">{story.vendor?.storeName}</h4>
                        <p className="text-xs text-white/50">Verified Vendor</p>
                      </div>
                    </div>
                    <p className="text-white/80 line-clamp-3">{story.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-14">
              <Link href="/stories">
                <Button size="lg" className="rounded-full px-10 h-12 shadow-lg shadow-primary/30" data-testid="button-view-all-stories">
                  View All Stories <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

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
