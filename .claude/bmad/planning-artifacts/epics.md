---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - .claude/bmad/planning-artifacts/prd.md
  - .claude/bmad/planning-artifacts/architecture.md
workflowType: 'epics'
project_name: 'Kpsull'
user_name: 'Eliott'
date: '2026-01-28'
---

# Kpsull - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Kpsull, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

#### Gestion des Comptes & Authentification

- **FR1:** Tout visiteur peut créer un compte via Google OAuth ou email/mot de passe
- **FR2:** Un visiteur peut choisir son type de compte (Client ou Créateur) lors de l'inscription
- **FR3:** Un utilisateur peut se connecter et se déconnecter de son compte
- **FR4:** Un Client peut upgrader son compte vers Créateur depuis son profil
- **FR5:** Un Créateur doit fournir et valider son numéro SIRET avant d'activer son compte
- **FR6:** Un Créateur doit compléter l'onboarding Stripe Connect pour recevoir des paiements
- **FR7:** Tout utilisateur peut modifier ses informations de profil
- **FR8:** Un Admin peut désactiver un compte utilisateur

#### Gestion des Abonnements (Créateur)

- **FR9:** Un Créateur peut consulter son plan d'abonnement actuel et ses limites
- **FR10:** Un Créateur peut upgrader vers un plan supérieur (FREE → PRO)
- **FR11:** Un Créateur est notifié lorsqu'il atteint ses limites (5 produits ou 10 ventes)
- **FR12:** Un Créateur peut payer son abonnement via Stripe Billing
- **FR13:** Un Admin peut consulter les abonnements de tous les créateurs
- **FR14:** Un Admin peut modifier manuellement le statut d'un abonnement (prolongation, suspension)

#### Gestion des Produits & Projets

- **FR15:** Un Créateur peut créer, modifier et supprimer des projets (collections)
- **FR16:** Un Créateur peut créer, modifier et supprimer des produits dans un projet
- **FR17:** Un Créateur peut uploader des images pour ses produits (stockage CDN)
- **FR18:** Un Créateur peut définir le prix, description, variantes (taille, couleur) d'un produit
- **FR19:** Un Créateur peut publier ou dépublier un produit
- **FR20:** Un Créateur FREE est limité à 5 produits publiés maximum

#### Page Créateur (Page Builder)

- **FR21:** Un Créateur peut personnaliser sa page publique via le Page Builder
- **FR22:** Un Créateur peut choisir un template de base pour sa page
- **FR23:** Un Créateur peut ajouter, modifier, réorganiser et supprimer des sections (hero, about, bento, produits)
- **FR24:** Un Créateur peut uploader des images et éditer les textes de chaque section
- **FR25:** Un Créateur peut prévisualiser sa page avant publication
- **FR26:** Un Créateur peut publier sa page avec une URL unique

#### Catalogue & Navigation Client

- **FR27:** Un visiteur peut consulter la page publique d'un créateur
- **FR28:** Un visiteur peut parcourir le catalogue de produits d'un créateur
- **FR29:** Un visiteur peut voir les détails d'un produit (images, description, prix, variantes)

#### Panier & Checkout

- **FR30:** Un Client peut ajouter des produits au panier
- **FR31:** Un Client peut modifier les quantités ou supprimer des articles du panier
- **FR32:** Un Client peut saisir son adresse de livraison au checkout
- **FR33:** Un Client peut payer sa commande via Stripe (paiement escrow)
- **FR34:** Un Client reçoit une confirmation de commande par email

#### Gestion des Commandes (Créateur)

- **FR35:** Un Créateur peut voir la liste de ses commandes reçues avec filtres (statut, date)
- **FR36:** Un Créateur peut consulter les détails d'une commande (produits, client, adresse)
- **FR37:** Un Créateur peut marquer une commande comme expédiée et saisir le numéro de suivi
- **FR38:** Un Créateur peut sélectionner un transporteur pour l'expédition
- **FR39:** Un Créateur peut annuler une commande (avec remboursement automatique)
- **FR40:** Un Créateur FREE est limité à 10 ventes maximum

#### Système Escrow & Suivi Livraison

- **FR41:** La plateforme bloque les fonds en escrow jusqu'à validation de la livraison
- **FR42:** La plateforme suit automatiquement les colis via API tracking (AfterShip)
- **FR43:** La plateforme libère les fonds 48h après confirmation de livraison
- **FR44:** Un Client peut signaler un problème (litige) dans les 48h suivant la livraison
- **FR45:** Un Client peut initier un retour de commande
- **FR46:** La plateforme rembourse le Client après validation du retour par le Créateur
- **FR47:** La plateforme prélève 3% de commission sur chaque vente validée

#### Gestion Clients (Créateur)

- **FR48:** Un Créateur peut consulter la liste de ses clients
- **FR49:** Un Créateur peut voir l'historique d'achat d'un client

#### Dashboard & Analytics (Créateur)

- **FR50:** Un Créateur peut consulter son dashboard avec statistiques clés (CA, commandes, produits)
- **FR51:** Un Créateur peut voir l'évolution de ses ventes sur une période donnée
- **FR52:** Un Créateur PRO peut accéder à des analytics avancés
- **FR53:** Un Créateur PRO peut exporter ses rapports de ventes

#### Administration Plateforme

- **FR54:** Un Admin peut accéder au dashboard plateforme (MRR, créateurs actifs, commandes)
- **FR55:** Un Admin peut voir la liste de tous les créateurs avec filtres
- **FR56:** Un Admin est notifié des nouveaux créateurs inscrits
- **FR57:** Un Admin peut consulter la page d'un créateur pour contrôle de contenu
- **FR58:** Un Admin peut exporter les statistiques plateforme

#### Historique Client

- **FR59:** Un Client peut consulter l'historique de ses commandes passées
- **FR60:** Un Client peut suivre le statut et le tracking de ses commandes en cours

### NonFunctional Requirements

#### Performance

- **NFR-PERF-1:** Chargement Dashboard < 2s (Time to interactive)
- **NFR-PERF-2:** Chargement Page Créateur < 1.5s (Largest Contentful Paint)
- **NFR-PERF-3:** Upload image CDN < 3s (temps total upload 5MB)
- **NFR-PERF-4:** Recherche produits < 500ms (temps de réponse API)
- **NFR-PERF-5:** Checkout/Paiement < 3s (temps validation Stripe)
- **NFR-PERF-6:** Actions CRUD < 1s (création/modification/suppression)

#### Sécurité

- **NFR-SEC-1:** Chiffrement transit TLS 1.3 pour toutes les communications
- **NFR-SEC-2:** Chiffrement repos données sensibles (AES-256)
- **NFR-SEC-3:** JWT avec refresh tokens, expiration 15min/7j
- **NFR-SEC-4:** RBAC avec vérification à chaque requête API
- **NFR-SEC-5:** Isolation multi-tenant row-level security par creator_id
- **NFR-SEC-6:** Conformité RGPD (consentement, droit à l'oubli, export)
- **NFR-SEC-7:** Conformité PCI-DSS via Stripe (pas de stockage CB)
- **NFR-SEC-8:** Protection XSS/CSRF (sanitization, tokens)
- **NFR-SEC-9:** Rate limiting 100 req/min IP, 1000 req/min user
- **NFR-SEC-10:** Audit trail des actions sensibles

#### Scalabilité

- **NFR-SCALE-1:** 100 créateurs actifs MVP, 500 à 12 mois
- **NFR-SCALE-2:** 500 clients simultanés MVP, 5000 à 12 mois
- **NFR-SCALE-3:** 5000 produits MVP, 50000 à 12 mois
- **NFR-SCALE-4:** 100 commandes/jour MVP, 1000 à 12 mois
- **NFR-SCALE-5:** Horizontal scaling backend (containers stateless)
- **NFR-SCALE-6:** Cache Redis pour sessions et données chaudes
- **NFR-SCALE-7:** CDN pour assets statiques et images

#### Accessibilité

- **NFR-A11Y-1:** WCAG 2.1 niveau AA
- **NFR-A11Y-2:** Navigation clavier 100% fonctionnalités
- **NFR-A11Y-3:** Compatibilité lecteurs d'écran ARIA
- **NFR-A11Y-4:** Contraste ratio minimum 4.5:1
- **NFR-A11Y-5:** Responsive mobile-first 320px → 1920px
- **NFR-A11Y-6:** Labels explicites et messages d'erreur clairs

#### Intégration

- **NFR-INT-1:** Stripe Connect SLA 99.9%, retry + notification admin
- **NFR-INT-2:** Stripe Billing SLA 99.9%, grace period abonnement
- **NFR-INT-3:** API INSEE SLA 95%, cache SIRET + validation manuelle
- **NFR-INT-4:** Cloudinary SLA 99.9%, queue images
- **NFR-INT-5:** AfterShip SLA 99%, polling fallback webhooks
- **NFR-INT-6:** Resend SLA 99%, queue + retry 3x
- **NFR-INT-7:** Circuit breaker sur toutes intégrations externes

#### Fiabilité

- **NFR-REL-1:** Uptime 99.5% (≈ 3.6h downtime/mois max)
- **NFR-REL-2:** RPO 1 heure (perte données max)
- **NFR-REL-3:** RTO 4 heures (temps restauration max)
- **NFR-REL-4:** Backups quotidiens, rétention 30 jours
- **NFR-REL-5:** Alertes monitoring < 5min sur erreurs critiques
- **NFR-REL-6:** Logs rétention 90 jours, centralisés

### Additional Requirements

#### Architecture & Infrastructure (from architecture.md)

- **ARCH-1:** Next.js 15 full-stack avec App Router, Server Actions
- **ARCH-2:** Architecture Hexagonale (Domain/Application/Infrastructure)
- **ARCH-3:** Shared Kernel avec Entity, ValueObject, Result pattern
- **ARCH-4:** DI Container pour injection dépendances
- **ARCH-5:** Multi-tenancy Row-Level Security par creatorId
- **ARCH-6:** Auth.js v5 + Google OAuth + JWT sessions
- **ARCH-7:** Prisma ORM avec 20+ modèles

#### Intégrations Externes

- **INT-1:** Stripe Connect pour paiements escrow + commission 3%
- **INT-2:** Stripe Billing pour abonnements créateurs
- **INT-3:** Resend pour emails transactionnels
- **INT-4:** Cloudinary pour CDN images avec transformations
- **INT-5:** AfterShip pour tracking multi-transporteurs
- **INT-6:** API INSEE/Sirene pour vérification SIRET

#### Testing Strategy

- **TEST-1:** TDD avec Vitest pour tests unitaires domaine
- **TEST-2:** Tests intégration API routes + repositories
- **TEST-3:** Tests E2E Playwright pour parcours critiques
- **TEST-4:** Coverage minimum 80% sur nouveau code

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Inscription Google/email |
| FR2 | Epic 1 | Choix type compte |
| FR3 | Epic 1 | Connexion/déconnexion |
| FR4 | Epic 2 | Upgrade Client → Créateur |
| FR5 | Epic 2 | Validation SIRET |
| FR6 | Epic 2 | Onboarding Stripe Connect |
| FR7 | Epic 1 | Modification profil |
| FR8 | Epic 11 | Désactivation compte (Admin) |
| FR9 | Epic 3 | Consultation plan |
| FR10 | Epic 3 | Upgrade FREE → PRO |
| FR11 | Epic 3 | Notification limites |
| FR12 | Epic 3 | Paiement Stripe Billing |
| FR13 | Epic 3 | Consultation abonnements (Admin) |
| FR14 | Epic 3 | Modification abonnement (Admin) |
| FR15 | Epic 4 | CRUD projets |
| FR16 | Epic 4 | CRUD produits |
| FR17 | Epic 4 | Upload images CDN |
| FR18 | Epic 4 | Prix, description, variantes |
| FR19 | Epic 4 | Publier/dépublier produit |
| FR20 | Epic 4 | Limite 5 produits FREE |
| FR21 | Epic 5 | Personnalisation page |
| FR22 | Epic 5 | Choix template |
| FR23 | Epic 5 | Gestion sections |
| FR24 | Epic 5 | Upload images/textes |
| FR25 | Epic 5 | Preview page |
| FR26 | Epic 5 | Publication URL unique |
| FR27 | Epic 6 | Consultation page créateur |
| FR28 | Epic 6 | Parcourir catalogue |
| FR29 | Epic 6 | Détails produit |
| FR30 | Epic 7 | Ajout panier |
| FR31 | Epic 7 | Modification panier |
| FR32 | Epic 7 | Saisie adresse |
| FR33 | Epic 7 | Paiement Stripe escrow |
| FR34 | Epic 7 | Email confirmation |
| FR35 | Epic 8 | Liste commandes |
| FR36 | Epic 8 | Détails commande |
| FR37 | Epic 8 | Expédition + tracking |
| FR38 | Epic 8 | Sélection transporteur |
| FR39 | Epic 8 | Annulation + remboursement |
| FR40 | Epic 8 | Limite 10 ventes FREE |
| FR41 | Epic 7 | Blocage fonds escrow |
| FR42 | Epic 9 | Suivi colis API |
| FR43 | Epic 9 | Libération fonds 48h |
| FR44 | Epic 9 | Signalement litige |
| FR45 | Epic 9 | Initiation retour |
| FR46 | Epic 9 | Remboursement retour |
| FR47 | Epic 7 | Commission 3% |
| FR48 | Epic 10 | Liste clients |
| FR49 | Epic 10 | Historique achat client |
| FR50 | Epic 10 | Dashboard stats |
| FR51 | Epic 10 | Évolution ventes |
| FR52 | Epic 10 | Analytics avancés PRO |
| FR53 | Epic 10 | Export rapports PRO |
| FR54 | Epic 11 | Dashboard admin |
| FR55 | Epic 11 | Liste créateurs |
| FR56 | Epic 11 | Notification nouveaux créateurs |
| FR57 | Epic 11 | Contrôle contenu |
| FR58 | Epic 11 | Export stats plateforme |
| FR59 | Epic 12 | Historique commandes client |
| FR60 | Epic 12 | Suivi tracking client |

## Epic List

### Epic 1: Fondations & Authentification
Les utilisateurs peuvent créer un compte, se connecter et gérer leur profil.
**FRs couverts:** FR1, FR2, FR3, FR7
**Valeur utilisateur:** Accès à la plateforme avec identité sécurisée
**Notes:** Inclut setup Next.js 15, architecture hexagonale, Auth.js, Prisma base

### Epic 2: Onboarding Créateur
Un Client peut upgrader vers Créateur avec vérification SIRET et configuration Stripe Connect.
**FRs couverts:** FR4, FR5, FR6
**Valeur utilisateur:** Un utilisateur peut devenir vendeur professionnel vérifié
**Notes:** API INSEE, Stripe Connect onboarding, transition rôle CLIENT → CREATOR

### Epic 3: Gestion des Abonnements
Les créateurs peuvent gérer leur abonnement et les admins peuvent administrer les plans.
**FRs couverts:** FR9, FR10, FR11, FR12, FR13, FR14
**Valeur utilisateur:** Créateurs contrôlent leur plan, admins gèrent les abonnements
**Notes:** Stripe Billing, limites FREE/PRO, notifications

### Epic 4: Catalogue Produits
Les créateurs peuvent gérer leurs projets et produits avec images.
**FRs couverts:** FR15, FR16, FR17, FR18, FR19, FR20
**Valeur utilisateur:** Créateurs peuvent mettre en ligne leur catalogue complet
**Notes:** CRUD projets/produits, Cloudinary upload, variantes, limite FREE

### Epic 5: Page Builder
Les créateurs peuvent personnaliser et publier leur page vitrine.
**FRs couverts:** FR21, FR22, FR23, FR24, FR25, FR26
**Valeur utilisateur:** Créateurs ont une présence en ligne professionnelle
**Notes:** Templates, sections drag-and-drop, preview, URL unique

### Epic 6: Vitrine Publique & Catalogue
Les visiteurs peuvent découvrir les créateurs et parcourir leurs produits.
**FRs couverts:** FR27, FR28, FR29
**Valeur utilisateur:** Les clients peuvent découvrir et explorer les créations
**Notes:** Pages publiques, catalogue, détails produits, SEO

### Epic 7: Panier & Checkout
Les clients peuvent acheter des produits avec paiement sécurisé escrow.
**FRs couverts:** FR30, FR31, FR32, FR33, FR34, FR41, FR47
**Valeur utilisateur:** Les clients peuvent acheter en toute sécurité
**Notes:** Panier, checkout, Stripe Connect escrow, commission 3%, email confirmation

### Epic 8: Gestion Commandes Créateur
Les créateurs peuvent gérer leurs commandes et expéditions.
**FRs couverts:** FR35, FR36, FR37, FR38, FR39, FR40
**Valeur utilisateur:** Créateurs peuvent traiter et expédier leurs commandes
**Notes:** Liste commandes, détails, expédition, transporteurs, limite ventes FREE

### Epic 9: Suivi Livraison & Escrow
Le système gère automatiquement le tracking et la libération des fonds.
**FRs couverts:** FR42, FR43, FR44, FR45, FR46
**Valeur utilisateur:** Transactions sécurisées avec protection acheteur/vendeur
**Notes:** AfterShip webhooks, validation 48h, litiges, retours, remboursements

### Epic 10: Dashboard Créateur & Analytics
Les créateurs peuvent suivre leurs performances et statistiques.
**FRs couverts:** FR48, FR49, FR50, FR51, FR52, FR53
**Valeur utilisateur:** Créateurs ont une vision claire de leur activité
**Notes:** Dashboard stats, liste clients, historique, analytics PRO, exports

### Epic 11: Administration Plateforme
Les admins peuvent gérer la plateforme et les créateurs.
**FRs couverts:** FR8, FR54, FR55, FR56, FR57, FR58
**Valeur utilisateur:** Admins contrôlent et modèrent la plateforme
**Notes:** Dashboard admin, liste créateurs, notifications, contrôle contenu, exports

### Epic 12: Espace Client
Les clients peuvent suivre leurs commandes et leur historique.
**FRs couverts:** FR59, FR60
**Valeur utilisateur:** Clients ont une visibilité sur leurs achats
**Notes:** Historique commandes, tracking, statuts

---

## Epic 1: Fondations & Authentification

Les utilisateurs peuvent créer un compte, se connecter et gérer leur profil.

### Story 1.1: Setup Projet Next.js 15 avec Architecture Hexagonale

As a développeur,
I want un projet Next.js 15 configuré avec l'architecture hexagonale,
So that je puisse développer les fonctionnalités avec une base solide et testable.

**Acceptance Criteria:**

**Given** un nouveau projet Next.js 15
**When** je configure le projet
**Then** le projet est créé avec App Router, TailwindCSS, et shadcn/ui
**And** la structure de dossiers hexagonale est en place (modules/, shared/, lib/)
**And** Prisma est configuré avec le schéma de base (User, Account, Session, VerificationToken)
**And** Vitest est configuré pour les tests unitaires
**And** les classes de base Entity, ValueObject, Result sont implémentées dans shared/domain/

---

### Story 1.2: Inscription Google OAuth

As a visiteur,
I want créer un compte avec mon compte Google,
So that je puisse accéder à la plateforme rapidement et en toute sécurité.

**Acceptance Criteria:**

**Given** un visiteur non authentifié sur la page d'inscription
**When** il clique sur "S'inscrire avec Google"
**Then** il est redirigé vers Google OAuth consent screen
**And** après authentification, un compte User est créé avec role CLIENT par défaut
**And** il est redirigé vers la page de choix de type de compte
**And** sa session JWT est créée (15min access, 7j refresh)

**Given** un utilisateur existant avec ce compte Google
**When** il tente de s'inscrire
**Then** il est connecté à son compte existant

---

### Story 1.3: Choix du Type de Compte à l'Inscription

As a nouvel utilisateur,
I want choisir si je suis Client ou Créateur lors de l'inscription,
So that je puisse accéder aux fonctionnalités adaptées à mon profil.

**Acceptance Criteria:**

**Given** un utilisateur venant de s'inscrire
**When** il arrive sur la page de choix de type de compte
**Then** il voit deux options : "Je veux acheter" (CLIENT) et "Je veux vendre" (CREATOR)

**Given** l'utilisateur choisit "Je veux acheter"
**When** il valide son choix
**Then** son rôle reste CLIENT et il est redirigé vers la page d'accueil

**Given** l'utilisateur choisit "Je veux vendre"
**When** il valide son choix
**Then** son rôle reste CLIENT et il est redirigé vers l'onboarding créateur (Epic 2)

---

### Story 1.4: Connexion et Déconnexion

As a utilisateur enregistré,
I want me connecter et me déconnecter de mon compte,
So that je puisse accéder à mes données de manière sécurisée.

**Acceptance Criteria:**

**Given** un utilisateur sur la page de connexion
**When** il clique sur "Se connecter avec Google"
**Then** il est authentifié via Google OAuth et redirigé vers le dashboard approprié

**Given** un utilisateur connecté
**When** il clique sur "Déconnexion"
**Then** sa session est invalidée et il est redirigé vers la page d'accueil

**Given** un token JWT expiré (>15min)
**When** l'utilisateur fait une requête
**Then** le système utilise le refresh token pour renouveler la session
**And** si le refresh token est expiré (>7j), l'utilisateur est déconnecté

---

### Story 1.5: Modification du Profil Utilisateur

As a utilisateur connecté,
I want modifier mes informations de profil,
So that mes données soient à jour sur la plateforme.

**Acceptance Criteria:**

**Given** un utilisateur sur la page de profil
**When** il modifie son nom ou sa photo de profil
**Then** les modifications sont enregistrées dans la base de données
**And** un message de confirmation s'affiche

**Given** un utilisateur qui modifie son email
**When** il soumet le formulaire
**Then** une vérification est envoyée au nouvel email
**And** l'email n'est changé qu'après validation

**Given** des données invalides (nom vide, email invalide)
**When** l'utilisateur soumet le formulaire
**Then** des messages d'erreur clairs s'affichent
**And** les modifications ne sont pas enregistrées

---

## Epic 2: Onboarding Créateur

Un Client peut upgrader vers Créateur avec vérification SIRET et configuration Stripe Connect.

### Story 2.1: Initiation de l'Upgrade Client vers Créateur

As a Client,
I want initier le processus pour devenir Créateur,
So that je puisse commencer à vendre mes créations sur la plateforme.

**Acceptance Criteria:**

**Given** un utilisateur avec le rôle CLIENT sur sa page de profil
**When** il clique sur "Devenir Créateur"
**Then** il est redirigé vers le formulaire d'onboarding créateur
**And** le formulaire affiche les étapes : Informations Pro → Vérification SIRET → Stripe Connect

**Given** un utilisateur déjà CREATOR ou ADMIN
**When** il accède à la page de profil
**Then** l'option "Devenir Créateur" n'est pas affichée

---

### Story 2.2: Saisie des Informations Professionnelles

As a Client en cours d'upgrade,
I want saisir mes informations professionnelles,
So that la plateforme puisse vérifier mon activité.

**Acceptance Criteria:**

**Given** un Client sur le formulaire d'onboarding (étape 1)
**When** il remplit les champs : nom de marque, numéro SIRET, adresse professionnelle
**Then** les champs sont validés en temps réel (format SIRET 14 chiffres)
**And** il peut passer à l'étape suivante

**Given** un SIRET au format invalide
**When** l'utilisateur tente de continuer
**Then** un message d'erreur indique le format attendu
**And** l'utilisateur ne peut pas passer à l'étape suivante

---

### Story 2.3: Vérification SIRET via API INSEE

As a Client en cours d'upgrade,
I want que mon SIRET soit vérifié automatiquement,
So that la plateforme s'assure de la légitimité de mon activité.

**Acceptance Criteria:**

**Given** un Client ayant saisi son SIRET
**When** le système vérifie via l'API INSEE/Sirene
**Then** si le SIRET existe et est actif, les informations entreprise sont affichées
**And** l'utilisateur peut confirmer et passer à l'étape suivante
**And** le champ siretVerified est mis à true avec siretVerifiedAt

**Given** un SIRET invalide ou inactif
**When** la vérification échoue
**Then** un message d'erreur clair est affiché
**And** l'utilisateur peut corriger et réessayer

**Given** l'API INSEE indisponible
**When** la vérification échoue par timeout
**Then** le SIRET est marqué "en attente de validation manuelle"
**And** l'utilisateur peut continuer avec un avertissement

---

### Story 2.4: Onboarding Stripe Connect

As a Client en cours d'upgrade,
I want configurer mon compte Stripe Connect,
So that je puisse recevoir les paiements de mes ventes.

**Acceptance Criteria:**

**Given** un Client ayant validé son SIRET (étape 2 complétée)
**When** il clique sur "Configurer les paiements"
**Then** il est redirigé vers le flux Stripe Connect onboarding
**And** un stripeAccountId est créé et associé au futur profil Creator

**Given** l'utilisateur complète l'onboarding Stripe
**When** Stripe confirme via webhook account.updated
**Then** stripeOnboarded passe à true avec stripeOnboardedAt
**And** l'utilisateur est redirigé vers la confirmation

**Given** l'utilisateur abandonne l'onboarding Stripe
**When** il revient sur Kpsull
**Then** il peut reprendre l'onboarding Stripe depuis son profil

---

### Story 2.5: Activation du Compte Créateur

As a Client ayant complété l'onboarding,
I want que mon compte soit activé en tant que Créateur,
So that je puisse accéder au dashboard créateur et commencer à vendre.

**Acceptance Criteria:**

**Given** un Client avec SIRET vérifié et Stripe Connect configuré
**When** l'activation est déclenchée
**Then** un enregistrement Creator est créé avec les informations saisies
**And** une Subscription FREE est créée (productLimit=5, salesLimit=10)
**And** le rôle User passe de CLIENT à CREATOR
**And** l'utilisateur est redirigé vers le dashboard créateur
**And** un email de bienvenue créateur est envoyé via Resend

**Given** un nouveau créateur activé
**When** un Admin consulte le dashboard admin
**Then** une notification "Nouveau créateur : [nom]" est visible

---

## Epic 3: Gestion des Abonnements

Les créateurs peuvent gérer leur abonnement et les admins peuvent administrer les plans.

### Story 3.1: Consultation du Plan d'Abonnement

As a Créateur,
I want consulter mon plan d'abonnement actuel,
So that je puisse voir mes limites et fonctionnalités disponibles.

**Acceptance Criteria:**

**Given** un Créateur connecté sur la page abonnement
**When** il consulte son plan
**Then** il voit : plan actuel (FREE/PRO), limites (produits, ventes), usage actuel
**And** il voit les features disponibles et verrouillées selon son plan

**Given** un Créateur FREE
**When** il consulte ses limites
**Then** il voit "5 produits max (X utilisés)" et "10 ventes max (Y réalisées)"

---

### Story 3.2: Notification des Limites Atteintes

As a Créateur FREE,
I want être notifié quand j'atteins mes limites,
So that je puisse décider de passer au plan PRO.

**Acceptance Criteria:**

**Given** un Créateur FREE avec 4 produits publiés
**When** il publie un 5ème produit
**Then** une notification s'affiche "Vous avez atteint votre limite de produits"
**And** un CTA "Passer à PRO" est affiché

**Given** un Créateur FREE avec 5 produits publiés
**When** il tente de publier un nouveau produit
**Then** l'action est bloquée avec message "Limite atteinte, passez à PRO"

**Given** un Créateur FREE avec 9 ventes
**When** une 10ème commande est passée
**Then** une notification email est envoyée "Vous approchez de votre limite de ventes"

---

### Story 3.3: Upgrade vers Plan PRO

As a Créateur FREE,
I want passer au plan PRO,
So that je puisse vendre sans limites et accéder aux fonctionnalités avancées.

**Acceptance Criteria:**

**Given** un Créateur FREE sur la page des plans
**When** il clique sur "Choisir PRO"
**Then** il est redirigé vers Stripe Checkout avec le prix PRO

**Given** le paiement Stripe réussi
**When** le webhook checkout.session.completed est reçu
**Then** la Subscription passe en plan PRO
**And** productLimit et salesLimit passent à -1 (illimité)
**And** stripeSubscriptionId et stripeCustomerId sont enregistrés
**And** un email de confirmation est envoyé

**Given** le paiement échoue
**When** l'utilisateur revient sur Kpsull
**Then** il reste en plan FREE avec un message d'erreur

---

### Story 3.4: Gestion du Paiement Récurrent

As a Créateur PRO,
I want que mon abonnement soit renouvelé automatiquement,
So that je n'aie pas d'interruption de service.

**Acceptance Criteria:**

**Given** un Créateur PRO avec abonnement actif
**When** la date de renouvellement approche
**Then** Stripe prélève automatiquement le montant

**Given** un échec de paiement
**When** le webhook invoice.payment_failed est reçu
**Then** la Subscription passe en statut PAST_DUE
**And** un email d'alerte est envoyé au créateur
**And** une grace period de 7 jours commence

**Given** la grace period expirée sans paiement
**When** le système vérifie
**Then** la Subscription passe en CANCELED
**And** les limites FREE sont réappliquées

---

### Story 3.5: Administration des Abonnements (Admin)

As a Admin,
I want gérer les abonnements des créateurs,
So that je puisse résoudre les problèmes et faire des gestes commerciaux.

**Acceptance Criteria:**

**Given** un Admin sur la page de gestion des abonnements
**When** il consulte la liste
**Then** il voit tous les créateurs avec : nom, plan, statut, date renouvellement

**Given** un Admin qui consulte un abonnement spécifique
**When** il clique sur "Modifier"
**Then** il peut : prolonger la période, suspendre, réactiver, changer de plan

**Given** un Admin qui prolonge un abonnement
**When** il valide la modification
**Then** currentPeriodEnd est mis à jour
**And** un log d'audit est créé
**And** le créateur reçoit un email de notification

---

## Epic 4: Catalogue Produits

Les créateurs peuvent gérer leurs projets et produits avec images.

### Story 4.1: Création et Gestion des Projets

As a Créateur,
I want créer des projets pour organiser mes produits,
So that je puisse présenter mes collections de manière structurée.

**Acceptance Criteria:**

**Given** un Créateur sur la page produits
**When** il clique sur "Nouveau projet"
**Then** un formulaire s'affiche avec : nom, description, image de couverture

**Given** un Créateur qui remplit le formulaire projet
**When** il valide
**Then** le projet est créé et visible dans la liste
**And** il peut y ajouter des produits

**Given** un Créateur qui modifie ou supprime un projet
**When** il effectue l'action
**Then** les modifications sont enregistrées
**And** les produits du projet supprimé passent sans projet (projectId = null)

---

### Story 4.2: Création de Produit avec Informations de Base

As a Créateur,
I want créer un produit avec ses informations de base,
So that je puisse commencer à constituer mon catalogue.

**Acceptance Criteria:**

**Given** un Créateur sur la page de création de produit
**When** il remplit : nom, description, prix, projet (optionnel)
**Then** les champs sont validés (nom requis, prix > 0)

**Given** un formulaire valide
**When** le Créateur valide
**Then** le produit est créé en statut DRAFT
**And** currentProductCount de la Subscription n'est pas incrémenté (pas encore publié)

**Given** un prix invalide (négatif, non numérique)
**When** le Créateur tente de valider
**Then** un message d'erreur clair s'affiche

---

### Story 4.3: Upload d'Images Produit via Cloudinary

As a Créateur,
I want uploader des images pour mes produits,
So that mes clients puissent voir mes créations.

**Acceptance Criteria:**

**Given** un Créateur sur la page d'édition de produit
**When** il sélectionne une image (max 5MB, formats jpg/png/webp)
**Then** l'image est uploadée vers Cloudinary
**And** une URL optimisée est générée et stockée dans ProductImage
**And** un aperçu s'affiche immédiatement

**Given** plusieurs images uploadées
**When** le Créateur réorganise l'ordre
**Then** les positions sont mises à jour
**And** la première image devient l'image principale

**Given** une image trop grande ou format invalide
**When** le Créateur tente l'upload
**Then** un message d'erreur clair s'affiche
**And** l'upload est refusé

---

### Story 4.4: Gestion des Variantes Produit

As a Créateur,
I want définir des variantes pour mes produits,
So that mes clients puissent choisir taille, couleur, etc.

**Acceptance Criteria:**

**Given** un Créateur sur la page d'édition de produit
**When** il clique sur "Ajouter une variante"
**Then** il peut saisir : type (Taille/Couleur/etc), valeur, prix optionnel, stock

**Given** des variantes ajoutées
**When** le Créateur consulte le produit
**Then** toutes les variantes sont listées avec leurs caractéristiques

**Given** un Créateur qui modifie ou supprime une variante
**When** il effectue l'action
**Then** les modifications sont enregistrées

---

### Story 4.5: Publication et Dépublication de Produit

As a Créateur,
I want publier ou dépublier mes produits,
So that je contrôle ce qui est visible par les clients.

**Acceptance Criteria:**

**Given** un produit en statut DRAFT
**When** le Créateur clique sur "Publier"
**Then** le statut passe à PUBLISHED
**And** publishedAt est défini
**And** currentProductCount de la Subscription est incrémenté

**Given** un Créateur FREE avec 5 produits publiés
**When** il tente de publier un 6ème produit
**Then** l'action est bloquée avec message "Limite atteinte"

**Given** un produit PUBLISHED
**When** le Créateur clique sur "Dépublier"
**Then** le statut passe à DRAFT
**And** currentProductCount est décrémenté
**And** le produit n'est plus visible publiquement

---

### Story 4.6: Liste et Filtrage des Produits

As a Créateur,
I want voir et filtrer mes produits,
So that je puisse gérer mon catalogue efficacement.

**Acceptance Criteria:**

**Given** un Créateur sur la page produits
**When** il consulte la liste
**Then** il voit tous ses produits avec : image, nom, prix, statut, projet

**Given** des filtres disponibles
**When** le Créateur filtre par statut (DRAFT/PUBLISHED) ou par projet
**Then** la liste est mise à jour en temps réel

**Given** une recherche par nom
**When** le Créateur saisit un terme
**Then** les produits correspondants sont affichés

---

## Epic 5: Page Builder

Les créateurs peuvent personnaliser et publier leur page vitrine.

### Story 5.1: Création de la Page Créateur

As a Créateur,
I want créer ma page vitrine,
So that les clients puissent découvrir mon univers et mes créations.

**Acceptance Criteria:**

**Given** un nouveau Créateur sans page
**When** il accède au Page Builder
**Then** une CreatorPage est créée automatiquement
**And** il voit une page vide avec option "Choisir un template"

**Given** un Créateur avec une page existante
**When** il accède au Page Builder
**Then** il voit sa page actuelle avec possibilité de modifier

---

### Story 5.2: Choix de Template

As a Créateur,
I want choisir un template de base,
So that ma page ait un style professionnel adapté à mon activité.

**Acceptance Criteria:**

**Given** un Créateur sur le Page Builder
**When** il clique sur "Choisir un template"
**Then** une galerie de templates s'affiche (Artisan, Moderne, Minimaliste, etc.)

**Given** un template sélectionné
**When** le Créateur confirme
**Then** les sections par défaut du template sont créées
**And** le champ template de CreatorPage est mis à jour

---

### Story 5.3: Gestion des Sections de Page

As a Créateur,
I want ajouter et organiser des sections sur ma page,
So that je puisse présenter mon contenu de manière personnalisée.

**Acceptance Criteria:**

**Given** un Créateur sur le Page Builder
**When** il clique sur "Ajouter une section"
**Then** il peut choisir : HERO, ABOUT, BENTO_GRID, PRODUCTS_FEATURED, PRODUCTS_GRID, TESTIMONIALS, CONTACT, CUSTOM

**Given** des sections existantes
**When** le Créateur drag-and-drop une section
**Then** les positions sont réorganisées
**And** les champs position des PageSection sont mis à jour

**Given** une section existante
**When** le Créateur clique sur "Supprimer"
**Then** la section est supprimée de la page

---

### Story 5.4: Édition du Contenu des Sections

As a Créateur,
I want éditer le contenu de chaque section,
So that ma page reflète mon identité et mes produits.

**Acceptance Criteria:**

**Given** une section HERO
**When** le Créateur l'édite
**Then** il peut modifier : titre, sous-titre, image de fond, CTA

**Given** une section ABOUT
**When** le Créateur l'édite
**Then** il peut modifier : texte de présentation, images, liens

**Given** une section PRODUCTS_FEATURED
**When** le Créateur l'édite
**Then** il peut sélectionner les produits à mettre en avant

**Given** des images uploadées dans une section
**When** le Créateur valide
**Then** les images sont stockées via Cloudinary
**And** le JSON content de la PageSection est mis à jour

---

### Story 5.5: Prévisualisation de la Page

As a Créateur,
I want prévisualiser ma page avant publication,
So that je puisse vérifier le rendu final.

**Acceptance Criteria:**

**Given** un Créateur sur le Page Builder
**When** il clique sur "Prévisualiser"
**Then** une nouvelle fenêtre/onglet s'ouvre avec le rendu de la page
**And** la prévisualisation reflète exactement le contenu actuel

**Given** des modifications non sauvegardées
**When** le Créateur prévisualise
**Then** la prévisualisation inclut les modifications en cours

---

### Story 5.6: Publication de la Page avec URL Unique

As a Créateur,
I want publier ma page avec une URL unique,
So that mes clients puissent y accéder facilement.

**Acceptance Criteria:**

**Given** un Créateur avec une page complète
**When** il clique sur "Publier"
**Then** published passe à true
**And** publishedAt est défini
**And** la page est accessible à l'URL /[slug]

**Given** un slug déjà pris
**When** le Créateur tente de publier
**Then** un message lui demande de choisir un autre slug

**Given** une page publiée
**When** le Créateur clique sur "Dépublier"
**Then** published passe à false
**And** la page n'est plus accessible publiquement

---

## Epic 6: Vitrine Publique & Catalogue

Les visiteurs peuvent découvrir les créateurs et parcourir leurs produits.

### Story 6.1: Affichage de la Page Créateur Publique

As a visiteur,
I want consulter la page d'un créateur,
So that je puisse découvrir son univers et ses créations.

**Acceptance Criteria:**

**Given** une page créateur publiée
**When** un visiteur accède à /[slug]
**Then** la page s'affiche avec toutes les sections configurées
**And** le temps de chargement est < 1.5s (LCP)

**Given** une page non publiée
**When** un visiteur accède à /[slug]
**Then** une page 404 est affichée

**Given** un slug inexistant
**When** un visiteur accède à /[slug]
**Then** une page 404 est affichée avec suggestions

---

### Story 6.2: Parcours du Catalogue Produits

As a visiteur,
I want parcourir les produits d'un créateur,
So that je puisse découvrir ce qui est disponible à l'achat.

**Acceptance Criteria:**

**Given** un visiteur sur la page d'un créateur
**When** il accède à la section produits ou /[slug]/products
**Then** tous les produits PUBLISHED sont affichés en grille
**And** chaque produit montre : image principale, nom, prix

**Given** des produits avec variantes de prix différentes
**When** ils sont affichés dans le catalogue
**Then** le prix affiché est "À partir de X€"

---

### Story 6.3: Affichage des Détails d'un Produit

As a visiteur,
I want voir les détails d'un produit,
So that je puisse prendre ma décision d'achat.

**Acceptance Criteria:**

**Given** un visiteur sur le catalogue
**When** il clique sur un produit
**Then** il est redirigé vers /[slug]/products/[productId]
**And** il voit : galerie images, nom, description, prix, variantes disponibles

**Given** un produit avec plusieurs images
**When** le visiteur navigue dans la galerie
**Then** il peut voir toutes les images en grand

**Given** un produit avec variantes
**When** le visiteur sélectionne une variante
**Then** le prix se met à jour si la variante a un prix différent

---

## Epic 7: Panier & Checkout

Les clients peuvent acheter des produits avec paiement sécurisé escrow.

### Story 7.1: Ajout de Produits au Panier

As a visiteur,
I want ajouter des produits à mon panier,
So that je puisse préparer ma commande.

**Acceptance Criteria:**

**Given** un visiteur sur la page d'un produit
**When** il clique sur "Ajouter au panier"
**Then** le produit est ajouté au panier (localStorage si non connecté)
**And** le compteur panier est mis à jour
**And** une confirmation visuelle s'affiche

**Given** un produit avec variantes
**When** le visiteur ajoute au panier sans sélectionner de variante
**Then** un message lui demande de choisir une variante

**Given** un visiteur qui ajoute le même produit
**When** il est déjà dans le panier
**Then** la quantité est incrémentée

---

### Story 7.2: Gestion du Panier

As a Client,
I want modifier mon panier,
So that je puisse ajuster ma commande avant paiement.

**Acceptance Criteria:**

**Given** un Client sur la page panier
**When** il consulte son panier
**Then** il voit : liste des articles, quantités, prix unitaires, sous-total

**Given** un article dans le panier
**When** le Client modifie la quantité
**Then** le total est recalculé en temps réel

**Given** un article dans le panier
**When** le Client clique sur "Supprimer"
**Then** l'article est retiré et le total mis à jour

**Given** un panier vide
**When** le Client consulte le panier
**Then** un message "Votre panier est vide" et un CTA vers les produits s'affichent

---

### Story 7.3: Authentification pour Checkout

As a visiteur avec un panier,
I want m'identifier pour finaliser ma commande,
So that je puisse procéder au paiement.

**Acceptance Criteria:**

**Given** un visiteur non connecté qui clique sur "Commander"
**When** il est redirigé vers la connexion
**Then** après connexion, il revient au checkout avec son panier intact

**Given** un Client connecté qui clique sur "Commander"
**When** il accède au checkout
**Then** ses informations pré-remplies s'affichent si disponibles

---

### Story 7.4: Saisie de l'Adresse de Livraison

As a Client au checkout,
I want saisir mon adresse de livraison,
So that je puisse recevoir ma commande.

**Acceptance Criteria:**

**Given** un Client au checkout (étape adresse)
**When** il remplit : prénom, nom, adresse, code postal, ville, pays, téléphone
**Then** les champs sont validés en temps réel

**Given** un Client avec des adresses enregistrées
**When** il arrive au checkout
**Then** il peut sélectionner une adresse existante ou en créer une nouvelle

**Given** une adresse valide saisie
**When** le Client clique sur "Continuer"
**Then** une Address est créée/sélectionnée et il passe à l'étape paiement

---

### Story 7.5: Paiement Stripe Connect avec Escrow

As a Client au checkout,
I want payer ma commande de manière sécurisée,
So that mes fonds soient protégés jusqu'à réception.

**Acceptance Criteria:**

**Given** un Client à l'étape paiement
**When** il voit le récapitulatif
**Then** il voit : articles, sous-total, frais de livraison, total TTC

**Given** le formulaire Stripe Elements affiché
**When** le Client saisit ses informations de carte et valide
**Then** un PaymentIntent est créé avec transfer_data vers le créateur
**And** application_fee_amount = 3% du total (commission Kpsull)
**And** les fonds sont bloqués en escrow (pas de transfert immédiat)

**Given** un paiement réussi
**When** le webhook payment_intent.succeeded est reçu
**Then** une Order est créée avec statut PAID
**And** stripePaymentIntentId est enregistré
**And** platformFee et creatorPayout sont calculés

---

### Story 7.6: Confirmation de Commande et Email

As a Client ayant payé,
I want recevoir une confirmation de commande,
So that j'aie une preuve de mon achat.

**Acceptance Criteria:**

**Given** un paiement réussi
**When** le Client est redirigé vers /success
**Then** il voit : numéro de commande, récapitulatif, message de confirmation

**Given** une commande créée
**When** le système traite la confirmation
**Then** un email est envoyé via Resend avec : numéro, articles, montant, adresse

**Given** le créateur concerné
**When** une commande est passée
**Then** il reçoit une notification email "Nouvelle commande #XXX"

---

## Epic 8: Gestion Commandes Créateur

Les créateurs peuvent gérer leurs commandes et expéditions.

### Story 8.1: Liste des Commandes Reçues

As a Créateur,
I want voir la liste de mes commandes,
So that je puisse gérer mes ventes efficacement.

**Acceptance Criteria:**

**Given** un Créateur sur la page commandes
**When** il consulte la liste
**Then** il voit toutes ses commandes avec : numéro, date, client, montant, statut

**Given** des filtres disponibles
**When** le Créateur filtre par statut (PAID, SHIPPED, etc.) ou période
**Then** la liste est mise à jour

**Given** une recherche par numéro de commande
**When** le Créateur saisit un terme
**Then** les commandes correspondantes sont affichées

---

### Story 8.2: Détails d'une Commande

As a Créateur,
I want consulter les détails d'une commande,
So that je puisse la préparer et l'expédier.

**Acceptance Criteria:**

**Given** un Créateur qui clique sur une commande
**When** la page détail s'affiche
**Then** il voit : articles commandés, quantités, prix, infos client, adresse livraison

**Given** une commande avec notes client
**When** le Créateur consulte les détails
**Then** la note est affichée clairement

---

### Story 8.3: Expédition avec Numéro de Suivi

As a Créateur,
I want marquer une commande comme expédiée,
So that le client soit informé et les fonds soient libérés après livraison.

**Acceptance Criteria:**

**Given** une commande en statut PAID
**When** le Créateur clique sur "Marquer comme expédié"
**Then** un formulaire demande : transporteur, numéro de suivi

**Given** les informations d'expédition saisies
**When** le Créateur valide
**Then** le statut passe à SHIPPED
**And** shippedAt est défini
**And** trackingNumber et shippingCarrier sont enregistrés
**And** le client reçoit un email avec le lien de suivi

---

### Story 8.4: Sélection du Transporteur

As a Créateur,
I want sélectionner un transporteur pour l'expédition,
So that le suivi soit correctement configuré.

**Acceptance Criteria:**

**Given** un Créateur sur le formulaire d'expédition
**When** il sélectionne le transporteur
**Then** il peut choisir parmi : Colissimo, Mondial Relay, Chronopost, UPS, DHL, Autre

**Given** un transporteur sélectionné
**When** le Créateur saisit le numéro de suivi
**Then** le format est validé selon le transporteur

---

### Story 8.5: Annulation de Commande avec Remboursement

As a Créateur,
I want annuler une commande non expédiée,
So that le client soit remboursé automatiquement.

**Acceptance Criteria:**

**Given** une commande en statut PAID (non expédiée)
**When** le Créateur clique sur "Annuler la commande"
**Then** une confirmation est demandée avec raison obligatoire

**Given** l'annulation confirmée
**When** le système traite l'annulation
**Then** un refund Stripe est déclenché pour le montant total
**And** le statut passe à CANCELED
**And** le client reçoit un email de confirmation d'annulation

**Given** une commande déjà expédiée
**When** le Créateur tente d'annuler
**Then** l'option n'est pas disponible (doit passer par retour)

---

### Story 8.6: Limite de Ventes FREE

As a Créateur FREE,
I want être informé de ma limite de ventes,
So that je puisse anticiper le passage à PRO.

**Acceptance Criteria:**

**Given** un Créateur FREE avec 10 ventes (currentSalesCount = 10)
**When** un client tente de passer commande
**Then** la commande est bloquée côté Créateur
**And** un message indique "Ce créateur a atteint sa limite de ventes"
**And** le Créateur est notifié pour upgrader

**Given** un Créateur FREE avec 8 ventes
**When** une nouvelle commande est passée
**Then** currentSalesCount est incrémenté
**And** si = 10, une notification "Limite atteinte" est envoyée

---

## Epic 9: Suivi Livraison & Escrow

Le système gère automatiquement le tracking et la libération des fonds.

### Story 9.1: Intégration AfterShip pour Suivi Automatique

As a système,
I want suivre automatiquement les colis via AfterShip,
So that les statuts de livraison soient mis à jour en temps réel.

**Acceptance Criteria:**

**Given** une commande expédiée avec tracking
**When** le système enregistre l'expédition
**Then** un tracking est créé sur AfterShip avec le numéro et transporteur

**Given** un webhook AfterShip reçu (tracking update)
**When** le statut passe à "Delivered"
**Then** le statut Order passe à DELIVERED
**And** deliveredAt est défini
**And** validationDeadline = deliveredAt + 48h

---

### Story 9.2: Libération Automatique des Fonds après 48h

As a Créateur,
I want que mes fonds soient libérés 48h après livraison,
So that je reçoive mon paiement si le client ne conteste pas.

**Acceptance Criteria:**

**Given** une commande en DELIVERED depuis > 48h
**When** le job de libération s'exécute
**Then** le statut passe à COMPLETED
**And** un transfert Stripe est créé vers le compte du créateur
**And** le montant = total - platformFee (3%)
**And** completedAt est défini

**Given** le transfert réussi
**When** le créateur consulte son dashboard
**Then** le paiement apparaît dans ses revenus

---

### Story 9.3: Signalement de Litige par le Client

As a Client,
I want signaler un problème dans les 48h suivant la livraison,
So that je puisse contester avant la libération des fonds.

**Acceptance Criteria:**

**Given** une commande en statut DELIVERED (< 48h)
**When** le Client clique sur "Signaler un problème"
**Then** un formulaire s'affiche : type de problème, description, photos

**Given** un litige soumis
**When** le système le traite
**Then** le statut passe à DISPUTE_OPENED
**And** la libération automatique est suspendue
**And** le créateur et l'admin sont notifiés

**Given** une commande en DELIVERED depuis > 48h
**When** le Client tente de signaler
**Then** l'option n'est plus disponible

---

### Story 9.4: Initiation de Retour par le Client

As a Client,
I want initier un retour de commande,
So that je puisse être remboursé si le produit ne me convient pas.

**Acceptance Criteria:**

**Given** une commande en statut DELIVERED ou VALIDATION_PENDING
**When** le Client clique sur "Retourner la commande"
**Then** un formulaire demande : raison, articles concernés

**Given** un retour initié
**When** le système le traite
**Then** le statut passe à RETURN_SHIPPED (en attente d'expédition retour)
**And** des instructions de retour sont affichées au client
**And** le créateur est notifié

---

### Story 9.5: Validation du Retour et Remboursement

As a Créateur,
I want valider la réception d'un retour,
So that le client soit remboursé.

**Acceptance Criteria:**

**Given** un colis retour reçu par le Créateur
**When** il clique sur "Confirmer réception retour"
**Then** le statut passe à RETURN_RECEIVED

**Given** le retour validé
**When** le créateur confirme le remboursement
**Then** un refund Stripe 100% est déclenché
**And** le statut passe à REFUNDED
**And** le client reçoit un email de confirmation

**Given** un retour non conforme
**When** le créateur conteste
**Then** le litige est escaladé à l'admin

---

## Epic 10: Dashboard Créateur & Analytics

Les créateurs peuvent suivre leurs performances et statistiques.

### Story 10.1: Dashboard avec Statistiques Clés

As a Créateur,
I want voir mes statistiques clés sur mon dashboard,
So that j'aie une vue d'ensemble de mon activité.

**Acceptance Criteria:**

**Given** un Créateur sur son dashboard
**When** il consulte la page
**Then** il voit : CA total, nombre de commandes, nombre de produits publiés
**And** les données sont issues des champs dénormalisés (totalRevenue, totalOrders, totalProducts)

**Given** un Créateur avec des commandes récentes
**When** il consulte le dashboard
**Then** il voit les 5 dernières commandes en un coup d'œil

---

### Story 10.2: Évolution des Ventes sur Période

As a Créateur,
I want voir l'évolution de mes ventes,
So that je puisse identifier les tendances.

**Acceptance Criteria:**

**Given** un Créateur sur le dashboard
**When** il consulte le graphique de ventes
**Then** il voit un graphique CA par jour/semaine/mois

**Given** des filtres de période
**When** le Créateur sélectionne "30 derniers jours"
**Then** le graphique se met à jour avec les données correspondantes

---

### Story 10.3: Liste et Historique des Clients

As a Créateur,
I want consulter la liste de mes clients,
So that je puisse mieux connaître ma clientèle.

**Acceptance Criteria:**

**Given** un Créateur sur la page clients
**When** il consulte la liste
**Then** il voit : nom, email, nombre de commandes, montant total dépensé

**Given** un client dans la liste
**When** le Créateur clique dessus
**Then** il voit l'historique complet des commandes de ce client

---

### Story 10.4: Analytics Avancés (PRO)

As a Créateur PRO,
I want accéder à des analytics avancés,
So that je puisse optimiser ma stratégie de vente.

**Acceptance Criteria:**

**Given** un Créateur PRO sur la page analytics
**When** il consulte les données
**Then** il voit : taux de conversion, panier moyen, produits les plus vendus, sources de trafic

**Given** un Créateur FREE
**When** il tente d'accéder aux analytics avancés
**Then** une page "Passez à PRO pour débloquer" s'affiche

---

### Story 10.5: Export des Rapports (PRO)

As a Créateur PRO,
I want exporter mes rapports de ventes,
So that je puisse les analyser ou les partager.

**Acceptance Criteria:**

**Given** un Créateur PRO sur la page rapports
**When** il clique sur "Exporter"
**Then** il peut choisir : format (CSV, Excel), période, données à inclure

**Given** un export demandé
**When** le système génère le fichier
**Then** le fichier est téléchargé avec les données demandées

**Given** un Créateur FREE
**When** il tente d'exporter
**Then** l'action est bloquée avec CTA "Passez à PRO"

---

## Epic 11: Administration Plateforme

Les admins peuvent gérer la plateforme et les créateurs.

### Story 11.1: Dashboard Admin avec KPIs Plateforme

As a Admin,
I want consulter les KPIs de la plateforme,
So that je puisse suivre la santé du business.

**Acceptance Criteria:**

**Given** un Admin sur le dashboard admin
**When** il consulte la page
**Then** il voit : MRR (abonnements actifs), nombre de créateurs actifs, commandes totales, GMV

**Given** des données temporelles
**When** l'Admin consulte les tendances
**Then** il voit les évolutions par rapport à la période précédente

---

### Story 11.2: Liste et Gestion des Créateurs

As a Admin,
I want gérer les créateurs de la plateforme,
So that je puisse contrôler l'activité et résoudre les problèmes.

**Acceptance Criteria:**

**Given** un Admin sur la page créateurs
**When** il consulte la liste
**Then** il voit : nom, marque, plan, statut, date inscription, CA total

**Given** des filtres disponibles
**When** l'Admin filtre par plan, statut, ou période
**Then** la liste est mise à jour

**Given** un Admin qui clique sur un créateur
**When** la page détail s'affiche
**Then** il voit toutes les informations : profil, produits, commandes, abonnement

---

### Story 11.3: Désactivation de Compte

As a Admin,
I want désactiver un compte utilisateur,
So that je puisse agir en cas de violation des règles.

**Acceptance Criteria:**

**Given** un Admin sur la page d'un utilisateur
**When** il clique sur "Désactiver le compte"
**Then** une confirmation avec raison obligatoire est demandée

**Given** la désactivation confirmée
**When** le système traite l'action
**Then** l'utilisateur ne peut plus se connecter
**And** un email l'informant de la désactivation est envoyé
**And** un log d'audit est créé

**Given** un compte désactivé
**When** l'Admin clique sur "Réactiver"
**Then** le compte est réactivé et l'utilisateur notifié

---

### Story 11.4: Notification des Nouveaux Créateurs

As a Admin,
I want être notifié des nouveaux créateurs,
So that je puisse vérifier leur contenu rapidement.

**Acceptance Criteria:**

**Given** un nouveau créateur activé
**When** son compte passe en CREATOR
**Then** une notification apparaît dans le dashboard admin
**And** un email est envoyé aux admins

**Given** des notifications non lues
**When** l'Admin consulte le dashboard
**Then** un badge indique le nombre de notifications

---

### Story 11.5: Contrôle de Contenu des Pages Créateurs

As a Admin,
I want consulter les pages des créateurs,
So that je puisse vérifier qu'il n'y a pas de contenu illicite.

**Acceptance Criteria:**

**Given** un Admin sur la liste des créateurs
**When** il clique sur "Voir la page"
**Then** la page publique du créateur s'affiche dans un nouvel onglet

**Given** un contenu problématique détecté
**When** l'Admin prend une action
**Then** il peut : contacter le créateur, dépublier la page, désactiver le compte

---

### Story 11.6: Export des Statistiques Plateforme

As a Admin,
I want exporter les statistiques plateforme,
So that je puisse créer des rapports pour l'équipe.

**Acceptance Criteria:**

**Given** un Admin sur la page rapports
**When** il clique sur "Exporter"
**Then** il peut choisir : créateurs, commandes, revenus, abonnements

**Given** un export demandé
**When** le système génère le fichier
**Then** un CSV/Excel est téléchargé avec les données

---

## Epic 12: Espace Client

Les clients peuvent suivre leurs commandes et leur historique.

### Story 12.1: Historique des Commandes Client

As a Client,
I want consulter l'historique de mes commandes,
So that je puisse retrouver mes achats passés.

**Acceptance Criteria:**

**Given** un Client connecté sur sa page commandes
**When** il consulte la liste
**Then** il voit toutes ses commandes avec : numéro, date, créateur, montant, statut

**Given** une commande dans la liste
**When** le Client clique dessus
**Then** il voit les détails : articles, adresse, historique de statut

---

### Story 12.2: Suivi de Commande en Cours

As a Client,
I want suivre ma commande en cours,
So that je sache quand je vais la recevoir.

**Acceptance Criteria:**

**Given** une commande en statut SHIPPED
**When** le Client consulte les détails
**Then** il voit le numéro de suivi et un lien vers le tracking transporteur

**Given** une timeline de commande
**When** le Client consulte le suivi
**Then** il voit les étapes : Commandé → Payé → Expédié → En livraison → Livré

**Given** une commande livrée
**When** le Client consulte
**Then** il voit la date de livraison et peut laisser un avis (post-MVP)
