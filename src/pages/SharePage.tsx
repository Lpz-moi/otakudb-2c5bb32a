import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimeListStore } from '@/stores/animeListStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { ShareCard } from '@/components/ShareCard';

type SharePermission = Database['public']['Enums']['share_permission'];

const SharePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { getStats } = useAnimeListStore();
  const [sharePermissions, setSharePermissions] = useState({
    watching: profile?.share_watching === 'public' ? 'public' : 'none',
    completed: profile?.share_completed === 'public' ? 'public' : 'none',
    planned: profile?.share_planned === 'public' ? 'public' : 'none',
    favorites: profile?.share_favorites === 'public' ? 'public' : 'none',
  });

  useEffect(() => {
    if (profile) {
      setSharePermissions({
        watching: profile.share_watching === 'public' ? 'public' : 'none',
        completed: profile.share_completed === 'public' ? 'public' : 'none',
        planned: profile.share_planned === 'public' ? 'public' : 'none',
        favorites: profile.share_favorites === 'public' ? 'public' : 'none',
      });
    }
  }, [profile]);

  const updatePermission = async (listType: keyof typeof sharePermissions, value: SharePermission) => {
    if (!user?.id) return;

    try {
      const updateField = `share_${listType}` as keyof Database['public']['Tables']['profiles']['Update'];
      
      const { error } = await supabase
        .from('profiles')
        .update({ [updateField]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      setSharePermissions(prev => ({ ...prev, [listType]: value }));
      refreshProfile();
      toast.success('Permission mise à jour');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getShareUrl = (listType: string) => {
    return `${window.location.origin}/share/${user?.id}/${listType}`;
  };

  const animeStats = getStats();
  const stats = {
    watching: animeStats.watching,
    completed: animeStats.completed,
    planned: animeStats.planned,
    favorites: animeStats.favorites,
  };

  if (!user) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-5xl mb-4">🔒</div>
          <p className="font-semibold text-foreground text-lg">Connectez-vous</p>
          <p className="text-muted-foreground text-sm max-w-sm">Pour accéder aux fonctionnalités de partage, vous devez être connecté avec Discord</p>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary text-sm mt-6"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="font-semibold text-foreground">Chargement du profil...</p>
          <p className="text-muted-foreground text-sm">Patientez un moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Partager</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Partagez vos listes d'anime en un clic
        </p>
      </motion.div>

      {/* Share Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {(['watching', 'completed', 'planned', 'favorites'] as const).map((status, idx) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <ShareCard
              listName={status}
              status={status}
              itemCount={stats[status]}
              isPublic={sharePermissions[status] !== 'none'}
              onTogglePublic={() => {
                const newPerm = sharePermissions[status] === 'none' ? 'public' : 'none';
                updatePermission(status, newPerm as SharePermission);
              }}
              shareUrl={getShareUrl(status)}
              userName={profile?.display_name || profile?.discord_username || 'Utilisateur'}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Info Card */}
      <div className="glass-card p-4 border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent">
        <p className="text-xs text-blue-200">
          💡 <span className="font-semibold">Conseil :</span> Rendez votre liste "Public" pour qu'elle soit visible à tous via le lien de partage.
        </p>
      </div>
    </div>
  );
};

export default SharePage;
