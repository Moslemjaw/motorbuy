import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-motorbuy";
import { useLanguage } from "@/lib/i18n";
import { Store, Loader2, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { buildApiUrl } from "@/lib/api-config";

export default function BecomeVendor() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/auth");
    }
    if (!isRoleLoading && roleData?.role !== "customer") {
      setLocation("/");
    }
    if (user) {
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [isAuthLoading, isAuthenticated, isRoleLoading, roleData, user, setLocation]);

  const submitRequestMutation = useMutation({
    mutationFn: async (data: { companyName: string; phone: string; email: string }) => {
      const res = await fetch(buildApiUrl("/api/vendor/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to submit request");
      }
      return res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: t("vendorRequest.success"),
        description: t("vendorRequest.successDesc"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("vendorRequest.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !phone || !email) {
      toast({
        title: t("vendorRequest.missingFields"),
        description: t("vendorRequest.missingFieldsDesc"),
        variant: "destructive",
      });
      return;
    }
    submitRequestMutation.mutate({ companyName, phone, email });
  };

  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated || roleData?.role !== "customer") {
    return null;
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">{t("vendorRequest.success")}</h2>
                  <p className="text-muted-foreground">{t("vendorRequest.contactMessage")}</p>
                </div>
                <Button onClick={() => setLocation("/account")} className="w-full sm:w-auto">
                  {t("vendorRequest.backToAccount")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      
      <div className="bg-primary/10 py-6 md:py-12 mb-6 md:mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-1 md:mb-2">{t("vendorRequest.title")}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{t("vendorRequest.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" /> {t("vendorRequest.formTitle")}
            </CardTitle>
            <CardDescription>{t("vendorRequest.formDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">{t("vendorRequest.companyName")} *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={isRTL ? "اسم الشركة" : "Company Name"}
                  required
                  dir={isRTL ? "rtl" : "ltr"}
                  className={isRTL ? "text-right" : "text-left"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("vendorRequest.phone")} *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+965 XXXX XXXX"
                  required
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("vendorRequest.email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com"
                  required
                  dir="ltr"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitRequestMutation.isPending}
              >
                {submitRequestMutation.isPending ? (
                  <>
                    <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t("vendorRequest.submitting")}
                  </>
                ) : (
                  t("vendorRequest.submit")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

