# 🚀 OtakuDB - Guide de Configuration Initiale

## ✅ État Actuel

- ✅ Serveur Vite lancé sur **http://localhost:8081/**
- ✅ Variables d'environnement configurées (placeholders)
- ✅ CORS headers ajoutés pour le développement

## ⚙️ Configuration Nécessaire

### 1. Supabase (Obligatoire)

Pour que l'application fonctionne correctement, vous devez configurer Supabase :

**Fichier:** `.env.local`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_DISCORD_CLIENT_ID=your-discord-client-id
```

**Où trouver ces valeurs:**
1. Allez sur [supabase.com](https://supabase.com)
2. Créez ou ouvrez votre projet
3. Allez dans **Settings > API**
4. Copiez:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `Anon public key` → `VITE_SUPABASE_PUBLISHABLE_KEY`

**Discord OAuth (optionnel):**
1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Créez une application
3. Copiez le **Client ID** → `VITE_DISCORD_CLIENT_ID`

### 2. Redémarrer Après Configuration

Après avoir mis à jour `.env.local`, redémarrez le serveur :

```bash
# Arrêtez: Ctrl+C
# Relancez:
npm run dev
```

## 📝 Tâches à Faire

### Avant la Production

- [ ] Configurer Supabase URL et clés
- [ ] Configurer Discord OAuth
- [ ] Exécuter les tests: `npm test`
- [ ] Builder: `npm run build`
- [ ] Vérifier le rapport de sécurité: [README_SECURITY_AUDIT.md](README_SECURITY_AUDIT.md)

### En Développement

```bash
# Commandes disponibles:
npm run dev       # Serveur de développement
npm test          # Tests unitaires
npm run build     # Build production
npm run lint      # Vérifier le code
npm run preview   # Prévisualiser le build
```

## 🔒 Important: Sécurité

Votre application a été auditée pour **8 vulnérabilités critiques** qui ont toutes été corrigées.

**Ne distribuez JAMAIS:**
- `VITE_SUPABASE_PUBLISHABLE_KEY` directement (elle est publique mais contrôlée)
- Clés secrètes Discord/Supabase
- Variables sensibles

Consultez [README_SECURITY_AUDIT.md](README_SECURITY_AUDIT.md) pour plus de détails.

## 🐛 Dépannage

### "VITE_SUPABASE_URL is not configured"
→ Mettez à jour `.env.local` avec votre Supabase URL

### CORS Errors
→ Headers CORS ajoutés dans `vite.config.ts` pour le développement

### Port 8080 occupé
→ Le serveur va utiliser le port suivant (8081, 8082, etc.)

## 📚 Documentation

- [README_SECURITY_AUDIT.md](README_SECURITY_AUDIT.md) - Audit complet
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Avant déploiement
- [SECURITY_TECHNICAL_GUIDE.md](SECURITY_TECHNICAL_GUIDE.md) - Détails techniques

## ✨ Vous êtes Prêt !

L'application est maintenant en cours d'exécution et prête pour le développement.

**Prochaine étape:** Ouvrez votre navigateur et visitez http://localhost:8081/ 🎉

---

*Créé: 2 février 2026*
