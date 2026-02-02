# 🎯 VISION: Discord-First Anime Tracker

## Le Problème ❌
- App actuelle = offline-first + localStorage
- **VIOLÉE la règle: "0 stockage local"**
- Données perdent si cache effacé
- Pas de sync real-time
- Partage = lien complexe (pas social)

---

## La Solution ✅

### 1️⃣ **Supprime localStorage**
```
Avant: User → Cache Local → Maybe Sync
Après: User ← Real-time Sync ← Supabase
```

### 2️⃣ **Real-time Sync Supabase**
```
Change sur device A
→ Supabase broadcast
→ Tous devices reçoivent immédiatement
→ Zero lag
```

### 3️⃣ **Image Premium Share**
```
Click "Partager"
→ Canvas génère image 1200x630
→ Avatar + Username + 4 sections
→ Posters des animes en grille
→ OtakuDB watermark
→ PNG prêt pour Discord
```

### 4️⃣ **UI Discord-Inspired**
```
Dark mode
Large posters
4 tabs (En cours / Favoris / À voir / Terminés)
Share button PROMINENT
Animations fluides
```

---

## Architecture Finale

```
┌─────────────┐
│ Discord     │ (Unique auth)
│ OAuth       │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ Supabase                    │
│ - profiles                  │
│ - anime_lists (real-time)   │
│ - friends                   │
└──────┬──────────────────────┘
       │
       ├─→ Real-time Listener
       │
       ▼
┌─────────────────────────────┐
│ Zustand (MEMORY ONLY)       │
│ No persist, no localStorage │
│ Cleared on logout           │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ React UI                    │
│ - HomePage (Grid)           │
│ - ShareButton (Canvas)      │
│ - Real-time updates         │
└─────────────────────────────┘
```

---

## Implementation Roadmap

### Week 1:
- **Day 1:** Supprimer localStorage, créer real-time hooks
- **Day 2:** Image generator Canvas, ShareButton
- **Day 3:** UI refactor, design polish
- **Day 4:** Tests, optimisation, deploy

### Result:
✅ 100% Discord-first  
✅ 0% localStorage  
✅ Real-time sync  
✅ Premium UX  
✅ Social-ready  

---

## Why This Works

| Aspect | Before | After |
|--------|--------|-------|
| **Data Location** | Local cache | Supabase (server) |
| **Multi-device** | ❌ Lost on new device | ✅ Instant access |
| **Sync** | Manual/Optional | ✅ Real-time |
| **Sharing** | Complex URL | ✅ Beautiful image |
| **Social** | Not designed for it | ✅ Discord native |
| **Performance** | Depends on cache | ✅ Always fresh |

---

## Next Steps

1. **Confirm this approach** (5 min)
2. **Start Phase 1** (remove localStorage)
3. **Build real-time hooks** (2 hours)
4. **Test sync** (30 min)
5. **Move to Phase 2** (image generator)

Ready to start? 🚀

