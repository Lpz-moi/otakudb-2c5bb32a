# ✅ Checklist de Déploiement et QA

## Phase 1: Préparation (Avant le Déploiement)

- [ ] **Code Review**
  - [ ] Reviewer 1 a approuvé les changements SQL
  - [ ] Reviewer 2 a approuvé les changements TypeScript/React
  - [ ] Aucun commentaire critique ouvert

- [ ] **Documentation Complète**
  - [ ] `SECURITY_AUDIT_REPORT.md` - ✅ Généré
  - [ ] `SECURITY_TECHNICAL_GUIDE.md` - ✅ Généré
  - [ ] `SECURITY_CHANGES_DETAILED.md` - ✅ Généré
  - [ ] `SECURITY_FIXES_SUMMARY.md` - ✅ Généré

- [ ] **Tests Unitaires**
  - [ ] Tous les tests passent: `npm test`
  - [ ] Aucune régression détectée
  - [ ] Coverage > 80%

- [ ] **Build & Compilation**
  - [ ] `npm run build` - ✅ Succès
  - [ ] `supabase functions build` - ✅ Succès
  - [ ] Aucune erreur de compilation
  - [ ] Aucun warning critique

---

## Phase 2: Déploiement Staging

### A. Préparer l'Environnement Staging

```bash
# 1. Créer une branche de staging
git checkout -b deploy/security-fixes-staging

# 2. Vérifier les migrations
supabase db pull --staging

# 3. Tester les migrations localement
supabase db reset
supabase db push
```

- [ ] L'environnement staging est prêt
- [ ] Les backups de la DB sont faits
- [ ] Les logs de déploiement sont configurés

### B. Déployer les Migrations SQL

```bash
# Staging uniquement
supabase db push --staging
```

- [ ] Migration appliquée avec succès
- [ ] Aucune erreur SQL
- [ ] RLS policies vérifiées

**Vérifications SQL:**

```sql
-- Vérifier que session_logs n'a pas de SELECT policy
SELECT schemaname, tablename, policyname, permissive, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'session_logs';
-- EXPECTED: Seulement une policy INSERT, pas de SELECT

-- Vérifier les policies profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
-- EXPECTED: 5 policies claires (own profile, friends, update, insert, delete)
```

- [ ] Session logs policies vérifiées
- [ ] Profiles policies vérifiées
- [ ] Anime lists policies vérifiées

### C. Déployer les Edge Functions

```bash
# Staging
supabase functions deploy discord-auth --no-verify
```

- [ ] Edge function déployée
- [ ] Logs accessible dans Supabase console
- [ ] Pas d'erreurs de déploiement

**Test CSRF Protection:**

```bash
# 1. Sans state → doit échouer (403)
curl -X POST https://staging-xxx.supabase.co/functions/v1/discord-auth \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code",
    "redirect_uri": "http://localhost:3000",
    "state": ""
  }'
# EXPECTED: 403 "Missing state parameter - possible CSRF attack"

# 2. Avec state → doit réussir
curl -X POST https://staging-xxx.supabase.co/functions/v1/discord-auth \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code_valid",
    "redirect_uri": "http://localhost:3000",
    "state": "uuid-1234-5678-9999"
  }'
# EXPECTED: 200 OK (ou erreur Discord si code est invalide, mais pas 403)
```

- [ ] CSRF validation fonctionne
- [ ] Requests sans state sont rejetées
- [ ] Requests avec state sont traitées

### D. Déployer le Frontend

```bash
# Build
npm run build

# Deploy to staging
npm run deploy:staging
```

- [ ] Build succès sans erreurs
- [ ] Frontend déployé sur staging
- [ ] Pas de console errors en production

### E. Tests Fonctionnels Staging

#### Test 1: Recherche d'Amis (SQL Injection Prevention)

```javascript
// Test cases in browser console
const testCases = [
  // Normal cases
  { input: "Alice", shouldWork: true },
  { input: "café", shouldWork: true },
  { input: "san-francisco", shouldWork: true },
  
  // Edge cases
  { input: "ab", shouldWork: false }, // < 3 chars
  { input: "", shouldWork: false },
  { input: "   ", shouldWork: false },
  
  // Injection attempts
  { input: "'; DROP TABLE users; --", shouldWork: true },
  { input: "\" OR \"1\"=\"1", shouldWork: true },
  { input: "test%'; EXEC xp_cmdshell", shouldWork: true },
];

testCases.forEach(test => {
  console.log(`Testing: "${test.input}" (expect: ${test.shouldWork})`);
  // Manually test each search
});
```

- [ ] Recherches normales fonctionnent
- [ ] Accents français preservés
- [ ] Injections échouent silencieusement
- [ ] Requêtes < 3 chars rejetées

#### Test 2: Discord Authentication CSRF

```javascript
// Simuler attaque CSRF (devrait échouer)
1. Ouvrir application dans 2 onglets
2. Dans onglet 1: Initier Discord login
3. Dans onglet 2: Tenter d'intercepter le callback SANS state
4. EXPECTED: 403 Forbidden "Missing state parameter"

// Test normal (devrait réussir)
1. Cliquer "Se connecter avec Discord"
2. Approuver dans Discord
3. Redirection vers /auth?code=XXX&state=YYY
4. EXPECTED: Connexion réussie
```

- [ ] Attaques CSRF détectées et bloquées
- [ ] Flux normal fonctionne
- [ ] Session créée avec succès

#### Test 3: Profile Privacy (Discord Data)

```javascript
// Tester que discord_id ne revient pas du serveur
const profile = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', friend_id)
  .single();

console.log(profile);
// EXPECTED: discord_username et discord_avatar présents
// UNEXPECTED: discord_id doit être NULL ou absent
```

- [ ] Discord IDs cachés aux amis
- [ ] Discord usernames visibles (affichage)
- [ ] Discord avatars visibles (affichage)

#### Test 4: Session Logs Not Accessible

```javascript
// Tenter d'accéder à session_logs (devrait échouer)
const logs = await supabase
  .from('session_logs')
  .select('*')
  .limit(1);

console.log(logs);
// EXPECTED: error "relation does not exist" ou "permission denied"
// NEVER: Array of logs
```

- [ ] Session logs pas accessibles via client
- [ ] Pas de data leaking
- [ ] Error handling correct

### F. Validation de Sécurité Staging

```bash
# Exécuter le script de validation
bash validate_security_fixes.sh
```

- [ ] Tous les checks passent (12/12)
- [ ] Aucune check fail
- [ ] Rapport de validation sauvegardé

---

## Phase 3: Déploiement Production

### A. Sanity Checks Production

- [ ] Backups full DB créés
- [ ] Rollback plan documenté
- [ ] Maintenance window < 2 heures
- [ ] Équipe de support on-call

### B. Déployer en Production

**Ordre recommandé:**

1. **Étape 1:** Migrations SQL (0-downtime)
```bash
supabase db push --production
```

2. **Étape 2:** Edge Functions (0-downtime)
```bash
supabase functions deploy discord-auth --production
```

3. **Étape 3:** Frontend (déploiement classique)
```bash
npm run deploy:production
```

- [ ] Migrations appliquées
- [ ] Edge functions déployées
- [ ] Frontend déployé
- [ ] Monitoring actif

### C. Post-Deployment Verification

```bash
# Vérifier les logs
supabase functions logs discord-auth --limit 100

# Vérifier les metrics
# (dans Supabase dashboard)
- API response times
- Error rates
- Function invocations
```

- [ ] Pas d'erreurs massives dans les logs
- [ ] Performance stable
- [ ] Error rate < 0.1%

### D. User Communication

- [ ] Changelog publié
- [ ] Utilisateurs notifiés des changements de sécurité
- [ ] Support team entraîné sur les nouvelles restrictions

---

## Phase 4: Monitoring Post-Déploiement

### Première Semaine

- [ ] **Daily Checks (24h)**
  - [ ] Aucune erreur SQL anormale
  - [ ] CSRF protection fonctionne
  - [ ] Pas de requêtes rejetées pour de mauvaises raisons
  - [ ] Performance stable

- [ ] **Trois jours**
  - [ ] Vérifier les patterns de recherche (no injection attempts)
  - [ ] Vérifier les Discord auth flows (success rate normal)
  - [ ] User complaints = 0

- [ ] **Une semaine**
  - [ ] Rapport hebdomadaire généré
  - [ ] Aucune régression identifiée
  - [ ] Status = STABLE

### Monitoring Continu

```bash
# Setup alertes (exemple Datadog/New Relic)
alerts:
  - discord-auth function errors > 5 in 5min → alert
  - search endpoint ILIKE errors > 10 in 5min → alert
  - session_logs SELECT attempts → critical alert
  - 403 CSRF errors > 100 in 5min → investigate
```

- [ ] Alertes configurées
- [ ] On-call team notifié
- [ ] Escalation path défini

---

## Phase 5: Documentation Finale

- [ ] Runbook créé pour escalade d'incidents
- [ ] Troubleshooting guide publié
- [ ] Team training complété
- [ ] Documentation mise à jour (README, docs site)

---

## 🚨 Rollback Plan

**Si quelque chose ne va pas:**

### Rollback Immédiat (< 5 min)

```bash
# 1. Revert frontend (CDN/hosting)
git revert <commit-hash>
npm run deploy:production

# 2. Si besoin: revert les functions
supabase functions deploy discord-auth --production --older-version

# 3. SQL: Plus complexe, voir procédure en bas
```

### Rollback SQL (Si Critique)

```sql
-- SAUVEGARDER LES DONNÉES
CREATE TABLE session_logs_backup AS SELECT * FROM session_logs;

-- Restaurer les policies
CREATE POLICY "Users can view own session logs"
ON public.session_logs FOR SELECT
USING (auth.uid() = user_id);

-- Ajouter les policies redondantes (si absolument nécessaire)
CREATE POLICY "Require authentication"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Re-déployer après analyse root cause
```

- [ ] Rollback plan testé en staging
- [ ] Temps d'exécution estimé
- [ ] Communication plan si rollback

---

## ✅ Final Sign-Off

- [ ] Product Manager: Changements approuvés
- [ ] Security Lead: Audit passé
- [ ] Tech Lead: Code review complété
- [ ] QA Lead: Tests signoff
- [ ] DevOps: Déploiement validé
- [ ] Support: Formation complétée

**Date de Déploiement Prévue:** ___________

**Déployé Par:** _______________________

**Approval Sign-Off:** ___________________

---

## 📞 Support & Escalation

**Pendant le Déploiement:**
- On-Call: [TEAM NAME]
- Slack Channel: #security-deployment
- PagerDuty: [SERVICE NAME]

**Post-Déploiement Issues:**
- Create GitHub issue avec label `security-deployment`
- Notify: @security-team
- Severity: High (RLS/Auth issues)

---

**Checklist Version:** 1.0  
**Dernière Mise à Jour:** 2 février 2026
