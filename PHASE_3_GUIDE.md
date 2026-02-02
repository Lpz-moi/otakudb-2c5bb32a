# 🚀 PHASE 3 - Quick Start Guide

## 📍 Où on en est

### ✅ Complété
- Phase 1: Real-time sync Supabase ✅
- Phase 2: Image generator + ShareButton ✅

### 🚧 En cours
- Phase 3: UI Refactor (social-first)

### ⏳ À venir
- Phase 4: Tests + Deploy

---

## 🎯 Phase 3 Objectif

**Transformer HomePage en "social-first" grid**

### Avant (Actuel)
```
Sidebar + Header + Content
Classic layout, pas optimisé pour partage
```

### Après (Phase 3)
```
┌───────────────────────────────────┐
│ Avatar + Share Button ← PROMINENT │
├───────────────────────────────────┤
│ [▶️ EN COURS] [⭐ FAVORIS]         │
│ [⏰ À VOIR]   [✅ TERMINÉS]        │
├───────────────────────────────────┤
│ [BIG Poster] [BIG] [BIG] [BIG]   │
│ [BIG Poster] [BIG] [BIG] [BIG]   │
│                                   │
│ Stats: 12 en cours, 5 favoris...  │
└───────────────────────────────────┘
```

---

## 📋 Checklist Phase 3

### Step 1: Refactor HomePage Layout
**Fichier:** `src/pages/HomePage.tsx`

```tsx
// Structure:
HomePage
├─ Header
│  ├─ User Avatar
│  ├─ Stats (count par catégorie)
│  └─ ShareButton ← PROMINENT
│
├─ Tabs (4 catégories)
│  ├─ watching (▶️ EN COURS)
│  ├─ favorites (⭐ FAVORIS)
│  ├─ planned (⏰ À VOIR)
│  └─ completed (✅ TERMINÉS)
│
└─ Grid
   └─ AnimeCard[] (responsive)
```

### Step 2: AnimeCard Amélioré
**Fichier:** `src/components/anime/AnimeCard.tsx` (refactorisé)

```tsx
// Avant: Petit layout
// Après: Large poster + hover effects

<AnimeCard anime={anime}>
  ├─ Large image (aspect 2:3)
  ├─ Gradient overlay (on hover)
  ├─ Title + info
  ├─ Rating (if available)
  ├─ Progress (if watching)
  └─ Context menu (... button)
```

### Step 3: Animations
- Stagger entries (react-awesome-reveal ou Framer Motion)
- Smooth tab transitions
- Hover scale effects
- Loading skeletons

### Step 4: Mobile Responsive
- 2 columns (mobile)
- 3-4 columns (tablet)
- 5-6 columns (desktop)
- Touch-friendly interactions

---

## 💻 Code Structure (Phase 3)

### HomePage refactor
```typescript
// src/pages/HomePage.tsx

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimeListStore } from '@/stores/animeListStore';
import { ShareButton } from '@/components/ShareButton';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { profile } = useAuth();
  const { items } = useAnimeListStore();
  const [activeTab, setActiveTab] = useState('watching');

  // Group animes by status
  const grouped = {
    watching: Object.values(items).filter(i => i.status === 'watching'),
    completed: Object.values(items).filter(i => i.status === 'completed'),
    planned: Object.values(items).filter(i => i.status === 'planned'),
    favorites: Object.values(items).filter(i => i.status === 'favorites'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Left: User info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                {/* Avatar */}
              </div>
              <div>
                <h1 className="font-bold text-xl">{profile?.username}</h1>
                <p className="text-sm text-muted-foreground">
                  {Object.keys(items).length} anime(s)
                </p>
              </div>
            </div>

            {/* Right: Share Button */}
            <ShareButton />
          </div>

          {/* Stats line */}
          <div className="flex gap-6 mt-6 text-sm">
            <div>
              <span className="font-bold">{grouped.watching.length}</span>
              <span className="text-muted-foreground"> en cours</span>
            </div>
            <div>
              <span className="font-bold">{grouped.favorites.length}</span>
              <span className="text-muted-foreground"> favoris</span>
            </div>
            {/* ... etc */}
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 border-b border-border pb-4">
          {['watching', 'completed', 'planned', 'favorites'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-bold rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {getTabLabel(tab)} ({grouped[tab as keyof typeof grouped].length})
            </button>
          ))}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {grouped[activeTab as keyof typeof grouped].map((anime, i) => (
            <motion.div
              key={anime.anime_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <AnimeCard anime={anime} />
            </motion.div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {grouped[activeTab as keyof typeof grouped].length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun anime ici</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🎨 Design Details

### Color Palette (Discord-inspired)
```css
Primary: #7289DA (Discord blue)
Secondary: #2C2F33 (Dark)
Muted: #72767D (Gray)
```

### Typography
```css
Title: Inter 24px bold
Subtitle: Inter 14px medium
Body: Inter 14px regular
```

### Spacing
```css
Container: max-w-7xl
Padding: px-4 py-8
Gap: gap-4 (grid), gap-2 (tabs)
Rounded: rounded-lg (buttons), rounded-xl (cards)
```

---

## 🧪 Testing Phase 3

### Visual Testing
- [ ] Header properly aligned
- [ ] Share button visible and accessible
- [ ] Grid responsive (test: resize browser)
- [ ] Tabs working
- [ ] AnimeCard images load
- [ ] Hover effects smooth

### Responsive Testing
```
Mobile (320px):    2 columns
Tablet (768px):    3-4 columns
Desktop (1024px+): 5-6 columns
```

### Interaction Testing
- [ ] Tab switching smooth
- [ ] Grid stagger animation works
- [ ] Hover effects visible
- [ ] Share button functional
- [ ] Images lazy load

---

## 🚀 Implementation Sequence

### Day 1:
1. Refactor HomePage (3-4h)
2. Update AnimeCard (2h)
3. Add tabs + grid (1h)

### Day 2:
1. Animations (2h)
2. Responsive design (2h)
3. Mobile testing (1h)
4. Polish (1h)

### Day 3:
1. Visual testing
2. Performance optimization
3. Bug fixes
4. Prepare for deploy

---

## 📦 Files to Modify

### Primary:
```
src/pages/HomePage.tsx ← Main refactor
src/components/anime/AnimeCard.tsx ← Visual improvements
```

### Secondary:
```
src/pages/ListsPage.tsx ← Possibly similar pattern
src/pages/StatsPage.tsx ← Could benefit from new layout
```

---

## 🎯 Success Criteria

Phase 3 is complete when:
- ✅ HomePage displays grid layout
- ✅ Share button is prominent and working
- ✅ Responsive on mobile/tablet/desktop
- ✅ Animations smooth
- ✅ Build passes: 2138 modules, 0 errors
- ✅ No console warnings
- ✅ Images load properly
- ✅ Interactions feel responsive

---

## 💬 Questions Before Starting

1. **AnimeCard click behavior?**
   - Open detail page?
   - Context menu?
   - Just view?

2. **Stats display?**
   - Show in header?
   - Floating bar?
   - Separate component?

3. **Search functionality?**
   - Keep current search?
   - Integrate into HomePage?

4. **Add anime action?**
   - FAB button?
   - Menu item?
   - Separate page?

---

## 📚 Reference

- Figma/Design?: Use as reference
- Previous components: `src/components/anime/AnimeCard.tsx`
- Animations: Framer Motion docs
- Responsive: Tailwind responsive classes

---

**Ready to start Phase 3?** Let me know! 🚀

