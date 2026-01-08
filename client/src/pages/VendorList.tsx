import { Navbar } from "@/components/Navbar";
import { useVendors } from "@/hooks/use-motorbuy";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function VendorList() {
  const { data: vendors, isLoading } = useVendors();

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-foreground text-white py-12 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-display font-bold mb-4">Our Vendors</h1>
          <p className="text-gray-400">Trusted shops and expert parts dealers</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vendors?.map((vendor) => (
              <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      {vendor.logoUrl ? <img src={vendor.logoUrl} className="w-full h-full object-cover rounded-full"/> : <Store className="w-8 h-8"/>}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{vendor.storeName}</h3>
                      <p className="text-sm text-muted-foreground">Verified Dealer</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 line-clamp-2">{vendor.description}</p>
                  <Link href={`/products?vendorId=${vendor.id}`}>
                    <Button variant="outline" className="w-full">View Products</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
