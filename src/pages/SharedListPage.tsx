import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, User, Star, Clock, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SharedList = Database['public']['Tables']['shared_lists']['Row'];
type AnimeListItem = Database['public']['Tables']['anime_lists']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface SharedData {
  share: SharedList;
  owner: Profile | null;
  items: AnimeListItem[];
}

const SharedListPage = () => {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      fetchSharedList(code);
    }
  }, [code]);

  const fetchSharedList = async (shareCode: string) => {
    try {
      // Get the shared list
      const { data: share, error: shareError } = await supabase
        .from('shared_lists')
        .select('*')
        .eq('share_code', shareCode)
        .single();

      if (shareError || !share) {
        setError('Lien de partage invalide ou expiré');
        return;
      }

      // Check expiration
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        setError('Ce lien de partage a expiré');
        return;
      }

      // Get owner profile
      const { data: owner } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', share.owner_id)
        .single();

      // Get anime items based on list type
      let itemsQuery = supabase
        .from('anime_lists')
        .select('*')
        .eq('user_id', share.owner_id);

      if (share.list_type !== 'all') {
        itemsQuery = itemsQuery.eq('status', share.list_type);
      }

      const { data: items } = await itemsQuery.order('updated_at', { ascending: false });

      // Increment view count
      await supabase
        .from('shared_lists')
        .update({ view_count: (share.view_count || 0) + 1 })
        .eq('id', share.id);

      setData({
        share,
        owner,
        items: items || [],
      });
    } catch (err) {
      console.error('Error fetching shared list:', err);
      setError('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'watching': return 'En cours';
      case 'completed': return 'Terminé';
      case 'planned': return 'À voir';
      case 'favorites': return 'Favoris';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching': return 'text-status-watching';
      case 'completed': return 'text-rating-green';
      case 'planned': return 'text-status-planned';
      case 'favorites': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Oops !</h1>
        <p className="text-muted-foreground">{error || 'Liste introuvable'}</p>
      </div>
    );
  }

  const { share, owner, items } = data;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {owner?.discord_avatar ? (
                <img src={owner.discord_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-foreground truncate">
                {owner?.display_name || 'Utilisateur'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {share.list_type === 'all' ? 'Toutes les listes' : getStatusLabel(share.list_type)}
                {' '}&bull;{' '}
                {items.length} anime{items.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-lg">
              <Eye className="w-3.5 h-3.5" />
              {share.view_count || 0}
            </div>
          </div>
        </div>
      </header>

      {/* Anime Grid */}
      <div className="px-4 py-4">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Cette liste est vide</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
                  {item.anime_image ? (
                    <img
                      src={item.anime_image}
                      alt={item.anime_title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      📺
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Status badge */}
                  {share.list_type === 'all' && (
                    <span className={`absolute top-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-black/50 ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  )}
                  
                  {/* Rating */}
                  {item.rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 text-xs font-medium bg-black/50 px-1.5 py-0.5 rounded-md">
                      <Star className="w-3 h-3 text-rating-yellow fill-rating-yellow" />
                      <span className="text-white">{item.rating}</span>
                    </div>
                  )}
                  
                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-xs font-medium line-clamp-2 leading-tight">
                      {item.anime_title}
                    </p>
                    {item.progress !== null && item.total_episodes && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-white/70">
                        <Clock className="w-3 h-3" />
                        {item.progress}/{item.total_episodes}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* OtakuDB branding */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          Partagé via <span className="text-primary font-semibold">OtakuDB</span>
        </p>
      </div>
    </div>
  );
};

export default SharedListPage;
