# 🏗️ DIAGNOSTIC ARCHITECTURE

## ❌ PROBLÈMES CRITIQUES TROUVÉS

### 1. localStorage = VIOLATION RÈGLE FONDAMENTALE ❌
```tsx
// animeListStore.ts - MAUVAIS
persist(
  (set) => ({ ... }),
  {
    name: 'otakudb-anime-list',  // ❌ STOCKAGE LOCAL!
  }
)
```

**Problème:**
- Données cachées sur l'appareil (local)
- Si utilisateur change d'appareil → données perdues
- Sync pas automatique
- Règle violée: "Aucune donnée locale"

---

### 2. usePersistenceMonitor = BAND-AID SOLUTION ❌
```tsx
// Hook créé pour monitorer localStorage
// ❌ C'est du pansement sur une jambe de bois!
// Les données DOIVENT venir de Supabase, pas du cache local
```

**Problème:**
- Essaie de "sauver" localStorage
- Mais localStorage ne doit PAS exister!
- Solution: supprimer tout ça

---

### 3. Architecture "Offline-first" ❌
Approche actuelle:
```
User → Local Cache → Optional Sync to Server
```

**Problème:**
- ❌ Données disparaissent si cache effacé
- ❌ Pas de sync real-time
- ❌ Pas d'accès multi-device

Approche REQUISE:
```
User ← Real-time Sync ← Server (Supabase)
```

---

### 4. Partage = URL Complexe ❌
```
/share/:userId/:listType
→ Utilisateur doit copier + coller le lien
→ Pas social
```

**Problème:**
- Discord users s'attendent à UNE IMAGE partager
- Pas un lien à cliquer
- Besoin: **Image haute qualité** envoyable directement

---

### 5. UI = Pas optimisée "Discord first" ❌
```tsx
// Layout actuel:
- Header
- Sidebar
- Content
- BottomNav
```

**Problème:**
- Design classique, pas social
- Pas pensé pour partage
- Images d'animes pas mise en avant

---

## ✅ ARCHITECTURE CORRECTE REQUISE

```
┌─────────────────────────────────────────────────────────┐
│                    DISCORD OAUTH                         │
│         (Unique Source of Identity)                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  Supabase Auth      │
        │  (Discord Login)    │
        └─────────────┬───────┘
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
  ┌────────┐    ┌──────────┐    ┌─────────┐
  │profiles│    │anime_list│    │friends  │
  │        │    │          │    │         │
  │ All    │◄──►│ Real-    │◄──►│ Friend  │
  │ user   │    │ time     │    │ network │
  │ data   │    │ sync     │    │         │
  └────────┘    └──────────┘    └─────────┘
      │               │              │
      └───────────────┼──────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │  Real-time Listeners     │
         │  (Supabase RLS + Filters)│
         └──────────────────────────┘
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
  ┌─────────┐   ┌──────────┐   ┌──────────┐
  │ React   │   │ Zustand  │   │  Local   │
  │Component│   │ (Memory) │   │ Cache    │
  │         │   │ NO STORE │   │ (Session)│
  └─────────┘   └──────────┘   └──────────┘
      │               │              │
      └───────────────┼──────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │   IMAGE EXPORT           │
         │   (Canvas + Download)    │
         │   Discord-ready format   │
         └──────────────────────────┘
```

---

## 📊 FLUX DE DONNÉES

### Ajouter un anime:
```
1. User tape nom + cherche via API Jikan
2. Click "Ajouter" → INSERT Supabase
3. RLS trigger → Broadcast change
4. Listener Supabase détecte
5. Zustand met à jour state (MEMORY ONLY)
6. UI re-render
7. ✅ Sync automatique

NO localStorage involved!
```

### Changer d'appareil:
```
1. User login sur mobile avec Discord OAuth
2. Supabase Auth confirme identité
3. Real-time listener se connecte
4. Supabase envoie TOUTES les données de l'user
5. Zustand remplit state depuis query
6. ✅ Données disponibles immédiatement
7. Aucun cache ne manquant!
```

### Partager:
```
1. User click "Partager"
2. Canvas génère image haute qualité:
   - Avatar Discord
   - Username
   - 4 sections (Favoris, En cours, À voir, Terminés)
   - Posters des animes (max 20)
   - Style premium
3. Image exportée en PNG
4. User upload sur Discord
5. ✅ Vrai partage social!
```

---

## 🔧 CHANGEMENTS REQUIS

### 1. Zustand (NO PERSIST)
```tsx
// AVANT
persist((set) => {...}, { name: 'otakudb-anime-list' })

// APRÈS
create((set) => ({
  // MEMORY ONLY
  // Data loaded from Supabase
  // Cleared on logout
  animes: [],
  addAnime: async (anime) => {
    // INSERT to Supabase
    // Listener updates state
  }
}))
```

### 2. Real-time Subscriptions
```tsx
// NEW: useRealtimeAnimeList
useEffect(() => {
  const subscription = supabase
    .from('anime_lists')
    .on('*', (payload) => {
      if (payload.new.user_id === user?.id) {
        setStore(payload.new);
      }
    })
    .subscribe();
    
  return () => subscription.unsubscribe();
}, [user?.id]);
```

### 3. Image Generator (Canvas)
```tsx
// NEW: generateShareImage
const generateShareImage = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630; // OG image size
  
  const ctx = canvas.getContext('2d');
  
  // Background Discord-like
  ctx.fillStyle = '#2C2F33';
  ctx.fillRect(0, 0, 1200, 630);
  
  // Avatar + username
  drawDiscordProfile(ctx, user, 40, 20);
  
  // 4 sections
  drawAnimeSection(ctx, 'Favoris', animes.favorites, 0);
  drawAnimeSection(ctx, 'En cours', animes.watching, 1);
  drawAnimeSection(ctx, 'À voir', animes.planned, 2);
  drawAnimeSection(ctx, 'Terminés', animes.completed, 3);
  
  // OtakuDB watermark
  ctx.font = 'bold 24px Inter';
  ctx.fillStyle = '#7289DA';
  ctx.fillText('otakudb.app', 1100, 600);
  
  return canvas;
};
```

### 4. Supprimer localStorage partout
```tsx
// ❌ REMOVE
- animeListStore.ts persist
- usePersistenceMonitor.ts (whole file!)
- SaveIndicator.tsx (not needed)
- Any localStorage references
```

---

## 🎨 UI/UX CHANGES

### Current: "List-based"
```
┌─────────────────────────────┐
│ Favoris (7)                 │
│ [Card] [Card] [Card] ...    │
│                             │
│ En cours (12)               │
│ [Card] [Card] [Card] ...    │
└─────────────────────────────┘
```

### NEW: "Grid-based" + "Share-optimized"
```
┌────────────────────────────────────────┐
│  👤 Username                    [Share]│
├────────────────────────────────────────┤
│  ▶️ EN COURS (12)               ⭐ FAV (7)
│  [Big Img] [Big Img] [Big Img]         │
│  [Big Img] [Big Img] [Big Img]         │
│                                        │
│  ⏰ À VOIR (5)                  ✅ TERM (18)
│  [Big Img] [Big Img] [Big Img]         │
│  [Big Img] [Big Img] [Big Img]         │
└────────────────────────────────────────┘
```

**Design Discord-inspired:**
- Dark mode premium
- Large anime posters (visible)
- Quick actions (drag-drop, quick add)
- Share button prominently featured
- Real-time count indicators

---

## ✅ CHECKLIST CONFORMITÉ

- [ ] ✅ Toutes données = Supabase
- [ ] ❌ ZÉRO localStorage
- [ ] ✅ Real-time sync
- [ ] ✅ Multi-device access
- [ ] ✅ Image partage haute qualité
- [ ] ✅ Discord first
- [ ] ✅ UI modern + social
- [ ] ✅ RLS + Security

---

## 📋 PLAN D'IMPLÉMENTATION

**Phase 1: Architecture (1 jour)**
1. Supprimer localStorage
2. Créer hooks real-time Supabase
3. Refactor Zustand (memory only)
4. Tests de sync

**Phase 2: Image Generator (1 jour)**
1. Canvas image generator
2. Multiple template options
3. Download + Discord upload
4. Quality assurance

**Phase 3: UI Refactor (1-2 jours)**
1. Nouveau layout grid
2. Animations fluides
3. Share UX prominent
4. Mobile optimization

**Phase 4: Social Features (1 jour)**
1. Friend system fix
2. Share notifications
3. Discord bot integration (optional)

**Total: 4-5 jours** pour une implémentation propre et scalable

