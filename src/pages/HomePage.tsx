import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { getTopAnime, getSeasonalAnime, type Anime } from '@/services/jikanApi';
import { AnimeGrid } from '@/components/anime/AnimeGrid';
import { useAnimeListStore } from '@/stores/animeListStore';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const HomePage = () => {
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [seasonalAnime, setSeasonalAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getItemsByStatus } = useAnimeListStore();
  const watchingList = getItemsByStatus('watching');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [trendingRes, seasonalRes] = await Promise.all([
          getTopAnime(1, 'bypopularity'),
          getSeasonalAnime(),
        ]);

        setTrendingAnime(trendingRes.data.slice(0, 12));
        setSeasonalAnime(seasonalRes.data.slice(0, 12));
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="page-container space-y-10">
      {/* Hero Section */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 px-4 sm:px-6 lg:px-8 py-12 md:py-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
            Bienvenue sur{' '}
            <span className="text-primary glow-text">OtakuDB</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Gérez vos animes, suivez votre progression, découvrez de nouvelles pépites.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/search" className="btn-primary inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Explorer
            </Link>
            <Link to="/lists" className="btn-secondary inline-flex items-center gap-2">
              <Play className="w-4 h-4" />
              Mes Listes
            </Link>
          </div>
        </div>
      </section>

      {/* Continue Watching */}
      {watchingList.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2 mb-0">
              <Play className="w-5 h-5 text-primary" />
              Continuer à regarder
            </h2>
            <Link to="/lists" className="text-sm text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchingList.slice(0, 6).map((item, i) => (
              <Link
                key={item.anime.mal_id}
                to={`/anime/${item.anime.mal_id}`}
                className="anime-card group block animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl">
                  <img
                    src={item.anime.images.webp?.large_image_url || item.anime.images.jpg?.large_image_url}
                    alt={item.anime.title}
                    className="anime-card-image transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${item.anime.episodes ? (item.progress / item.anime.episodes) * 100 : 0}%` 
                        }} 
                      />
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                      Ép. {item.progress}/{item.anime.episodes || '?'}
                    </p>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {item.anime.title_english || item.anime.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card p-6 text-center">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-secondary"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Trending */}
      <section>
        <h2 className="section-title flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Tendances
        </h2>
        <AnimeGrid animes={trendingAnime} loading={loading} />
      </section>

      {/* Seasonal */}
      <section>
        <h2 className="section-title flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Cette saison
        </h2>
        <AnimeGrid animes={seasonalAnime} loading={loading} />
      </section>
    </div>
  );
};

export default HomePage;
