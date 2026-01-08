import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRole, useCart } from "@/hooks/use-motorbuy";
import { ShoppingCart, Menu, User, Store, ShieldCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function Navbar() {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { data: roleData } = useRole();
  const { data: cart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const cartCount = cart?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const role = roleData?.role;

  const NavLinks = () => (
    <>
      <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
        All Parts
      </Link>
      <Link href="/vendors" className="text-sm font-medium hover:text-primary transition-colors">
        Shops
      </Link>
      <Link href="/stories" className="text-sm font-medium hover:text-primary transition-colors">
        Stories
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display font-bold text-2xl text-primary flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              M
            </div>
            MotorBuy
          </Link>
          
          <div className="hidden md:flex gap-6">
            <NavLinks />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

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
                
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal pt-2">
                  Test as different role:
                </DropdownMenuLabel>
                <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                  {[
                    { key: "customer", label: "Cust", icon: User },
                    { key: "vendor", label: "Vendor", icon: Store },
                    { key: "admin", label: "Admin", icon: ShieldCheck },
                  ].map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={role === key ? "default" : "outline"}
                      className="text-xs h-8 px-2"
                      onClick={async () => {
                        await apiRequest("POST", "/api/roles/switch", { role: key });
                        queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
                      }}
                      data-testid={`switch-role-${key}`}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {label}
                    </Button>
                  ))}
                </div>
                
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

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
