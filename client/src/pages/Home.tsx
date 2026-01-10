import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { ArrowRight, ChevronRight, ChevronLeft, Package, Users, ShoppingCart, Wrench, Battery, Disc, Zap, Cog, AlertTriangle, ShieldCheck, Truck, Clock, CreditCard, Settings, CircleStop, Gauge, Thermometer, Fuel, Wind, Car, Armchair, Circle, Lightbulb, Droplets } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useProducts, useCategories, useVendors } from "@/hooks/use-motorbuy";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const { t, isRTL } = useLanguage();
  const { data: categories } = useCategories();
  const { data: vendors } = useVendors();
  const { data: products } = useProducts();

  // Scroll ref for categories
  const categoriesTrackRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleInteractionStart = () => {
    setIsHovering(true);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
  };

  const handleInteractionEnd = () => {
    interactionTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);
    }, 1000); // Resume after 1 second of inactivity
  };

  // Auto-scroll logic using requestAnimationFrame
  useEffect(() => {
    const track = categoriesTrackRef.current;
    if (!track || !categories || categories.length === 0) return;

    let scrollPos = track.scrollLeft;
    const speed = isRTL ? -0.5 : 0.5; // Adjust speed as needed
    let frame: number;

    const step = () => {
      if (!isHovering) {
        scrollPos += speed;
        
        // Loop logic
        // We have duplicated the items, so when we reach halfway (or the end of the first set), we jump back
        const maxScroll = track.scrollWidth / 2; // Approximate halfway point due to duplication
        
        if (isRTL) {
           if (Math.abs(scrollPos) >= maxScroll) {
             scrollPos = 0;
           }
        } else {
           if (scrollPos >= maxScroll) {
             scrollPos = 0;
           }
        }
        
        track.scrollLeft = scrollPos;
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
        interactionTimeoutRef.current = null;
      }
    };
  }, [categories, isRTL, isHovering]);


  const stats = [
    { label: t("stats.products"), value: products?.length || 0, icon: Package },
    { label: t("stats.vendors"), value: vendors?.filter(v => v.isApproved).length || 0, icon: Users },
    { label: t("stats.categories"), value: categories?.length || 0, icon: Wrench },
  ];

  const features = [
    { icon: ShieldCheck, title: t("feature.quality"), desc: t("feature.quality.desc") },
    { icon: Truck, title: t("feature.delivery"), desc: t("feature.delivery.desc") },
    { icon: Clock, title: t("feature.support"), desc: t("feature.support.desc") },
    { icon: CreditCard, title: t("feature.secure"), desc: t("feature.secure.desc") },
  ];
  
  const iconMap: any = {
    "Cog": Cog,
    "Settings": Settings,
    "CircleStop": CircleStop,
    "Gauge": Gauge,
    "Zap": Zap,
    "Thermometer": Thermometer,
    "Fuel": Fuel,
    "Wind": Wind,
    "Car": Car,
    "Armchair": Armchair,
    "Circle": Circle,
    "Lightbulb": Lightbulb,
    "Droplets": Droplets,
    // Fallbacks or legacy
    "engine": Cog,
    "brakes": CircleStop,
    "suspension": Gauge,
    "electrical": Zap,
    "batteries": Battery,
    "filters": Package,
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />

      <section className="relative overflow-hidden bg-background pt-24 pb-20 lg:pt-32 lg:pb-32">
        {/* Ambient Background similar to Mosey's clean look but with blue */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-background to-background dark:from-blue-950/20 dark:to-background -z-20" />
        
        <div className="container relative z-10 px-4 mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-5xl mx-auto"
          >
            {/* Pill Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border bg-background/50 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background/80 mb-8"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              {t("hero.badge")}
            </motion.div>
            
            {/* Main Heading */}
            <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-foreground ${isRTL ? 'leading-tight' : 'leading-[1.1]'} mb-8`}>
              <span className="block">{t("hero.title")}</span>
              <span className="block text-primary relative inline-block">
                {t("hero.title.highlight")}
                {/* Underline decoration */}
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-200 dark:text-blue-900 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className={`text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed`}>
              {t("hero.subtitle")}
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-primary text-primary-foreground">
                  {t("hero.shopParts")} <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
              <Link href="/vendors">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-2 hover:bg-secondary/50 transition-all duration-300">
                  {t("hero.browseVendors")}
                </Button>
              </Link>
            </div>

            {/* Trusted By / Stats Bar */}
            <div className="border-t pt-10">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mb-8">Trusted by automotive enthusiasts</p>
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 md:gap-x-24 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-3 group cursor-default">
                    <stat.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="text-2xl font-bold font-display text-foreground leading-none">{stat.value}+</div>
                      <div className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Us Section moved here */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">{t("section.whyUs")}</h2>
            <p className="text-muted-foreground">{t("section.whyUs.subtitle")}</p>
          </div>
          
          {/* Desktop: Grid Layout */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Mobile: Horizontal Scrollable Row (Auto-scrolling) */}
          <div className="md:hidden relative -mx-4 px-4 overflow-hidden">
             <div className="flex gap-4 animate-scroll-features-auto w-max hover:[animation-play-state:paused] py-4">
                {[...features, ...features, ...features].map((item, i) => ( // Tripled for smoother loop
                  <div
                    key={i}
                    className="w-[280px] flex-shrink-0 bg-card border rounded-2xl p-6 text-center shadow-sm"
                  >
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
            </div>
             {/* Dots indicator */}
            <div className="flex justify-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center md:flex-row md:justify-between md:items-center gap-4 mb-8">
            {isRTL ? (
              <>
                <div className="max-w-2xl md:max-w-none text-center md:text-right">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 md:mb-1">{t("section.categories")}</h2>
                  <p className="text-muted-foreground text-sm md:text-base">{t("section.categories.subtitle")}</p>
                </div>
                <Link href="/products" className="text-primary text-sm font-medium flex items-center gap-1 group justify-center md:justify-start">
                  {t("common.viewAll")} <ChevronRight className="w-4 h-4 transition-transform rotate-180 group-hover:-translate-x-1" />
                </Link>
              </>
            ) : (
              <>
                <div className="max-w-2xl md:max-w-none text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 md:mb-1">{t("section.categories")}</h2>
                  <p className="text-muted-foreground text-sm md:text-base">{t("section.categories.subtitle")}</p>
                </div>
                <Link href="/products" className="text-primary text-sm font-medium flex items-center gap-1 group justify-center md:justify-start">
                  {t("common.viewAll")} <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {categories?.slice(0, 10).map((cat, index) => {
              const IconComponent = cat.icon ? iconMap[cat.icon] : Wrench;
              const translatedName = t(`cat.${cat.slug}`) !== `cat.${cat.slug}` ? t(`cat.${cat.slug}`) : cat.name;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                  className="h-full"
                >
                  <Link href={`/products?categoryId=${cat.id}`}>
                    <div className="group cursor-pointer bg-card rounded-xl p-4 md:p-5 border hover:border-primary/30 hover:shadow-md transition-all text-center h-full flex flex-col items-center justify-center">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        {IconComponent && <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-primary" />}
                      </div>
                      <h3 className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem] flex items-center justify-center">{translatedName}</h3>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile: Auto-scrolling Carousel (All 10 categories) */}
          {categories && categories.length > 0 ? (
            <div className="md:hidden relative -mx-4 px-4 overflow-hidden">
               <div className="flex gap-3 animate-scroll-categories-auto w-max hover:[animation-play-state:paused] py-2">
                  {[...categories.slice(0, 10), ...categories.slice(0, 10), ...categories.slice(0, 10)].map((cat, index) => {
                    const IconComponent = cat.icon ? iconMap[cat.icon] : Wrench;
                    const translatedName = t(`cat.${cat.slug}`) !== `cat.${cat.slug}` ? t(`cat.${cat.slug}`) : cat.name;
                    return (
                      <div
                        key={`${cat.id}-${index}`}
                        className="w-[120px] flex-shrink-0"
                      >
                        <Link href={`/products?categoryId=${cat.id}`}>
                          <div className="group cursor-pointer bg-card rounded-xl p-3 border hover:border-primary/30 hover:shadow-md transition-all text-center h-full flex flex-col items-center justify-center aspect-square">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                              {IconComponent && <IconComponent className="w-5 h-5 text-primary" />}
                            </div>
                            <h3 className="font-medium text-xs group-hover:text-primary transition-colors line-clamp-2 flex items-center justify-center text-center leading-tight">{translatedName}</h3>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
              </div>
              {/* Scroll Indicator */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <ChevronLeft className={`w-4 h-4 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                </div>
                <ChevronRight className={`w-4 h-4 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
              </div>
            </div>
          ) : (
            <div className="md:hidden text-center py-12 text-muted-foreground">
              {t("common.noResults")}
            </div>
          )}
          
          {(!categories || categories.length === 0) && (
            <div className="hidden md:block text-center py-12 text-muted-foreground">
              {t("common.noResults")}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center md:flex-row md:justify-between md:items-center gap-4 mb-8">
            {isRTL ? (
              <>
                <div className="max-w-2xl md:max-w-none text-center md:text-right">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 md:mb-1">{t("section.newArrivals")}</h2>
                  <p className="text-muted-foreground text-sm md:text-base">{t("section.newArrivals.subtitle")}</p>
                </div>
                <Link href="/products" className="text-primary text-sm font-medium flex items-center gap-1 group justify-center md:justify-start">
                  {t("common.viewAll")} <ChevronRight className="w-4 h-4 transition-transform rotate-180 group-hover:-translate-x-1" />
                </Link>
              </>
            ) : (
              <>
                <div className="max-w-2xl md:max-w-none text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 md:mb-1">{t("section.newArrivals")}</h2>
                  <p className="text-muted-foreground text-sm md:text-base">{t("section.newArrivals.subtitle")}</p>
                </div>
                <Link href="/products" className="text-primary text-sm font-medium flex items-center gap-1 group justify-center md:justify-start">
                  {t("common.viewAll")} <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products?.slice(0, 4).map((product, i) => (
               <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/products/${product.id}`}>
                  <div className="group bg-card rounded-2xl overflow-hidden border hover:border-primary/50 hover:shadow-lg transition-all h-full flex flex-col">
                    <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                      <img 
                        src={product.images?.[0] || "https://placehold.co/400x300?text=MotorBuy"} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" className="rounded-full">
                          {t("common.viewAll")}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">{product.description}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-bold text-lg">{product.price} KWD</span>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Mobile Scroll */}
          <div className="md:hidden relative -mx-4 px-4 overflow-x-auto scrollbar-hide pb-4">
            <div className="flex gap-4 w-max">
              {products?.slice(0, 4).map((product) => (
                <div key={product.id} className="w-[280px] flex-shrink-0">
                  <Link href={`/products/${product.id}`}>
                    <div className="bg-card rounded-2xl overflow-hidden border shadow-sm h-full flex flex-col">
                      <div className="aspect-video bg-muted relative">
                         <img 
                          src={product.images?.[0] || "https://placehold.co/400x300?text=MotorBuy"} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                        <div className="mt-auto font-bold text-primary">{product.price} KWD</div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
