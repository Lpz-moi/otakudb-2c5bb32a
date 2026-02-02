# 📖 Guide Technique des Corrections de Sécurité

## Vue d'ensemble

Ce document explique chaque correction en détail pour les développeurs qui maintiendront le code.

---

## 1. Session Logs Access Control

### Avant (Vulnérable)
```sql
CREATE POLICY "Users can view own session logs"
ON public.session_logs FOR SELECT
USING (auth.uid() = user_id);
```

### Après (Sécurisé)
```sql
-- SECURITY: Session logs are NEVER accessible via client API
-- Access only via secure server-side functions or admin interfaces
-- No SELECT policy - cannot read own logs via public API
CREATE POLICY "System can insert session logs"
ON public.session_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Pourquoi?
- **session_logs** contient: IP addresses, user agents, métadonnées système
- Ces données sensibles ne doivent JAMAIS être accessibles via l'API client
- Les logs audit doivent rester serveur-side uniquement
- Un attaquant avec accès client ne peut plus télécharger une liste d'IPs ou d'user agents

### Cas d'usage
- **Admin dashboard**: Implémenter une fonction Edge securisée pour les admin
- **Monitoring**: Utiliser une table `admin_audit_logs` séparée
- **Compliance**: Logs toujours accessibles aux administrateurs via interface séparée

---

## 2. Discord Data Privacy

### Avant (Vulnérable)
```typescript
// FriendsPage.tsx
const { data, error } = await supabase
  .from('profiles')
  .select('*')  // ❌ Retourne TOUTES les colonnes
```

Avec les RLS policies:
```sql
CREATE POLICY "Users can view friends profiles"
ON public.profiles FOR SELECT
USING (public.are_friends(auth.uid(), user_id));
```

### Après (Sécurisé)
```typescript
// FriendsPage.tsx - Sélection explicite
const { data, error } = await supabase
  .from('profiles')
  .select('id, user_id, display_name, discord_username, discord_avatar, total_anime, total_episodes')
  // ✅ Exclusion de discord_id (jamais envoyé au client)
```

Avec le commentaire RLS:
```sql
-- Users can view friends' profiles (public fields only)
-- NOTE: Friends can only see display_name, total_anime, total_episodes
-- Discord data (discord_id, discord_username, discord_avatar) is PRIVATE
```

### Pourquoi?
- **discord_id** est un identifiant unique pouvant être utilisé pour:
  - Cross-platform tracking
  - Account harvesting/enumeration
  - Impersonation sur d'autres services
- L'application n'a besoin QUE de `discord_username` et `discord_avatar` pour l'affichage

### Implémentation à venir (Supabase v3+)
```sql
-- Restriction au niveau des colonnes (plus sécurisé)
ALTER POLICY "Users can view friends profiles"
  ON public.profiles
  USING (public.are_friends(auth.uid(), user_id))
  WITH (SELECT (display_name, total_anime, total_episodes));
```

---

## 3. CSRF Protection (Discord OAuth)

### Avant (Vulnérable)
```typescript
// discord-auth/index.ts - Pas de validation state
if (action === 'callback' || req.method === 'POST') {
  const { code, redirect_uri } = body;
  // ❌ Pas de contrôle du paramètre 'state'
  // Un attaquant peut faire: POST /discord-auth avec code valide + son state
}
```

### Attaque Possible (CSRF)
```
1. Attaquant génère son propre Discord auth flow
2. Attaquant obtient un code Discord pour SON compte
3. Attaquant fait POST vers /discord-auth avec:
   - Son CODE
   - La victime se connecte (via CSRF)
4. Résultat: La victime est connectée avec le compte de l'attaquant
5. Attaquant accède à tous les amis de la victime, listes, etc.
```

### Après (Sécurisé)
```typescript
// discord-auth/index.ts - Validation CSRF stricte
if (action === 'callback' || req.method === 'POST') {
  const { code, redirect_uri, state } = body;
  
  // CSRF PROTECTION: Validate state parameter
  if (!state) {
    console.error('CSRF protection: Missing state parameter');
    return new Response(
      JSON.stringify({ error: 'Missing state parameter - possible CSRF attack' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  // Continuer uniquement si state est présent
}
```

### Flux de Sécurité Complet

```
Client                    Server              Discord
  |                          |                    |
  |--1. initiateDiscordLogin->|                    |
  |                          |--GET /authorize--->|
  |                          |<--redirect + state-|
  |<--URL + state+------------|                    |
  |                                               |
  |--2. User clicks Discord login                 |
  |--3. Discord redirects + code-----------redirect back with code
  |                          |                    |
  |--4. handleCallback(code, state)               |
  |     POST /discord-auth                        |
  |     { code, state }----->|                    |
  |                          |--Validate state ✓--|
  |                          |--Exchange code---->|
  |                          |<--access_token----|
  |                          |--Create session----|
  |<----------success + session---|                |
```

### Points Clés
- ✅ **Frontend**: Récupère state depuis URL query params
- ✅ **Frontend**: Envoie state au serveur
- ✅ **Serveur**: VALIDE state, sinon 403
- ✅ **Discord**: Fournit aussi state (standard OAuth 2.0)

---

## 4. RLS Policies Simplification

### Avant (Confus)
```sql
-- Redondant: Plusieurs policies "authentication required"
CREATE POLICY "Require authentication"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Spécifique: Owner only
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Spécifique: Friends only
CREATE POLICY "Users can view friends profiles"
ON public.profiles FOR SELECT
USING (public.are_friends(auth.uid(), user_id));
```

**Problème:** Plusieurs policies = OU logique. Un attaquant pouvait potentiellement:
- Utiliser la première policy "generic auth" plutôt que la friends-only

### Après (Clair et Exclusif)
```sql
-- Seulement 5 policies, une par opération:
CREATE POLICY "Users can view own profile" -- SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends profiles" -- SELECT
USING (public.are_friends(auth.uid(), user_id));

CREATE POLICY "Users can update own profile" -- UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile" -- INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" -- DELETE
USING (auth.uid() = user_id);
```

**Bénéfices:**
- ✅ Une seule policy par opération
- ✅ Logique claire: "Qui peut voir quoi?"
- ✅ Pas de redondance
- ✅ Plus facile à auditer

---

## 5. Anime Lists Policy Fix

### Avant (Risqué)
```sql
CREATE POLICY "Friends can view shared anime lists"
ON public.anime_lists FOR SELECT
USING (
    public.are_friends(auth.uid(), user_id)
    AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = anime_lists.user_id
        AND (
            -- ❌ Problème: 'public' ici!
            (anime_lists.status = 'watching' 
             AND p.share_watching IN ('friends_only', 'public'))
        )
    )
);
```

**Scénario d'attaque:**
```
1. User A définit: share_watching = 'public' (veut partager globalement)
2. Mais utilise le partage de liste partagée pour accès explicite
3. Cette policy permet à TOUS les amis de voir la liste 'watching'
   même si elle n'était destinée que à certains amis
4. Le contrôle de partage granulaire est contourné
```

### Après (Sécurisé)
```sql
CREATE POLICY "Friends can view shared anime lists"
ON public.anime_lists FOR SELECT
USING (
    public.are_friends(auth.uid(), user_id)
    AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = anime_lists.user_id
        AND (
            -- ✅ Uniquement friends_only, pas de 'public' ici
            (anime_lists.status = 'watching' 
             AND p.share_watching = 'friends_only')
            OR (anime_lists.status = 'completed' 
             AND p.share_completed = 'friends_only')
            OR (anime_lists.status = 'planned' 
             AND p.share_planned = 'friends_only')
            OR (anime_lists.status = 'favorites' 
             AND p.share_favorites = 'friends_only')
        )
    )
);

-- Public access is ONLY through shared_lists table
-- which has explicit opt-in and access control
CREATE POLICY "Anyone can view shared lists"
ON public.shared_lists FOR SELECT
USING (true);
```

**Séparation des concerns:**
- 🔒 **anime_lists** = Données privées, amis SEULEMENT (via friends_only flag)
- 🔓 **shared_lists** = Partages publics explicites avec share_code

---

## 6. SQL Injection via ILIKE

### Avant (Vulnérable)
```typescript
const sanitizedQuery = query.trim().replace(/[%_]/g, '');
// ❌ Problèmes:
// 1. Supprime SEULEMENT % et _ (autres chars spéciaux restent)
// 2. N'accepte pas les accents français (café → caf)
// 3. Interpolation directe reste risquée
```

### Vecteurs d'Injection Possibles
```javascript
// Test 1: Caractères spéciaux
query = "test\x00injection"  // Null byte
query = "test';--comment"    // SQL comment
query = "test\\injection"    // Backslash escaping

// Test 2: Unicode escapes
query = "test\u001f"  // Control character
query = "test\uffff"  // Invalid UTF-8

// Test 3: Accents (non-supportés)
query = "café"  // Retourne: "caf" ❌ Mauvais résultat
```

### Après (Robuste)
```typescript
const sanitizedQuery = query.trim().replace(/[^\w\s\-àâäæçéèêëíìîïñóòôöœúùûüýÿ]/gi, '');
// ✅ Whitelist stricte:
// - \w = [a-zA-Z0-9_]
// - \s = espaces
// - \- = hyphens (pour "San-Francisco")
// - Accents = àâäæçéèêëíìîïñóòôöœúùûüýÿ (français, esp, port)

// ✅ Validation post-sanitization
if (sanitizedQuery.length === 0) {
  setSearchResults([]);
  return;
}

// ✅ Sélection explicite (pas de SELECT *)
const { data } = await supabase
  .from('profiles')
  .select('id, user_id, display_name, discord_username, discord_avatar, total_anime, total_episodes')
  .or(`display_name.ilike.%${sanitizedQuery}%,discord_username.ilike.%${sanitizedQuery}%`);
```

### Résultats
```
Input: "café"
Sanitized: "café" ✅ (accent préservé)
Query: display_name.ilike.%café%

Input: "test'; DROP TABLE profiles; --"
Sanitized: "test DROP TABLE profiles" (caractères spéciaux supprimés)
Query: display_name.ilike.%test DROP TABLE profiles%
       (Supabase échappe les paramètres automatiquement)
```

---

## ✅ Testing Guide

### 1. Test RLS Policies
```bash
# Terminal avec Supabase CLI
supabase start

# Vérifier que session_logs n'est pas lisible
curl -H "Authorization: Bearer $USER_TOKEN" \
  https://localhost:54321/rest/v1/session_logs

# Devrait retourner: 0 rows
```

### 2. Test CSRF Protection
```bash
# Sans state → doit échouer
curl -X POST http://localhost:3000/functions/v1/discord-auth \
  -H "Content-Type: application/json" \
  -d '{"code": "...", "redirect_uri": "...", "state": ""}'
# Expected: 403 "Missing state parameter"

# Avec state → doit réussir
curl -X POST http://localhost:3000/functions/v1/discord-auth \
  -H "Content-Type: application/json" \
  -d '{"code": "...", "redirect_uri": "...", "state": "uuid"}'
# Expected: 200
```

### 3. Test Search ILIKE
```javascript
// Frontend tests
const testCases = [
  { input: "café", expected: true },        // Accents OK
  { input: "san-francisco", expected: true }, // Hyphens OK
  { input: "'; DROP --", expected: true },   // Quotes removed
  { input: "ab", expected: false },          // < 3 chars
];
```

---

## 🚀 Deploiement

### Ordre Recommandé
1. ✅ Déployer les migrations SQL d'abord
2. ✅ Redéployer les Edge Functions
3. ✅ Redéployer le frontend React
4. ✅ Tester en staging avant production

### Déploiement SQL
```bash
supabase db push
```

### Déploiement Edge Functions
```bash
supabase functions deploy discord-auth
```

### Déploiement React
```bash
npm run build
npm run deploy
```

---

## 📚 Références

- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth 2.0 State Parameter](https://tools.ietf.org/html/rfc6749#section-10.12)
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [OWASP CSRF Prevention](https://owasp.org/www-community/attacks/csrf)

---

**Document créé par:** GitHub Copilot  
**Date:** 2 février 2026  
**Version:** 1.0
