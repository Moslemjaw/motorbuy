import { Navbar } from "@/components/Navbar";
import { LoadingPage } from "@/components/LoadingPage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStories } from "@/hooks/use-motorbuy";
import { useLanguage } from "@/lib/i18n";
import { Store, Calendar, ArrowRight, Newspaper } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Stories() {
  const { t, language, isRTL } = useLanguage();
  const { data: stories, isLoading } = useStories();

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      
      <section className="relative gradient-dark text-white py-8 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center">
                <Newspaper className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <Badge className="bg-white/10 border-white/20 text-white">{t("stories.feedBadge")}</Badge>
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold mb-2 md:mb-4">{t("stories.title")}</h1>
            <p className="text-white/70 text-sm md:text-lg max-w-xl">
              {t("stories.subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <LoadingPage message="Loading stories..." fullScreen={false} />
        ) : !stories || stories.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3">{t("stories.noStories")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("stories.noStoriesDesc")}
            </p>
            <Link href="/vendors">
              <Button variant="outline" className="rounded-full" data-testid="button-browse-vendors">
                {t("stories.browseVendors")} <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden h-full border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group" data-testid={`story-card-${story.id}`}>
                  {story.imageUrl && (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img 
                        src={story.imageUrl} 
                        alt="Story" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shrink-0">
                        {story.vendor?.logoUrl ? (
                          <img 
                            src={story.vendor.logoUrl} 
                            alt={story.vendor.storeName} 
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-white font-bold">
                            {story.vendor?.storeName?.[0] || "V"}
                          </span>
                        )}
                      </div>
                      <div>
                        <Link href={`/vendor/${story.vendorId}`}>
                          <span className="font-semibold hover:text-primary transition-colors block">
                            {story.vendor?.storeName || `Vendor #${story.vendorId}`}
                          </span>
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {story.createdAt ? new Date(story.createdAt).toLocaleDateString(language === 'ar' ? 'ar-KW' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : t("stories.recently")}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground leading-relaxed line-clamp-4">
                      {story.content || t("stories.noContent")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <footer className="gradient-dark text-white py-12 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="font-display font-bold text-2xl mb-2">{t("brand.name")}</div>
          <p className="text-white/50 text-sm">{t("products.tagline")}</p>
        </div>
      </footer>
    </div>
  );
}
