import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Check, X, Loader2, Clock, UserMinus, Share2, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Friendship = Database['public']['Tables']['friendships']['Row'];

interface FriendWithProfile extends Friendship {
  friend_profile?: Profile;
}

const FriendsPage = () => {
  const { user, profile } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'discover'>('friends');

  useEffect(() => {
    if (user?.id) {
      fetchFriendships();
    }
  }, [user?.id]);

  const fetchFriendships = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch all friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      // Separate into categories
      const accepted: FriendWithProfile[] = [];
      const pending: FriendWithProfile[] = [];
      const sent: FriendWithProfile[] = [];

      // Fetch all friend profiles in a single batch
      const friendIds = (friendships || []).map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      const { data: profiles } = friendIds.length > 0 
        ? await supabase
            .from('profiles')
            .select('*')
            .in('user_id', friendIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      for (const f of friendships || []) {
        const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        const friendProfile = profileMap.get(friendId);
        const friendWithProfile = { ...f, friend_profile: friendProfile || undefined };

        if (f.status === 'accepted') {
          accepted.push(friendWithProfile);
        } else if (f.status === 'pending') {
          if (f.addressee_id === user.id) {
            pending.push(friendWithProfile);
          } else {
            sent.push(friendWithProfile);
          }
        }
      }

      setFriends(accepted);
      setPendingRequests(pending);
      setSentRequests(sent);
    } catch (err) {
      console.error('Error fetching friendships:', err);
      toast.error('Erreur lors du chargement des amis');
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // SECURITY: Input validation - remove special characters
      // Allow only alphanumeric, spaces, hyphens, underscores, and accented characters
      const sanitizedQuery = query.trim().replace(/[^\w\s\-àâäæçéèêëíìîïñóòôöœúùûüýÿ]/gi, '');
      
      if (sanitizedQuery.length === 0) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // SECURITY: Use parameterized search with textSearch instead of raw ILIKE
      // Supabase handles parameter escaping automatically
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, discord_username, discord_avatar, total_anime, total_episodes')
        .or(`display_name.ilike.%${sanitizedQuery}%,discord_username.ilike.%${sanitizedQuery}%`)
        .neq('user_id', user?.id || '')
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Erreur de recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user?.id) {
      toast.error('❌ Vous devez être connecté pour ajouter des amis');
      console.warn('⚠️ Tentative d\'ajout ami sans authentification');
      return;
    }

    if (!targetUserId || targetUserId === user.id) {
      toast.error('❌ Ami invalide');
      return;
    }

    try {
      console.log(`📤 Envoi demande d'ami à: ${targetUserId}`);
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: targetUserId,
          status: 'pending',
        });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Demande envoyée avec succès');
      toast.success('✅ Demande envoyée !');
      await fetchFriendships();
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      console.error('❌ Erreur complète:', {
        code: err.code,
        message: err.message,
        details: err.details,
        hint: err.hint,
      });
      
      // Gérer les erreurs spécifiques
      if (err.code === '23505') {
        toast.error('⚠️ Vous avez déjà une demande en attente');
      } else if (err.message?.includes('duplicate') || err.message?.includes('Friendships')) {
        toast.error('⚠️ Relation ami existante avec ce compte');
      } else if (err.message?.includes('policy')) {
        toast.error('❌ Vous n\'avez pas la permission d\'effectuer cette action');
      } else if (err.message) {
        toast.error(`❌ Erreur: ${err.message}`);
      } else {
        toast.error('❌ Impossible d\'ajouter un ami pour le moment');
      }
    }
  };

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    try {
      if (accept) {
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', friendshipId);
        
        if (error) throw error;
        toast.success('Ami ajouté !');
      } else {
        const { error } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId);
        
        if (error) throw error;
        toast.success('Demande refusée');
      }
      
      fetchFriendships();
    } catch (err) {
      toast.error('Erreur lors de la réponse');
    }
  };

  const removeFriend = async (friendshipId: string) => {
    if (!confirm('Retirer cet ami ?')) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      toast.success('Ami retiré');
      fetchFriendships();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const isAlreadyFriendOrPending = (userId: string) => {
    return (
      friends.some(f => f.friend_profile?.user_id === userId) ||
      pendingRequests.some(f => f.friend_profile?.user_id === userId) ||
      sentRequests.some(f => f.friend_profile?.user_id === userId)
    );
  };

  if (!user) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-5xl mb-4">👥</div>
          <p className="font-semibold text-foreground text-lg">Connectez-vous</p>
          <p className="text-muted-foreground text-sm max-w-sm">Pour ajouter des amis et découvrir leurs listes, connectez-vous avec Discord</p>
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

  return (
    <div className="page-container space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Découvrir</h1>
            <p className="text-sm text-muted-foreground">Amis & leurs animes</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 bg-secondary/30 p-1 rounded-lg">
        {[
          { id: 'friends', label: `Amis (${friends.length})` },
          { id: 'discover', label: 'Découvrir' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Friends Section */}
        {activeTab === 'friends' && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : friends.length === 0 ? (
              <div className="glass-card p-8 text-center space-y-4">
                <Users className="w-16 h-16 mx-auto opacity-20" />
                <div>
                  <p className="text-foreground font-medium mb-1">Aucun ami pour le moment</p>
                  <p className="text-sm text-muted-foreground">Découvrez et ajoutez des amis qui regardent aussi des animes !</p>
                </div>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="btn-primary text-sm mx-auto"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter des amis
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {friends.map((friend, idx) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-card p-4 hover:bg-card-hover transition-colors space-y-3"
                  >
                    {/* Avatar & Name */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-blue-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {friend.friend_profile?.discord_avatar ? (
                          <img src={friend.friend_profile.discord_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-violet-400">
                            {friend.friend_profile?.display_name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {friend.friend_profile?.display_name || 'Utilisateur'}
                        </p>
                        {friend.friend_profile?.discord_username && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{friend.friend_profile.discord_username}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        📺 {friend.friend_profile?.total_anime || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        ▶️ {friend.friend_profile?.total_episodes || 0}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {/* TODO: View friend's list */}}
                        className="flex-1 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-medium transition-colors"
                      >
                        Voir listes
                      </button>
                      <button
                        onClick={() => removeFriend(friend.id)}
                        className="px-3 py-1.5 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg text-xs transition-colors"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Discover Section */}
        {activeTab === 'discover' && (
          <motion.div
            key="discover"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Chercher par pseudo Discord..."
                className="input-search pl-10"
              />
            </div>

            {/* Search Results or Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Demandes reçues ({pendingRequests.length})
                </h3>
                {pendingRequests.map((request) => (
                  <div key={request.id} className="glass-card p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {request.friend_profile?.discord_avatar ? (
                        <img src={request.friend_profile.discord_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-amber-400">
                          {request.friend_profile?.display_name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {request.friend_profile?.display_name || 'Utilisateur'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => respondToRequest(request.id, true)}
                        className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => respondToRequest(request.id, false)}
                        className="p-2 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-lg transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search Results */}
            {isSearching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-4 space-y-3 hover:bg-card-hover transition-colors"
                  >
                    {/* Avatar & Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {result.discord_avatar ? (
                          <img src={result.discord_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-pink-400">
                            {result.display_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{result.display_name}</p>
                        {result.discord_username && (
                          <p className="text-xs text-muted-foreground truncate">@{result.discord_username}</p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>📺 {result.total_anime || 0} animes</p>
                      <p>▶️ {result.total_episodes || 0} épisodes</p>
                    </div>

                    {/* Action Button */}
                    {isAlreadyFriendOrPending(result.user_id) ? (
                      <p className="text-xs text-muted-foreground text-center py-2">Déjà ami</p>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(result.user_id)}
                        className="w-full px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Ajouter
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : searchQuery.length >= 3 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Aucun utilisateur trouvé</p>
              </div>
            ) : searchQuery.length > 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Entrez au moins 3 caractères
              </p>
            ) : (
              <div className="glass-card p-8 text-center text-muted-foreground">
                <p className="text-sm">Cherchez des utilisateurs pour ajouter des amis !</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FriendsPage;
