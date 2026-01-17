import { Navbar } from "@/components/Navbar";
import { LoadingPage } from "@/components/LoadingPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/use-motorbuy";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Package, ShoppingCart, Loader2, CheckCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatKWD } from "@/lib/currency";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { buildApiUrl } from "@/lib/api-config";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Warranties() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedWarrantyId, setSelectedWarrantyId] = useState("");

  const { data: allProducts, isLoading: isProductsLoading } = useProducts();
  const products = allProducts?.filter((p: any) => p.warrantyEligible) || [];
  const { data: warranties, isLoading: isWarrantiesLoading } = useQuery({
    queryKey: ["/api/warranties"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/warranties"));
      if (!res.ok) throw new Error("Failed to fetch warranties");
      return res.json();
    },
  });

  const { data: myWarranties, isLoading: isMyWarrantiesLoading } = useQuery({
    queryKey: ["/api/warranty-purchases"],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const res = await fetch(buildApiUrl("/api/warranty-purchases"), {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const purchaseWarrantyMutation = useMutation({
    mutationFn: async (data: { productId: string; warrantyId: string; price: string }) => {
      const res = await apiRequest("POST", "/api/warranty-purchases", data);
      if (!res.ok) throw new Error("Failed to purchase warranty");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warranty-purchases"] });
      setSelectedProductId("");
      setSelectedWarrantyId("");
      toast({
        title: t("warranties.purchaseSuccess") || "Success",
        description: t("warranties.purchaseSuccessDesc") || "Warranty purchased successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("warranties.purchaseError") || "Error",
        description: error.message || t("warranties.purchaseErrorDesc") || "Failed to purchase warranty",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    if (!isAuthenticated) {
      toast({
        title: t("warranties.loginRequired") || "Login Required",
        description: t("warranties.loginRequiredDesc") || "Please login to purchase warranties",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    if (!selectedProductId || !selectedWarrantyId) {
      toast({
        title: t("warranties.selectRequired") || "Selection Required",
        description: t("warranties.selectRequiredDesc") || "Please select a product and warranty",
        variant: "destructive",
      });
      return;
    }

    const warranty = warranties?.find((w: any) => w.id === selectedWarrantyId);
    if (!warranty) return;

    purchaseWarrantyMutation.mutate({
      productId: selectedProductId,
      warrantyId: selectedWarrantyId,
      price: warranty.price,
    });
  };

  const selectedProduct = products?.find((p: any) => p.id === selectedProductId);
  const selectedWarranty = warranties?.find((w: any) => w.id === selectedWarrantyId);

  if (isProductsLoading || isWarrantiesLoading) {
    return <LoadingPage message={t("warranties.loading") || "Loading..."} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className={`mb-8 ${isRTL ? "text-right" : "text-left"}`}>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-display font-bold">
                {t("warranties.title") || "Product Warranties"}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {t("warranties.subtitle") || "Extend protection for your purchases with our warranty plans"}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Purchase Section */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>{t("warranties.purchaseTitle") || "Purchase Warranty"}</CardTitle>
                <CardDescription>
                  {t("warranties.purchaseDesc") || "Select a product and choose a warranty plan"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t("warranties.selectProduct") || "Select Product"} *</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("warranties.selectProductPlaceholder") || "Choose a product"} />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <span>{product.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {selectedProduct.images?.[0] && (
                        <img
                          src={selectedProduct.images[0]}
                          alt={selectedProduct.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{selectedProduct.name}</h3>
                        <p className="text-sm text-muted-foreground">{formatKWD(selectedProduct.price)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProductId && warranties && warranties.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t("warranties.selectWarranty") || "Select Warranty Plan"} *</Label>
                    <div className="space-y-3">
                      {warranties.map((warranty: any) => (
                        <Card
                          key={warranty.id}
                          className={`cursor-pointer transition-all border-2 ${
                            selectedWarrantyId === warranty.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedWarrantyId(warranty.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{warranty.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {t("warranties.period") || "Period"}: {warranty.periodMonths}{" "}
                                  {t("warranties.months") || "months"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">{formatKWD(warranty.price)}</p>
                                {selectedWarrantyId === warranty.id && (
                                  <CheckCircle className="w-5 h-5 text-primary mt-1" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProductId && warranties && warranties.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    {t("warranties.noWarrantiesAvailable") || "No warranties available"}
                  </p>
                )}

                <Button
                  onClick={handlePurchase}
                  disabled={!selectedProductId || !selectedWarrantyId || purchaseWarrantyMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {purchaseWarrantyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("warranties.processing") || "Processing..."}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t("warranties.purchaseButton") || "Purchase Warranty"}
                    </>
                  )}
                </Button>

                {selectedProduct && selectedWarranty && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{t("warranties.total") || "Total"}:</span>
                      <span className="text-xl font-bold text-primary">{formatKWD(selectedWarranty.price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("warranties.coverageInfo") || "Coverage includes repair and replacement services"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Warranties Section */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>{t("warranties.myWarranties") || "My Warranties"}</CardTitle>
                <CardDescription>
                  {t("warranties.myWarrantiesDesc") || "View your active warranty purchases"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="text-center py-8">
                    <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {t("warranties.loginToView") || "Please login to view your warranties"}
                    </p>
                    <Button onClick={() => setLocation("/auth")}>
                      {t("common.login") || "Login"}
                    </Button>
                  </div>
                ) : isMyWarrantiesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : myWarranties && myWarranties.length > 0 ? (
                  <div className="space-y-4">
                    {myWarranties.map((purchase: any) => {
                      const isExpired = new Date(purchase.endDate) < new Date();
                      const isActive = purchase.status === "active" && !isExpired;
                      return (
                        <Card
                          key={purchase.id}
                          className={`border ${
                            isActive ? "border-green-500/50 bg-green-50/50" : "border-muted"
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">
                                  {purchase.product?.name || t("warranties.unknownProduct") || "Unknown Product"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {purchase.warranty?.name || t("warranties.unknownWarranty") || "Unknown Warranty"}
                                </p>
                              </div>
                              <Badge variant={isActive ? "default" : "secondary"}>
                                {isActive
                                  ? t("warranties.active") || "Active"
                                  : t("warranties.expired") || "Expired"}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {t("warranties.startDate") || "Start"}:{" "}
                                  {new Date(purchase.startDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {t("warranties.endDate") || "End"}:{" "}
                                  {new Date(purchase.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="pt-2 border-t">
                                <span className="font-medium">{formatKWD(purchase.price)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t("warranties.noWarranties") || "You don't have any warranties yet"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

