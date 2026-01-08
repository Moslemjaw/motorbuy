import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRole, useCart } from "@/hooks/use-motorbuy";
import { ShoppingCart, Menu, User, Store, ShieldCheck, LogOut, Home, Package, Users, BookOpen, X } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);

  const cartCount = cart?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const role = roleData?.role;

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "All Parts", icon: Package },
    { href: "/vendors", label: "Shops", icon: Users },
    { href: "/stories", label: "Stories", icon: BookOpen },
  ];

  const closeSheet = () => setIsOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="font-display font-bold text-xl md:text-2xl text-primary flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm md:text-base">
              M
            </div>
            <span className="hidden xs:inline">MotorBuy</span>
          </Link>
          
          <div className="hidden md:flex gap-6">
            {navLinks.slice(1).map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`text-sm font-medium transition-colors ${location === link.href ? 'text-primary' : 'hover:text-primary'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
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
                          <span>My Account</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/vendor/store">
                        <DropdownMenuItem>
                          <Store className="mr-2 h-4 w-4" />
                          <span>My Store</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/vendor/dashboard">
                        <DropdownMenuItem>
                          <Store className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/account">
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          <span>My Account</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/orders">
                        <DropdownMenuItem>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>Order History</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  
                  {role === 'admin' && (
                    <Link href="/admin">
                      <DropdownMenuItem>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Admin Portal</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm">
                <a href="/api/login">Log In</a>
              </Button>
            )}
          </div>

          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-left font-display">Menu</SheetTitle>
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
                    </div>
                    
                    {isAuthenticated && (
                      <>
                        <div className="border-t my-2" />
                        <div className="p-2">
                          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Account
                          </div>
                          {role === 'vendor' ? (
                            <>
                              <Link href="/vendor/account" onClick={closeSheet}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                  <User className="w-5 h-5" />
                                  <span className="font-medium">My Account</span>
                                </div>
                              </Link>
                              <Link href="/vendor/store" onClick={closeSheet}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                  <Store className="w-5 h-5" />
                                  <span className="font-medium">My Store</span>
                                </div>
                              </Link>
                              <Link href="/vendor/dashboard" onClick={closeSheet}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                  <Package className="w-5 h-5" />
                                  <span className="font-medium">Dashboard</span>
                                </div>
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link href="/account" onClick={closeSheet}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                  <User className="w-5 h-5" />
                                  <span className="font-medium">My Account</span>
                                </div>
                              </Link>
                              <Link href="/orders" onClick={closeSheet}>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                  <Package className="w-5 h-5" />
                                  <span className="font-medium">Order History</span>
                                </div>
                              </Link>
                            </>
                          )}
                          
                          {role === 'admin' && (
                            <Link href="/admin" onClick={closeSheet}>
                              <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="font-medium">Admin Portal</span>
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
                          Log out
                        </Button>
                      </div>
                    ) : (
                      <Button asChild className="w-full" data-testid="button-login-mobile">
                        <a href="/api/login">Log In with Replit</a>
                      </Button>
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
