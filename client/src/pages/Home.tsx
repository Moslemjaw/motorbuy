import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Package,
  Users,
  ShoppingCart,
  Wrench,
  Battery,
  Disc,
  Zap,
  Cog,
  AlertTriangle,
  ShieldCheck,
  Truck,
  Clock,
  CreditCard,
  Settings,
  CircleStop,
  Gauge,
  Thermometer,
  Fuel,
  Wind,
  Car,
  Armchair,
  Circle,
  Lightbulb,
  Droplets,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  useProducts,
  useCategories,
  useVendors,
  useStories,
} from "@/hooks/use-motorbuy";
import { useMemo, useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";

export default function Home() {
  const { t, isRTL } = useLanguage();
  const { data: categories } = useCategories();
  const { data: vendors } = useVendors();
  const { data: products } = useProducts();
  const { data: stories } = useStories();

  // Categories carousel pause/resume logic with manual scroll support
  const categoriesCarouselRef = useRef<HTMLDivElement>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const isUserScrollingRef = useRef(false);
  const scrollPositionRef = useRef(0);

  const pauseAutoScroll = () => {
    isPausedRef.current = true;
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
      // Sync scroll position when resuming
      if (categoriesCarouselRef.current) {
        scrollPositionRef.current = isRTL
          ? -categoriesCarouselRef.current.scrollLeft
          : categoriesCarouselRef.current.scrollLeft;
      }
    }, 2000);
  };

  useEffect(() => {
    const carousel = categoriesCarouselRef.current;
    if (!carousel || !categories || categories.length === 0) return;

    const scrollSpeed = isRTL ? -0.3 : 0.3;
    const maxScroll = carousel.scrollWidth / 3; // Since we tripled items

    const autoScroll = () => {
      if (isPausedRef.current || isUserScrollingRef.current) {
        animationFrameRef.current = requestAnimationFrame(autoScroll);
        return;
      }

      scrollPositionRef.current += scrollSpeed;

      if (isRTL) {
        if (Math.abs(scrollPositionRef.current) >= maxScroll) {
          scrollPositionRef.current = 0;
        }
        carousel.scrollLeft = -scrollPositionRef.current;
      } else {
        if (scrollPositionRef.current >= maxScroll) {
          scrollPositionRef.current = 0;
        }
        carousel.scrollLeft = scrollPositionRef.current;
      }

      animationFrameRef.current = requestAnimationFrame(autoScroll);
    };

    let scrollTimeout: NodeJS.Timeout;

    const handleTouchStart = () => {
      isUserScrollingRef.current = true;
      pauseAutoScroll();
    };

    const handleTouchEnd = () => {
      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false;
        if (carousel) {
          scrollPositionRef.current = isRTL
            ? -carousel.scrollLeft
            : carousel.scrollLeft;
        }
      }, 150);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a")) {
        pauseAutoScroll();
      }
    };

    const handleScroll = () => {
      isUserScrollingRef.current = true;
      pauseAutoScroll();
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false;
        if (carousel) {
          scrollPositionRef.current = isRTL
            ? -carousel.scrollLeft
            : carousel.scrollLeft;
        }
      }, 150);
    };

    carousel.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    carousel.addEventListener("touchend", handleTouchEnd, { passive: true });
    carousel.addEventListener("click", handleClick);
    carousel.addEventListener("scroll", handleScroll, { passive: true });

    // Start auto-scroll
    animationFrameRef.current = requestAnimationFrame(autoScroll);

    return () => {
      carousel.removeEventListener("touchstart", handleTouchStart);
      carousel.removeEventListener("touchend", handleTouchEnd);
      carousel.removeEventListener("click", handleClick);
      carousel.removeEventListener("scroll", handleScroll);
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [categories, isRTL]);

  const stats = useMemo(
    () => [
      {
        label: t("stats.products"),
        value: products?.length || 0,
        icon: Package,
      },
      {
        label: t("stats.vendors"),
        value: vendors?.filter((v) => v.isApproved).length || 0,
        icon: Users,
      },
      {
        label: t("stats.categories"),
        value: categories?.length || 0,
        icon: Wrench,
      },
    ],
    [products, vendors, categories, t]
  );

  // Compute vendors with ads indicator
  const vendorsWithAds = useMemo(() => {
    const approvedVendors = vendors?.filter((v) => v.isApproved) || [];
    const vendorIdsWithAds = new Set(
      stories?.map((story) => story.vendorId) || []
    );

    return approvedVendors
      .map((vendor) => ({
        ...vendor,
        hasAd: vendorIdsWithAds.has(vendor.id),
      }))
      .slice(0, 8); // Show up to 8 vendors
  }, [vendors, stories]);

  const features = [
    {
      icon: ShieldCheck,
      title: t("feature.quality"),
      desc: t("feature.quality.desc"),
    },
    {
      icon: Truck,
      title: t("feature.delivery"),
      desc: t("feature.delivery.desc"),
    },
    {
      icon: Clock,
      title: t("feature.support"),
      desc: t("feature.support.desc"),
    },
    {
      icon: CreditCard,
      title: t("feature.secure"),
      desc: t("feature.secure.desc"),
    },
  ];

  const iconMap: any = {
    Cog: Cog,
    Settings: Settings,
    CircleStop: CircleStop,
    Gauge: Gauge,
    Zap: Zap,
    Thermometer: Thermometer,
    Fuel: Fuel,
    Wind: Wind,
    Car: Car,
    Armchair: Armchair,
    Circle: Circle,
    Lightbulb: Lightbulb,
    Droplets: Droplets,
    // Fallbacks or legacy
    engine: Cog,
    brakes: CircleStop,
    suspension: Gauge,
    electrical: Zap,
    batteries: Battery,
    filters: Package,
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />

      <section className="relative overflow-hidden bg-background pt-16 pb-16 lg:pt-24 lg:pb-24">
        {/* Ambient Background with Blue Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-background to-blue-50/30 dark:from-blue-950/20 dark:to-background -z-20" />

        <div className="container relative z-10 px-4 mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-6xl mx-auto"
          >
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border bg-white/80 dark:bg-background/80 backdrop-blur-sm px-3 py-1 text-sm font-medium text-foreground transition-colors hover:bg-white/90 mb-4 shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              {t("hero.badge")}
            </motion.div>

            {/* Main Heading - Reduced Size */}
            <h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground ${
                isRTL ? "leading-tight" : "leading-[1.1]"
              } mb-4`}
            >
              <span className="block">{t("hero.title")}</span>
              <span className="inline-block text-primary relative mt-2">
                {t("hero.title.highlight")}
                {/* Underline decoration */}
                <svg
                  className="absolute w-full h-3 -bottom-1 left-0 text-blue-200 dark:text-blue-900 -z-10"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className={`text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed`}
            >
              {t("hero.subtitle")}
            </p>

            {/* Buttons */}
            <div className="flex flex-row items-center justify-center gap-3 mb-12">
              <Link
                href="/products"
                className="flex-1 sm:flex-initial max-w-[200px] sm:max-w-none"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-4 sm:px-8 text-sm sm:text-base rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-primary text-primary-foreground"
                >
                  {t("hero.shopParts")}{" "}
                  <ArrowRight
                    className={`w-4 h-4 ${isRTL ? "mr-2 rotate-180" : "ml-2"}`}
                  />
                </Button>
              </Link>
              <Link
                href="/vendors"
                className="flex-1 sm:flex-initial max-w-[200px] sm:max-w-none"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-4 sm:px-8 text-sm sm:text-base rounded-full border-2 bg-background/50 hover:bg-background transition-all duration-300"
                >
                  {t("hero.browseVendors")}
                </Button>
              </Link>
            </div>

            {/* Trusted By / Stats Bar */}
            <div className="border-t border-border/50 pt-8">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-6">
                Trusted by automotive enthusiasts
              </p>
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 md:gap-x-20">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center group cursor-default"
                  >
                    <stat.icon className="w-5 h-5 text-primary/80 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                      <div className="text-xl font-bold font-display text-foreground leading-none">
                        {stat.value}+
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wide">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center md:flex-row md:justify-between md:items-center gap-4 mb-8">
            {isRTL ? (
              <>
                <div className="max-w-2xl md:max-w-none text-center md:text-right">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 md:mb-1">
                    {t("section.categories")}
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    {t("section.categories.subtitle")}
                  </p>
                </div>
                <Link
                  href="/products"
                  className="text-primary text-sm font-medium flex items-center gap-1 group justify-center md:justify-start"
                >
                  {t("common.viewAll")}{" "}
                  <ChevronRight className="w-4 h-4 transition-transform rotate-180 group-hover:-translate-x-1" />
                </Link>
              </>
            ) : (
              <>
                <div className="max-w-2xl md:max-w-none text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 md:mb-1">
                    {t("section.categories")}
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    {t("section.categories.subtitle")}
                  </p>
                </div>
                <Link
                  href="/products"
                  className="text-primary text-sm font-medium flex items-center gap-1 group justify-center md:justify-start"
                >
                  {t("common.viewAll")}{" "}
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {categories?.slice(0, 10).map((cat, index) => {
              const IconComponent = cat.icon ? iconMap[cat.icon] : Wrench;
              const translatedName =
                t(`cat.${cat.slug}`) !== `cat.${cat.slug}`
                  ? t(`cat.${cat.slug}`)
                  : cat.name;
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
                        {IconComponent && (
                          <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        )}
                      </div>
                      <h3 className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                        {translatedName}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile: Auto-scrolling Carousel (All 10 categories) */}
          {categories && categories.length > 0 ? (
            <div className="md:hidden relative -mx-4 px-4 overflow-hidden">
              <div
                ref={categoriesCarouselRef}
                className="flex gap-3 w-max py-2 overflow-x-auto scrollbar-hide"
              >
                {[
                  ...categories.slice(0, 10),
                  ...categories.slice(0, 10),
                  ...categories.slice(0, 10),
                ].map((cat, index) => {
                  const IconComponent = cat.icon ? iconMap[cat.icon] : Wrench;
                  const translatedName =
                    t(`cat.${cat.slug}`) !== `cat.${cat.slug}`
                      ? t(`cat.${cat.slug}`)
                      : cat.name;
                  return (
                    <div
                      key={`${cat.id}-${index}`}
                      className="w-[120px] flex-shrink-0"
                    >
                      <Link href={`/products?categoryId=${cat.id}`}>
                        <div className="group cursor-pointer bg-card rounded-xl p-3 border hover:border-primary/30 hover:shadow-md transition-all text-center h-full flex flex-col items-center justify-center aspect-square">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                            {IconComponent && (
                              <IconComponent className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <h3 className="font-medium text-xs group-hover:text-primary transition-colors line-clamp-2 flex items-center justify-center text-center leading-tight">
                            {translatedName}
                          </h3>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
              {/* Scroll Indicator */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <ChevronLeft
                  className={`w-4 h-4 text-muted-foreground ${
                    isRTL ? "rotate-180" : ""
                  }`}
                />
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground ${
                    isRTL ? "rotate-180" : ""
                  }`}
                />
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
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 md:mb-1">
                    {t("section.newArrivals")}
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    {t("section.newArrivals.subtitle")}
                  </p>
                </div>
                <Link
                  href="/products"
                  className="text-primary text-sm font-medium flex items-center gap-1 group justify-center md:justify-start"
                >
                  {t("common.viewAll")}{" "}
                  <ChevronRight className="w-4 h-4 transition-transform rotate-180 group-hover:-translate-x-1" />
                </Link>
              </>
            ) : (
              <>
                <div className="max-w-2xl md:max-w-none text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 md:mb-1">
                    {t("section.newArrivals")}
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    {t("section.newArrivals.subtitle")}
                  </p>
                </div>
                <Link
                  href="/products"
                  className="text-primary text-sm font-medium flex items-center gap-1 group justify-center md:justify-start"
                >
                  {t("common.viewAll")}{" "}
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
                        src={
                          product.images?.[0] ||
                          "https://placehold.co/400x300?text=MotorBuy"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-full"
                        >
                          {t("common.viewAll")}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-bold text-lg">
                          {product.price} KWD
                        </span>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <ArrowRight
                            className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Mobile Scroll */}
          <div className="md:hidden relative -mx-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
            <div className="flex gap-4 px-4 w-max">
              {products?.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="w-[85vw] max-w-[280px] flex-shrink-0 snap-center first:pl-0 last:pr-4"
                >
                  <Link href={`/products/${product.id}`}>
                    <div className="bg-card rounded-2xl overflow-hidden border shadow-sm h-full flex flex-col">
                      <div className="aspect-video bg-muted relative">
                        <img
                          src={
                            product.images?.[0] ||
                            "https://placehold.co/400x300?text=MotorBuy"
                          }
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-semibold mb-1 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="mt-auto font-bold text-primary">
                          {product.price} KWD
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Vendors Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center md:flex-row md:justify-between md:items-center gap-4 mb-12">
            {isRTL ? (
              <>
                <div className="max-w-2xl md:max-w-none text-center md:text-right">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 md:mb-1">
                    {t("section.trustedVendors")}
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    {t("section.trustedVendors.subtitle")}
                  </p>
                </div>
                <Link
                  href="/stories"
                  className="text-primary text-sm font-medium flex items-center gap-1 group justify-center md:justify-start"
                >
                  {t("section.trustedVendors.viewMoreAds")}{" "}
                  <ChevronRight className="w-4 h-4 transition-transform rotate-180 group-hover:-translate-x-1" />
                </Link>
              </>
            ) : (
              <>
                <div className="max-w-2xl md:max-w-none text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 md:mb-1">
                    {t("section.trustedVendors")}
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    {t("section.trustedVendors.subtitle")}
                  </p>
                </div>
                <Link
                  href="/stories"
                  className="text-primary text-sm font-medium flex items-center gap-1 group justify-center md:justify-start"
                >
                  {t("section.trustedVendors.viewMoreAds")}{" "}
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>

          {/* Desktop: Grid Layout */}
          {vendorsWithAds.length > 0 && (
            <>
              <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                {vendorsWithAds.map((vendor, i) => (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={`/vendors/${vendor.id}`}>
                      <div className="group relative bg-card border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg transition-all text-center h-full flex flex-col items-center">
                        {/* Bright ring indicator for vendors with ads */}
                        {vendor.hasAd && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg z-10 animate-pulse">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {vendor.hasAd && (
                          <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-pulse pointer-events-none" />
                        )}

                        {/* Vendor Logo */}
                        <div
                          className={`relative w-20 h-20 mb-4 rounded-full overflow-hidden border-2 flex items-center justify-center ${
                            vendor.hasAd
                              ? "border-primary shadow-lg shadow-primary/20"
                              : "border-border"
                          }`}
                        >
                          {vendor.logoUrl ? (
                            <img
                              src={vendor.logoUrl}
                              alt={vendor.storeName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                              <span className="text-2xl font-bold text-primary">
                                {vendor.storeName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Vendor Name */}
                        <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors line-clamp-2">
                          {vendor.storeName}
                        </h3>

                        {/* Vendor Description */}
                        {vendor.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {vendor.description}
                          </p>
                        )}

                        {/* Has Ad Badge */}
                        {vendor.hasAd && (
                          <div className="mt-3 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            {t("section.trustedVendors.hasAd")}
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Mobile: Horizontal Scrollable */}
              <div className="md:hidden relative -mx-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
                <div className="flex gap-4 px-4 w-max">
                  {vendorsWithAds.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="w-[200px] flex-shrink-0 snap-center"
                    >
                      <Link href={`/vendors/${vendor.id}`}>
                        <div className="group relative bg-card border rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg transition-all text-center h-full flex flex-col items-center">
                          {/* Bright ring indicator for vendors with ads */}
                          {vendor.hasAd && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg z-10 animate-pulse">
                              <Sparkles className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {vendor.hasAd && (
                            <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-pulse pointer-events-none" />
                          )}

                          {/* Vendor Logo */}
                          <div
                            className={`relative w-16 h-16 mb-3 rounded-full overflow-hidden border-2 flex items-center justify-center ${
                              vendor.hasAd
                                ? "border-primary shadow-lg shadow-primary/20"
                                : "border-border"
                            }`}
                          >
                            {vendor.logoUrl ? (
                              <img
                                src={vendor.logoUrl}
                                alt={vendor.storeName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xl font-bold text-primary">
                                  {vendor.storeName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Vendor Name */}
                          <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                            {vendor.storeName}
                          </h3>

                          {/* Has Ad Badge */}
                          {vendor.hasAd && (
                            <div className="mt-2 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
                              {t("section.trustedVendors.hasAd")}
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {vendorsWithAds.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {t("section.trustedVendors.noVendors")}
            </div>
          )}
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              {t("section.whyUs")}
            </h2>
            <p className="text-muted-foreground">
              {t("section.whyUs.subtitle")}
            </p>
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
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Mobile: Horizontal Scrollable Row (Auto-scrolling) */}
          <div className="md:hidden relative -mx-4 px-4 overflow-hidden">
            <div className="flex gap-4 animate-scroll-features-auto w-max hover:[animation-play-state:paused] py-4">
              {[...features, ...features, ...features].map(
                (
                  item,
                  i // Tripled for smoother loop
                ) => (
                  <div
                    key={i}
                    className="w-[280px] flex-shrink-0 bg-card border rounded-2xl p-6 text-center shadow-sm"
                  >
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                )
              )}
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

      <Footer />
    </div>
  );
}
