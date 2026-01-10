import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-motorbuy";
import { Wallet, Loader2, ArrowLeft, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatKWD } from "@/lib/currency";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PaymentRequest } from "@shared/schema";
import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n";

export default function VendorWallet() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();

  const { data: walletData, isLoading: isWalletLoading } = useQuery<{
    grossSalesKwd: string;
    pendingPayoutKwd: string;
    walletBalanceKwd: string; // New
    lifetimePayoutsKwd: string;
    commissionType: "percentage" | "fixed";
    commissionValue: string;
    paymentRequests: PaymentRequest[];
  }>({
    queryKey: ["/api/vendor/wallet"],
    enabled: !!user && roleData?.role === "vendor",
  });

  const requestPaymentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/vendor/wallet/request", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/wallet"] });
      toast({ title: t("wallet.paymentRequested"), description: t("wallet.paymentRequestedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
    if (!isRoleLoading && roleData?.role !== "vendor") {
      setLocation("/");
    }
  }, [isAuthLoading, isAuthenticated, isRoleLoading, roleData, setLocation]);

  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated || !user || roleData?.role !== "vendor") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  // Use walletBalanceKwd if available, fallback to pendingPayoutKwd
  const balance = walletData?.walletBalanceKwd || walletData?.pendingPayoutKwd || "0";
  const numBalance = parseFloat(balance);
  const commissionType = walletData?.commissionType || "percentage";
  const commissionValue = walletData?.commissionValue || "5";
  const canRequestPayment = numBalance > 0;
  const isNegative = numBalance < 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "approved": return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return t("wallet.status.paid");
      case "approved": return t("wallet.status.approved");
      case "rejected": return t("wallet.status.rejected");
      default: return t("wallet.status.pending");
    }
  };

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <Link href="/vendor/dashboard#wallet">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} /> {t("wallet.backToAccount")}
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold mb-2">{t("wallet.title")}</h1>
          <p className="text-muted-foreground">{t("wallet.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {isNegative ? "Outstanding Balance (Owed to MotorBuy)" : t("wallet.availableBalance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className={`w-8 h-8 ${isNegative ? "text-destructive" : "text-primary"}`} />
                <span className={`text-3xl font-bold ${isNegative ? "text-destructive" : ""}`} data-testid="text-balance">
                  {formatKWD(Math.abs(numBalance))}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t("wallet.platformFee")}: {commissionType === "percentage" 
                  ? t("wallet.platformFeePercentage").replace("{value}", commissionValue)
                  : t("wallet.platformFeeFixed").replace("{value}", formatKWD(commissionValue))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("wallet.requestPayout")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {isNegative 
                  ? "Orders paid in store reduce your balance. Online orders will increase it."
                  : t("wallet.requestPayoutDesc")}
              </p>
              <Button 
                onClick={() => requestPaymentMutation.mutate()}
                disabled={!canRequestPayment || requestPaymentMutation.isPending}
                className="w-full"
                data-testid="button-request-payment"
              >
                {requestPaymentMutation.isPending ? (
                  <><Loader2 className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} animate-spin`} /> {t("wallet.processing")}</>
                ) : (
                  <><DollarSign className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} /> {t("wallet.requestPayment")}</>
                )}
              </Button>
              {!canRequestPayment && !isNegative && (
                <p className="text-xs text-muted-foreground mt-2 text-center">{t("wallet.noBalance")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" /> {t("wallet.paymentHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isWalletLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : !walletData?.paymentRequests || walletData.paymentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t("wallet.noPaymentRequests")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {walletData.paymentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`payment-row-${request.id}`}>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <div className="font-medium">{formatKWD(request.amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "N/A"}
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      request.status === "paid" ? "default" :
                      request.status === "approved" ? "secondary" :
                      request.status === "rejected" ? "destructive" : "outline"
                    }>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
