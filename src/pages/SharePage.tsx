import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Eye, Trash2, Clock, Check, Link2, Users, Image, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type SharedList = Database['public']['Tables']['shared_lists']['Row'];
type SharePermission = Database['public']['Enums']['share_permission'];

const SharePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [sharedLists, setSharedLists] = useState<SharedList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedListType, setSelectedListType] = useState<'watching' | 'completed' | 'planned' | 'favorites' | 'all'>('all');
  const [sharePermissions, setSharePermissions] = useState({
    watching: profile?.share_watching || 'friends_only',
    completed: profile?.share_completed || 'friends_only',
    planned: profile?.share_planned || 'none',
    favorites: profile?.share_favorites || 'friends_only',
  });

  useEffect(() => {
    if (user?.id) {
      fetchSharedLists();
    }
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      setSharePermissions({
        watching: profile.share_watching || 'friends_only',
        completed: profile.share_completed || 'friends_only',
        planned: profile.share_planned || 'none',
        favorites: profile.share_favorites || 'friends_only',
      });
    }
  }, [profile]);

  const fetchSharedLists = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('shared_lists')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedLists(data || []);
    } catch (err) {
      console.error('Error fetching shared lists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createShareLink = async () => {
    if (!user?.id) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('shared_lists')
        .insert({
          owner_id: user.id,
          list_type: selectedListType,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();

      if (error) throw error;

      setSharedLists(prev => [data, ...prev]);
      toast.success('Lien de partage créé !');
    } catch (err) {
      console.error('Error creating share:', err);
      toast.error('Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const copyShareLink = async (shareCode: string) => {
    const url = `${window.location.origin}/share/${shareCode}`;
    await navigator.clipboard.writeText(url);
    toast.success('Lien copié !');
  };

  const deleteShareLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shared_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSharedLists(prev => prev.filter(s => s.id !== id));
      toast.success('Lien supprimé');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

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

  const listTypes = [
    { id: 'watching', label: 'En cours', icon: '▶️' },
    { id: 'completed', label: 'Terminés', icon: '✓' },
    { id: 'planned', label: 'À voir', icon: '📅' },
    { id: 'favorites', label: 'Favoris', icon: '❤️' },
    { id: 'all', label: 'Toutes', icon: '📋' },
  ] as const;

  const permissionLabels: Record<SharePermission, string> = {
    none: 'Privé',
    friends_only: 'Amis',
    public: 'Public',
  };

  if (!user) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Connectez-vous pour partager vos listes</p>
      </div>
    );
  }

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Share2 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-display font-bold">Partage</h1>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Confidentialité des listes
          </h2>
        </div>

        <div className="glass-card p-4 space-y-3">
          {(['watching', 'completed', 'planned', 'favorites'] as const).map((listType) => (
            <div key={listType} className="flex items-center justify-between">
              <span className="text-sm text-foreground capitalize">
                {listType === 'watching' && 'En cours'}
                {listType === 'completed' && 'Terminés'}
                {listType === 'planned' && 'À voir'}
                {listType === 'favorites' && 'Favoris'}
              </span>
              <div className="flex gap-1 bg-secondary/50 p-0.5 rounded-lg">
                {(['none', 'friends_only', 'public'] as SharePermission[]).map((perm) => (
                  <button
                    key={perm}
                    onClick={() => updatePermission(listType, perm)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      sharePermissions[listType] === perm
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {permissionLabels[perm]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Share Link */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Link2 className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Créer un lien de partage
          </h2>
        </div>

        <div className="glass-card p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {listTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedListType(type.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedListType === type.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="mr-1.5">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>

          <button
            onClick={createShareLink}
            disabled={isCreating}
            className="btn-primary w-full"
          >
            {isCreating ? 'Création...' : 'Créer le lien'}
          </button>
        </div>
      </div>

      {/* Existing Share Links */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Liens actifs ({sharedLists.length})
          </h2>
        </div>

        {sharedLists.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            <Link2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun lien de partage actif</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sharedLists.map((share) => {
              const isExpired = share.expires_at && new Date(share.expires_at) < new Date();
              const listInfo = listTypes.find(t => t.id === share.list_type);
              
              return (
                <motion.div
                  key={share.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card p-3 ${isExpired ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                      {listInfo?.icon || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {listInfo?.label || 'Liste'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        <span>{share.view_count} vues</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>
                          {isExpired 
                            ? 'Expiré' 
                            : share.expires_at 
                              ? `Expire ${new Date(share.expires_at).toLocaleDateString('fr-FR')}`
                              : 'Permanent'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => copyShareLink(share.share_code)}
                        className="p-2 bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteShareLink(share.id)}
                        className="p-2 bg-secondary text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gallery Feature Teaser */}
      <div className="glass-card p-5 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Image className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-1">Galerie collaborative</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bientôt : créez une galerie photo avec vos amis ! Affichez vos animes favoris en commun et découvrez votre compatibilité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePage;
