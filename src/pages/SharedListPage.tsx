import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle, User, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { AnimeListCard } from '@/components/anime/AnimeListCard';
import { toast } from 'sonner';

type AnimeListItem = Database['public']['Tables']['anime_lists']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type ListStatus = 'watching' | 'completed' | 'planned' | 'favorites';

const statusLabels = {
  watching: '▶️ En cours',
  completed: '✅ Complétés',
  planned: '⏰ À regarder',
  favorites: '⭐ Favoris',
};

const statusColors = {
  watching: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  completed: 'from-green-500/20 to-green-500/5 border-green-500/30',
  planned: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  favorites: 'from-rose-500/20 to-rose-500/5 border-rose-500/30',
};

const SharedListPage = () => {
  const { userId, listType } = useParams<{ userId: string; listType: string }>();
  const navigate = useNavigate();
  const [owner, setOwner] = useState<Profile | null>(null);
  const [items, setItems] = useState<AnimeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && listType) {
      fetchSharedList();
    }
  }, [userId, listType]);

  const fetchSharedList = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Vérifier les permissions de partage
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('❌ Erreur profil:', profileError);
        setError('Profil non trouvé');
        return;
      }

      if (!profile) {
        setError('Utilisateur introuvable');
        return;
      }

      // Vérifier permission de partage
      const shareField = `share_${listType}` as keyof typeof profile;
      const sharePermission = profile[shareField];

      if (sharePermission === 'none') {
        setError('Cette liste n\'est pas partagée');
        return;
      }

      setOwner(profile);

      // Charger les animes
      const { data: listItems, error: itemsError } = await supabase
        .from('anime_lists')
        .select('*')
        .eq('user_id', userId)
        .eq('status', listType)
        .order('date_added', { ascending: false });

      if (itemsError) {
        console.error('❌ Erreur chargement animes:', itemsError);
        setError('Erreur lors du chargement de la liste');
        return;
      }

      setItems(listItems || []);
      console.log(`✅ Liste "${listType}" chargée: ${(listItems || []).length} anime(s)`);
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="w-8 h-8 text-primary" />
          <p className="text-muted-foreground">Chargement de la liste...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-4"
        >
          <div className="glass-card border border-red-500/30 rounded-xl p-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className="bg-red-500/20 rounded-full p-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-foreground">{error}</h2>
            <p className="text-sm text-muted-foreground">
              Cette liste n'est pas disponible ou a été supprimée
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full btn-primary rounded-lg mt-4"
            >
              ← Retour à l'accueil
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => window.history.back()}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Retour</span>
      </motion.button>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-8"
        >
          {/* Owner Info */}
          {owner && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Liste de</p>
                <p className="text-lg font-bold text-foreground">
                  {owner.display_name || owner.discord_username || 'Utilisateur'}
                </p>
              </div>
            </div>
          )}

          {/* List Title */}
          <div className={`glass-card border rounded-xl p-6 bg-gradient-to-br ${statusColors[listType as ListStatus] || 'from-primary/20 to-primary/5'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ma liste</p>
                <h1 className="text-3xl font-bold text-foreground">
                  {statusLabels[listType as ListStatus] || listType}
                </h1>
              </div>
              <div className="bg-white/10 rounded-full px-4 py-2 backdrop-blur">
                <p className="text-lg font-bold text-foreground">{items.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-block p-4 rounded-full bg-muted mb-4">
              <Zap className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Aucun anime dans cette liste
            </h3>
            <p className="text-muted-foreground text-sm">
              {owner?.display_name || owner?.discord_username || 'Cet utilisateur'} n'a pas encore ajouté d'anime à cette catégorie
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <AnimeListCard 
                  animeId={item.anime_id}
                  title={item.anime_title}
                  image={item.anime_image}
                  status={item.status}
                  progress={item.progress || 0}
                  totalEpisodes={item.total_episodes || undefined}
                  rating={item.rating}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SharedListPage;
