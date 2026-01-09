import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useRole, useVendors } from "@/hooks/use-motorbuy";
import { Wallet, Loader2, ArrowLeft, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatKWD } from "@/lib/currency";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PaymentRequest } from "@shared/schema";
import { useEffect } from "react";

export default function VendorWallet() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const { data: vendors } = useVendors();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const myVendor = vendors?.find(v => v.userId === user?.id);

  const { data: walletData, isLoading: isWalletLoading } = useQuery<{
    balance: string;
    pendingPayouts: string;
    totalEarnings: string;
    commissionRate: string;
    paymentRequests: PaymentRequest[];
  }>({
    queryKey: ["/api/vendor/wallet", myVendor?.id],
    enabled: !!myVendor?.id,
  });

  const requestPaymentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/vendor/wallet/request", { vendorId: myVendor?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/wallet", myVendor?.id] });
      toast({ title: "Payment Requested", description: "Your payment request has been submitted for review." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to request payment.", variant: "destructive" });
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

  const balance = walletData?.balance || myVendor?.pendingPayoutKwd || "0";
  const commissionValue = walletData?.commissionRate || myVendor?.commissionValue || "10";
  const commissionPercent = myVendor?.commissionType === "percentage" ? commissionValue : "fixed";
  const canRequestPayment = parseFloat(balance) > 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "approved": return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <Link href="/vendor/account">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Account
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold mb-2">Wallet</h1>
          <p className="text-muted-foreground">View your earnings and request payouts.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="w-8 h-8 text-primary" />
                <span className="text-3xl font-bold" data-testid="text-balance">{formatKWD(balance)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">After {commissionPercent}% platform fee</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Request Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Request a payout of your available balance. Payments are processed within 3-5 business days.
              </p>
              <Button 
                onClick={() => requestPaymentMutation.mutate()}
                disabled={!canRequestPayment || requestPaymentMutation.isPending}
                className="w-full"
                data-testid="button-request-payment"
              >
                {requestPaymentMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><DollarSign className="w-4 h-4 mr-2" /> Request Payment</>
                )}
              </Button>
              {!canRequestPayment && (
                <p className="text-xs text-muted-foreground mt-2 text-center">No balance available for payout</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" /> Payment History
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
                <p>No payment requests yet</p>
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
                      {request.status}
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
