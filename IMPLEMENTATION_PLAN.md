# 🚀 PLAN D'IMPLÉMENTATION - DISCORD FIRST

## PHASE 1: Supprimer localStorage (1 jour)

### Étape 1.1: Refactor animeListStore.ts
```tsx
// AVANT (MAUVAIS)
const useAnimeListStore = create(
  persist(
    (set) => ({ ... }),
    { name: 'otakudb-anime-list' }  // ❌ REMOVE
  )
);

// APRÈS (CORRECT)
const useAnimeListStore = create((set) => ({
  animes: [],
  isLoading: false,
  
  addAnime: (anime) => {
    set((state) => ({
      animes: [...state.animes, anime]
    }));
  },
  
  removeAnime: (id) => {
    set((state) => ({
      animes: state.animes.filter(a => a.id !== id)
    }));
  },
  
  updateAnime: (id, updates) => {
    set((state) => ({
      animes: state.animes.map(a => 
        a.id === id ? { ...a, ...updates } : a
      )
    }));
  },
  
  // IMPORTANT: No persist middleware!
  // Data comes from Supabase
}));
```

### Étape 1.2: Créer hook Real-time Supabase
**Nouveau fichier: `src/hooks/useRealtimeAnimeList.ts`**

```tsx
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimeListStore } from '@/stores/animeListStore';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeAnimeList = () => {
  const { user } = useAuth();
  const { setAnimes } = useAnimeListStore();

  useEffect(() => {
    if (!user?.id) return;

    console.log(`📡 Connexion réelle-temps anime_lists pour ${user.id}`);

    // 1. Charger données initiales
    const loadInitialData = async () => {
      const { data, error } = await supabase
        .from('anime_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur chargement initial:', error);
        return;
      }

      console.log(`✅ ${data.length} animes chargés`);
      setAnimes(data);
    };

    loadInitialData();

    // 2. S'abonner aux changements
    const subscription = supabase
      .channel(`anime_list_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'anime_lists',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📦 Changement détecté:', payload.eventType);

          if (payload.eventType === 'INSERT') {
            console.log('➕ Nouvel anime:', payload.new.anime_title);
            setAnimes((state) => [...state, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('✏️ Anime modifié:', payload.new.anime_title);
            setAnimes((state) =>
              state.map((a) => (a.id === payload.new.id ? payload.new : a))
            );
          } else if (payload.eventType === 'DELETE') {
            console.log('❌ Anime supprimé:', payload.old.id);
            setAnimes((state) => state.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Statut subscription: ${status}`);
      });

    return () => {
      console.log('📡 Déconnexion réelle-temps');
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);
};
```

### Étape 1.3: Utiliser le hook dans App.tsx
```tsx
// App.tsx
import { useRealtimeAnimeList } from '@/hooks/useRealtimeAnimeList';

export default function App() {
  const { user } = useAuth();
  
  // Activer sync réelle-temps
  useRealtimeAnimeList();

  return (
    // ... rest of app
  );
}
```

### Étape 1.4: Supprimer les fichiers inutiles
```bash
❌ DELETE: src/hooks/usePersistenceMonitor.ts
❌ DELETE: src/components/SaveIndicator.tsx
❌ REMOVE: localStorage references everywhere
```

---

## PHASE 2: Image Generator Premium (1-2 jours)

### Étape 2.1: Créer ImageGenerator.ts
**Nouveau fichier: `src/lib/imageGenerator.ts`**

```typescript
import type { Database } from '@/integrations/supabase/types';

type AnimeListItem = Database['public']['Tables']['anime_lists']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface GenerateImageOptions {
  profile: Profile;
  animes: AnimeListItem[];
  template?: 'simple' | 'premium' | 'compact';
}

export const generateShareImage = async (
  options: GenerateImageOptions
): Promise<Blob> => {
  const { profile, animes, template = 'premium' } = options;

  // Créer canvas (OG size pour Discord)
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  // === BACKGROUND ===
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#2C2F33'); // Discord dark
  gradient.addColorStop(1, '#23272A'); // Darker
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  // === HEADER: Avatar + Username ===
  ctx.save();
  ctx.beginPath();
  ctx.arc(50, 50, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#7289DA'; // Discord blue
  ctx.fill();
  ctx.restore();

  // Avatar image (if exists)
  if (profile.discord_avatar) {
    try {
      const img = await loadImage(profile.discord_avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(50, 50, 28, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, 22, 22, 56, 56);
      ctx.restore();
    } catch (e) {
      console.log('⚠️ Avatar load failed, using placeholder');
    }
  }

  // Username
  ctx.font = 'bold 32px "Inter", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(
    profile.username || profile.display_name || 'Utilisateur',
    100,
    65
  );

  // Subtitle
  ctx.font = '16px "Inter", sans-serif';
  ctx.fillStyle = '#B9BBBE';
  ctx.fillText('Ma liste OtakuDB', 100, 85);

  // === GROUP ANIMES BY STATUS ===
  const grouped = {
    watching: animes.filter((a) => a.status === 'watching').slice(0, 6),
    completed: animes.filter((a) => a.status === 'completed').slice(0, 6),
    planned: animes.filter((a) => a.status === 'planned').slice(0, 6),
    favorites: animes.filter((a) => a.status === 'favorites').slice(0, 6),
  };

  // === DRAW SECTIONS ===
  const sections = [
    { label: '▶️ EN COURS', key: 'watching', x: 30, y: 130 },
    { label: '⭐ FAVORIS', key: 'favorites', x: 630, y: 130 },
    { label: '⏰ À VOIR', key: 'planned', x: 30, y: 380 },
    { label: '✅ TERMINÉS', key: 'completed', x: 630, y: 380 },
  ];

  for (const section of sections) {
    // Section title
    ctx.font = 'bold 20px "Inter", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(
      `${section.label} (${grouped[section.key as keyof typeof grouped].length})`,
      section.x,
      section.y
    );

    // Draw anime posters
    const sectionAnimes = grouped[section.key as keyof typeof grouped];
    let posterX = section.x;
    let posterY = section.y + 30;

    for (let i = 0; i < Math.min(3, sectionAnimes.length); i++) {
      const anime = sectionAnimes[i];

      if (anime.anime_image) {
        try {
          const img = await loadImage(anime.anime_image);
          // Draw poster (small)
          ctx.drawImage(img, posterX, posterY, 80, 120);
        } catch (e) {
          // Fallback: colored box
          ctx.fillStyle = '#2C2F33';
          ctx.fillRect(posterX, posterY, 80, 120);
          ctx.strokeStyle = '#7289DA';
          ctx.lineWidth = 2;
          ctx.strokeRect(posterX, posterY, 80, 120);
        }
      }

      posterX += 95; // Space entre posters
    }
  }

  // === FOOTER: OtakuDB branding ===
  ctx.font = 'bold 28px "Inter", sans-serif';
  ctx.fillStyle = '#7289DA';
  ctx.textAlign = 'right';
  ctx.fillText('otakudb.app', 1150, 600);

  // === EXPORT ===
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, 'image/png');
  });
};

// Helper: Charger image avec CORS
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Erreur chargement: ${url}`));
    img.src = url;
  });
};
```

### Étape 2.2: Créer composant ShareButton
**Nouveau fichier: `src/components/ShareButton.tsx`**

```tsx
import { Download, Share2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimeListStore } from '@/stores/animeListStore';
import { generateShareImage } from '@/lib/imageGenerator';

export const ShareButton = () => {
  const { profile } = useAuth();
  const { animes } = useAnimeListStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (!profile) {
      toast.error('Connectez-vous pour partager');
      return;
    }

    try {
      setIsGenerating(true);
      console.log('🎨 Génération image partage...');

      // 1. Générer image
      const imageBlob = await generateShareImage({
        profile,
        animes,
        template: 'premium',
      });

      // 2. Créer objet fichier
      const file = new File(
        [imageBlob],
        `otakudb-${profile.username}-${Date.now()}.png`,
        { type: 'image/png' }
      );

      // 3. Vérifier si Web Share API disponible
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        console.log('📤 Partage natif');
        await navigator.share({
          files: [file],
          title: 'Ma liste OtakuDB',
          text: `Découvrez ma liste d'anime: ${animes.length} titres`,
        });
        toast.success('Partagé ! 🎉');
      } else {
        // Fallback: télécharger
        console.log('💾 Téléchargement (fallback)');
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(
          '📥 Image téléchargée! Envoyez-la sur Discord.\n👉 Allez à #general ou un ami'
        );
      }

      console.log('✅ Partage réussi');
    } catch (err) {
      console.error('❌ Erreur partage:', err);
      toast.error('Erreur génération image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isGenerating || animes.length === 0}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7289DA] to-[#5865F2] text-white rounded-xl font-bold transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Génération...
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5" />
          Partager
        </>
      )}
    </button>
  );
};
```

---

## PHASE 3: Refactor UI (1-2 jours)

### Étape 3.1: Nouveau layout "Social-first"
**Modifier: `src/pages/HomePage.tsx`**

```tsx
export default function HomePage() {
  const { user, profile } = useAuth();
  const { animes } = useAnimeListStore();
  const [activeTab, setActiveTab] = useState<
    'watching' | 'completed' | 'planned' | 'favorites'
  >('watching');

  const grouped = {
    watching: animes.filter((a) => a.status === 'watching'),
    completed: animes.filter((a) => a.status === 'completed'),
    planned: animes.filter((a) => a.status === 'planned'),
    favorites: animes.filter((a) => a.status === 'favorites'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      {/* HERO: Share Button + Stats */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Left: User */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                {profile?.discord_avatar ? (
                  <img
                    src={profile.discord_avatar}
                    alt={profile.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="font-bold text-lg">
                  {profile?.username || 'Bienvenue'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {animes.length} anime(s)
                </p>
              </div>
            </div>

            {/* Right: Share Button */}
            <ShareButton />
          </div>
        </div>
      </div>

      {/* TABS: 4 Catégories */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'watching', label: '▶️ EN COURS', icon: Play },
            { id: 'favorites', label: '⭐ FAVORIS', icon: Star },
            { id: 'planned', label: '⏰ À VOIR', icon: Clock },
            { id: 'completed', label: '✅ TERMINÉS', icon: Check },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {tab.label} ({grouped[tab.id as keyof typeof grouped].length})
            </button>
          ))}
        </div>

        {/* GRID: Animes */}
        {grouped[activeTab].length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun anime ici</p>
            <button onClick={() => setActiveTab('watching')} className="btn-primary mt-4">
              Ajouter un anime
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {grouped[activeTab].map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Étape 3.2: AnimeCard composant amélioré
```tsx
export const AnimeCard = ({ anime }: { anime: AnimeListItem }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary/50"
    >
      {/* Image */}
      {anime.anime_image && (
        <img
          src={anime.anime_image}
          alt={anime.anime_title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 group-hover:translate-y-0 transition-transform">
        <h3 className="font-bold text-white text-sm line-clamp-2">
          {anime.anime_title}
        </h3>

        {anime.progress !== null && (
          <p className="text-xs text-white/70 mt-1">
            Épisode {anime.progress}/{anime.total_episodes}
          </p>
        )}

        {anime.rating && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-white">{anime.rating}/10</span>
          </div>
        )}
      </div>

      {/* Context Menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 bg-black/50 rounded-lg hover:bg-black/70"
        >
          <MoreVertical className="w-4 h-4 text-white" />
        </button>
      </div>
    </motion.div>
  );
};
```

---

## PHASE 4: Deploy & Test (1 jour)

### Checklist Final:
- [ ] ✅ Tous les localStorage supprimés
- [ ] ✅ Real-time sync fonctionne
- [ ] ✅ Image generator en HD
- [ ] ✅ Share button prominent
- [ ] ✅ UI moderne et fluide
- [ ] ✅ Multi-device test
- [ ] ✅ Discord share test
- [ ] ✅ Performance optimisé

### Tests:
```bash
# 1. Ajouter anime sur device A
# 2. Vérifier apparaît immédiatement sur device B
# 3. Cliquer "Partager"
# 4. Vérifier image en haute qualité
# 5. Uploader sur Discord
# 6. Vérifier affichage impeccable
```

---

## RÉSUMÉ

**De:** Offline-first + localStorage
**À:** Real-time + Discord-first + Premium UX

**Impact:**
- ✅ 100% conforme à la spec
- ✅ Pas de data loss
- ✅ Multi-device seamless
- ✅ Social first
- ✅ Images premium

