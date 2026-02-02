# 🚀 Test Rapide - 5 min

## Checklist Tests 

### ✅ Test 1: Copier Lien (2 min)
```
1. Ouvrir SharePage (Menu Partager)
2. Cliquer le toggle "Public" sur une liste
3. Cliquer "Copier"
   ✅ Toast vert: "Lien copié ! 📋"
   ✅ Button change: "✅ Copié!"
4. Coller dans barre adresse (Ctrl+V)
   ✅ Page charge (pas erreur 404)
   ✅ Voir la liste d'animes

Console attendue:
✅ "✅ Copié: https://localhost:5173/share/userId/watching"
```

---

### ✅ Test 2: Télécharger Image (2 min)
```
1. SharePage, liste "Public"
2. Cliquer "Image"
   ✅ Button loader: ⟳ spinning
   ✅ Toast: "Image téléchargée ! 🎨"
3. Vérifier téléchargements
   ✅ Fichier: otakudb-watching-[timestamp].png
   ✅ Ouvrir image:
      - Fond dégradé (couleur selon status)
      - Emoji (▶️, ✅, ⏰, ⭐)
      - Titre en blanc (En cours / Complétés etc)
      - "X anime(s)" en gros
      - "Par [username]"
      - "otakudb.app" en bas

Console attendue:
✅ "📸 Génération image pour: watching"
✅ "✅ Image téléchargée"
```

---

### ✅ Test 3: Partage Discord (1.5 min)
```
1. SharePage, liste "Public"
2. Cliquer "Discord"
   Option A (Web Share API disponible):
   ✅ Dialog partage s'ouvre
   ✅ Pré-rempli avec titre + URL
   
   Option B (fallback):
   ✅ Discord ouvert en nouvel onglet
   ✅ Lien copié (Ctrl+V dans chat Discord)
   ✅ Message: "📺 Regardez ma liste "En cours" sur OtakuDB!\nhttps://..."

Toast: ✅ "Partagé sur Discord ! 🎉"

Console attendue:
✅ "✅ Partagé Discord"
```

---

### ✅ Test 4: Voir Liste Partagée (2 min)
```
1. Générer URL: https://localhost:5173/share/[userId]/watching
   (copier depuis Test 1)

2. Ouvrir dans nouvel onglet incognito
   ✅ Page charge
   
3. Voir:
   ✅ Avatar propriétaire + nom
   ✅ "▶️ En cours" titre
   ✅ "7" nombre animes (ou votre count)
   ✅ Grille animes avec images
   ✅ Bouton "Retour" en haut left
   
4. Tester fallbacks:
   a) Rendre liste "Privée"
   b) Recharger page partagée
   ✅ Erreur: "Cette liste n'est pas partagée"
   ✅ Bouton: "Retour à l'accueil"

Console attendue:
✅ "✅ Liste "watching" chargée: 7 anime(s)"
```

---

### ✅ Test 5: Ajouter Ami (1 min)
```
1. Aller FriendsPage (Menu Amis)
2. Cliquer "Découvrir"
3. Chercher un utilisateur (ex: votre username dans navigateur incognito)
4. Cliquer "Ajouter" sur quelqu'un
   ✅ Toast vert: "✅ Demande envoyée !"
   ✅ Button change à loader
   ✅ Demande apparaît dans "Demandes envoyées"

5. Test erreur:
   a) Cliquer "Ajouter" 2x sur même personne
   ✅ Erreur: "⚠️ Vous avez déjà une demande en attente"

Console attendue:
✅ "📤 Envoi demande d'ami à: [targetId]"
✅ "✅ Demande envoyée avec succès"

Erreur attendue (2e tentative):
❌ "❌ Erreur Supabase: {code: "23505", ...}"
⚠️ Toast: "Vous avez déjà une demande en attente"
```

---

## Command Quick Run

```bash
# 1. Ouvrir terminal VS Code
# 2. npm run dev
# 3. Ouvrir http://localhost:5173
# 4. F12 pour DevTools
# 5. Faire les 5 tests
```

---

## Résultats Attendus ✅

| Test | Avant | Après |
|------|-------|-------|
| Copier lien | ❌ Erreur 404 | ✅ URL valide |
| Télécharger image | ❌ Rien ne se passe | ✅ PNG téléchargé |
| Discord | ❌ URL invalide | ✅ Partage vrai |
| Voir partage | ❌ N/A | ✅ Page charge |
| Ajouter ami | ⚠️ Pas d'erreur | ✅ Messages clairs |

---

## Red Flags 🚩

```
❌ Erreur 404 sur lien copié
   → Problème: URL pas construite complètement
   → Fix: Vérifier fullUrl = window.location.origin + shareUrl

❌ Page noire sur partage
   → Problème: userId/listType pas chargé
   → Fix: Vérifier useParams

❌ Toast pas visible
   → Problème: Sonner pas importé
   → Fix: Vérifier import { toast } from 'sonner'

❌ Image pas téléchargée
   → Problème: Canvas ou blob fail
   → Fix: Vérifier DevTools pour l'erreur exacte

❌ Discord button lance Discord App mauvais
   → OK: C'est le fallback, copier+lien dans navigateur
```

---

## Debug Console 🔍

**Ouvrir DevTools (F12)** et chercher dans Console:

```javascript
// Pour Copier
console.log('✅ Copié: https://...')

// Pour Image
console.log('📸 Génération image pour: watching')
console.log('✅ Image téléchargée')

// Pour Discord
console.log('✅ Partagé Discord')

// Pour Partage visible
console.log('✅ Liste "watching" chargée: 7 anime(s)')

// Pour Ami
console.log('📤 Envoi demande d\'ami à: ...')
console.log('✅ Demande envoyée avec succès')
```

**Si tu vois ❌ rouge:** Il y a un bug → copie le message d'erreur et envoie!

---

## Commit Rapide

```bash
git status  # Voir fichiers modifiés
git add .
git commit -m "Fix: Copier lien, télécharger image, partage Discord, amis"
git push
```

---

✅ **Tous les tests passen = SUCCÈS!**
