import type { Anime } from '@/services/jikanApi';
import { AnimeCard } from './AnimeCard';

interface AnimeGridProps {
  animes: Anime[];
  loading?: boolean;
  emptyMessage?: string;
}

export const AnimeGrid = ({ animes, loading, emptyMessage = 'Aucun anime trouvé' }: AnimeGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="aspect-[3/4] skeleton rounded-xl" />
            <div className="p-3 space-y-2">
              <div className="h-4 skeleton w-3/4" />
              <div className="h-3 skeleton w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (animes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">🎬</span>
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {animes.map((anime, i) => (
        <div 
          key={anime.mal_id} 
          className="animate-fade-in" 
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <AnimeCard anime={anime} />
        </div>
      ))}
    </div>
  );
};
