import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { useStories } from "@/hooks/use-motorbuy";
import { Store, Calendar, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Stories() {
  const { data: stories, isLoading } = useStories();

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Navbar />
      
      <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-2">Vendor Stories</h1>
          <p className="text-muted-foreground">
            Latest updates, promotions, and announcements from our vendors.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : !stories || stories.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No stories yet</h2>
            <p className="text-muted-foreground">
              Check back soon for updates from our vendors.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card key={story.id} className="overflow-hidden" data-testid={`story-card-${story.id}`}>
                {story.imageUrl && (
                  <div className="aspect-video bg-muted">
                    <img 
                      src={story.imageUrl} 
                      alt="Story" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      {story.vendor?.logoUrl ? (
                        <img 
                          src={story.vendor.logoUrl} 
                          alt={story.vendor.storeName} 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <Store className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <Link href={`/vendors/${story.vendorId}`}>
                        <span className="font-semibold hover:text-primary transition-colors">
                          {story.vendor?.storeName || `Vendor #${story.vendorId}`}
                        </span>
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : "Recently"}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {story.content || "No content"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
