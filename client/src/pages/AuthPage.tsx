import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-motorbuy";
import { Link, useLocation } from "wouter";
import { LogIn, UserPlus, Car, Store, Shield, User, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, isLoading, isAuthenticated, login, signup, logout, isLoggingIn, isSigningUp } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const getRedirectPath = async () => {
    try {
      const res = await fetch("/api/role", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.role === "vendor") return "/vendor/dashboard";
        if (data.role === "admin") return "/admin";
      }
    } catch {}
    return "/";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login({ email: formData.email, password: formData.password });
        toast({ title: "Welcome back!", description: "You have successfully logged in." });
        const redirectPath = await getRedirectPath();
        setLocation(redirectPath);
      } else {
        await signup(formData);
        toast({ title: "Account created!", description: "Welcome to MotorBuy." });
        setLocation("/");
      }
    } catch (error: any) {
      const message = error?.message || "An error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Logged out", description: "You have been logged out." });
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
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-primary font-display font-bold text-2xl mb-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base">
                M
              </div>
              MotorBuy
            </Link>
            <p className="text-muted-foreground">
              {mode === "login" ? "Sign in to your account" : "Create a new account"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{mode === "login" ? "Sign In" : "Create Account"}</CardTitle>
              <CardDescription>
                {mode === "login" 
                  ? "Enter your email and password to sign in" 
                  : "Fill in your details to create an account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={mode === "signup" ? 6 : undefined}
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoggingIn || isSigningUp}
                  data-testid="button-submit"
                >
                  {(isLoggingIn || isSigningUp) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {mode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                {mode === "login" ? (
                  <p>
                    Don't have an account?{" "}
                    <button 
                      onClick={() => setMode("signup")} 
                      className="text-primary font-medium hover:underline"
                      data-testid="button-switch-to-signup"
                    >
                      Create one
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button 
                      onClick={() => setMode("login")} 
                      className="text-primary font-medium hover:underline"
                      data-testid="button-switch-to-login"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Link href="/">
              <Button variant="ghost" data-testid="button-back-home">
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
