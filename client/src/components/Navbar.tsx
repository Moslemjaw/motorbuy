import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRole, useCart } from "@/hooks/use-motorbuy";
import { useLanguage } from "@/lib/i18n";
import { ShoppingCart, Menu, User, Store, ShieldCheck, LogOut, Home, Package, Users, BookOpen, Globe } from "lucide-react";
import carLogo from "@assets/image_2026-01-09_142631252-removebg-preview_1767958016384.png";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Navbar() {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { data: roleData } = useRole();
  const { data: cart } = useCart();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const cartCount = cart?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const role = roleData?.role;

  const navLinks = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/products", label: t("nav.products"), icon: Package },
    { href: "/vendors", label: t("nav.vendors"), icon: Users },
    { href: "/stories", label: t("section.ads"), icon: BookOpen },
  ];

  const closeSheet = () => setIsOpen(false);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  // Check if we're on a dashboard page
  const isDashboardPage = location.startsWith("/vendor/dashboard") || location.startsWith("/admin");

  const renderLogo = () => (
    <Link href="/" className="font-display font-bold text-lg md:text-xl flex items-center gap-2">
      <img src={carLogo} alt="MotorBuy" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
      {language === "ar" ? (
        <span>
          <span className="text-[hsl(var(--logo-accent))]">موتور</span>
          <span className="text-primary">باي</span>
        </span>
      ) : (
        <span>
          <span className="text-primary">motor</span>
          <span className="text-[hsl(var(--logo-accent))]">buy</span>
        </span>
      )}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={`${isDashboardPage ? "lg:pl-64" : ""} container mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-4 md:gap-8">
          {renderLogo()}
          <div className="hidden md:flex gap-6 items-center">
            {navLinks.slice(1).map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`text-sm font-medium transition-colors ${location === link.href ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {link.label}
              </Link>
            ))}
            {(!isAuthenticated || (role !== 'vendor' && role !== 'admin')) && (
              <Link 
                href="/become-vendor"
                className={`text-sm font-medium transition-colors ${location === '/become-vendor' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t("account.becomeVendor")}
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLanguage}
            className="gap-1.5 text-xs font-medium px-2 md:px-3"
            data-testid="button-language-toggle"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "en" ? "العربية" : "English"}</span>
            <span className="sm:hidden">{language === "en" ? "AR" : "EN"}</span>
          </Button>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          <div className="hidden md:block">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {role === 'vendor' ? (
                    <>
                      <Link href="/vendor/account">
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          <span>{t("nav.account")}</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/vendor/dashboard">
                        <DropdownMenuItem>
                          <Store className="mr-2 h-4 w-4" />
                          <span>{t("nav.dashboard")}</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/account">
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          <span>{t("nav.account")}</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/orders">
                        <DropdownMenuItem>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>{t("customer.orders")}</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/become-vendor">
                        <DropdownMenuItem>
                          <Store className="mr-2 h-4 w-4" />
                          <span>{t("account.becomeVendor")}</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  
                  {role === 'admin' && (
                    <Link href="/admin">
                      <DropdownMenuItem>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>{t("nav.admin")}</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("nav.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button size="sm" data-testid="button-login">
                  {t("nav.login")}
                </Button>
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "left" : "right"} className="w-[280px] sm:w-[320px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className={`${isRTL ? 'text-right' : 'text-left'} font-display`}>
                    {t("nav.home")}
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col h-[calc(100%-60px)]">
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-2">
                      {navLinks.map((link) => (
                        <Link key={link.href} href={link.href} onClick={closeSheet}>
                          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location === link.href ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
                            <link.icon className="w-5 h-5" />
                            <span className="font-medium">{link.label}</span>
                          </div>
                        </Link>
                      ))}
                      {(!isAuthenticated || (role !== 'vendor' && role !== 'admin')) && (
                        <Link href="/become-vendor" onClick={closeSheet}>
                          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location === '/become-vendor' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
                            <Store className="w-5 h-5" />
                            <span className="font-medium">{t("account.becomeVendor")}</span>
                          </div>
                        </Link>
                      )}
                    </div>
                    
                    {isAuthenticated && (
                      <>
                        <div className="border-t my-2" />
                        <div className="p-2">
                          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("nav.account")}
                          </div>
                          {role === 'vendor' ? (
                            <>
                              <Link href="/vendor/account" onClick={closeSheet}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                  <User className="w-5 h-5" />
                                  <span className="font-medium">{t("nav.account")}</span>
                                </div>
                              </Link>
                              <Link href="/vendor/dashboard" onClick={closeSheet}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                  <Package className="w-5 h-5" />
                                  <span className="font-medium">{t("nav.dashboard")}</span>
                                </div>
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link href="/account" onClick={closeSheet}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                  <User className="w-5 h-5" />
                                  <span className="font-medium">{t("nav.account")}</span>
                                </div>
                              </Link>
                              <Link href="/orders" onClick={closeSheet}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                  <Package className="w-5 h-5" />
                                  <span className="font-medium">{t("customer.orders")}</span>
                                </div>
                              </Link>
                              <Link href="/become-vendor" onClick={closeSheet}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                  <Store className="w-5 h-5" />
                                  <span className="font-medium">{t("account.becomeVendor")}</span>
                                </div>
                              </Link>
                            </>
                          )}
                          
                          {role === 'admin' && (
                            <Link href="/admin" onClick={closeSheet}>
                              <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="font-medium">{t("nav.admin")}</span>
                              </div>
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="border-t p-4">
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 px-2">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{user?.firstName} {user?.lastName}</div>
                            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                          onClick={() => { logout(); closeSheet(); }}
                          data-testid="button-logout-mobile"
                        >
                          <LogOut className="w-4 h-4" />
                          {t("nav.logout")}
                        </Button>
                      </div>
                    ) : (
                      <Link href="/auth" onClick={closeSheet}>
                        <Button className="w-full" data-testid="button-login-mobile">
                          {t("nav.login")}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
