import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "@/hooks/use-motorbuy";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Users, Store, DollarSign, Bell, CheckCircle, Loader2, Pencil, X, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { Vendor } from "@shared/schema";

interface VendorFinancials extends Vendor {
  hasPendingRequest: boolean;
  pendingRequestAmount: string | null;
  pendingRequestId: string | null;
}

interface PayoutRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isAuthLoading, setLocation]);

  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (roleData?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage vendors, commissions, and payouts.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-8">
        <SummaryCards />
        <PayoutRequestsPanel />
        <VendorManagement />
      </div>
    </div>
  );
}

function SummaryCards() {
  const { data: vendors } = useQuery<VendorFinancials[]>({
    queryKey: ["/api/admin/vendors/financials"],
  });
  const { data: payoutRequests } = useQuery<PayoutRequest[]>({
    queryKey: ["/api/admin/payout-requests"],
  });

  const totalVendors = vendors?.length || 0;
  const approvedVendors = vendors?.filter(v => v.isApproved).length || 0;
  const pendingPayouts = payoutRequests?.length || 0;
  const totalPendingAmount = vendors?.reduce((sum, v) => sum + parseFloat(v.pendingPayoutKwd || "0"), 0) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVendors}</div>
          <p className="text-xs text-muted-foreground">{approvedVendors} approved</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium">Payout Requests</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPayouts}</div>
          <p className="text-xs text-muted-foreground">pending approval</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium">Total Pending Payouts</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPendingAmount.toFixed(3)} KWD</div>
          <p className="text-xs text-muted-foreground">across all vendors</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium">Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">-</div>
          <p className="text-xs text-muted-foreground">registered users</p>
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutRequestsPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: payoutRequests, isLoading } = useQuery<PayoutRequest[]>({
    queryKey: ["/api/admin/payout-requests"],
  });

  const payVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const res = await apiRequest("POST", `/api/admin/vendors/${vendorId}/payout`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to process payout");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/financials"] });
      toast({ title: "Success", description: "Payout processed successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" /> Payout Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!payoutRequests || payoutRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" /> Payout Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">No pending payout requests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" /> Payout Requests
          <Badge variant="destructive" className="ml-2">{payoutRequests.length} pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payoutRequests.map((request) => (
            <div 
              key={request.id} 
              className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20"
              data-testid={`payout-request-${request.id}`}
            >
              <div>
                <div className="font-semibold">{request.vendorName}</div>
                <div className="text-sm text-muted-foreground">
                  Requested: {parseFloat(request.amount).toFixed(3)} KWD
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>
              <Button 
                onClick={() => payVendorMutation.mutate(request.vendorId)}
                disabled={payVendorMutation.isPending}
                data-testid={`button-pay-${request.vendorId}`}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Pay Vendor
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VendorManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [commissionType, setCommissionType] = useState<string>("percentage");
  const [commissionValue, setCommissionValue] = useState<string>("");

  const { data: vendors, isLoading } = useQuery<VendorFinancials[]>({
    queryKey: ["/api/admin/vendors/financials"],
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async ({ vendorId, commissionType, commissionValue }: { vendorId: string; commissionType: string; commissionValue: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/vendors/${vendorId}/commission`, { commissionType, commissionValue });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update commission");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/financials"] });
      setEditingVendor(null);
      toast({ title: "Success", description: "Commission updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const payVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const res = await apiRequest("POST", `/api/admin/vendors/${vendorId}/payout`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to process payout");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/financials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-requests"] });
      toast({ title: "Success", description: "Payout processed" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const startEditing = (vendor: VendorFinancials) => {
    setEditingVendor(vendor.id);
    setCommissionType(vendor.commissionType || "percentage");
    setCommissionValue(vendor.commissionValue || "5");
  };

  const saveCommission = (vendorId: string) => {
    updateCommissionMutation.mutate({ vendorId, commissionType, commissionValue });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" /> Vendor Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5" /> Vendor Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!vendors || vendors.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No vendors registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Vendor</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Commission</th>
                  <th className="pb-3 font-medium text-right">Gross Sales</th>
                  <th className="pb-3 font-medium text-right">Pending Payout</th>
                  <th className="pb-3 font-medium text-right">Lifetime Paid</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b" data-testid={`vendor-row-${vendor.id}`}>
                    <td className="py-4">
                      <div className="font-medium">{vendor.storeName}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{vendor.description}</div>
                    </td>
                    <td className="py-4">
                      <Badge variant={vendor.isApproved ? "default" : "secondary"}>
                        {vendor.isApproved ? "Approved" : "Pending"}
                      </Badge>
                      {vendor.hasPendingRequest && (
                        <Badge variant="destructive" className="ml-2">Payout Requested</Badge>
                      )}
                    </td>
                    <td className="py-4">
                      {editingVendor === vendor.id ? (
                        <div className="flex items-center gap-2">
                          <Select value={commissionType} onValueChange={setCommissionType}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="fixed">KWD</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={commissionValue}
                            onChange={(e) => setCommissionValue(e.target.value)}
                            className="w-20"
                            min="0"
                            step="0.01"
                          />
                          <Button size="icon" variant="ghost" onClick={() => saveCommission(vendor.id)} disabled={updateCommissionMutation.isPending}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingVendor(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                            {vendor.commissionValue || "5"}
                            {vendor.commissionType === "fixed" ? " KWD" : "%"}
                          </span>
                          <Button size="icon" variant="ghost" onClick={() => startEditing(vendor)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-right font-mono">
                      {parseFloat(vendor.grossSalesKwd || "0").toFixed(3)} KWD
                    </td>
                    <td className="py-4 text-right font-mono">
                      <span className={parseFloat(vendor.pendingPayoutKwd || "0") > 0 ? "text-amber-600 font-semibold" : ""}>
                        {parseFloat(vendor.pendingPayoutKwd || "0").toFixed(3)} KWD
                      </span>
                    </td>
                    <td className="py-4 text-right font-mono text-muted-foreground">
                      {parseFloat(vendor.lifetimePayoutsKwd || "0").toFixed(3)} KWD
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => payVendorMutation.mutate(vendor.id)}
                        disabled={payVendorMutation.isPending || parseFloat(vendor.pendingPayoutKwd || "0") <= 0}
                        data-testid={`button-pay-vendor-${vendor.id}`}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Pay
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
