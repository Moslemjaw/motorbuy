import { Navbar } from "@/components/Navbar";
import { useVendors } from "@/hooks/use-motorbuy";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Loader2, Users, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function VendorList() {
  const { data: vendors, isLoading } = useVendors();

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      
      <section className="relative gradient-dark text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <Badge className="bg-white/10 border-white/20 text-white">
                {vendors?.length || 0} Verified Vendors
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">Our Vendors</h1>
            <p className="text-white/70 text-lg max-w-xl">
              Trusted shops and expert parts dealers serving automotive enthusiasts across Kuwait.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : !vendors || vendors.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-card rounded-2xl border"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3">No vendors yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Check back soon as we onboard new automotive parts vendors.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border group overflow-hidden" data-testid={`vendor-card-${vendor.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
                        {vendor.logoUrl ? (
                          <img src={vendor.logoUrl} className="w-full h-full object-cover rounded-2xl" alt={vendor.storeName} />
                        ) : (
                          <span className="text-2xl font-bold">{vendor.storeName?.[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-lg truncate group-hover:text-primary transition-colors">{vendor.storeName}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Verified Dealer</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-6 line-clamp-2 leading-relaxed">{vendor.description || "Quality automotive parts and accessories."}</p>
                    
                    <Link href={`/vendor/${vendor.id}`}>
                      <Button variant="outline" className="w-full rounded-xl h-11 group-hover:border-primary group-hover:text-primary transition-colors" data-testid={`button-view-vendor-${vendor.id}`}>
                        View Profile <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <footer className="gradient-dark text-white py-12 mt-8">
        <div className="container mx-auto px-4 text-center">
          <div className="font-display font-bold text-2xl mb-2">MotorBuy</div>
          <p className="text-white/50 text-sm">Kuwait's premier auto parts marketplace</p>
        </div>
      </footer>
    </div>
  );
}
