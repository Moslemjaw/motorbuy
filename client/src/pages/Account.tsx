import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useOrders, useRole } from "@/hooks/use-motorbuy";
import { useLanguage } from "@/lib/i18n";
import { User, Package, ShoppingBag, Store, Loader2, Settings, Phone, MapPin, Mail, Camera, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatKWD } from "@/lib/currency";
import { useUpload } from "@/hooks/use-upload";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Account() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const { data: orders, isLoading: isOrdersLoading } = useOrders();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(user?.profileImageUrl || null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const publicUrl = response.objectPath;
      setProfileImageUrl(publicUrl);
      toast({ title: t("account.photoUploaded"), description: t("account.photoUploadedDesc") });
    },
    onError: (error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { profileImageUrl?: string; bio?: string; phone?: string; address?: string; city?: string }) => {
      return apiRequest("PATCH", "/api/users/me", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: t("account.settingsSaved"), description: t("account.settingsSavedDesc") });
    },
    onError: () => {
      toast({ title: t("auth.error"), description: t("auth.genericError"), variant: "destructive" });
    },
  });

  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    setLocation("/");
    return null;
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleSaveSettings = () => {
    const updates: Record<string, string> = {};
    if (profileImageUrl) updates.profileImageUrl = profileImageUrl;
    if (bio) updates.bio = bio;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (city) updates.city = city;
    
    updateProfileMutation.mutate(updates);
  };

  const displayImage = profileImageUrl || user.profileImageUrl;

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-2">{t("account.title")}</h1>
          <p className="text-muted-foreground">{t("account.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> {t("account.profile")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {displayImage ? (
                  <img 
                    src={displayImage} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary text-3xl font-bold">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-photo-file"
                />
                <button 
                  onClick={handlePhotoClick}
                  disabled={isUploading}
                  className={`absolute bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50`}
                  data-testid="button-change-photo"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div>
                <div className="font-semibold text-lg">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t("account.role")}</span>
                <Badge variant="secondary">{roleData?.role || "customer"}</Badge>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => logout()} data-testid="button-logout">
              {t("account.logout")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> {t("account.settings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" /> {t("account.email")}
              </Label>
              <Input 
                id="email" 
                value={user.email || ""} 
                disabled 
                className="bg-muted"
                data-testid="input-email"
              />
              <p className="text-xs text-muted-foreground">{t("account.emailManaged")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" /> {t("account.bio")}
              </Label>
              <Textarea 
                id="bio" 
                placeholder={t("account.bioPlaceholder")} 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-bio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" /> {t("account.phone")}
              </Label>
              <Input 
                id="phone" 
                placeholder="+965 XXXX XXXX" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" /> {t("account.address")}
              </Label>
              <Input 
                id="address" 
                placeholder={isRTL ? "عنوان الشارع" : "Street address"} 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                data-testid="input-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm">
                {t("account.city")}
              </Label>
              <Input 
                id="city" 
                placeholder={isRTL ? "مثال: السالمية، مدينة الكويت" : "e.g., Salmiya, Kuwait City"} 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                data-testid="input-city"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleSaveSettings} 
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateProfileMutation.isPending ? t("account.saving") : t("account.saveChanges")}
            </Button>
          </CardContent>
        </Card>

        {roleData?.role !== "vendor" && (
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" /> {t("account.orderHistory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOrdersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin" />
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t("account.noOrdersYet")}</p>
                  <Link href="/products">
                    <Button variant="outline" className="mt-4" data-testid="button-start-shopping">{t("account.startShopping")}</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`order-row-${order.id}`}>
                      <div>
                        <div className="font-medium">Order #{order.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatKWD(order.total)}</div>
                        <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {roleData?.role === "vendor" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" /> {t("account.vendorTools")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("account.vendorToolsDesc")}
              </p>
              <Link href="/vendor-dashboard">
                <Button className="w-full" data-testid="button-vendor-dashboard">{t("account.goToDashboard")}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {roleData?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" /> {t("account.adminTools")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("account.adminToolsDesc")}
              </p>
              <Link href="/admin">
                <Button className="w-full" data-testid="button-admin-dashboard">{t("account.goToAdminDashboard")}</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
