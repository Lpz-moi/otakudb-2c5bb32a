# ⚡ Quick Start - Tester les Corrections

## 🚀 En 3 Étapes

### 1. Démarrer l'App
```bash
cd /workspaces/otakudb-2c5bb32a
npm run dev
# Ouvrir: http://localhost:5173
```

### 2. Ouvrir DevTools
```
Appuyez sur: F12
Allez à: Console
```

### 3. Tester les Corrections

---

## 📋 Tests à Faire

### ✅ TEST 1: Menu Amis
**Durée:** 2 minutes

```
ÉTAPES:
1. Cliquez "Profil" en bas
2. Cliquez "Découvrir" (violet)
3. Cliquez "Découvrir" (tab du haut)
4. Tapez un pseudo dans le champ recherche
5. Cliquez "Ajouter" sur un utilisateur

ATTENDRE:
✅ Message toast "Demande envoyée ! ✅"
✅ Pas de toast d'erreur
✅ Console montre: "Sending friend request to: [id]"

SI ERREUR:
❌ Message: "Vous avez déjà une demande en attente"
→ Cliquez Découvrir → Utilisateur différent
```

---

### ✅ TEST 2: Menu Partager
**Durée:** 1 minute

```
ÉTAPES:
1. Cliquez "Profil" en bas
2. Cliquez "Partager" (orange)

ATTENDRE:
✅ Page se charge NORMALEMENT
✅ Vous voyez 4 cartes colorées
✅ Titres: En cours, Terminés, À voir, Favoris
✅ Pas de page noire!

SI ERREUR:
❌ Page noire
→ Console: Vérifiez "User loaded" et "Profile loaded"
→ Assurez-vous d'être connecté (vérifier Profil)
```

---

### ✅ TEST 3: Sauvegarde des Données
**Durée:** 5 minutes

```
ÉTAPES:
1. Cliquez "Découvrir" (barre bas/gauche)
2. Cherchez "Naruto" dans la barre recherche
3. Cliquez le "+" de Naruto → Cliquez "En cours"
4. Répétez avec 4 autres animes

VÉRIFICATION 1 - Console:
✅ Cherchez: "✅ Données persistées (5 animes)"
✅ Ou: "📊 Vérification: 5 animes sauvegardé(s)"

VÉRIFICATION 2 - Refresh:
1. Appuyez F5 (recharger la page)
2. Attendez le chargement

ATTENDRE:
✅ Les 5 animes REAPPPARAISSENT dans Découvrir/Listes
✅ Console montre: "✅ Restauration de 5 anime(s)"

VÉRIFICATION 3 - DevTools:
1. F12 → Onglet "Application"
2. À gauche: Storage → Local Storage
3. Cherchez "otakudb-anime-list"
4. Cliquez dessus

ATTENDRE:
✅ Vous voyez le contenu JSON avec vos 5 animes
✅ Copie-colle pour vérifier: devrait contenir "naruto"
```

---

## 🐛 Logs Console à Chercher

### ✅ Tous les logs que VOUS DEVEZ VOIR:
```javascript
// Démarrage
🔍 Vérification initiale de la persistance...
✅ Données persistées (5 animes) 2026-02-02T...
📊 Vérification: 5 animes sauvegardé(s)
✅ Restauration de 5 anime(s) depuis localStorage

// Ajout ami
Sending friend request to: [user-id]
✅ Demande envoyée ! ✅

// Erreurs (utiles pour debug)
Friendship error: [détails erreur]
Full error object: {...}
```

### ❌ Logs QUE VOUS NE DEVEZ PAS VOIR:
```javascript
❌ Impossible de sauvegarder les données
⚠️ Aucun anime sauvegardé
⚠️ localStorage inaccessible
Erreur lors de la restauration
```

---

## 🔧 Commandes Utiles (à taper dans Console)

### Vérifier la Sauvegarde
```javascript
// Copier-coller dans Console:
console.log(JSON.parse(localStorage.getItem('otakudb-anime-list')));
// Affiche tous vos animes en JSON
```

### Voir Combien d'Animes Sont Sauvegardés
```javascript
const saved = JSON.parse(localStorage.getItem('otakudb-anime-list') || '{}');
const count = Object.keys(saved.state?.items || {}).length;
console.log(`Animes sauvegardés: ${count}`);
```

### Effacer la Sauvegarde (pour tester fresh)
```javascript
localStorage.removeItem('otakudb-anime-list');
location.reload(); // Recharger
```

---

## 📊 Résumé des Tests

| Test | ✅ Réussi? | Notes |
|------|----------|-------|
| Menu Amis - Ajouter | [ ] | Message toast + console logs |
| Menu Amis - Erreur | [ ] | Message clair si erreur |
| Menu Partager - Charge | [ ] | 4 cartes + pas de noir |
| Menu Partager - Fallback | [ ] | Si pas connecté, bouton retour |
| Sauvegarde - Persist | [ ] | Console logs présents |
| Sauvegarde - Restore | [ ] | Après F5, données toujours là |
| Sauvegarde - DevTools | [ ] | localStorage contient JSON |

---

## 🚨 Si Quelque Chose ne Marche pas

### 1. Vérifiez la Console (F12 → Console)
- Y a-t-il des messages rouges?
- Cherchez "Error" ou "failed"

### 2. Vérifiez localStorage
- F12 → Application → Storage → Local Storage
- Cherchez `otakudb-anime-list`
- Est-ce présent? Contient-il du contenu?

### 3. Testez dans DevTools Console
```javascript
// Copier-coller ce code:
const test = localStorage.getItem('otakudb-anime-list');
console.log(test ? '✅ localStorage OK' : '❌ localStorage vide');
```

### 4. Videz le Cache
- Ctrl+Shift+Del (Windows/Linux) ou Cmd+Shift+Del (Mac)
- Sélectionnez "Cache" + "Cookies"
- Rafraîchissez la page

---

## 💡 Tips

- **Utilisez incognito (Ctrl+Shift+N)** pour tester sans cache
- **Ouvrez DevTools AVANT de tester** pour voir tous les logs
- **Cherchez les messages orange ⚠️ et rouges ❌** en priorité
- **Les messages ✅ verts** = tout va bien!

---

## 📞 Questions?

Si vous avez des doutes:
1. Vérifiez [DEBUG_GUIDE.md](DEBUG_GUIDE.md) pour plus de détails
2. Consultez [CORRECTIONS_SUMMARY.md](CORRECTIONS_SUMMARY.md) pour la techi

que
3. Cherchez le message d'erreur exact dans les logs

---

**Bonne chance! 🚀**
