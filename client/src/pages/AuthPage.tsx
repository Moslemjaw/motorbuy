import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-motorbuy";
import { Link, useLocation } from "wouter";
import { LogIn, UserPlus, Car, Store, Shield, User, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Welcome back!</CardTitle>
                <CardDescription>
                  You are signed in as {user.firstName || user.email || "User"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    <User className="w-4 h-4 mr-1" />
                    {user.email}
                  </Badge>
                  {!isRoleLoading && roleData && (
                    <Badge className="text-sm py-1 px-3 capitalize">
                      {roleData.role === "admin" && <Shield className="w-4 h-4 mr-1" />}
                      {roleData.role === "vendor" && <Store className="w-4 h-4 mr-1" />}
                      {roleData.role === "customer" && <Car className="w-4 h-4 mr-1" />}
                      {roleData.role}
                    </Badge>
                  )}
                </div>

                <div className="grid gap-3">
                  <Link href="/">
                    <Button className="w-full" size="lg" data-testid="button-go-home">
                      Go to Home
                    </Button>
                  </Link>
                  
                  {roleData?.role === "customer" && (
                    <Link href="/account">
                      <Button variant="outline" className="w-full" size="lg" data-testid="button-customer-dashboard">
                        Customer Dashboard
                      </Button>
                    </Link>
                  )}
                  
                  {roleData?.role === "vendor" && (
                    <Link href="/vendor/dashboard">
                      <Button variant="outline" className="w-full" size="lg" data-testid="button-vendor-dashboard">
                        Vendor Dashboard
                      </Button>
                    </Link>
                  )}
                  
                  {roleData?.role === "admin" && (
                    <Link href="/admin">
                      <Button variant="outline" className="w-full" size="lg" data-testid="button-admin-dashboard">
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={handleLogout}
                    data-testid="button-logout"
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {process.env.NODE_ENV === "development" && (
              <RoleSwitcher currentRole={roleData?.role} />
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Car className="w-4 h-4" />
              Kuwait's Premier Car Parts Marketplace
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              Welcome to MotorBuy
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sign in to browse parts, manage your shop, or access admin features
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <LogIn className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Already have a Replit account? Sign in to access your MotorBuy dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleLogin}
                  data-testid="button-sign-in"
                >
                  Sign In with Replit
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                  <UserPlus className="w-6 h-6 text-accent-foreground" />
                </div>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  New to MotorBuy? Create a free Replit account to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg" 
                  onClick={handleLogin}
                  data-testid="button-sign-up"
                >
                  Create Account
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-6 text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Car className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-bold mb-2">Customer</h3>
              <p className="text-sm text-muted-foreground">
                Browse parts, compare prices, and order from multiple vendors
              </p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Store className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-bold mb-2">Vendor</h3>
              <p className="text-sm text-muted-foreground">
                List your parts, manage inventory, and grow your business
              </p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-bold mb-2">Admin</h3>
              <p className="text-sm text-muted-foreground">
                Oversee the marketplace, approve vendors, and manage users
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/">
              <Button variant="ghost" data-testid="link-back-home">
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function RoleSwitcher({ currentRole }: { currentRole?: string }) {
  const handleSwitchRole = async (role: string) => {
    try {
      const res = await fetch("/api/roles/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to switch role:", e);
    }
  };

  return (
    <Card className="mt-6 border-dashed border-yellow-500/50 bg-yellow-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            Dev Mode
          </Badge>
          Role Switcher
        </CardTitle>
        <CardDescription className="text-xs">
          Switch roles to test different user experiences (development only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={currentRole === "customer" ? "default" : "outline"}
            onClick={() => handleSwitchRole("customer")}
            data-testid="button-switch-customer"
          >
            <Car className="w-4 h-4 mr-1" /> Customer
          </Button>
          <Button
            size="sm"
            variant={currentRole === "vendor" ? "default" : "outline"}
            onClick={() => handleSwitchRole("vendor")}
            data-testid="button-switch-vendor"
          >
            <Store className="w-4 h-4 mr-1" /> Vendor
          </Button>
          <Button
            size="sm"
            variant={currentRole === "admin" ? "default" : "outline"}
            onClick={() => handleSwitchRole("admin")}
            data-testid="button-switch-admin"
          >
            <Shield className="w-4 h-4 mr-1" /> Admin
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
