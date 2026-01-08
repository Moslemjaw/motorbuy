import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-motorbuy";
import { User, Loader2, Settings, Phone, MapPin, Mail, Camera, FileText, Package } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpload } from "@/hooks/use-upload";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CustomerAccount() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
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

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setProfileImageUrl(response.objectPath);
      toast({ title: "Photo Uploaded", description: "Your profile photo has been uploaded." });
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
      toast({ title: "Settings Saved", description: "Your account settings have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
    if (!isRoleLoading && roleData?.role === "vendor") {
      setLocation("/vendor/account");
    }
  }, [isAuthLoading, isAuthenticated, isRoleLoading, roleData, setLocation]);

  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated || !user || roleData?.role === "vendor") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
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
      
      <div className="bg-primary/10 py-6 md:py-12 mb-6 md:mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-1 md:mb-2">My Account</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your profile and settings.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative shrink-0">
                {displayImage ? (
                  <img src={displayImage} alt="Profile" className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary text-2xl md:text-3xl font-bold">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="input-photo-file" />
                <button onClick={handlePhotoClick} disabled={isUploading} className="absolute bottom-0 right-0 w-6 h-6 md:w-7 md:h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50" data-testid="button-change-photo">
                  {isUploading ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Camera className="w-3 h-3 md:w-4 md:h-4" />}
                </button>
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-base md:text-lg truncate">{user.firstName} {user.lastName}</div>
                <div className="text-xs md:text-sm text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge variant="secondary">{roleData?.role || "customer"}</Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href="/orders" className="flex-1">
                <Button variant="outline" className="w-full" data-testid="button-view-orders">
                  <Package className="w-4 h-4 mr-2" /> Order History
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
              <Settings className="w-5 h-5" /> Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input id="email" value={user.email || ""} disabled className="bg-muted" data-testid="input-email" />
              <p className="text-xs text-muted-foreground">Email is managed by your Replit account</p>
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
