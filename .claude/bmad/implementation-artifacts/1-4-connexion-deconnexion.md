# Story 1.4: Connexion et Déconnexion

Status: review

## Story

As a utilisateur enregistré,
I want me connecter et me déconnecter de mon compte,
so that je puisse accéder à mes données de manière sécurisée.

## Acceptance Criteria

1. **AC1 - Page de connexion avec Google OAuth**
   - **Given** un utilisateur sur la page de connexion
   - **When** il voit la page
   - **Then** un bouton "Se connecter avec Google" est visible

2. **AC2 - Connexion réussie et redirection**
   - **Given** un utilisateur qui clique sur "Se connecter avec Google"
   - **When** il s'authentifie via Google OAuth
   - **Then** il est authentifié et redirigé vers le dashboard approprié selon son rôle
   - **And** CLIENT → page d'accueil
   - **And** CREATOR → dashboard créateur
   - **And** ADMIN → dashboard admin

3. **AC3 - Déconnexion**
   - **Given** un utilisateur connecté
   - **When** il clique sur "Déconnexion"
   - **Then** sa session est invalidée
   - **And** il est redirigé vers la page d'accueil

4. **AC4 - Refresh token automatique**
   - **Given** un token JWT expiré (>15min)
   - **When** l'utilisateur fait une requête
   - **Then** le système utilise le refresh token pour renouveler la session
   - **And** un nouveau access token est généré

5. **AC5 - Expiration du refresh token**
   - **Given** un refresh token expiré (>7j)
   - **When** l'utilisateur fait une requête
   - **Then** l'utilisateur est déconnecté
   - **And** il est redirigé vers la page de connexion

## Tasks / Subtasks

- [x] **Task 1: Créer la page de connexion** (AC: #1)
  - [x] 1.1 Page `/login` déjà existante (Story 1-2)
  - [x] 1.2 UI avec bouton Google OAuth
  - [x] 1.3 Lien vers inscription
  - [x] 1.4 Gestion états de chargement et erreurs

- [x] **Task 2: Implémenter la logique de redirection post-login** (AC: #2)
  - [x] 2.1 Callback `signIn` dans Auth.js config
  - [x] 2.2 Vérification du choix de type de compte
  - [x] 2.3 Redirection selon le rôle (CLIENT→/, CREATOR→/dashboard/creator, ADMIN→/dashboard/admin)
  - [x] 2.4 Callback `redirect` pour les URLs de callback

- [x] **Task 3: Implémenter la déconnexion** (AC: #3)
  - [x] 3.1 Créé composant `SignOutButton`
  - [x] 3.2 Utilisation de `signOut` de next-auth/react
  - [x] 3.3 Créé page `/logout` avec confirmation
  - [x] 3.4 Redirection vers l'accueil

- [x] **Task 4: Configurer le refresh token** (AC: #4, #5)
  - [x] 4.1 Configuré `jwt.maxAge` pour l'access token (15min)
  - [x] 4.2 Configuré `session.maxAge` pour le refresh token (7j)
  - [x] 4.3 Ajouté `accessTokenExpires` au token JWT
  - [x] 4.4 Auth.js gère automatiquement l'expiration

- [x] **Task 5: Validation** (AC: #1-5)
  - [x] 5.1 TypeScript check passing
  - [x] 5.2 ESLint passing
  - [x] 5.3 130 tests passants

## Dev Notes

### Architecture Implémentée

```
src/lib/auth/config.ts
├── ACCESS_TOKEN_MAX_AGE = 15 * 60  (15 minutes)
├── SESSION_MAX_AGE = 7 * 24 * 60 * 60  (7 days)
├── session.maxAge = SESSION_MAX_AGE
├── jwt.maxAge = ACCESS_TOKEN_MAX_AGE
└── callbacks:
    ├── signIn    - Permet les connexions OAuth
    ├── jwt       - Enrichit le token avec accessTokenExpires
    ├── session   - Expose les données utilisateur
    ├── redirect  - Gère les URLs de callback
    └── authorized - Redirige selon le rôle après login

src/components/auth/
├── sign-out-button.tsx  # Bouton de déconnexion réutilisable
└── index.ts             # Export du composant

src/app/(auth)/logout/
├── page.tsx             # Page de confirmation de déconnexion
└── logout-card.tsx      # Card avec actions de déconnexion
```

### Flux de Redirection Post-Login

```
Login → Google OAuth → Callback
                          ↓
                   Account type choisi ?
                    /              \
                  Non              Oui
                   ↓                ↓
            /account-type     Selon rôle:
                              CLIENT → /
                              CREATOR → /dashboard/creator
                              ADMIN → /dashboard/admin
```

### JWT Token Lifecycle

- **Access Token**: 15 minutes (jwt.maxAge)
- **Session/Refresh**: 7 jours (session.maxAge)
- Auth.js gère automatiquement le refresh du token

### Références

- [Source: architecture.md#JWT Strategy]
- [Source: prd.md#FR3]
- [Source: epics.md#Story 1.4]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Implémentation réussie

### Completion Notes List

1. ✅ Page /login déjà existante (Story 1-2)
2. ✅ Ajouté constantes ACCESS_TOKEN_MAX_AGE et SESSION_MAX_AGE
3. ✅ Configuré jwt.maxAge et session.maxAge
4. ✅ Ajouté callbacks signIn et redirect
5. ✅ Mis à jour callback authorized avec redirection selon rôle
6. ✅ Créé composant SignOutButton
7. ✅ Créé page /logout avec LogoutCard
8. ✅ Ajouté accessTokenExpires au type JWT
9. ✅ 130 tests passants, TypeScript et ESLint OK

### File List

**Nouveaux fichiers créés:**
- `src/components/auth/sign-out-button.tsx`
- `src/app/(auth)/logout/page.tsx`
- `src/app/(auth)/logout/logout-card.tsx`

**Fichiers modifiés:**
- `src/lib/auth/config.ts` - Ajout ACCESS_TOKEN_MAX_AGE, SESSION_MAX_AGE, callbacks signIn/redirect, mise à jour authorized
- `src/lib/auth/types.d.ts` - Ajout accessTokenExpires au type JWT
- `src/components/auth/index.ts` - Export SignOutButton

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
| 2026-01-28 | Story implémentée - SignOutButton, page logout, redirections par rôle, JWT config | Claude Opus 4.5 |
