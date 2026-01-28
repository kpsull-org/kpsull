---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - .context/plans/plan-tyler-backoffice.md
  - .context/attachments/image.png
  - .context/attachments/image-v1.png
  - README.md
workflowType: 'prd'
projectType: 'brownfield'
documentCounts:
  briefs: 0
  research: 0
  projectDocs: 2
  maquettes: 2
classification:
  projectType: saas_b2b_webapp
  domain: ecommerce_marketplace
  complexity: medium
  projectContext: brownfield
  signals:
    - multi-tenant (créateurs)
    - dashboard analytics
    - page builder
    - gestion produits/commandes
    - intégration CDN
    - intégration transporteurs
businessModel:
  type: saas_freemium_marketplace
  commission: 3%
  users:
    - clients (buyers)
    - creators (freemium + paying subscribers + sellers)
    - admins (platform operators)
  payments:
    b2c: Stripe Connect (client → créateur, commission 3%)
    b2b: Stripe Billing (créateur → plateforme, abonnement)
  subscriptionPlans:
    free:
      price: 0
      limits:
        products: 5
        sales: 10
    pro:
      price: TBD
      limits: unlimited
      features: [premium_templates, advanced_analytics, export_reports, priority_support]
    premium:
      price: TBD
      limits: unlimited
      features: [pro_features, ai_price_suggestion, ai_recommendations]
      status: post-mvp
accountSystem:
  type: unified
  roles:
    - CLIENT (default)
    - CREATOR (upgraded from CLIENT, requires SIRET)
    - ADMIN
  upgrade: CLIENT can upgrade to CREATOR
  creatorRequirements:
    - SIRET (verified via API INSEE)
    - Stripe Connect KYC
    - Subscription payment
escrowSystem:
  enabled: true
  validationDelay: 48h
  autoValidation: true
  commission: 3%
---

# Product Requirements Document - Kpsull Backoffice

**Author:** Eliott
**Date:** 2026-01-28

## Success Criteria

### User Success (Créateur)

| Critère | Mesure | Cible MVP |
|---------|--------|-----------|
| **Onboarding rapide** | Temps pour créer premier produit | < 15 min |
| **Page en ligne** | Temps pour publier sa page créateur | < 30 min |
| **Gestion commandes** | Temps moyen pour traiter une commande | < 2 min |
| **Satisfaction** | NPS créateurs | > 40 |
| **Moment Aha!** | Première commande reçue via la plateforme | Dans les 7 jours après inscription |

### Business Success (Plateforme)

| Critère | Mesure | Cible 3 mois | Cible 12 mois |
|---------|--------|--------------|---------------|
| **Créateurs actifs** | Créateurs avec ≥1 produit publié | 20 | 200 |
| **Taux de conversion** | Visiteurs → Abonnés payants | 5% | 10% |
| **Rétention** | Créateurs actifs après 3 mois | 60% | 75% |
| **MRR** | Revenu mensuel récurrent | 500€ | 5 000€ |
| **Commandes traitées** | Volume mensuel plateforme | 100 | 2 000 |

### Technical Success

| Critère | Mesure | Cible |
|---------|--------|-------|
| **Performance Dashboard** | Temps de chargement | < 2s |
| **Performance Page Créateur** | Temps de chargement | < 1.5s |
| **Disponibilité** | Uptime | 99.5% |
| **Sécurité** | Isolation données créateurs | 100% |
| **Images CDN** | Temps upload image | < 3s |
| **Scalabilité MVP** | Créateurs simultanés | 100+ |

### Measurable Outcomes

- Un créateur peut être opérationnel (produits + page) en moins d'1 heure
- Les admins ont une vue temps réel du CA et des abonnements
- Les commandes peuvent être expédiées avec tracking transporteur
- Chaque créateur a une page personnalisée unique et performante

## Product Scope

### MVP - Minimum Viable Product

| Module | Utilisateur | Priorité |
|--------|-------------|----------|
| Auth OAuth Google + JWT | Tous | 🔴 Critique |
| Dashboard Stats | Créateur | 🔴 Critique |
| CRUD Projets/Produits | Créateur | 🔴 Critique |
| Page Builder | Créateur | 🔴 Critique |
| Gestion Commandes | Créateur | 🔴 Critique |
| Gestion Clients | Créateur | 🟡 Important |
| Expédition/Transporteurs | Créateur | 🟡 Important |
| Profil | Créateur | 🟡 Important |
| Gestion Créateurs | Admin | 🔴 Critique |
| Gestion Abonnements | Admin | 🔴 Critique |
| Dashboard Plateforme | Admin | 🟡 Important |
| Panier/Checkout | Client | 🔴 Critique |
| Paiement Stripe Connect | Client | 🔴 Critique |
| Historique Commandes | Client | 🟡 Important |

### Growth Features (Post-MVP)

- Calendrier et gestion des tâches
- Notifications avancées (email, push)
- Analytics poussés et rapports exportables
- Multi-langue
- Intégrations tierces (marketplaces, réseaux sociaux)
- App mobile créateur
- **Suggestion de prix IA** (Groq API - gratuit)
- **Recommandations produits/créateurs** (embeddings + vector search)

### Vision (Future)

- Marketplace intégrée avec découverte de créateurs
- Système de recommandation IA personnalisé
- Automatisation marketing
- Programme d'affiliation
- API publique pour intégrations

## User Journeys

### Journey 1: Sophie, Créatrice de Mode - Onboarding et Première Vente

**Persona:** Sophie, 32 ans, créatrice de vêtements éthiques à Lyon. Vend sur Instagram et marchés locaux, perd 3h/jour en admin. Rêve d'une présence en ligne professionnelle.

**Situation actuelle:**
- Gère tout sur Excel et Instagram DMs
- Pas de visibilité sur son CA réel
- Frustration administrative

**Parcours:**

1. **Découverte** : Sophie découvre Kpsull via une recommandation. Elle clique sur "S'inscrire avec Google" - en 10 secondes, son compte est créé. Elle choisit "Je suis créateur".

2. **Onboarding Créateur** : Configuration Stripe Connect (compte bancaire), choix d'abonnement, premier paiement.

3. **Premier projet** : Elle crée "Collection Printemps 2026", ajoute 5 robes avec photos (upload CDN automatique), descriptions, prix.

4. **Page Builder** : Sophie choisit un template "Artisan", ajoute son histoire, photos d'atelier, crée un bento grid avec ses créations.

5. **Moment Aha!** : En 45 minutes, sa page est en ligne. Elle partage le lien sur Instagram.

6. **Première commande** : 2 jours plus tard, notification ! Elle ouvre le dashboard, voit la commande, clique "Préparer l'envoi", sélectionne Colissimo, imprime l'étiquette.

7. **Nouvelle réalité** : Dashboard chaque matin, 30 min/jour au lieu de 3h.

**Capacités révélées:** Auth OAuth, Choix type compte, Stripe Connect onboarding, Abonnement Stripe, CRUD Projets/Produits, Upload CDN, Page Builder, Dashboard analytics, Gestion commandes, Intégration transporteurs.

---

### Journey 2: Sophie en difficulté - Cas d'erreur

**Situation:** Erreur de prix (15€ au lieu de 150€), une cliente a commandé.

**Parcours:**
1. Notification commande avec montant suspect
2. Consultation produit, découverte de l'erreur
3. Correction du prix pour futures commandes
4. Accès infos client pour contacter et expliquer
5. Annulation de la commande
6. Leçon apprise

**Capacités révélées:** Modification produit post-publication, Détails commande avec infos client, Annulation commande, Historique modifications.

---

### Journey 3: Marc, Admin Plateforme - Gestion quotidienne

**Persona:** Marc, 28 ans, co-fondateur Kpsull. Vérifie la santé plateforme chaque matin.

**Parcours:**
1. **Connexion** au backoffice admin
2. **Dashboard plateforme** : 3 nouvelles inscriptions, 45 commandes hier, MRR 2 400€
3. **Nouveaux créateurs** : Notification "Lucas s'est inscrit". Marc consulte son profil.
4. **Contrôle contenu** : Une fois la page créée, Marc vérifie qu'il n'y a pas de contenu problématique
5. **Gestion abonnement** : Un créateur a un échec CB, Marc prolonge manuellement
6. **Rapport** : Export stats pour réunion équipe

**Capacités révélées:** Dashboard admin global, Liste créateurs avec filtres, Notification nouveaux créateurs, Consultation pages créateurs, Gestion abonnements (statut, prolongation), Désactivation compte si besoin, Export rapports.

---

### Journey 4: Emma, Cliente - Inscription et Achat

**Persona:** Emma, 25 ans, découvre la page de Sophie via Instagram.

**Parcours:**
1. **Découverte** : Clic lien Instagram → Page créateur Sophie
2. **Exploration** : Parcourt la page, lit l'histoire, explore les produits
3. **Coup de cœur** : Clique sur une robe, voit détails (tailles, prix)
4. **Ajout panier** : "Ajouter au panier" → "Créez un compte pour continuer"
5. **Inscription** : Google ou email, compte **Client** par défaut
6. **Checkout** : Valide panier, entre adresse livraison
7. **Paiement** : Formulaire Stripe intégré (100€ - 3% commission = 97€ vers Sophie)
8. **Confirmation** : Page succès + email récap
9. **Suivi** : Email avec tracking Colissimo à l'expédition

**Capacités révélées:** Page créateur publique, Catalogue produits, Panier persistant, Inscription client (Google/email), Checkout avec adresse, Paiement Stripe Connect (commission 3%), Emails transactionnels, Tracking expédition.

---

### Journey 5: Lucas, Client qui devient Créateur

**Persona:** Lucas, 29 ans, client depuis 3 mois, fait de la poterie artisanale.

**Parcours:**
1. **Décision** : Veut vendre ses créations
2. **Upgrade** : Dans profil, clique "Devenir Créateur"
3. **Onboarding** : Infos boutique, config Stripe Connect, choix abonnement
4. **Paiement abonnement** : Premier paiement Stripe Billing
5. **Activation** : Compte passe en Créateur, accès dashboard
6. **Notification admin** : Marc voit "Nouveau créateur : Lucas"
7. **Création boutique** : Premier projet, produits, page personnalisée

**Capacités révélées:** Upgrade Client → Créateur, Onboarding Stripe Connect, Abonnement Stripe Billing, Notification admin, Transition fluide entre rôles.

---

### Journey Requirements Summary

| Capacité | Créateur | Client | Admin |
|----------|----------|--------|-------|
| Inscription Google/Email | ✅ | ✅ | ✅ |
| Choix type compte (inscription) | ✅ | ✅ | |
| Upgrade Client → Créateur | ✅ | ✅ | |
| Dashboard Stats Créateur | ✅ | | |
| CRUD Projets/Produits | ✅ | | |
| Page Builder | ✅ | | |
| Gestion Commandes (reçues) | ✅ | | |
| Intégration Transporteurs | ✅ | | |
| Stripe Connect (recevoir paiements) | ✅ | | |
| Abonnement Stripe (payer plateforme) | ✅ | | |
| Parcourir pages créateurs | ✅ | ✅ | |
| Panier / Checkout | ✅ | ✅ | |
| Payer produits (Stripe 3% commission) | ✅ | ✅ | |
| Historique commandes (passées) | ✅ | ✅ | |
| Profil / Paramètres | ✅ | ✅ | ✅ |
| Dashboard Admin Plateforme | | | ✅ |
| Liste Créateurs + Contrôle | | | ✅ |
| Gestion Abonnements | | | ✅ |
| Désactivation comptes | | | ✅ |

### Payment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KPSULL PLATFORM                          │
│                  (Stripe Platform Account)                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────────┐                    ┌───────────────────┐
│  STRIPE CONNECT   │                    │ STRIPE BILLING    │
│  (Paiements B2C)  │                    │ (Abonnements B2B) │
└───────────────────┘                    └───────────────────┘
        │                                           │
        ▼                                           ▼
┌───────────────────┐                    ┌───────────────────┐
│ Client achète     │                    │ Créateur paie     │
│ produit créateur  │                    │ abonnement Kpsull  │
│                   │                    │                   │
│ 100€ produit      │                    │ XX€/mois          │
│ - 3€ commission   │                    │ → Kpsull           │
│ = 97€ → Créateur  │                    │                   │
└───────────────────┘                    └───────────────────┘
```

## Domain-Specific Requirements

### Conformité & Réglementaire

| Exigence | Description | MVP |
|----------|-------------|-----|
| **RGPD** | Protection données personnelles (clients EU) | ✅ Obligatoire |
| **CGV** | Conditions générales de vente claires | ✅ Obligatoire |
| **Droit de rétractation** | 14 jours pour ventes à distance + process retour | ✅ Obligatoire |
| **Vente internationale** | Pas de limitation géographique | ✅ Supporté |
| **SIRET obligatoire** | Vérification créateurs professionnels | ✅ Obligatoire |

### Vérification Créateur (KYC)

| Exigence | Description |
|----------|-------------|
| **SIRET** | Numéro SIRET requis et vérifié via API INSEE/Sirene |
| **Stripe KYC** | Vérification identité via Stripe Connect onboarding |
| **Marque propre** | Créateur vend sous sa propre marque uniquement |

### Restrictions Produits

| Interdit | Raison |
|----------|--------|
| **Contrefaçon** | Illégal - marques tierces interdites |
| **Revente/Dropshipping** | Créations propres uniquement |
| **Produits réglementés** | Armes, alcool, tabac, etc. |

### Système Escrow (Paiement Sécurisé)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUX DE PAIEMENT ESCROW                           │
└─────────────────────────────────────────────────────────────────────────────┘

    CLIENT                    STRIPE ESCROW                 CRÉATEUR
       │                           │                            │
       │  1. Paie 100€             │                            │
       │ ─────────────────────────>│  [Fonds bloqués]           │
       │                           │                            │
       │                           │  2. Commande expédiée      │
       │                           │<───────────────────────────│
       │                           │                            │
       │  3. Colis livré (API tracking)                         │
       │                           │                            │
       │  4. Délai 48h validation  │                            │
       │      (auto ou manuelle)   │                            │
       │                           │                            │
       │  VALIDATION OK:           │  5. Libération fonds       │
       │                           │     97€ → Créateur         │
       │                           │     3€  → Kpsull (Kpsull)   │
       │                           │                            │
       │  LITIGE/RETOUR:           │                            │
       │  → Client renvoie colis   │                            │
       │  → Créateur valide retour │                            │
       │  → Remboursement 100%     │                            │
       └───────────────────────────┴────────────────────────────┘
```

### États de Commande

| État | Description |
|------|-------------|
| `PAID` | Paiement reçu, fonds en escrow |
| `SHIPPED` | Expédié, tracking actif |
| `DELIVERED` | Livré (confirmé par API tracking) |
| `VALIDATION_PENDING` | Délai 48h en cours |
| `COMPLETED` | Validé, fonds libérés (97% créateur + 3% Kpsull) |
| `DISPUTE_OPENED` | Client conteste dans les 48h |
| `RETURN_SHIPPED` | Client a renvoyé le colis |
| `RETURN_RECEIVED` | Créateur confirme réception retour |
| `REFUNDED` | Client remboursé 100% |

### Intégrations Requises

| Système | Usage | MVP |
|---------|-------|-----|
| **Stripe Connect** | Paiements escrow + libération différée | ✅ |
| **Stripe Billing** | Abonnements créateurs | ✅ |
| **API INSEE/Sirene** | Vérification SIRET | ✅ |
| **Cloudinary** | CDN images | ✅ |
| **AfterShip/Shippo** | API tracking multi-transporteurs (webhooks) | ✅ |
| **SendGrid/Resend** | Emails transactionnels | ✅ |

### Flux Upgrade Client → Créateur

```
Client clique "Devenir Créateur"
            │
            ▼
┌───────────────────────────────┐
│   ÉTAPE 1: Informations Pro   │
│  • Nom marque/boutique        │
│  • Numéro SIRET *             │
│  • Adresse professionnelle    │
└───────────────────────────────┘
            │
            ▼
┌───────────────────────────────┐
│   ÉTAPE 2: Vérification SIRET │
│  → API INSEE/Sirene           │
│  → Vérifie existence + actif  │
└───────────────────────────────┘
            │
            ▼
┌───────────────────────────────┐
│   ÉTAPE 3: Stripe Connect     │
│  • KYC Stripe                 │
│  • Coordonnées bancaires      │
└───────────────────────────────┘
            │
            ▼
┌───────────────────────────────┐
│   ÉTAPE 4: Abonnement         │
│  • Premier paiement Stripe    │
└───────────────────────────────┘
            │
            ▼
      ✅ Compte Créateur Activé (Plan FREE)
      → Notification Admin
```

## SaaS B2B Specific Requirements

### Multi-Tenancy Model

| Aspect | Décision |
|--------|----------|
| **Modèle** | Single DB avec isolation par créateur |
| **Isolation** | Row-level security (creator_id sur chaque table) |
| **Données partagées** | Catégories, templates Page Builder |
| **Données isolées** | Produits, commandes, clients, pages, stats |

### RBAC Permission Matrix

| Permission | CLIENT | CREATOR (FREE) | CREATOR (PRO) | ADMIN |
|------------|--------|----------------|---------------|-------|
| Parcourir pages créateurs | ✅ | ✅ | ✅ | ✅ |
| Acheter produits | ✅ | ✅ | ✅ | ✅ |
| Historique commandes | ✅ | ✅ | ✅ | ✅ |
| Créer produits | ❌ | ✅ (max 5) | ✅ ∞ | ✅ |
| Page Builder | ❌ | ✅ (basic) | ✅ (premium) | ✅ |
| Dashboard stats | ❌ | ✅ | ✅ | ✅ |
| Gestion commandes reçues | ❌ | ✅ (max 10) | ✅ ∞ | ✅ |
| Analytics avancés | ❌ | ❌ | ✅ | ✅ |
| Export rapports | ❌ | ❌ | ✅ | ✅ |
| Dashboard plateforme | ❌ | ❌ | ❌ | ✅ |
| Gestion créateurs | ❌ | ❌ | ❌ | ✅ |
| Gestion abonnements | ❌ | ❌ | ❌ | ✅ |

### Subscription Plans

| Plan | Prix | Limites Produits | Limites Ventes | Features |
|------|------|------------------|----------------|----------|
| **FREE** | 0€ | 5 max | 10 max | Core features |
| **PRO** | TBD | Illimité | Illimité | Templates premium, Analytics, Export, Support prioritaire |
| **PREMIUM** | TBD | Illimité | Illimité | PRO + IA (post-MVP) |

### Upgrade Flow (FREE → PRO)

```
Créateur atteint limite (5 produits OU 10 ventes)
            │
            ▼
┌───────────────────────────────┐
│   POPUP UPGRADE               │
│                               │
│   "Vous avez atteint la       │
│   limite du plan FREE.        │
│   Passez à PRO pour           │
│   continuer à vendre !"       │
│                               │
│   [Voir les plans] [Plus tard]│
└───────────────────────────────┘
            │
            ▼ (si upgrade)
┌───────────────────────────────┐
│   PAGE PLANS                  │
│                               │
│   FREE (actuel) | PRO | PREMIUM│
│                               │
│   [Choisir PRO]               │
└───────────────────────────────┘
            │
            ▼
┌───────────────────────────────┐
│   CHECKOUT STRIPE BILLING     │
│                               │
│   Paiement abonnement PRO     │
└───────────────────────────────┘
            │
            ▼
      ✅ Plan PRO activé
      → Limites levées
```

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KPSULL ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │   FRONTEND   │     │   BACKEND    │     │   SERVICES   │ │
│  │   Next.js 15 │────▶│   NestJS 10  │────▶│   Externes   │ │
│  │   + shadcn   │     │   + Prisma   │     │              │ │
│  └──────────────┘     └──────────────┘     └──────────────┘ │
│         │                    │                    │         │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │    CDN       │     │  PostgreSQL  │     │   Stripe     │ │
│  │  Cloudinary  │     │   + Redis    │     │   INSEE      │ │
│  │              │     │   (cache)    │     │   AfterShip  │ │
│  └──────────────┘     └──────────────┘     └──────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Model Overview

| Entité | Relations | Notes |
|--------|-----------|-------|
| **User** | → Orders, → Creator? | Rôle: CLIENT/CREATOR/ADMIN |
| **Creator** | → User, → Products, → Projects, → Page, → Subscription | Extension de User avec SIRET |
| **Subscription** | → Creator | Plan FREE/PRO/PREMIUM, Stripe subscription_id |
| **Project** | → Creator, → Products | Conteneur/collection de produits |
| **Product** | → Project, → OrderItems, → Images | Article vendable |
| **Order** | → User (buyer), → Creator (seller), → Items | Statut escrow |
| **Page** | → Creator, → Sections | Page personnalisée créateur |
| **PageSection** | → Page | Bloc de la page (hero, about, bento, etc.) |

### Implementation Considerations

| Aspect | Approche |
|--------|----------|
| **Auth** | OAuth Google + JWT avec refresh tokens |
| **API** | REST (NestJS controllers + guards) |
| **Validation** | class-validator + Zod (frontend) |
| **Cache** | Redis pour sessions et rate limiting |
| **Files** | Cloudinary SDK (upload direct frontend) |
| **Jobs** | BullMQ pour tâches async (emails, webhooks tracking) |
| **Webhooks** | Stripe + AfterShip → NestJS webhook handlers |

## Functional Requirements

### Gestion des Comptes & Authentification

- **FR1:** Tout visiteur peut créer un compte via Google OAuth ou email/mot de passe
- **FR2:** Un visiteur peut choisir son type de compte (Client ou Créateur) lors de l'inscription
- **FR3:** Un utilisateur peut se connecter et se déconnecter de son compte
- **FR4:** Un Client peut upgrader son compte vers Créateur depuis son profil
- **FR5:** Un Créateur doit fournir et valider son numéro SIRET avant d'activer son compte
- **FR6:** Un Créateur doit compléter l'onboarding Stripe Connect pour recevoir des paiements
- **FR7:** Tout utilisateur peut modifier ses informations de profil
- **FR8:** Un Admin peut désactiver un compte utilisateur

### Gestion des Abonnements (Créateur)

- **FR9:** Un Créateur peut consulter son plan d'abonnement actuel et ses limites
- **FR10:** Un Créateur peut upgrader vers un plan supérieur (FREE → PRO)
- **FR11:** Un Créateur est notifié lorsqu'il atteint ses limites (5 produits ou 10 ventes)
- **FR12:** Un Créateur peut payer son abonnement via Stripe Billing
- **FR13:** Un Admin peut consulter les abonnements de tous les créateurs
- **FR14:** Un Admin peut modifier manuellement le statut d'un abonnement (prolongation, suspension)

### Gestion des Produits & Projets

- **FR15:** Un Créateur peut créer, modifier et supprimer des projets (collections)
- **FR16:** Un Créateur peut créer, modifier et supprimer des produits dans un projet
- **FR17:** Un Créateur peut uploader des images pour ses produits (stockage CDN)
- **FR18:** Un Créateur peut définir le prix, description, variantes (taille, couleur) d'un produit
- **FR19:** Un Créateur peut publier ou dépublier un produit
- **FR20:** Un Créateur FREE est limité à 5 produits publiés maximum

### Page Créateur (Page Builder)

- **FR21:** Un Créateur peut personnaliser sa page publique via le Page Builder
- **FR22:** Un Créateur peut choisir un template de base pour sa page
- **FR23:** Un Créateur peut ajouter, modifier, réorganiser et supprimer des sections (hero, about, bento, produits)
- **FR24:** Un Créateur peut uploader des images et éditer les textes de chaque section
- **FR25:** Un Créateur peut prévisualiser sa page avant publication
- **FR26:** Un Créateur peut publier sa page avec une URL unique

### Catalogue & Navigation Client

- **FR27:** Un visiteur peut consulter la page publique d'un créateur
- **FR28:** Un visiteur peut parcourir le catalogue de produits d'un créateur
- **FR29:** Un visiteur peut voir les détails d'un produit (images, description, prix, variantes)

### Panier & Checkout

- **FR30:** Un Client peut ajouter des produits au panier
- **FR31:** Un Client peut modifier les quantités ou supprimer des articles du panier
- **FR32:** Un Client peut saisir son adresse de livraison au checkout
- **FR33:** Un Client peut payer sa commande via Stripe (paiement escrow)
- **FR34:** Un Client reçoit une confirmation de commande par email

### Gestion des Commandes (Créateur)

- **FR35:** Un Créateur peut voir la liste de ses commandes reçues avec filtres (statut, date)
- **FR36:** Un Créateur peut consulter les détails d'une commande (produits, client, adresse)
- **FR37:** Un Créateur peut marquer une commande comme expédiée et saisir le numéro de suivi
- **FR38:** Un Créateur peut sélectionner un transporteur pour l'expédition
- **FR39:** Un Créateur peut annuler une commande (avec remboursement automatique)
- **FR40:** Un Créateur FREE est limité à 10 ventes maximum

### Système Escrow & Suivi Livraison

- **FR41:** La plateforme bloque les fonds en escrow jusqu'à validation de la livraison
- **FR42:** La plateforme suit automatiquement les colis via API tracking (AfterShip)
- **FR43:** La plateforme libère les fonds 48h après confirmation de livraison
- **FR44:** Un Client peut signaler un problème (litige) dans les 48h suivant la livraison
- **FR45:** Un Client peut initier un retour de commande
- **FR46:** La plateforme rembourse le Client après validation du retour par le Créateur
- **FR47:** La plateforme prélève 3% de commission sur chaque vente validée

### Gestion Clients (Créateur)

- **FR48:** Un Créateur peut consulter la liste de ses clients
- **FR49:** Un Créateur peut voir l'historique d'achat d'un client

### Dashboard & Analytics (Créateur)

- **FR50:** Un Créateur peut consulter son dashboard avec statistiques clés (CA, commandes, produits)
- **FR51:** Un Créateur peut voir l'évolution de ses ventes sur une période donnée
- **FR52:** Un Créateur PRO peut accéder à des analytics avancés
- **FR53:** Un Créateur PRO peut exporter ses rapports de ventes

### Administration Plateforme

- **FR54:** Un Admin peut accéder au dashboard plateforme (MRR, créateurs actifs, commandes)
- **FR55:** Un Admin peut voir la liste de tous les créateurs avec filtres
- **FR56:** Un Admin est notifié des nouveaux créateurs inscrits
- **FR57:** Un Admin peut consulter la page d'un créateur pour contrôle de contenu
- **FR58:** Un Admin peut exporter les statistiques plateforme

### Historique Client

- **FR59:** Un Client peut consulter l'historique de ses commandes passées
- **FR60:** Un Client peut suivre le statut et le tracking de ses commandes en cours

## Non-Functional Requirements

### Performance

| Critère | Cible | Mesure |
|---------|-------|--------|
| **Chargement Dashboard** | < 2s | Time to interactive |
| **Chargement Page Créateur** | < 1.5s | Largest Contentful Paint |
| **Upload image CDN** | < 3s | Temps total upload 5MB |
| **Recherche produits** | < 500ms | Temps de réponse API |
| **Checkout/Paiement** | < 3s | Temps validation Stripe |
| **Actions CRUD** | < 1s | Création/modification/suppression |

### Sécurité

| Exigence | Description |
|----------|-------------|
| **Chiffrement transit** | TLS 1.3 pour toutes les communications |
| **Chiffrement repos** | Données sensibles chiffrées en BDD (AES-256) |
| **Authentification** | JWT avec refresh tokens, expiration 15min/7j |
| **Autorisation** | RBAC avec vérification à chaque requête API |
| **Isolation multi-tenant** | Row-level security par creator_id |
| **Conformité RGPD** | Consentement explicite, droit à l'oubli, export données |
| **Conformité PCI-DSS** | Via Stripe (pas de stockage CB côté Kpsull) |
| **Protection XSS/CSRF** | Sanitization inputs, tokens CSRF |
| **Rate limiting** | 100 req/min par IP, 1000 req/min par user authentifié |
| **Audit trail** | Logs des actions sensibles (paiements, modifications) |

### Scalabilité

| Critère | MVP | 12 mois | Notes |
|---------|-----|---------|-------|
| **Créateurs actifs** | 100 | 500 | Avec données isolées |
| **Clients simultanés** | 500 | 5 000 | Pics checkout |
| **Produits totaux** | 5 000 | 50 000 | Index optimisés |
| **Commandes/jour** | 100 | 1 000 | Queue processing |
| **Images CDN** | 50 000 | 500 000 | Via Cloudinary |

**Stratégie scalabilité :**
- Horizontal scaling backend (containers stateless)
- Cache Redis pour sessions et données chaudes
- CDN pour assets statiques et images
- Queue async pour webhooks et emails

### Accessibilité

| Critère | Cible |
|---------|-------|
| **Standard** | WCAG 2.1 niveau AA |
| **Navigation clavier** | 100% des fonctionnalités accessibles |
| **Lecteurs d'écran** | Compatibilité ARIA complète |
| **Contraste** | Ratio minimum 4.5:1 |
| **Responsive** | Mobile-first, breakpoints 320px → 1920px |
| **Formulaires** | Labels explicites, messages d'erreur clairs |

### Intégration

| Service | SLA requis | Fallback |
|---------|------------|----------|
| **Stripe Connect** | 99.9% | Queue retry + notification admin |
| **Stripe Billing** | 99.9% | Queue retry + grace period abonnement |
| **API INSEE** | 95% | Cache SIRET validés + validation manuelle |
| **Cloudinary** | 99.9% | Images en file d'attente |
| **AfterShip** | 99% | Polling fallback si webhook échoue |
| **SendGrid/Resend** | 99% | Queue emails + retry 3x |

**Résilience :**
- Circuit breaker sur toutes les intégrations externes
- Retry avec backoff exponentiel
- Notifications admin si service dégradé

### Fiabilité

| Critère | Cible |
|---------|-------|
| **Uptime** | 99.5% (≈ 3.6h downtime/mois max) |
| **RPO** | 1 heure (perte données max) |
| **RTO** | 4 heures (temps restauration max) |
| **Backups** | Quotidiens, rétention 30 jours |
| **Monitoring** | Alertes < 5min sur erreurs critiques |
| **Logs** | Rétention 90 jours, centralisés |
