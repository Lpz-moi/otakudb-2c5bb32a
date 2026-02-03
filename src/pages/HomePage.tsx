import { useEffect, useState } from 'react';
import { TrendingUp, Play, ChevronRight, Tv, Calendar, Settings, Check, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTopAnime, getSeasonalAnime, type Anime } from '@/services/jikanApi';
import { AnimeCardPremium } from '@/components/anime/AnimeCardPremium';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { HeroCarousel } from '@/components/anime/HeroCarousel';
import { CalendarSchedule } from '@/components/calendar/CalendarSchedule';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { RecentActivitySection } from '@/components/recommendations/RecentActivitySection';
import { useAnimeListStore } from '@/stores/animeListStore';
import { useAuth } from '@/contexts/AuthContext';
import { PageTransition } from '@/components/ui/page-transition';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TabValue = 'watching' | 'completed' | 'planned' | 'favorites';

const HomePage = () => {
  const [heroAnime, setHeroAnime] = useState<Anime[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('watching');

  const { getItemsByStatus, getStats } = useAnimeListStore();
  const { user, profile } = useAuth();
  const stats = getStats();
  
  // Get items by category
  const watching = getItemsByStatus('watching');
  const completed = getItemsByStatus('completed');
  const planned = getItemsByStatus('planned');
  const favoritesArray = getItemsByStatus('favorites');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [topRes, seasonalRes] = await Promise.all([
          getTopAnime(1, 'bypopularity'),
          getSeasonalAnime(),
        ]);

        setHeroAnime(seasonalRes.data.slice(0, 5));
        setTrendingAnime(topRes.data.slice(0, 12));
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get display items based on active tab
  const getTabItems = (): Anime[] => {
    switch (activeTab) {
      case 'watching': 
        return watching
          .filter((item): item is any => item && item.anime !== undefined)
          .map(item => item.anime);
      case 'completed': 
        return completed
          .filter((item): item is any => item && item.anime !== undefined)
          .map(item => item.anime);
      case 'planned': 
        return planned
          .filter((item): item is any => item && item.anime !== undefined)
          .map(item => item.anime);
      case 'favorites': 
        return favoritesArray
          .filter((item): item is any => item && item.anime !== undefined)
          .map(item => item.anime);
      default: return [];
    }
  };

  const tabItems = getTabItems();
  const categoryStats = {
    watching: watching.length,
    completed: completed.length,
    planned: planned.length,
    favorites: favoritesArray.length,
  };

  return (
    <PageTransition>
      <div className="page-container space-y-6 sm:space-y-8">
        {/* HEADER: User Profile + Share */}
        {user && (
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-r from-primary/5 via-primary/2 to-transparent rounded-2xl p-4 sm:p-6 border border-border/30 sticky top-4 sm:top-5 z-20"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-primary/30">
                  <AvatarImage src={profile?.discord_avatar || user?.user_metadata?.avatar_url || ''} alt={profile?.discord_username || user?.email} />
                  <AvatarFallback>{(profile?.discord_username || user?.email)?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="font-display font-bold text-lg sm:text-xl text-foreground">
                    {profile?.discord_username || user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'Utilisateur'}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    📺 {stats.total} anime{stats.total > 1 ? 's' : ''} • ⭐ {stats.favorites} favori{stats.favorites > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <Link to="/profile">
                  <Button size="icon" variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* Welcome message for new users */}
        {stats.total === 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary/8 via-primary/4 to-transparent rounded-2xl p-4 sm:p-5 border border-primary/15"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Tv className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-foreground text-base">Bienvenue sur OtakuDB</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Suivez vos animes préférés, recevez des rappels et ne manquez plus jamais un épisode.
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Hero Carousel */}
        {stats.total > 0 && (
          <section className="-mx-4 sm:-mx-5 md:-mx-6 lg:-mx-8">
            <div className="px-4 sm:px-5 md:px-6 lg:px-8">
              <HeroCarousel animes={heroAnime} loading={loading} />
            </div>
          </section>
        )}

        {/* MY LISTS SECTION - Tabs */}
        {stats.total > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="section-title text-lg sm:text-xl">Mes listes</h2>
              <Link to="/lists" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                Gérer
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 gap-1 bg-secondary/50 p-1 rounded-xl border border-border/30">
                <TabsTrigger value="watching" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">En cours</span>
                  <span className="sm:hidden">En cours</span>
                  {categoryStats.watching > 0 && (
                    <span className="ml-auto text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                      {categoryStats.watching}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger value="completed" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Terminés</span>
                  <span className="sm:hidden">Fini</span>
                  {categoryStats.completed > 0 && (
                    <span className="ml-auto text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                      {categoryStats.completed}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger value="planned" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">À voir</span>
                  <span className="sm:hidden">À voir</span>
                  {categoryStats.planned > 0 && (
                    <span className="ml-auto text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                      {categoryStats.planned}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger value="favorites" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Favoris</span>
                  <span className="sm:hidden">⭐</span>
                  {categoryStats.favorites > 0 && (
                    <span className="ml-auto text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                      {categoryStats.favorites}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Grid Content */}
              <AnimatePresence mode="wait">
                {tabItems.length > 0 ? (
                  <TabsContent value={activeTab} className="mt-4" asChild>
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                    >
                      {tabItems.map((anime, index) => (
                        <motion.div
                          key={anime.mal_id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                        >
                          <AnimeCard anime={anime} showQuickAdd={true} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </TabsContent>
                ) : (
                  <TabsContent value={activeTab} className="mt-6" asChild>
                    <motion.div
                      key={`empty-${activeTab}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center py-8"
                    >
                      <Tv className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground">Aucun anime dans cette catégorie</p>
                      <Link to="/discover" className="text-sm text-primary hover:text-primary/80 mt-2 inline-block">
                        Découvrir des animes
                      </Link>
                    </motion.div>
                  </TabsContent>
                )}
              </AnimatePresence>
            </Tabs>
          </motion.section>
        )}

        {/* Error State */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-5 text-center"
          >
            <p className="text-destructive text-sm mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary text-sm"
            >
              Réessayer
            </button>
          </motion.div>
        )}

        {/* Calendar Schedule */}
        <CalendarSchedule />

        {/* Personalized Recommendations */}
        <RecommendationsSection />

        {/* Recent Activity */}
        <RecentActivitySection />

        {/* Trending */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="section-title flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="w-4 h-4 text-primary" />
            Tendances
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-muted/50 rounded-xl" />
                  <div className="p-2.5 space-y-2">
                    <div className="h-3 bg-muted/50 rounded w-3/4" />
                    <div className="h-2 bg-muted/30 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {trendingAnime.map((anime, index) => (
                <AnimeCardPremium key={anime.mal_id} anime={anime} index={index} />
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </PageTransition>
  );
};

export default HomePage;