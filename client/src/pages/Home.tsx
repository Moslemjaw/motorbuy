import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCategories, useStories, useProducts, useVendors } from "@/hooks/use-motorbuy";
import { useLanguage } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, Shield, ChevronRight, Users, Package, TrendingUp, Cog, Settings, CircleStop, Gauge, Zap, Thermometer, Fuel, Wind, Car, Armchair, Circle, Lightbulb, Droplets, Wrench, Truck, Headphones, CreditCard, type LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const iconMap: Record<string, LucideIcon> = {
  Cog, Settings, CircleStop, Gauge, Zap, Thermometer, Fuel, Wind, Car, Armchair, Circle, Lightbulb, Droplets, Wrench
};

export default function Home() {
  const { t, isRTL } = useLanguage();
  const { data: categories } = useCategories();
  const { data: products } = useProducts({ sortBy: 'newest' });
  const { data: stories } = useStories();
  const { data: vendors } = useVendors();

  const featuredProducts = products?.slice(0, 4);

  const stats = [
    { icon: Package, label: t("stats.products"), value: products?.length || 0 },
    { icon: Users, label: t("stats.vendors"), value: vendors?.length || 0 },
    { icon: TrendingUp, label: t("stats.categories"), value: categories?.length || 0 },
  ];

  const features = [
    { icon: Shield, title: t("feature.quality"), desc: t("feature.quality.desc") },
    { icon: Truck, title: t("feature.delivery"), desc: t("feature.delivery.desc") },
    { icon: Headphones, title: t("feature.support"), desc: t("feature.support.desc") },
    { icon: CreditCard, title: t("feature.secure"), desc: t("feature.secure.desc") },
  ];

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12 md:py-20 lg:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 md:mb-6 tracking-tight leading-tight"
            >
              {t("hero.title")} <span className="text-primary">{t("hero.title.highlight")}</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base md:text-lg text-white/70 mb-8 max-w-lg leading-relaxed"
            >
              {t("hero.subtitle")}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/products">
                <Button size="lg" className="rounded-full px-6 md:px-8 shadow-lg" data-testid="button-shop-parts">
                  {t("hero.shopParts")} <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
              <Link href="/vendors">
                <Button size="lg" variant="outline" className="rounded-full px-6 md:px-8 border-white/20 text-white bg-white/5 hover:bg-white/10" data-testid="button-browse-vendors">
                  {t("hero.browseVendors")}
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-6 md:gap-10 mt-10 pt-8 border-t border-white/10"
            >
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-bold">{stat.value}+</div>
                    <div className="text-xs text-white/60">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 border-b">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-1">{t("section.categories")}</h2>
              <p className="text-muted-foreground text-sm md:text-base">{t("section.categories.subtitle")}</p>
            </div>
            <Link href="/products" className="text-primary text-sm font-medium flex items-center gap-1 group">
              {t("common.viewAll")} <ChevronRight className={`w-4 h-4 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {categories?.slice(0, 10).map((cat, index) => {
              const IconComponent = cat.icon ? iconMap[cat.icon] : Wrench;
              const translatedName = t(`cat.${cat.slug}`) !== `cat.${cat.slug}` ? t(`cat.${cat.slug}`) : cat.name;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link href={`/products?categoryId=${cat.id}`}>
                    <div className="group cursor-pointer bg-card rounded-xl p-4 md:p-5 border hover:border-primary/30 hover:shadow-md transition-all text-center">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:bg-primary/20 transition-colors">
                        {IconComponent && <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-primary" />}
                      </div>
                      <h3 className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors line-clamp-2">{translatedName}</h3>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          {(!categories || categories.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              {t("common.noResults")}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-1">{t("section.newArrivals")}</h2>
              <p className="text-muted-foreground text-sm md:text-base">{t("section.newArrivals.subtitle")}</p>
            </div>
            <Link href="/products" className="text-primary text-sm font-medium flex items-center gap-1 group">
              {t("common.viewAll")} <ChevronRight className={`w-4 h-4 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {featuredProducts?.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
          {(!featuredProducts || featuredProducts.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              {t("common.noResults")}
            </div>
          )}
        </div>
      </section>

      {stories && stories.length > 0 && (
        <section className="py-12 md:py-20">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-1">{t("section.spotlight")}</h2>
                <p className="text-muted-foreground text-sm md:text-base">{t("section.spotlight.subtitle")}</p>
              </div>
              <Link href="/stories" className="text-primary text-sm font-medium flex items-center gap-1 group">
                {t("common.viewAll")} <ChevronRight className={`w-4 h-4 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {stories.slice(0, 6).map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-card rounded-xl border overflow-hidden group hover:shadow-md transition-shadow"
                >
                  {story.imageUrl && (
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img 
                        src={story.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                        {story.vendor?.storeName?.[0] || "V"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{story.vendor?.storeName || "Vendor"}</h4>
                        <p className="text-xs text-muted-foreground">
                          {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{story.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">{t("section.whyUs")}</h2>
            <p className="text-muted-foreground">{t("section.whyUs.subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Shield, title: t("feature.quality"), desc: t("feature.quality.desc") },
              { icon: Truck, title: t("feature.delivery"), desc: t("feature.delivery.desc") },
              { icon: Headphones, title: t("feature.support"), desc: t("feature.support.desc") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
