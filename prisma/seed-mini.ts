/**
 * Prisma Seed Mini — Kpsull Marketplace (données de test ~570 images)
 *
 * Crée :
 *   - 1 admin
 *   - 6 créateurs (niches diversifiées : streetwear, lingerie, bijoux, knitwear, outerwear, romantique)
 *   - 3 collections × 5 produits × 3 variantes (couleurs) par créateur
 *   - 50 clients avec profils français réalistes
 *   - 150 commandes distribuées sur les 6 derniers mois
 *
 * Images :
 *   Lit depuis prisma/seed-assets/image-generation-mini-v3-progress.json si disponible.
 *   Générer les images d'abord : bun prisma/scripts/generate-images-gemini.ts --mini
 *
 * Usage:
 *   bun prisma/seed-mini.ts
 *
 * Tous les comptes : password123
 */

import {
  PrismaClient,
  Role,
  Plan,
  SubscriptionStatus,
  ProductStatus,
  OrderStatus,
  SectionType,
  OnboardingStep,
  PageStatus,
  ReturnStatus,
  ReturnReason,
  DisputeStatus,
  DisputeType,
  FlagReason,
  ModerationStatus,
  ModerationActionType,
  PlatformTransactionType,
  PlatformTransactionStatus,
  InvoiceType,
  InvoiceStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import * as fs from 'node:fs';
import * as path from 'node:path';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kpsull-db';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColorDef {
  name: string;
  code: string;
}

interface ProductDef {
  name: string;
  category: string;
  priceRange: [number, number];
  gender: string;
  materials: string;
  fit: string;
  season: string;
}

interface CollectionDef {
  name: string;
  desc: string;
}

interface MiniCreatorDef {
  id: string;
  email: string;
  name: string;
  brandName: string;
  brandStyle: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  plan: Plan;
  siret: string;
  stripeAccountId: string;
  collections: CollectionDef[];
  products: ProductDef[];
  colors: ColorDef[];
  sizeSet: string[];
  styleId: string;
}

interface MiniCheckpointEntry {
  images: string[];
  completedAt: string;
}

interface MiniCheckpoint {
  images: Record<string, MiniCheckpointEntry>;
}

// ─── Checkpoint images ────────────────────────────────────────────────────────

const SEED_ASSETS_DIR = path.resolve('./prisma/seed-assets');
const MINI_CHECKPOINT_PATH = path.join(SEED_ASSETS_DIR, 'image-generation-mini-v3-progress.json');

function loadMiniCheckpoint(): MiniCheckpoint {
  if (fs.existsSync(MINI_CHECKPOINT_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(MINI_CHECKPOINT_PATH, 'utf-8')) as MiniCheckpoint;
    } catch {
      // ignore
    }
  }
  return { images: {} };
}

// ─── Styles système ───────────────────────────────────────────────────────────

const MINI_STYLES = [
  { id: 'style_mini_streetwear', name: 'Streetwear' },
  { id: 'style_mini_lingerie',   name: 'Lingerie' },
  { id: 'style_mini_bijoux',     name: 'Bijoux' },
  { id: 'style_mini_enfant',     name: 'Enfant' },
  { id: 'style_mini_techwear',   name: 'Techwear' },
  { id: 'style_mini_romantique', name: 'Romantique' },
];

// ─── Définition des 6 créateurs mini ──────────────────────────────────────────

const MINI_CREATORS: MiniCreatorDef[] = [
  {
    id: 'hugo_tessier',
    email: 'hugo.tessier@kpsull.fr',
    name: 'Hugo Tessier',
    brandName: 'Hugo Tessier Studio',
    brandStyle: 'Streetwear déconstruit post-industriel — raw edges, exposed seams, architecture du vêtement',
    slug: 'hugo-tessier',
    phone: '06 12 34 56 78',
    address: '12 rue de la Paix',
    city: 'Paris',
    postalCode: '75001',
    plan: Plan.STUDIO,
    siret: '12345678901001',
    stripeAccountId: 'acct_hugo_tessier_demo',
    collections: [
      { name: 'Void', desc: 'Noir absolu, déconstruction architecturale, vide comme esthétique' },
      { name: 'Industrial', desc: 'Khaki et rouille, hardware militaire, esthétique utilitaire brute' },
      { name: 'Ghost', desc: 'Délavé et sans teinte, déconstruction spectrale, fantôme textile' },
    ],
    products: [
      { name: 'Veste déconstruite', category: 'veste_blouson', priceRange: [14900, 22900], gender: 'Unisexe', materials: '100% Coton canvas 400g/m²', fit: 'Oversize asymétrique', season: 'Toutes saisons' },
      { name: 'Cargo déconstruit', category: 'pantalon', priceRange: [9900, 14900], gender: 'Unisexe', materials: '100% Coton ripstop', fit: 'Regular', season: 'Toutes saisons' },
      { name: 'Hoodie déstructuré', category: 'hoodie', priceRange: [7900, 11900], gender: 'Unisexe', materials: '100% Coton French terry 420g/m²', fit: 'Oversize', season: 'Automne-Hiver' },
      { name: 'Crewneck architectural', category: 'hoodie', priceRange: [5900, 8900], gender: 'Unisexe', materials: '100% Coton 320g/m²', fit: 'Boxy oversize', season: 'Automne-Hiver' },
      { name: 'Veste coach utilitaire', category: 'veste_blouson', priceRange: [8900, 13900], gender: 'Unisexe', materials: 'Nylon-coton twill', fit: 'Regular', season: 'Printemps-Automne' },
    ],
    colors: [
      { name: 'Noir', code: '#1a1a1a' },
      { name: 'Blanc cassé', code: '#f0ede8' },
      { name: 'Kaki ardoise', code: '#6b7355' },
    ],
    sizeSet: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    styleId: 'style_mini_streetwear',
  },
  {
    id: 'nadia_forte',
    email: 'nadia.forte@kpsull.fr',
    name: 'Nadia Forte',
    brandName: 'Forte Lingerie',
    brandStyle: 'Lingerie boudoir artisan — dentelle Calais, soie charmeuse, savoir-faire héritage français',
    slug: 'nadia-forte',
    phone: '06 23 45 67 89',
    address: '8 rue du Faubourg Saint-Honoré',
    city: 'Paris',
    postalCode: '75008',
    plan: Plan.STUDIO,
    siret: '12345678901002',
    stripeAccountId: 'acct_nadia_forte_demo',
    collections: [
      { name: 'Dentelle Héritage', desc: 'Dentelle Calais héritage, boudoir classique, craft d\'exception' },
      { name: 'Soie Nue', desc: 'Soie charmeuse nude, second peau, minimalisme intime' },
      { name: 'Velours Rouge', desc: 'Velours bordeaux, opulence romantique, boudoir dramatique' },
    ],
    products: [
      { name: 'Body dentelle', category: 'lingerie', priceRange: [5900, 9900], gender: 'Femme', materials: 'Dentelle Calais + voile de soie', fit: 'Regular', season: 'Toutes saisons' },
      { name: 'Soutien-gorge balconnet', category: 'lingerie', priceRange: [4900, 7900], gender: 'Femme', materials: '70% Polyamide 30% Élasthanne + dentelle', fit: 'Regular', season: 'Toutes saisons' },
      { name: 'Culotte taille haute', category: 'lingerie', priceRange: [2900, 4900], gender: 'Femme', materials: 'Jersey satiné + dentelle Calais', fit: 'Regular', season: 'Toutes saisons' },
      { name: 'Nuisette', category: 'lingerie', priceRange: [7900, 12900], gender: 'Femme', materials: '100% Soie charmeuse biais-coupée', fit: 'Regular', season: 'Toutes saisons' },
      { name: 'Ensemble 2 pièces', category: 'lingerie', priceRange: [8900, 14900], gender: 'Femme', materials: 'Dentelle Calais + satin', fit: 'Regular', season: 'Toutes saisons' },
    ],
    colors: [
      { name: 'Noir', code: '#1a1a1a' },
      { name: 'Ivoire', code: '#FFFFF0' },
      { name: 'Rose nude', code: '#E8B4A0' },
    ],
    sizeSet: ['XS', 'S', 'M', 'L', 'XL'],
    styleId: 'style_mini_lingerie',
  },
  {
    id: 'yasmine_larbi',
    email: 'yasmine.larbi@kpsull.fr',
    name: 'Yasmine Larbi',
    brandName: 'Yasmine Bijoux',
    brandStyle: 'Bijoux géo-culturel — géométrie zellij, silversmithing Touareg, métaux bruts coulés à la main',
    slug: 'yasmine-larbi',
    phone: '06 34 56 78 90',
    address: '24 rue de Rivoli',
    city: 'Paris',
    postalCode: '75004',
    plan: Plan.ESSENTIEL,
    siret: '12345678901003',
    stripeAccountId: 'acct_yasmine_larbi_demo',
    collections: [
      { name: 'Zellige', desc: 'Géométrie dorée inspirée des mosaïques zellij, facettes coulées à la main' },
      { name: 'Touareg', desc: 'Argent oxydé, motifs protecteurs croix et boussole, héritage nomade' },
      { name: 'Nuit de Blida', desc: 'Bronze sombre, formes croissant et étoile, romantisme de nuit algéroise' },
    ],
    products: [
      { name: 'Collier architecture', category: 'bijoux', priceRange: [8900, 18900], gender: 'Femme', materials: 'Métal coulé, estampage main', fit: 'Unique', season: 'Toutes saisons' },
      { name: 'Boucles asymétriques', category: 'bijoux', priceRange: [5900, 12900], gender: 'Femme', materials: 'Métal coulé, surface estampée', fit: 'Unique', season: 'Toutes saisons' },
      { name: 'Bracelet manchette', category: 'bijoux', priceRange: [6900, 14900], gender: 'Femme', materials: 'Métal forgé, motifs géométriques gravés', fit: 'Unique', season: 'Toutes saisons' },
      { name: 'Bague sculptée', category: 'bijoux', priceRange: [4900, 9900], gender: 'Femme', materials: 'Métal coulé, finition limée à la main', fit: 'Unique', season: 'Toutes saisons' },
      { name: 'Parure complète', category: 'bijoux', priceRange: [22900, 44900], gender: 'Femme', materials: 'Métal coulé, set coordonné', fit: 'Unique', season: 'Toutes saisons' },
    ],
    colors: [
      { name: 'Or', code: '#C8A951' },
      { name: 'Argent oxydé', code: '#8C8C8C' },
      { name: 'Bronze', code: '#8B5E3C' },
    ],
    sizeSet: ['Unique'],
    styleId: 'style_mini_bijoux',
  },
  {
    id: 'marie_durand',
    email: 'marie.durand@kpsull.fr',
    name: 'Marie Durand',
    brandName: 'Petit Atelier Marie',
    brandStyle: 'Mode bébé et enfant artisanale — coton bio GOTS, broderies main, slow fashion transgénérationnel',
    slug: 'marie-durand',
    phone: '06 45 67 89 01',
    address: '5 rue des Abbesses',
    city: 'Paris',
    postalCode: '75018',
    plan: Plan.ESSENTIEL,
    siret: '12345678901004',
    stripeAccountId: 'acct_marie_durand_demo',
    collections: [
      { name: 'Premiers Pas', desc: 'Essentiels bébé 0-24 mois en coton bio, blanc et écru, douceur pure' },
      { name: 'Grandir Doucement', desc: 'Vêtements enfant 2-8 ans, tons terre naturels, jeu et raffinement' },
      { name: 'Dimanche Matin', desc: 'Tenues de cérémonie tous âges, lin fin et broderie anglaise' },
    ],
    products: [
      { name: 'Barboteuse brodée', category: 'tshirt', priceRange: [2900, 4900], gender: 'Enfant', materials: '100% Coton bio GOTS', fit: 'Regular', season: 'Toutes saisons' },
      { name: 'Cardigan bébé', category: 'pull_knitwear', priceRange: [3900, 6900], gender: 'Enfant', materials: '100% Laine mérinos bio GOTS', fit: 'Regular', season: 'Automne-Hiver' },
      { name: 'Robe enfant smockée', category: 'robe', priceRange: [4900, 8900], gender: 'Enfant', materials: '100% Coton voile GOTS', fit: 'Regular', season: 'Printemps-Été' },
      { name: 'Salopette enfant', category: 'pantalon', priceRange: [3900, 6900], gender: 'Enfant', materials: '100% Coton canvas bio', fit: 'Regular', season: 'Toutes saisons' },
      { name: 'Veste réversible', category: 'veste_blouson', priceRange: [4900, 7900], gender: 'Enfant', materials: 'Coton canvas + coton imprimé', fit: 'Regular', season: 'Printemps-Automne' },
    ],
    colors: [
      { name: 'Blanc naturel', code: '#FAF7F2' },
      { name: 'Caramel doux', code: '#C8956C' },
      { name: 'Vert sauge', code: '#8FA88A' },
    ],
    sizeSet: ['0-3M', '3-6M', '6-12M', '12-18M', '18-24M', '2Y', '4Y', '6Y', '8Y'],
    styleId: 'style_mini_enfant',
  },
  {
    id: 'louis_renard',
    email: 'louis.renard@kpsull.fr',
    name: 'Louis Renard',
    brandName: 'Renard Outerwear',
    brandStyle: 'Techwear modulaire futuriste — ripstop technique, fermetures YKK, coutures sellées, systèmes modulaires',
    slug: 'louis-renard',
    phone: '06 56 78 90 12',
    address: '18 avenue Montaigne',
    city: 'Paris',
    postalCode: '75008',
    plan: Plan.STUDIO,
    siret: '12345678901005',
    stripeAccountId: 'acct_louis_renard_demo',
    collections: [
      { name: 'System_01', desc: 'Noir technique stealth, système modulaire de poches, ingénierie pure' },
      { name: 'Terroir', desc: 'Toile cirée tons terre, héritage fonctionnel, beauté utilitaire' },
      { name: 'Surplus', desc: 'Surplus militaire réinterprété, olive-rouille-sable, précision tactique' },
    ],
    products: [
      { name: 'Parka modulaire', category: 'manteau', priceRange: [24900, 39900], gender: 'Homme', materials: '100% Nylon ripstop déperlant, coutures sellées', fit: 'Regular', season: 'Automne-Hiver' },
      { name: 'Manteau architecturale', category: 'manteau', priceRange: [29900, 49900], gender: 'Homme', materials: 'Laine-nylon 80/20', fit: 'Oversize architectural', season: 'Automne-Hiver' },
      { name: 'Veste matelassée', category: 'veste_blouson', priceRange: [16900, 24900], gender: 'Homme', materials: 'Ripstop nylon + isolant technique', fit: 'Regular', season: 'Automne-Hiver' },
      { name: 'Trench technique', category: 'manteau', priceRange: [22900, 36900], gender: 'Homme', materials: 'Coton-nylon ciré, coutures sellées', fit: 'Regular', season: 'Printemps-Automne' },
      { name: 'Blouson aviateur', category: 'veste_blouson', priceRange: [18900, 29900], gender: 'Homme', materials: 'Nylon technique + côtes tricotées', fit: 'Regular', season: 'Automne-Hiver' },
    ],
    colors: [
      { name: 'Noir technique', code: '#0D0D0D' },
      { name: 'Olive terrain', code: '#5A6340' },
      { name: 'Marine profond', code: '#0C1A2E' },
    ],
    sizeSet: ['S', 'M', 'L', 'XL', 'XXL'],
    styleId: 'style_mini_techwear',
  },
  {
    id: 'camille_petit',
    email: 'camille.petit@kpsull.fr',
    name: 'Camille Petit',
    brandName: 'Studio Camille',
    brandStyle: 'Romantique botanical prints — illustrations botaniques à la main sur soie, velours, coton liberty',
    slug: 'camille-petit',
    phone: '06 67 89 01 23',
    address: '33 rue de Bretagne',
    city: 'Paris',
    postalCode: '75003',
    plan: Plan.STUDIO,
    siret: '12345678901006',
    stripeAccountId: 'acct_camille_petit_demo',
    collections: [
      { name: 'Herbier', desc: 'Soie imprimée herbier, tons sauge et ivoire, romantisme éthéré' },
      { name: 'Valse', desc: 'Velours tons bijoux, bordeaux et émeraude, romantisme théâtral' },
      { name: 'Plein Air', desc: 'Coton liberty fleuri, tons rose et crème, romantisme pastoral quotidien' },
    ],
    products: [
      { name: 'Robe midi botanique', category: 'robe', priceRange: [8900, 14900], gender: 'Femme', materials: 'Mélange soie imprimé illustration main', fit: 'Regular', season: 'Printemps-Été' },
      { name: 'Blouse romantique', category: 'tshirt', priceRange: [5900, 9900], gender: 'Femme', materials: '100% Georgette de soie', fit: 'Loose', season: 'Printemps-Été' },
      { name: 'Jupe évasée imprimée', category: 'robe', priceRange: [6900, 10900], gender: 'Femme', materials: 'Coton-soie imprimé liberty', fit: 'Évasé circulaire', season: 'Toutes saisons' },
      { name: 'Robe velours maxi', category: 'robe', priceRange: [11900, 18900], gender: 'Femme', materials: '100% Velours de soie froissé', fit: 'Regular', season: 'Automne-Hiver' },
      { name: 'Robe portefeuille', category: 'robe', priceRange: [7900, 13900], gender: 'Femme', materials: 'Coton liberty imprimé botanique', fit: 'Portefeuille', season: 'Printemps-Été' },
    ],
    colors: [
      { name: 'Rose poudré', code: '#E8C4BC' },
      { name: 'Ivoire', code: '#F8F4E8' },
      { name: 'Bordeaux profond', code: '#6B1E2E' },
    ],
    sizeSet: ['XS', 'S', 'M', 'L', 'XL'],
    styleId: 'style_mini_romantique',
  },
];

// ─── Clients ──────────────────────────────────────────────────────────────────

const FIRST_NAMES = ['Marie', 'Thomas', 'Emma', 'Nicolas', 'Camille', 'Lucas', 'Léa', 'Pierre', 'Sophie', 'Antoine',
  'Julie', 'Alexandre', 'Manon', 'Julien', 'Chloé', 'Maxime', 'Laura', 'Romain', 'Alice', 'Florian',
  'Jade', 'Hugo', 'Inès', 'Baptiste', 'Anaïs', 'Théo', 'Pauline', 'Quentin', 'Clara', 'Mathieu',
  'Sarah', 'Louis', 'Charlotte', 'Raphaël', 'Élodie', 'Kevin', 'Marine', 'Alexis', 'Valentine', 'Guillaume'];
const LAST_NAMES = ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau',
  'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier',
  'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefevre', 'Faure', 'André'];
const CITIES: Array<{ city: string; postalCode: string }> = [
  { city: 'Paris', postalCode: '75001' }, { city: 'Lyon', postalCode: '69001' },
  { city: 'Marseille', postalCode: '13001' }, { city: 'Bordeaux', postalCode: '33000' },
  { city: 'Nantes', postalCode: '44000' }, { city: 'Toulouse', postalCode: '31000' },
  { city: 'Strasbourg', postalCode: '67000' }, { city: 'Nice', postalCode: '06000' },
  { city: 'Montpellier', postalCode: '34000' }, { city: 'Rennes', postalCode: '35000' },
];

function generateClients(): Array<{
  id: string; email: string; name: string; phone: string;
  address: string; city: string; postalCode: string;
}> {
  const clients = [];
  const used = new Set<string>();

  for (let i = 0; i < 50; i++) {
    let firstName: string, lastName: string, emailKey: string;
    do {
      firstName = FIRST_NAMES[i % FIRST_NAMES.length]!;
      lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]!;
      emailKey = `${firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}${i > 0 ? i : ''}`;
    } while (used.has(emailKey));
    used.add(emailKey);

    const location = CITIES[i % CITIES.length]!;
    clients.push({
      id: `client_mini_${i + 1}`,
      email: `${emailKey}@email.fr`,
      name: `${firstName} ${lastName}`,
      phone: `06 ${String(10 + i).padStart(2, '0')} ${String(30 + i % 70).padStart(2, '0')} ${String(40 + i % 60).padStart(2, '0')} ${String(50 + i % 50).padStart(2, '0')}`,
      address: `${i + 1} rue des Fleurs`,
      city: location.city,
      postalCode: location.postalCode,
    });
  }
  return clients;
}

// ─── Seed admin ───────────────────────────────────────────────────────────────

async function seedAdmin(hashedPassword: string): Promise<void> {
  await prisma.user.upsert({
    where: { email: 'admin@kpsull.fr' },
    update: {},
    create: {
      id: 'user_admin_mini',
      email: 'admin@kpsull.fr',
      name: 'Admin Kpsull',
      role: Role.ADMIN,
      accountTypeChosen: true,
      emailVerified: new Date(),
      hashedPassword,
    },
  });
  console.log('   ✓ Admin créé');
}

// ─── Seed styles système ──────────────────────────────────────────────────────

async function seedStyles(): Promise<void> {
  for (const s of MINI_STYLES) {
    await prisma.style.upsert({
      where: { id: s.id },
      update: { name: s.name },
      create: {
        id: s.id,
        name: s.name,
        isCustom: false,
        status: 'APPROVED',
      },
    });
  }
  console.log(`   ✓ ${MINI_STYLES.length} styles système créés`);
}

// ─── Seed créateur ────────────────────────────────────────────────────────────

async function seedCreator(
  def: MiniCreatorDef,
  hashedPassword: string,
  checkpoint: MiniCheckpoint,
): Promise<string[]> {
  const userId = `user_${def.id}`;

  // 1. User
  await prisma.user.upsert({
    where: { email: def.email },
    update: {
      image: checkpoint.images[`profile_${def.id}`]?.images[0] ?? null,
    },
    create: {
      id: userId,
      email: def.email,
      name: def.name,
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: def.phone,
      address: def.address,
      city: def.city,
      postalCode: def.postalCode,
      country: 'France',
      image: checkpoint.images[`profile_${def.id}`]?.images[0] ?? null,
    },
  });

  // 2. Subscription
  await prisma.subscription.upsert({
    where: { userId },
    update: {},
    create: {
      id: `sub_${def.id}`,
      userId,
      creatorId: userId,
      plan: def.plan,
      status: SubscriptionStatus.ACTIVE,
      billingInterval: 'year',
      currentPeriodStart: daysAgo(90),
      currentPeriodEnd: daysFromNow(275),
      commissionRate: def.plan === Plan.ESSENTIEL ? 0.05 : def.plan === Plan.STUDIO ? 0.04 : 0.03,
      productsUsed: def.collections.length * def.products.length,
      stripeSubscriptionId: `sub_demo_${def.id}`,
      stripeCustomerId: `cus_demo_${def.id}`,
      stripePriceId: `price_demo_${def.plan.toLowerCase()}_year`,
    },
  });

  // 3. Onboarding
  await prisma.creatorOnboarding.upsert({
    where: { userId },
    update: {},
    create: {
      id: `onb_${def.id}`,
      userId,
      currentStep: OnboardingStep.COMPLETED,
      professionalInfoCompleted: true,
      siretVerified: true,
      stripeOnboarded: true,
      brandName: def.brandName,
      siret: def.siret,
      professionalAddress: `${def.address}, ${def.postalCode} ${def.city}`,
      stripeAccountId: def.stripeAccountId,
      dashboardTourCompleted: true,
      completedAt: daysAgo(80),
    },
  });

  // 4. Creator page
  const bannerImage = checkpoint.images[`banner_${def.id}`]?.images[0] ?? null;
  await prisma.creatorPage.upsert({
    where: { creatorId: userId },
    update: { bannerImage },
    create: {
      id: `page_${def.id}`,
      creatorId: userId,
      slug: def.slug,
      title: def.brandName,
      description: `Découvrez ${def.brandName} — ${def.brandStyle}`,
      tagline: def.brandStyle.split(',')[0]!.trim(),
      bannerImage,
      status: PageStatus.PUBLISHED,
      publishedAt: daysAgo(60),
    },
  });

  // Page sections
  await prisma.pageSection.upsert({
    where: { id: `section_hero_${def.id}` },
    update: {},
    create: {
      id: `section_hero_${def.id}`,
      pageId: `page_${def.id}`,
      type: SectionType.HERO,
      title: def.brandName,
      content: { subtitle: def.brandStyle.split(',')[0], ctaText: 'Découvrir', ctaLink: `/${def.slug}` },
      position: 0,
      isVisible: true,
    },
  });
  await prisma.pageSection.upsert({
    where: { id: `section_products_${def.id}` },
    update: {},
    create: {
      id: `section_products_${def.id}`,
      pageId: `page_${def.id}`,
      type: SectionType.PRODUCTS_FEATURED,
      title: 'Nos créations',
      content: { subtitle: 'Sélection exclusive', displayCount: 6 },
      position: 1,
      isVisible: true,
    },
  });

  // 5. Collections + Produits + Variantes
  const productIds: string[] = [];

  for (let colIdx = 0; colIdx < def.collections.length; colIdx++) {
    const colDef = def.collections[colIdx]!;
    const projectId = `proj_${def.id}_${colIdx}`;
    const coverImage = checkpoint.images[`cover_${def.id}_${colIdx}`]?.images[0] ?? null;

    await prisma.project.upsert({
      where: { id: projectId },
      update: { coverImage },
      create: {
        id: projectId,
        creatorId: userId,
        name: colDef.name,
        description: colDef.desc,
        coverImage,
      },
    });

    for (let prodIdx = 0; prodIdx < def.products.length; prodIdx++) {
      const prod = def.products[prodIdx]!;
      const productId = `prod_${def.id}_${colIdx}_${prodIdx}`;
      const productName = `${prod.name} — ${colDef.name}`;

      await prisma.product.upsert({
        where: { id: productId },
        update: {},
        create: {
          id: productId,
          creatorId: userId,
          projectId,
          name: productName,
          description: `${productName}. ${def.brandStyle}. ${prod.materials}.`,
          price: randInt(prod.priceRange[0], prod.priceRange[1]),
          currency: 'EUR',
          status: ProductStatus.PUBLISHED,
          publishedAt: daysAgo(randInt(5, 90)),
          category: prod.category,
          gender: prod.gender,
          materials: prod.materials,
          fit: prod.fit,
          season: prod.season,
          madeIn: 'France',
          careInstructions: 'Lavage 30°C délicat',
          styleId: def.styleId,
        },
      });

      productIds.push(productId);

      // 3 variantes (couleurs fixes)
      for (let colorIdx = 0; colorIdx < def.colors.length; colorIdx++) {
        const col = def.colors[colorIdx]!;
        const variantId = `var_${def.id}_${colIdx}_${prodIdx}_${colorIdx}`;
        const variantImages = checkpoint.images[variantId]?.images ?? [];

        await prisma.productVariant.upsert({
          where: { id: variantId },
          update: { images: variantImages },
          create: {
            id: variantId,
            productId,
            name: col.name,
            color: col.name,
            colorCode: col.code,
            images: variantImages,
            stock: 0,
          },
        });

        // SKUs par taille
        for (const size of def.sizeSet) {
          await prisma.productSku.upsert({
            where: { productId_variantId_size: { productId, variantId, size } },
            update: {},
            create: {
              productId,
              variantId,
              size,
              stock: randInt(5, 25),
            },
          });
        }
      }
    }
  }

  console.log(`   ✓ ${def.name} — ${def.collections.length} collections, ${productIds.length} produits, ${def.colors.length} couleurs`);
  return productIds;
}

// ─── Seed clients ──────────────────────────────────────────────────────────────

async function seedClients(hashedPassword: string): Promise<Array<{ id: string; name: string; email: string; city: string; postalCode: string; address: string }>> {
  const clients = generateClients();
  const result = [];

  for (const c of clients) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        id: c.id,
        email: c.email,
        name: c.name,
        role: Role.CLIENT,
        accountTypeChosen: true,
        emailVerified: new Date(),
        hashedPassword,
        phone: c.phone,
        address: c.address,
        city: c.city,
        postalCode: c.postalCode,
        country: 'France',
      },
    });
    result.push({ id: c.id, name: c.name, email: c.email, city: c.city, postalCode: c.postalCode, address: c.address });
  }

  console.log(`   ✓ ${clients.length} clients créés`);
  return result;
}

// ─── Seed commandes ────────────────────────────────────────────────────────────

async function seedOrders(
  clients: Array<{ id: string; name: string; email: string; city: string; postalCode: string; address: string }>,
  allCreatorProductIds: Map<string, string[]>,
): Promise<void> {
  const ORDER_STATUSES: OrderStatus[] = [
    OrderStatus.PENDING, OrderStatus.PENDING,
    OrderStatus.PAID, OrderStatus.PAID, OrderStatus.PAID,
    OrderStatus.SHIPPED, OrderStatus.SHIPPED, OrderStatus.SHIPPED, OrderStatus.SHIPPED,
    OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
    OrderStatus.COMPLETED, OrderStatus.COMPLETED, OrderStatus.COMPLETED,
    OrderStatus.CANCELED,
  ];

  const creatorIds = [...allCreatorProductIds.keys()];
  let orderCount = 0;

  for (let i = 0; i < 150; i++) {
    const client = clients[i % clients.length]!;
    const creatorId = creatorIds[i % creatorIds.length]!;
    const productIds = allCreatorProductIds.get(creatorId) ?? [];
    if (productIds.length === 0) continue;

    const productId = productIds[i % productIds.length]!;
    const status = pick(ORDER_STATUSES);
    const price = randInt(3900, 19900);
    const quantity = randInt(1, 3);
    const orderNumber = `ORD-MINI-${String(i + 1).padStart(4, '0')}`;
    const createdDaysAgo = randInt(1, 180);

    // Check for existing order to avoid duplicate orderNumber
    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (existing) continue;

    await prisma.order.create({
      data: {
        orderNumber,
        creatorId: `user_${creatorId}`,
        customerId: client.id,
        customerName: client.name,
        customerEmail: client.email,
        status,
        totalAmount: price * quantity,
        shippingStreet: client.address,
        shippingCity: client.city,
        shippingPostalCode: client.postalCode,
        shippingCountry: 'France',
        shippedAt: (['SHIPPED', 'DELIVERED', 'COMPLETED'] as string[]).includes(status)
          ? daysAgo(createdDaysAgo - 2) : null,
        deliveredAt: (['DELIVERED', 'COMPLETED'] as string[]).includes(status)
          ? daysAgo(createdDaysAgo - 5) : null,
        createdAt: daysAgo(createdDaysAgo),
        items: {
          create: [{
            productId,
            productName: `Produit ${productId}`,
            price,
            quantity,
          }],
        },
      },
    });
    orderCount++;
  }

  console.log(`   ✓ ${orderCount} commandes créées`);
}

// ─── Seed modèles manquants ────────────────────────────────────────────────────

async function seedMissingModels(): Promise<void> {
  console.log('▶ Modèles complémentaires...');

  const clientUserIds = Array.from({ length: 50 }, (_, i) => `client_mini_${i + 1}`);
  const adminUserId = 'user_admin_mini';

  // 1. NotificationPreference — 3 types × 50 clients = 150 entrées
  const notifTypes = ['ORDER_RECEIVED', 'RETURN_APPROVED', 'REVIEW_RECEIVED'];
  const notificationPreferenceData = clientUserIds.flatMap((userId, userIdx) =>
    notifTypes.map((type, typeIdx) => ({
      id: `notif_mini_${userIdx * notifTypes.length + typeIdx + 1}`,
      userId,
      type,
      email: true,
      inApp: true,
    })),
  );
  await prisma.notificationPreference.createMany({
    data: notificationPreferenceData,
    skipDuplicates: true,
  });
  console.log(`   ✓ ${notificationPreferenceData.length} préférences de notification créées`);

  // 2. Cart — 5 premiers clients avec 2-3 items chacun
  const cartData = [
    {
      id: 'cart_mini_1',
      userId: 'client_mini_1',
      items: [
        { productId: 'prod_hugo_tessier_0_0', variantId: 'var_hugo_tessier_0_0_0', name: 'Veste déconstruite — Void', price: 16900, quantity: 1, creatorSlug: 'hugo-tessier' },
        { productId: 'prod_hugo_tessier_0_1', variantId: 'var_hugo_tessier_0_1_1', name: 'Cargo déconstruit — Void', price: 11900, quantity: 2, creatorSlug: 'hugo-tessier' },
      ],
    },
    {
      id: 'cart_mini_2',
      userId: 'client_mini_2',
      items: [
        { productId: 'prod_nadia_forte_0_0', variantId: 'var_nadia_forte_0_0_0', name: 'Body dentelle — Dentelle Héritage', price: 7900, quantity: 1, creatorSlug: 'nadia-forte' },
        { productId: 'prod_nadia_forte_0_2', variantId: 'var_nadia_forte_0_2_2', name: 'Culotte taille haute — Dentelle Héritage', price: 3900, quantity: 1, creatorSlug: 'nadia-forte' },
      ],
    },
    {
      id: 'cart_mini_3',
      userId: 'client_mini_3',
      items: [
        { productId: 'prod_yasmine_larbi_0_0', variantId: 'var_yasmine_larbi_0_0_0', name: 'Collier architecture — Zellige', price: 14900, quantity: 1, creatorSlug: 'yasmine-larbi' },
        { productId: 'prod_yasmine_larbi_0_1', variantId: 'var_yasmine_larbi_0_1_0', name: 'Boucles asymétriques — Zellige', price: 8900, quantity: 1, creatorSlug: 'yasmine-larbi' },
      ],
    },
    {
      id: 'cart_mini_4',
      userId: 'client_mini_4',
      items: [
        { productId: 'prod_louis_renard_0_0', variantId: 'var_louis_renard_0_0_0', name: 'Parka modulaire — System_01', price: 31900, quantity: 1, creatorSlug: 'louis-renard' },
      ],
    },
    {
      id: 'cart_mini_5',
      userId: 'client_mini_5',
      items: [
        { productId: 'prod_camille_petit_0_0', variantId: 'var_camille_petit_0_0_1', name: 'Robe midi botanique — Herbier', price: 11900, quantity: 1, creatorSlug: 'camille-petit' },
        { productId: 'prod_camille_petit_1_3', variantId: 'var_camille_petit_1_3_2', name: 'Robe velours maxi — Valse', price: 15900, quantity: 1, creatorSlug: 'camille-petit' },
      ],
    },
  ];
  for (const cart of cartData) {
    await prisma.cart.upsert({
      where: { userId: cart.userId },
      update: { items: cart.items },
      create: { id: cart.id, userId: cart.userId, items: cart.items },
    });
  }
  console.log(`   ✓ ${cartData.length} paniers créés`);

  // 3. ReturnRequest — requête des commandes DELIVERED
  const deliveredOrders = await prisma.order.findMany({
    where: { orderNumber: { startsWith: 'ORD-MINI-' }, status: OrderStatus.DELIVERED },
    take: 6,
    orderBy: { orderNumber: 'asc' },
  });
  const returnConfigs = [
    { reason: ReturnReason.CHANGED_MIND, status: ReturnStatus.APPROVED, approvedAt: daysAgo(12) },
    { reason: ReturnReason.DEFECTIVE, status: ReturnStatus.REFUNDED, approvedAt: daysAgo(17), shippedAt: daysAgo(14), receivedAt: daysAgo(10), refundedAt: daysAgo(8) },
    { reason: ReturnReason.NOT_AS_DESCRIBED, status: ReturnStatus.REQUESTED },
    { reason: ReturnReason.OTHER, status: ReturnStatus.REJECTED, rejectedAt: daysAgo(15), rejectionReason: 'Délai de retour dépassé (30 jours)' },
    { reason: ReturnReason.DEFECTIVE, status: ReturnStatus.SHIPPED_BACK, approvedAt: daysAgo(19), shippedAt: daysAgo(16) },
    { reason: ReturnReason.CHANGED_MIND, status: ReturnStatus.RECEIVED, approvedAt: daysAgo(22), shippedAt: daysAgo(19), receivedAt: daysAgo(16) },
  ];
  for (let i = 0; i < Math.min(deliveredOrders.length, returnConfigs.length); i++) {
    const order = deliveredOrders[i]!;
    const cfg = returnConfigs[i]!;
    await prisma.returnRequest.upsert({
      where: { id: `return_mini_${i + 1}` },
      update: {},
      create: {
        id: `return_mini_${i + 1}`,
        orderId: order.id,
        customerId: order.customerId,
        creatorId: order.creatorId,
        reason: cfg.reason,
        status: cfg.status,
        deliveredAt: order.deliveredAt ?? daysAgo(20 + i),
        approvedAt: cfg.approvedAt ?? null,
        rejectedAt: cfg.rejectedAt ?? null,
        rejectionReason: cfg.rejectionReason ?? null,
        shippedAt: cfg.shippedAt ?? null,
        receivedAt: cfg.receivedAt ?? null,
        refundedAt: cfg.refundedAt ?? null,
      },
    });
  }
  console.log(`   ✓ ${Math.min(deliveredOrders.length, returnConfigs.length)} demandes de retour créées`);

  // 4. Dispute — 3 commandes DELIVERED
  const disputeOrders = await prisma.order.findMany({
    where: { orderNumber: { startsWith: 'ORD-MINI-' }, status: OrderStatus.DELIVERED },
    skip: 6,
    take: 3,
    orderBy: { orderNumber: 'asc' },
  });
  const disputeConfigs = [
    { type: DisputeType.NOT_RECEIVED, description: "Le colis indique livré mais je ne l'ai pas reçu.", status: DisputeStatus.OPEN },
    { type: DisputeType.DAMAGED, description: 'Le colis est arrivé endommagé.', status: DisputeStatus.UNDER_REVIEW },
    { type: DisputeType.WRONG_ITEM, description: "J'ai reçu un mauvais article.", status: DisputeStatus.RESOLVED, resolution: 'Remboursement intégral effectué.', resolvedAt: daysAgo(3) },
  ];
  for (let i = 0; i < Math.min(disputeOrders.length, disputeConfigs.length); i++) {
    const order = disputeOrders[i]!;
    const cfg = disputeConfigs[i]!;
    await prisma.dispute.upsert({
      where: { id: `dispute_mini_${i + 1}` },
      update: {},
      create: {
        id: `dispute_mini_${i + 1}`,
        orderId: order.id,
        customerId: order.customerId,
        creatorId: order.creatorId,
        type: cfg.type,
        description: cfg.description,
        status: cfg.status,
        resolution: cfg.resolution ?? null,
        resolvedAt: cfg.resolvedAt ?? null,
      },
    });
  }
  console.log(`   ✓ ${Math.min(disputeOrders.length, disputeConfigs.length)} litiges créés`);

  // 5. PlatformTransaction — commissions sur 20 commandes COMPLETED
  const completedOrders = await prisma.order.findMany({
    where: { orderNumber: { startsWith: 'ORD-MINI-' }, status: OrderStatus.COMPLETED },
    take: 20,
    orderBy: { orderNumber: 'asc' },
  });
  const platformTxData = completedOrders.map((order, i) => ({
    id: `ptx_mini_${i + 1}`,
    type: PlatformTransactionType.COMMISSION,
    status: PlatformTransactionStatus.CAPTURED,
    amount: Math.round(order.totalAmount * 0.08),
    creatorId: order.creatorId,
    orderId: order.id,
    subscriptionId: null,
    period: new Date(order.createdAt.getFullYear(), order.createdAt.getMonth(), 1),
  }));
  await prisma.platformTransaction.createMany({ data: platformTxData, skipDuplicates: true });
  console.log(`   ✓ ${platformTxData.length} transactions plateforme créées`);

  // 6. Invoice — CLIENT_ORDER pour commandes COMPLETED + CREATOR_SUBSCRIPTION pour créateurs
  const invoiceOrdersAll = await prisma.order.findMany({
    where: { orderNumber: { startsWith: 'ORD-MINI-' }, status: OrderStatus.COMPLETED },
    take: 20,
    orderBy: { orderNumber: 'asc' },
  });
  const invoiceData: Array<{
    id: string; number: string; type: InvoiceType; status: InvoiceStatus;
    amount: number; taxAmount: number; totalAmount: number;
    creatorId: string | null; clientId: string | null; orderId: string | null;
    period: Date | null; issuedAt: Date | null; paidAt: Date | null;
  }> = [];
  invoiceOrdersAll.forEach((order, i) => {
    const amountHT = Math.round(order.totalAmount / 1.2);
    invoiceData.push({
      id: `inv_mini_${i + 1}`,
      number: `INV-MINI-${String(i + 1).padStart(4, '0')}`,
      type: InvoiceType.CLIENT_ORDER,
      status: InvoiceStatus.PAID,
      amount: amountHT,
      taxAmount: order.totalAmount - amountHT,
      totalAmount: order.totalAmount,
      creatorId: null,
      clientId: order.customerId,
      orderId: order.id,
      period: null,
      issuedAt: daysAgo(30 - i),
      paidAt: daysAgo(28 - i),
    });
  });
  MINI_CREATORS.forEach((creator, i) => {
    const subAmount = creator.plan === Plan.ESSENTIEL ? 2900 : creator.plan === Plan.STUDIO ? 7900 : 9500;
    const taxAmount = Math.round(subAmount * 0.2);
    invoiceData.push({
      id: `inv_mini_${invoiceOrdersAll.length + i + 1}`,
      number: `INV-MINI-${String(invoiceOrdersAll.length + i + 1).padStart(4, '0')}`,
      type: InvoiceType.CREATOR_SUBSCRIPTION,
      status: InvoiceStatus.PAID,
      amount: subAmount,
      taxAmount,
      totalAmount: subAmount + taxAmount,
      creatorId: `user_${creator.id}`,
      clientId: null,
      orderId: null,
      period: new Date(2026, 1, 1),
      issuedAt: daysAgo(90),
      paidAt: daysAgo(89),
    });
  });
  await prisma.invoice.createMany({ data: invoiceData, skipDuplicates: true });
  console.log(`   ✓ ${invoiceData.length} factures créées`);

  // 7. FlaggedContent — 2 signalements
  await prisma.flaggedContent.createMany({
    data: [
      {
        id: 'flag_mini_1',
        contentId: 'prod_hugo_tessier_0_0',
        contentType: 'PRODUCT',
        contentTitle: 'Veste déconstruite — Void',
        creatorId: 'user_hugo_tessier',
        flaggedBy: 'client_mini_1',
        flagReason: FlagReason.MISLEADING_DESCRIPTION,
        flagDetails: 'La description ne correspond pas aux matières réellement utilisées.',
        status: ModerationStatus.PENDING,
        flaggedAt: daysAgo(7),
      },
      {
        id: 'flag_mini_2',
        contentId: 'prod_yasmine_larbi_2_4',
        contentType: 'PRODUCT',
        contentTitle: 'Parure complète — Nuit de Blida',
        creatorId: 'user_yasmine_larbi',
        flaggedBy: 'client_mini_2',
        flagReason: FlagReason.COUNTERFEIT,
        flagDetails: "Les bijoux semblent être des copies de créations d'une autre marque.",
        status: ModerationStatus.APPROVED,
        moderatorId: adminUserId,
        moderatorNote: "Après vérification, il s'agit d'une création originale.",
        flaggedAt: daysAgo(14),
        moderatedAt: daysAgo(10),
      },
    ],
    skipDuplicates: true,
  });
  console.log('   ✓ 2 contenus signalés créés');

  // 8. ModerationActionRecord — 1 par signalement
  await prisma.moderationActionRecord.createMany({
    data: [
      { id: 'modaction_mini_1', flaggedContentId: 'flag_mini_1', action: ModerationActionType.APPROVE, moderatorId: adminUserId, note: 'Contenu en attente de révision.', createdAt: daysAgo(6) },
      { id: 'modaction_mini_2', flaggedContentId: 'flag_mini_2', action: ModerationActionType.APPROVE, moderatorId: adminUserId, note: 'Création originale vérifiée. Signalement rejeté.', createdAt: daysAgo(10) },
    ],
    skipDuplicates: true,
  });
  console.log('   ✓ 2 actions de modération créées');

  // 9. CreatorSuspension — 1 suspension levée pour historique
  await prisma.creatorSuspension.upsert({
    where: { id: 'suspension_mini_1' },
    update: {},
    create: {
      id: 'suspension_mini_1',
      creatorId: 'user_louis_renard',
      suspendedBy: adminUserId,
      reason: 'Litige non résolu avec un client et non-réponse aux communications sur 7 jours.',
      suspendedAt: daysAgo(30),
      reactivatedAt: daysAgo(20),
      reactivatedBy: adminUserId,
      reactivationReason: "Le créateur a résolu le litige et s'est engagé à respecter les délais de réponse.",
    },
  });
  console.log('   ✓ 1 suspension créateur créée (levée)');
}

// ─── Cleanup ───────────────────────────────────────────────────────────────────

async function cleanupMiniSeedData(): Promise<void> {
  console.log('🧹 Nettoyage des données mini-seed existantes...');

  const creatorUserIds = MINI_CREATORS.map((c) => `user_${c.id}`);
  const clientUserIds = Array.from({ length: 50 }, (_, i) => `client_mini_${i + 1}`);
  const adminUserId = 'user_admin_mini';
  const allMiniUserIds = [...creatorUserIds, ...clientUserIds, adminUserId];

  // 0. Modèles complémentaires (doivent être supprimés avant commandes et utilisateurs)
  await prisma.moderationActionRecord.deleteMany({ where: { id: { startsWith: 'modaction_mini_' } } });
  await prisma.flaggedContent.deleteMany({ where: { id: { startsWith: 'flag_mini_' } } });
  await prisma.creatorSuspension.deleteMany({ where: { id: { startsWith: 'suspension_mini_' } } });
  await prisma.platformTransaction.deleteMany({ where: { id: { startsWith: 'ptx_mini_' } } });
  await prisma.invoice.deleteMany({ where: { id: { startsWith: 'inv_mini_' } } });
  await prisma.dispute.deleteMany({ where: { id: { startsWith: 'dispute_mini_' } } });
  await prisma.returnRequest.deleteMany({ where: { id: { startsWith: 'return_mini_' } } });
  await prisma.cart.deleteMany({ where: { id: { startsWith: 'cart_mini_' } } });
  await prisma.notificationPreference.deleteMany({ where: { userId: { startsWith: 'client_mini_' } } });
  console.log('   ✓ Modèles complémentaires supprimés');

  // 1. Commandes (OrderItems supprimés en cascade via onDelete:Cascade)
  const deleted = await prisma.order.deleteMany({
    where: { orderNumber: { startsWith: 'ORD-MINI-' } },
  });
  console.log(`   ✓ ${deleted.count} commandes supprimées`);

  // 2. ProductSkus → ProductVariants → Products (cascade via FK)
  const productIds = MINI_CREATORS.flatMap((c) =>
    c.collections.flatMap((_, colIdx) =>
      c.products.map((_, prodIdx) => `prod_${c.id}_${colIdx}_${prodIdx}`),
    ),
  );

  const variantIds = MINI_CREATORS.flatMap((c) =>
    c.collections.flatMap((_, colIdx) =>
      c.products.flatMap((_, prodIdx) =>
        c.colors.map((_, colorIdx) => `var_${c.id}_${colIdx}_${prodIdx}_${colorIdx}`),
      ),
    ),
  );

  const skusDeleted = await prisma.productSku.deleteMany({
    where: { variantId: { in: variantIds } },
  });
  console.log(`   ✓ ${skusDeleted.count} SKUs supprimés`);

  const variantsDeleted = await prisma.productVariant.deleteMany({
    where: { id: { in: variantIds } },
  });
  console.log(`   ✓ ${variantsDeleted.count} variantes supprimées`);

  const productsDeleted = await prisma.product.deleteMany({
    where: { id: { in: productIds } },
  });
  console.log(`   ✓ ${productsDeleted.count} produits supprimés`);

  // 3. Projects
  const projectIds = MINI_CREATORS.flatMap((c) =>
    c.collections.map((_, colIdx) => `proj_${c.id}_${colIdx}`),
  );
  const projectsDeleted = await prisma.project.deleteMany({
    where: { id: { in: projectIds } },
  });
  console.log(`   ✓ ${projectsDeleted.count} projets supprimés`);

  // 4. PageSections
  const pageSectionIds = MINI_CREATORS.flatMap((c) => [
    `section_hero_${c.id}`,
    `section_products_${c.id}`,
  ]);
  const sectionsDeleted = await prisma.pageSection.deleteMany({
    where: { id: { in: pageSectionIds } },
  });
  console.log(`   ✓ ${sectionsDeleted.count} sections de page supprimées`);

  // 5. CreatorPages
  const pageIds = MINI_CREATORS.map((c) => `page_${c.id}`);
  const pagesDeleted = await prisma.creatorPage.deleteMany({
    where: { id: { in: pageIds } },
  });
  console.log(`   ✓ ${pagesDeleted.count} pages créateur supprimées`);

  // 6. CreatorOnboardings
  const onboardingIds = MINI_CREATORS.map((c) => `onb_${c.id}`);
  const onboardingsDeleted = await prisma.creatorOnboarding.deleteMany({
    where: { id: { in: onboardingIds } },
  });
  console.log(`   ✓ ${onboardingsDeleted.count} onboardings supprimés`);

  // 7. Subscriptions
  const subIds = MINI_CREATORS.map((c) => `sub_${c.id}`);
  const subsDeleted = await prisma.subscription.deleteMany({
    where: { id: { in: subIds } },
  });
  console.log(`   ✓ ${subsDeleted.count} abonnements supprimés`);

  // 8. Users (créateurs + clients + admin)
  const usersDeleted = await prisma.user.deleteMany({
    where: { id: { in: allMiniUserIds } },
  });
  console.log(`   ✓ ${usersDeleted.count} utilisateurs supprimés`);

  // 9. Styles système mini
  const stylesDeleted = await prisma.style.deleteMany({
    where: { id: { in: MINI_STYLES.map((s) => s.id) } },
  });
  console.log(`   ✓ ${stylesDeleted.count} styles supprimés`);

  console.log('');
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  SEED MINI — KPSULL MARKETPLACE              ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('6 créateurs × 3 collections × 5 produits × 3 variantes');
  console.log('50 clients | 150 commandes');
  console.log('');

  // Nettoyage préalable
  await cleanupMiniSeedData();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Chargement checkpoint images
  const checkpoint = loadMiniCheckpoint();
  const completedImages = Object.keys(checkpoint.images).length;
  console.log(`📸 Checkpoint images: ${completedImages} entrées`);
  console.log('');

  // Styles système (requis avant les produits)
  console.log('▶ Styles système...');
  await seedStyles();

  // Admin
  console.log('▶ Admin...');
  await seedAdmin(hashedPassword);

  // Créateurs
  console.log('▶ Créateurs...');
  const allCreatorProductIds = new Map<string, string[]>();

  for (const creatorDef of MINI_CREATORS) {
    const productIds = await seedCreator(creatorDef, hashedPassword, checkpoint);
    allCreatorProductIds.set(creatorDef.id, productIds);
  }

  // Clients
  console.log('▶ Clients...');
  const clients = await seedClients(hashedPassword);

  // Commandes
  console.log('▶ Commandes...');
  await seedOrders(clients, allCreatorProductIds);

  // Modèles complémentaires
  await seedMissingModels();

  // Résumé
  const totalVariants = MINI_CREATORS.length * 3 * 5 * 3;
  const totalImages = MINI_CREATORS.length * 2 + MINI_CREATORS.length * 3 + totalVariants * 2;
  const imagesGenerated = completedImages;

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  RÉSUMÉ                                      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`Créateurs:      ${MINI_CREATORS.length}`);
  console.log(`Collections:    ${MINI_CREATORS.length * 3}`);
  console.log(`Produits:       ${MINI_CREATORS.length * 3 * 5}`);
  console.log(`Variantes:      ${totalVariants}`);
  console.log(`Clients:        50`);
  console.log(`Commandes:      ~150`);
  console.log(`Images totales: ${totalImages}`);
  console.log(`Images seeded:  ${imagesGenerated} / ${totalImages}`);
  console.log('');

  if (imagesGenerated < totalImages) {
    console.log('💡 Pour générer les images manquantes :');
    console.log('   bun prisma/scripts/generate-images-gemini.ts --mini');
    console.log('   Puis relancer: bun prisma/seed-mini.ts');
  } else {
    console.log('✅ Seed complet avec toutes les images !');
  }
  console.log('');
}

main()
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
