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
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'search'>('friends');

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

      for (const f of friendships || []) {
        const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        
        // Fetch friend profile
        const { data: friendProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', friendId)
          .single();

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
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`display_name.ilike.%${query}%,discord_username.ilike.%${query}%`)
        .neq('user_id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: targetUserId,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Demande envoyée !');
      fetchFriendships();
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      if (err.code === '23505') {
        toast.error('Demande déjà envoyée');
      } else {
        toast.error('Erreur lors de l\'envoi');
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
        <p className="text-muted-foreground">Connectez-vous pour voir vos amis</p>
      </div>
    );
  }

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-display font-bold">Mes Amis</h1>
        {pendingRequests.length > 0 && (
          <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
            {pendingRequests.length}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-secondary/50 p-1 rounded-xl">
        {[
          { id: 'friends', label: 'Amis', count: friends.length },
          { id: 'pending', label: 'Demandes', count: pendingRequests.length },
          { id: 'search', label: 'Rechercher', icon: Search },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-xs opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Rechercher par pseudo Discord..."
                className="input-search pl-10"
              />
            </div>

            {isSearching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="glass-card p-3 flex items-center gap-3"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {result.discord_avatar ? (
                        <img src={result.discord_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {result.display_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {result.display_name}
                      </p>
                      {result.discord_username && (
                        <p className="text-xs text-muted-foreground truncate">
                          @{result.discord_username}
                        </p>
                      )}
                    </div>
                    {isAlreadyFriendOrPending(result.user_id) ? (
                      <span className="text-xs text-muted-foreground px-2">Déjà ami</span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(result.user_id)}
                        className="p-2 bg-primary text-primary-foreground rounded-lg"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Aucun utilisateur trouvé
              </p>
            ) : null}
          </motion.div>
        )}

        {activeTab === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {pendingRequests.length === 0 && sentRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Aucune demande en attente</p>
              </div>
            ) : (
              <>
                {pendingRequests.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                      Demandes reçues
                    </h3>
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="glass-card p-3 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {request.friend_profile?.discord_avatar ? (
                            <img src={request.friend_profile.discord_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-primary">
                              {request.friend_profile?.display_name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {request.friend_profile?.display_name || 'Utilisateur'}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => respondToRequest(request.id, true)}
                            className="p-2 bg-rating-green/20 text-rating-green rounded-lg"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => respondToRequest(request.id, false)}
                            className="p-2 bg-destructive/20 text-destructive rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {sentRequests.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                      Demandes envoyées
                    </h3>
                    {sentRequests.map((request) => (
                      <div key={request.id} className="glass-card p-3 flex items-center gap-3 opacity-70">
                        <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {request.friend_profile?.display_name || 'Utilisateur'}
                          </p>
                          <p className="text-xs text-muted-foreground">En attente</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'friends' && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm mb-4">Aucun ami pour le moment</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="btn-primary text-sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter des amis
                </button>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {friend.friend_profile?.discord_avatar ? (
                      <img src={friend.friend_profile.discord_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-primary">
                        {friend.friend_profile?.display_name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {friend.friend_profile?.display_name || 'Utilisateur'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{friend.friend_profile?.total_anime || 0} animes</span>
                      <span>•</span>
                      <span>{friend.friend_profile?.total_episodes || 0} épisodes</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {/* TODO: View friend's list */}}
                      className="p-2 bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFriend(friend.id)}
                      className="p-2 bg-secondary text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FriendsPage;
