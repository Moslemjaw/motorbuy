import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, Package, ShoppingCart, BookOpen, Store, 
  Wallet, Users, FolderOpen, BarChart3, DollarSign, LogOut,
  Menu, X, Settings, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import carLogo from "@assets/image_2026-01-09_142631252-removebg-preview_1767958016384.png";

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  translationKey: string;
}

interface DashboardSidebarProps {
  type: "vendor" | "admin";
}

export function DashboardSidebar({ type }: DashboardSidebarProps) {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  const vendorItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: t("vendor.dashboard.title"), href: "/vendor/dashboard", translationKey: "vendor.dashboard.title" },
    { icon: Package, label: t("vendor.products"), href: "/vendor/dashboard#products", translationKey: "vendor.products" },
    { icon: ShoppingCart, label: t("vendor.orders"), href: "/vendor/dashboard#orders", translationKey: "vendor.orders" },
    { icon: BookOpen, label: t("vendor.ads"), href: "/vendor/dashboard", translationKey: "vendor.ads" },
    { icon: Store, label: t("vendor.dashboard.tabShop"), href: "/vendor/dashboard#shop", translationKey: "vendor.dashboard.tabShop" },
    { icon: Wallet, label: t("wallet.title"), href: "/vendor/wallet", translationKey: "wallet.title" },
  ];

  const adminItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: t("admin.dashboard.tabAnalytics"), href: "/admin#analytics", translationKey: "admin.dashboard.tabAnalytics" },
    { icon: Store, label: t("admin.dashboard.tabVendors"), href: "/admin#vendors", translationKey: "admin.dashboard.tabVendors" },
    { icon: Users, label: t("admin.dashboard.tabUsers"), href: "/admin#users", translationKey: "admin.dashboard.tabUsers" },
    { icon: FolderOpen, label: t("admin.dashboard.tabCategories"), href: "/admin#categories", translationKey: "admin.dashboard.tabCategories" },
    { icon: BookOpen, label: t("admin.dashboard.tabAds"), href: "/admin#ads", translationKey: "admin.dashboard.tabAds" },
    { icon: ShoppingCart, label: t("admin.dashboard.tabOrders"), href: "/admin#orders", translationKey: "admin.dashboard.tabOrders" },
    { icon: DollarSign, label: t("admin.dashboard.tabPayouts"), href: "/admin#payouts", translationKey: "admin.dashboard.tabPayouts" },
  ];

  const items = type === "vendor" ? vendorItems : adminItems;
  const isActive = (href: string) => {
    if (href.includes("#")) {
      const basePath = href.split("#")[0];
      const hash = href.split("#")[1];
      const currentHash = window.location.hash.replace("#", "");
      const isBasePathMatch = location === basePath || location.startsWith(basePath + "/");
      if (type === "vendor") {
        return isBasePathMatch && (hash === currentHash || (!currentHash && hash === "products"));
      } else {
        return isBasePathMatch && hash === currentHash;
      }
    }
    return location === href || location.startsWith(href + "/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <img src={carLogo} alt="MotorBuy" className="w-10 h-10 object-contain transition-transform group-hover:scale-110" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg">
                {language === "ar" ? (
                  <>
                    <span className="text-[hsl(var(--logo-accent))]">موتور</span>
                    <span className="text-primary">باي</span>
                  </>
                ) : (
                  <>
                    <span className="text-primary">motor</span>
                    <span className="text-[hsl(var(--logo-accent))]">buy</span>
                  </>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {type === "vendor" ? t("vendor.dashboard.title") : t("admin.dashboard.title")}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer",
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                !active && (isRTL ? "hover:-translate-x-1" : "hover:translate-x-1")
              )}
              onClick={() => {
                setIsMobileOpen(false);
                if (item.href.includes("#")) {
                  const [path, hash] = item.href.split("#");
                  window.location.hash = hash;
                  if (window.location.pathname !== path) {
                    window.location.href = `${path}#${hash}`;
                  }
                } else {
                  window.location.href = item.href;
                }
              }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      <div className="p-4 border-t space-y-2">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            onClick={toggleLanguage}
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm">{language === "en" ? "العربية" : "English"}</span>
          </div>
          <Link href={type === "vendor" ? "/vendor/account" : "/account"}>
            <div
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              onClick={() => setIsMobileOpen(false)}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">{t("nav.account")}</span>
            </div>
          </Link>
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            onClick={() => {
              logout();
              setIsMobileOpen(false);
            }}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">{t("nav.logout")}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 z-40 w-full bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2">
            <img src={carLogo} alt="MotorBuy" className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">
              {language === "ar" ? (
                <>
                  <span className="text-[hsl(var(--logo-accent))]">موتور</span>
                  <span className="text-primary">باي</span>
                </>
              ) : (
                <>
                  <span className="text-primary">motor</span>
                  <span className="text-[hsl(var(--logo-accent))]">buy</span>
                </>
              )}
            </span>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 h-screen bg-card/95 backdrop-blur-sm border-r shadow-xl z-50 transition-transform duration-300 w-64",
          isRTL ? "right-0 border-l border-r-0" : "left-0",
          isMobileOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Spacer */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
      
      {/* Mobile Top Spacer */}
      <div className="lg:hidden h-16 flex-shrink-0" />
    </>
  );
}

