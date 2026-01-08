import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRole, useVendors } from "@/hooks/use-motorbuy";
import { Store, Loader2, Camera, ArrowLeft, ImageIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpload } from "@/hooks/use-upload";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function VendorStore() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useRole();
  const { data: vendors } = useVendors();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const myVendor = vendors?.find(v => v.userId === user?.id);

  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (myVendor) {
      setStoreName(myVendor.storeName || "");
      setDescription(myVendor.description || "");
      setBio(myVendor.bio || "");
      setLogoUrl(myVendor.logoUrl || null);
      setCoverImageUrl(myVendor.coverImageUrl || null);
    }
  }, [myVendor]);

  const { uploadFile: uploadLogo, isUploading: isUploadingLogo } = useUpload({
    onSuccess: (response) => {
      setLogoUrl(response.objectPath);
      toast({ title: "Logo Uploaded" });
    },
    onError: (error) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
  });

  const { uploadFile: uploadCover, isUploading: isUploadingCover } = useUpload({
    onSuccess: (response) => {
      setCoverImageUrl(response.objectPath);
      toast({ title: "Cover Uploaded" });
    },
    onError: (error) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return apiRequest("PATCH", `/api/vendors/${myVendor?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Store Updated", description: "Your store details have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update store.", variant: "destructive" });
    },
  });

  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated || !user || roleData?.role !== "vendor") {
    setLocation("/");
    return null;
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadLogo(file);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadCover(file);
  };

  const handleSaveStore = () => {
    const updates: Record<string, string> = {};
    if (storeName) updates.storeName = storeName;
    if (description) updates.description = description;
    if (bio) updates.bio = bio;
    if (logoUrl) updates.logoUrl = logoUrl;
    if (coverImageUrl) updates.coverImageUrl = coverImageUrl;
    updateStoreMutation.mutate(updates);
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
          <h1 className="text-3xl font-display font-bold mb-2">My Store</h1>
          <p className="text-muted-foreground">Customize your store appearance and details.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" /> Store Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative h-48 bg-muted rounded-lg overflow-hidden">
              {coverImageUrl ? (
                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} data-testid="input-cover-file" />
              <Button 
                variant="secondary" 
                size="sm" 
                className="absolute bottom-3 right-3"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                data-testid="button-change-cover"
              >
                {isUploadingCover ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                Change Cover
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-24 h-24 rounded-lg object-cover border" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border">
                    <Store className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} data-testid="input-logo-file" />
                <button 
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
                  data-testid="button-change-logo"
                >
                  {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              </div>
              <div>
                <p className="font-medium">Store Logo</p>
                <p className="text-sm text-muted-foreground">Square image recommended</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" /> Store Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Your store name" data-testid="input-store-name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of your store" data-testid="input-description" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeBio">About Your Store</Label>
              <Textarea id="storeBio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell customers about your store, what you specialize in..." className="min-h-[120px]" data-testid="input-store-bio" />
            </div>

            <Button className="w-full" onClick={handleSaveStore} disabled={updateStoreMutation.isPending} data-testid="button-save-store">
              {updateStoreMutation.isPending ? "Saving..." : "Save Store Details"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
