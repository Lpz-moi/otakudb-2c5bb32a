import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Info, Trash2, Edit2, Check, X, Shield, LogOut, Users, Share2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnimeListStore } from '@/stores/animeListStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useAuth } from '@/contexts/AuthContext';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';
import { toast } from 'sonner';

// Discord logo SVG
const DiscordIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const { getStats } = useAnimeListStore();
  const stats = getStats();
  
  const { 
    profile: localProfile, 
    createProfile, 
    updateProfile: updateLocalProfile, 
    deleteProfile: deleteLocalProfile,
    versionPreference,
    setVersionPreference,
    exportData,
    importData,
    reminders,
  } = useUserPreferencesStore();

  const { user, profile: cloudProfile, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { initiateDiscordLogin, isLoading: discordLoading } = useDiscordAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(cloudProfile?.display_name || localProfile?.username || '');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  // Use cloud profile if authenticated, otherwise local
  const displayProfile = isAuthenticated && cloudProfile 
    ? {
        username: cloudProfile.display_name,
        avatar: cloudProfile.discord_avatar,
        createdAt: cloudProfile.created_at,
        discordUsername: cloudProfile.discord_username,
      }
    : localProfile 
      ? {
          username: localProfile.username,
          avatar: localProfile.avatar,
          createdAt: localProfile.createdAt,
          discordUsername: null,
        }
      : null;

  const handleCreateProfile = () => {
    if (!newUsername.trim()) {
      toast.error('Veuillez entrer un pseudo');
      return;
    }
    createProfile(newUsername.trim());
    setNewUsername('');
    setShowCreateForm(false);
    toast.success('Profil créé');
  };

  const handleUpdateName = () => {
    if (!editName.trim()) {
      toast.error('Le pseudo ne peut pas être vide');
      return;
    }
    updateLocalProfile({ username: editName.trim() });
    setIsEditing(false);
    toast.success('Pseudo mis à jour');
  };

  const handleDiscordLogin = async () => {
    await initiateDiscordLogin();
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
  };

  const handleDeleteProfile = () => {
    if (confirm('Supprimer votre profil ? Vos préférences et rappels seront effacés.')) {
      deleteLocalProfile();
      toast.success('Profil supprimé');
    }
  };

  if (authLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-display font-bold">Mon Profil</h1>
      </div>

      {/* Profile Card - Not logged in and no local profile */}
      {!isAuthenticated && !displayProfile && !showCreateForm ? (
        <div className="glass-card p-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/20 flex items-center justify-center mx-auto mb-4">
            <DiscordIcon className="w-7 h-7 text-[#5865F2]" />
          </div>
          <h2 className="text-base font-bold text-foreground mb-2">Connectez-vous avec Discord</h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Synchronisez vos listes, partagez avec vos amis et accédez à vos données partout.
          </p>
          <motion.button
            onClick={handleDiscordLogin}
            disabled={discordLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-6 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-[#5865F2]/30"
          >
            {discordLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <DiscordIcon className="w-4 h-4" />
                Se connecter avec Discord
              </>
            )}
          </motion.button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-card text-muted-foreground">ou</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continuer sans compte
          </button>
        </div>
      ) : showCreateForm && !isAuthenticated ? (
        <div className="glass-card p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Profil local</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Vos données resteront uniquement sur cet appareil.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Pseudo</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Votre pseudo"
                className="input-search"
                maxLength={20}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateProfile} className="btn-primary flex-1">
                Créer
              </button>
              <button 
                onClick={() => setShowCreateForm(false)} 
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : displayProfile ? (
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {displayProfile.avatar ? (
                <img src={displayProfile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {displayProfile.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing && !isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-secondary rounded-lg px-3 py-1.5 text-foreground font-bold w-full"
                    maxLength={20}
                    autoFocus
                  />
                  <button onClick={handleUpdateName} className="p-2 text-rating-green">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-2 text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground truncate">{displayProfile.username}</h2>
                  {!isAuthenticated && (
                    <button 
                      onClick={() => { setEditName(displayProfile.username || ''); setIsEditing(true); }}
                      className="p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                {displayProfile.discordUsername && (
                  <span className="flex items-center gap-1 text-xs text-[#5865F2]">
                    <DiscordIcon className="w-3 h-3" />
                    @{displayProfile.discordUsername}
                  </span>
                )}
                {!displayProfile.discordUsername && (
                  <p className="text-xs text-muted-foreground">
                    Profil local
                  </p>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Depuis {new Date(displayProfile.createdAt || '').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
            <div className="text-center p-2.5 rounded-xl bg-secondary/50">
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Animes</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-secondary/50">
              <p className="text-lg font-bold text-foreground">{stats.totalEpisodes}</p>
              <p className="text-[10px] text-muted-foreground">Épisodes</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-secondary/50">
              <p className="text-lg font-bold text-foreground">{reminders.length}</p>
              <p className="text-[10px] text-muted-foreground">Rappels</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Social Actions (only when authenticated) */}
      {isAuthenticated && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Social
          </h3>
          
          <button 
            onClick={() => navigate('/friends')}
            className="w-full glass-card p-3.5 flex items-center gap-3 hover:bg-card-hover transition-colors active:scale-[0.99]"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm text-foreground">Découvrir</p>
              <p className="text-[11px] text-muted-foreground">Amis et leurs listes</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/share')}
            className="w-full glass-card p-3.5 flex items-center gap-3 hover:bg-card-hover transition-colors active:scale-[0.99]"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm text-foreground">Partager</p>
              <p className="text-[11px] text-muted-foreground">Vos listes publiques</p>
            </div>
          </button>
        </div>
      )}

      {/* Preferences */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Préférences
        </h3>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground">Version préférée</p>
              <p className="text-[11px] text-muted-foreground">Filtre par défaut du calendrier</p>
            </div>
            <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5 flex-shrink-0">
              {(['all', 'vf', 'vostfr'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVersionPreference(v)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    versionPreference === v
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {v === 'all' ? 'Tout' : v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Compte
        </h3>
        
        {!isAuthenticated && displayProfile && (
          <button 
            onClick={handleDeleteProfile}
            className="w-full glass-card p-3.5 flex items-center gap-3 hover:bg-destructive/10 transition-colors active:scale-[0.99]"
          >
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm text-destructive">Supprimer mon profil</p>
              <p className="text-[11px] text-muted-foreground">Efface toutes les préférences</p>
            </div>
          </button>
        )}

        {isAuthenticated && (
          <button 
            onClick={handleSignOut}
            className="w-full glass-card p-3.5 flex items-center gap-3 hover:bg-destructive/10 transition-colors active:scale-[0.99]"
          >
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm text-destructive">Se déconnecter</p>
              <p className="text-[11px] text-muted-foreground">Déconnexion du compte Discord</p>
            </div>
          </button>
        )}
      </div>

      {/* Connect Discord (if using local profile) */}
      {!isAuthenticated && displayProfile && (
        <div className="glass-card p-4 bg-gradient-to-br from-[#5865F2]/10 to-transparent">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 flex items-center justify-center flex-shrink-0">
              <DiscordIcon className="w-5 h-5 text-[#5865F2]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-foreground mb-1">Synchroniser avec Discord</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Connectez-vous pour synchroniser vos données et les partager avec vos amis.
              </p>
              <button
                onClick={handleDiscordLogin}
                disabled={discordLoading}
                className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Connecter Discord
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="glass-card p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
            <p>
              {isAuthenticated 
                ? 'Vos données sont synchronisées de manière sécurisée via Cloud.'
                : 'Vos données sont stockées localement sur cet appareil.'
              }
            </p>
            <p>Données fournies par Jikan API (MyAnimeList non-officiel).</p>
            <p className="opacity-60">Version 2.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
