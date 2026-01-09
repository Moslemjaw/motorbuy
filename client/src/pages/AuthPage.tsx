import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-motorbuy";
import { useLanguage } from "@/lib/i18n";
import { Link, useLocation } from "wouter";
import { Car, Store, Shield, User, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api-config";
import carLogo from "@assets/image_2026-01-09_142631252-removebg-preview_1767958016384.png";

export default function AuthPage() {
  const { user, isLoading, isAuthenticated, login, signup, logout, isLoggingIn, isSigningUp } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, isRTL, language } = useLanguage();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login({ email: formData.email, password: formData.password });
        toast({ title: t("auth.loginSuccess"), description: t("auth.loginSuccessDesc") });
        // Removed auto-redirect - user can choose where to go from the welcome page
      } else {
        await signup(formData);
        toast({ title: t("auth.signupSuccess"), description: t("auth.signupSuccessDesc") });
        // Removed auto-redirect - user can choose where to go from the welcome page
      }
    } catch (error: any) {
      const message = error?.message || t("auth.genericError");
      toast({ title: t("auth.error"), description: message, variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: t("auth.loggedOut"), description: t("auth.loggedOutDesc") });
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
                <CardTitle className="text-2xl">{t("auth.welcome")}</CardTitle>
                <CardDescription>
                  {t("auth.signedInAs")} {user.firstName || user.email || t("auth.defaultUser")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    <User className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {user.email}
                  </Badge>
                  {!isRoleLoading && roleData && (
                    <Badge className="text-sm py-1 px-3 capitalize">
                      {roleData.role === "admin" && <Shield className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />}
                      {roleData.role === "vendor" && <Store className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />}
                      {roleData.role === "customer" && <Car className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />}
                      {roleData.role}
                    </Badge>
                  )}
                </div>

                <div className="grid gap-3">
                  {(roleData?.role === "vendor" || roleData?.role === "admin") && (
                    <Link href={roleData.role === "vendor" ? "/vendor/dashboard" : "/admin"}>
                      <Button className="w-full" size="lg" data-testid="button-go-dashboard">
                        {t("auth.goToDashboard") || "Go to Dashboard"}
                      </Button>
                    </Link>
                  )}
                  
                  <Link href="/">
                    <Button variant={roleData?.role === "vendor" || roleData?.role === "admin" ? "outline" : "default"} className="w-full" size="lg" data-testid="button-go-home">
                      {t("auth.goHome")}
                    </Button>
                  </Link>
                  
                  {roleData?.role === "customer" && (
                    <Link href="/account">
                      <Button variant="outline" className="w-full" size="lg" data-testid="button-customer-dashboard">
                        {t("auth.customerDashboard")}
                      </Button>
                    </Link>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={handleLogout}
                    data-testid="button-logout"
                  >
                    {t("auth.signOut")}
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
            <Link href="/">
              <span className="inline-flex items-center gap-2 font-display font-bold text-2xl mb-4 cursor-pointer">
                <img src={carLogo} alt="MotorBuy" className="w-12 h-12 object-contain" />
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
              </span>
            </Link>
            <p className="text-muted-foreground mt-2">
              {mode === "login" ? t("auth.welcomeSubtitle") : t("auth.createSubtitle")}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{mode === "login" ? t("auth.login") : t("auth.createAccount")}</CardTitle>
              <CardDescription>
                {mode === "login" 
                  ? t("auth.enterEmail") 
                  : t("auth.createSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t("auth.firstName")}</Label>
                      <Input
                        id="firstName"
                        placeholder={isRTL ? "محمد" : "John"}
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t("auth.lastName")}</Label>
                      <Input
                        id="lastName"
                        placeholder={isRTL ? "العلي" : "Doe"}
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
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
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={mode === "signup" ? t("auth.passwordHint") : ""}
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
                      className={`absolute top-0 h-full px-3 ${isRTL ? 'left-0' : 'right-0'}`}
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
                  {(isLoggingIn || isSigningUp) && <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}
                  {mode === "login" ? t("auth.login") : t("auth.createAccount")}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                {mode === "login" ? (
                  <p>
                    {t("auth.noAccount")}{" "}
                    <button 
                      onClick={() => setMode("signup")} 
                      className="text-primary font-medium hover:underline"
                      data-testid="button-switch-to-signup"
                    >
                      {t("auth.createOne")}
                    </button>
                  </p>
                ) : (
                  <p>
                    {t("auth.haveAccount")}{" "}
                    <button 
                      onClick={() => setMode("login")} 
                      className="text-primary font-medium hover:underline"
                      data-testid="button-switch-to-login"
                    >
                      {t("auth.signIn")}
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("auth.or")}
                </span>
              </div>
            </div>
            <Link href="/products">
              <Button variant="outline" className="w-full" data-testid="button-guest-continue">
                {t("auth.continueAsGuest")}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full" data-testid="button-back-home">
                {t("auth.backHome")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
