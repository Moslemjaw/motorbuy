import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useRole, useVendors } from "@/hooks/use-motorbuy";
import { User, Loader2, Settings, Phone, MapPin, Mail, Camera, FileText, Store, LayoutDashboard, Wallet } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpload } from "@/hooks/use-upload";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function VendorAccount() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const { data: vendors } = useVendors();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setBio(user.bio || "");
      setProfileImageUrl(user.profileImageUrl || null);
    }
  }, [user]);

  const myVendor = vendors?.find(v => v.userId === user?.id);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setProfileImageUrl(response.objectPath);
      toast({ title: "Photo Uploaded" });
    },
    onError: (error) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return apiRequest("PATCH", "/api/users/me", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Settings Saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
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

  if (roleData?.role !== "vendor") {
    setLocation("/account");
    return null;
  }

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
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
          <h1 className="text-3xl font-display font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your personal profile and settings.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {displayImage ? (
                  <img src={displayImage} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary text-3xl font-bold">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="input-photo-file" />
                <button onClick={handlePhotoClick} disabled={isUploading} className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50" data-testid="button-change-photo">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              </div>
              <div>
                <div className="font-semibold text-lg">{user.firstName} {user.lastName}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <Badge variant="secondary" className="mt-1">Vendor</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t">
              <Link href="/vendor/store">
                <Button variant="outline" className="w-full" data-testid="button-store-page">
                  <Store className="w-4 h-4 mr-2" /> My Store
                </Button>
              </Link>
              <Link href="/vendor/dashboard">
                <Button variant="outline" className="w-full" data-testid="button-dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                </Button>
              </Link>
              <Link href="/vendor/wallet" className="col-span-2">
                <Button variant="outline" className="w-full" data-testid="button-wallet">
                  <Wallet className="w-4 h-4 mr-2" /> Wallet
                </Button>
              </Link>
            </div>

            <Button variant="outline" className="w-full" onClick={() => logout()} data-testid="button-logout">
              Logout
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> Personal Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input id="email" value={user.email || ""} disabled className="bg-muted" data-testid="input-email" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" /> Bio
              </Label>
              <Textarea id="bio" placeholder="Tell us about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[80px]" data-testid="input-bio" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" /> Phone Number
              </Label>
              <Input id="phone" placeholder="+965 XXXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-phone" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" /> Address
              </Label>
              <Input id="address" placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} data-testid="input-address" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm">City / Area</Label>
              <Input id="city" placeholder="e.g., Salmiya, Kuwait City" value={city} onChange={(e) => setCity(e.target.value)} data-testid="input-city" />
            </div>

            <Button className="w-full" onClick={handleSaveSettings} disabled={updateProfileMutation.isPending} data-testid="button-save-settings">
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
