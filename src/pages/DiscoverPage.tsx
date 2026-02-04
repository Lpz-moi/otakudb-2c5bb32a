import React from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { GlobalSkeleton } from '@/components/ui/GlobalSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DiscoverPage() {
  const { recommendations, loading } = useRecommendations();

  if (loading) {
    return <GlobalSkeleton />;
  }

  return (
    <div className="page-container space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
          <Sparkles className="text-primary h-8 w-8" />
          Pour toi
        </h1>
        <p className="text-muted-foreground text-lg">
          Une sélection personnalisée basée sur tes goûts et ton historique.
        </p>
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations.map((anime) => (
            <Card key={anime.id} className="group relative overflow-hidden border-0 bg-card/50 hover:bg-card/80 transition-all duration-300 shadow-lg hover:shadow-primary/10">
              <div className="aspect-[2/3] relative overflow-hidden rounded-t-xl">
                <img 
                  src={anime.image_url} 
                  alt={anime.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="w-full flex gap-2">
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Play className="h-4 w-4 mr-2" /> Ajouter
                    </Button>
                  </div>
                </div>
                {anime.match_score > 0 && (
                  <Badge className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-white border-0 shadow-sm">
                    Recommandé
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                  {anime.title}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {anime.genres?.slice(0, 3).map((genre: string) => (
                    <span key={genre} className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                      {genre}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4">
          <div className="p-4 rounded-full bg-secondary/50 w-fit mx-auto">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">Connecte-toi pour voir tes recommandations</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Nous avons besoin de connaître tes goûts pour te proposer des animes.
          </p>
          <Button asChild className="mt-4">
            <Link to="/auth">Se connecter</Link>
          </Button>
        </div>
      )}
    </div>
  );
}