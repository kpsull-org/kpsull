/**
 * Prisma Seed - Données de développement pour Kpsull Marketplace
 *
 * Crée:
 * - 1 admin (admin@kpsull.fr)
 * - 3 créateurs : Hugo Tessier, Léa Fontaine, Kais Benali
 * - 5 clients avec profils complets
 * - 18 produits (3 créateurs × 2 collections × 3 produits)
 * - Variantes et SKUs (images dans variantes, variantId non-null)
 * - 8 commandes de test
 * - Pages, sections, styles, notifications, paniers
 *
 * Tous les comptes utilisent le mot de passe: password123
 *
 * IMPORTANT: Ce seed utilise le nouveau modèle de données :
 *   - Les images sont dans ProductVariant.images (Json)
 *   - Pas de ProductImage
 *   - variantId dans ProductSku est toujours non-null
 *   - La variante "défaut" a color: "unique", colorCode: "#000000"
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
  DisputeType,
  DisputeStatus,
  FlagReason,
  ModerationStatus,
  ModerationActionType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import * as fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/kpsull-db';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================
// HELPERS
// ============================================

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function ensureSeedImages(): Promise<void> {
  const jsonPath = './prisma/seed-assets/product-images.json';

  if (fs.existsSync(jsonPath)) {
    console.log('Images seed deja generees (cache trouve)\n');
    return;
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('Variables Cloudinary absentes - seed sans images\n');
    return;
  }

  console.log('Generation des images seed (premiere execution)...');
  console.log('   ~30s avec Picsum (fallback gratuit) | quelques minutes avec Unsplash\n');

  execFileSync('bun', ['prisma/scripts/upload-seed-images.ts'], {
    stdio: 'inherit',
    env: { ...process.env, PATH: '/usr/local/bin:/usr/bin:/bin' },
  });

  console.log('\nImages generees et uploadees sur Cloudinary\n');
}

interface SeedImagesOutput {
  products: Record<string, { variants: Record<string, string[]> }>;
  collections: Record<string, string>;
}

function loadSeedImages(): SeedImagesOutput {
  try {
    const raw = fs.readFileSync('./prisma/seed-assets/product-images.json', 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && 'products' in parsed) {
      return parsed as SeedImagesOutput;
    }
    return { products: {}, collections: {} };
  } catch {
    return { products: {}, collections: {} };
  }
}

function getVariantImages(
  seedImages: SeedImagesOutput,
  productId: string,
  variantId: string,
): string[] {
  return seedImages.products[productId]?.variants[variantId] ?? [];
}

async function main() {
  console.log('Seeding Kpsull marketplace database...\n');

  await ensureSeedImages();

  const hashedPassword = await bcrypt.hash('password123', 10);
  console.log('Password hashed for all accounts (password123)\n');

  const seedImages = loadSeedImages();

  // ============================================
  // ADMIN
  // ============================================

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kpsull.fr' },
    update: { role: Role.ADMIN, hashedPassword },
    create: {
      email: 'admin@kpsull.fr',
      name: 'Admin Kpsull',
      role: Role.ADMIN,
      accountTypeChosen: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: '+33600000000',
      address: '1 rue de la Marketplace',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
    },
  });
  console.log('Admin:', admin.email);

  // ============================================
  // CREATORS
  // ============================================

  const hugo = await prisma.user.upsert({
    where: { email: 'hugo.tessier@kpsull.fr' },
    update: { role: Role.CREATOR, hashedPassword, accountTypeChosen: true, wantsToBeCreator: true },
    create: {
      email: 'hugo.tessier@kpsull.fr',
      name: 'Hugo Tessier',
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: '+33612345678',
      address: '12 rue Oberkampf',
      city: 'Paris',
      postalCode: '75011',
      country: 'France',
    },
  });
  console.log('Creator:', hugo.email, '(streetwear urbain)');

  const lea = await prisma.user.upsert({
    where: { email: 'lea.fontaine@kpsull.fr' },
    update: { role: Role.CREATOR, hashedPassword, accountTypeChosen: true, wantsToBeCreator: true },
    create: {
      email: 'lea.fontaine@kpsull.fr',
      name: 'Lea Fontaine',
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: '+33623456789',
      address: '7 rue du Vieux-Port',
      city: 'Marseille',
      postalCode: '13002',
      country: 'France',
    },
  });
  console.log('Creator:', lea.email, '(mode artisanale)');

  const kais = await prisma.user.upsert({
    where: { email: 'kais.benali@kpsull.fr' },
    update: { role: Role.CREATOR, hashedPassword, accountTypeChosen: true, wantsToBeCreator: true },
    create: {
      email: 'kais.benali@kpsull.fr',
      name: 'Kais Benali',
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: '+33634567890',
      address: '34 avenue Jean-Jaures',
      city: 'Lyon',
      postalCode: '69007',
      country: 'France',
    },
  });
  console.log('Creator:', kais.email, '(sport & outdoor)');

  // ============================================
  // CLIENTS (5)
  // ============================================

  const clientsData = [
    { email: 'alice.bernard@example.com', name: 'Alice Bernard', phone: '+33611111111', city: 'Paris', postalCode: '75002', address: '15 rue de la Paix' },
    { email: 'bob.leroy@example.com', name: 'Bob Leroy', phone: '+33622222222', city: 'Lyon', postalCode: '69006', address: '28 avenue Victor Hugo' },
    { email: 'camille.moreau@example.com', name: 'Camille Moreau', phone: '+33633333333', city: 'Marseille', postalCode: '13001', address: '5 cours Julien' },
    { email: 'david.petit@example.com', name: 'David Petit', phone: '+33644444444', city: 'Bordeaux', postalCode: '33000', address: '18 rue Sainte-Catherine' },
    { email: 'emma.garcia@example.com', name: 'Emma Garcia', phone: '+33655555555', city: 'Toulouse', postalCode: '31000', address: '7 place du Capitole' },
  ];

  const clients: Awaited<ReturnType<typeof prisma.user.upsert>>[] = [];
  for (const c of clientsData) {
    const client = await prisma.user.upsert({
      where: { email: c.email },
      update: { hashedPassword },
      create: {
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
    clients.push(client);
  }
  console.log(`${clients.length} clients created`);

  const [alice, bob, camille, david, emma] = clients as [
    typeof clients[0], typeof clients[0], typeof clients[0],
    typeof clients[0], typeof clients[0],
  ];

  // ============================================
  // CREATOR ONBOARDING
  // ============================================

  const creatorsOnboarding = [
    { userId: hugo.id, brandName: 'Hugo Tessier Studio', siret: '11111111111111', address: '12 rue Oberkampf, 75011 Paris', stripeAccountId: 'acct_demo_hugo' },
    { userId: lea.id, brandName: 'Lea Fontaine Atelier', siret: '22222222222222', address: '7 rue du Vieux-Port, 13002 Marseille', stripeAccountId: 'acct_demo_lea' },
    { userId: kais.id, brandName: 'Kais Benali Sport', siret: '33333333333333', address: '34 avenue Jean-Jaures, 69007 Lyon', stripeAccountId: 'acct_demo_kais' },
  ];

  for (const co of creatorsOnboarding) {
    await prisma.creatorOnboarding.upsert({
      where: { userId: co.userId },
      update: {},
      create: {
        userId: co.userId,
        currentStep: OnboardingStep.COMPLETED,
        professionalInfoCompleted: true,
        siretVerified: true,
        stripeOnboarded: true,
        dashboardTourCompleted: true,
        brandName: co.brandName,
        siret: co.siret,
        professionalAddress: co.address,
        stripeAccountId: co.stripeAccountId,
        completedAt: daysAgo(30),
      },
    });
  }
  console.log('Creator onboardings created (3 creators, all COMPLETED)');

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  const subscriptionsData = [
    { userId: hugo.id, creatorId: hugo.id, plan: Plan.STUDIO, interval: 'year', productsUsed: 6, pinnedProductsUsed: 2, commissionRate: 0.04, subId: 'sub_demo_hugo', cusId: 'cus_demo_hugo', priceId: 'price_demo_studio_yearly' },
    { userId: lea.id, creatorId: lea.id, plan: Plan.ATELIER, interval: 'year', productsUsed: 6, pinnedProductsUsed: 2, commissionRate: 0.03, subId: 'sub_demo_lea', cusId: 'cus_demo_lea', priceId: 'price_demo_atelier_yearly' },
    { userId: kais.id, creatorId: kais.id, plan: Plan.STUDIO, interval: 'month', productsUsed: 6, pinnedProductsUsed: 2, commissionRate: 0.04, subId: 'sub_demo_kais', cusId: 'cus_demo_kais', priceId: 'price_demo_studio_monthly' },
  ];

  for (const sub of subscriptionsData) {
    await prisma.subscription.upsert({
      where: { userId: sub.userId },
      update: {},
      create: {
        userId: sub.userId,
        creatorId: sub.creatorId,
        plan: sub.plan,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: sub.interval,
        stripeSubscriptionId: sub.subId,
        stripeCustomerId: sub.cusId,
        stripePriceId: sub.priceId,
        currentPeriodStart: daysAgo(30),
        currentPeriodEnd: sub.interval === 'year' ? daysFromNow(335) : daysFromNow(0),
        productsUsed: sub.productsUsed,
        pinnedProductsUsed: sub.pinnedProductsUsed,
        commissionRate: sub.commissionRate,
      },
    });
  }
  console.log('Subscriptions created (3 creators)');

  // ============================================
  // PROJECTS (Collections)
  // ============================================

  const projHugoUrban = await prisma.project.upsert({
    where: { id: 'proj_hugo_urban_core' },
    update: {},
    create: { id: 'proj_hugo_urban_core', creatorId: hugo.id, name: 'Urban Core', description: 'Collection streetwear urbaine, coupes modernes et silhouettes affirmees.' },
  });

  const projHugoMono = await prisma.project.upsert({
    where: { id: 'proj_hugo_mono' },
    update: {},
    create: { id: 'proj_hugo_mono', creatorId: hugo.id, name: 'Monochrome', description: 'Palette neutre, lignes epurees — l essentiel revisited.' },
  });

  const projLeaMatiere = await prisma.project.upsert({
    where: { id: 'proj_lea_matiere' },
    update: {},
    create: { id: 'proj_lea_matiere', creatorId: lea.id, name: 'Matiere Premiere', description: 'Lin, coton naturel et matieres brutes facon a la main.' },
  });

  const projLeaEpure = await prisma.project.upsert({
    where: { id: 'proj_lea_epure' },
    update: {},
    create: { id: 'proj_lea_epure', creatorId: lea.id, name: 'Epure', description: 'Silhouettes minimalistes, pieces uniques pour femmes.' },
  });

  const projKaisTrail = await prisma.project.upsert({
    where: { id: 'proj_kais_trail' },
    update: {},
    create: { id: 'proj_kais_trail', creatorId: kais.id, name: 'Trail Ready', description: 'Vetements techniques pour le trail et l outdoor exigeant.' },
  });

  const projKaisEveryday = await prisma.project.upsert({
    where: { id: 'proj_kais_everyday' },
    update: {},
    create: { id: 'proj_kais_everyday', creatorId: kais.id, name: 'Everyday Active', description: 'Sportswear quotidien — du sport a la ville sans compromis.' },
  });

  // Mise a jour des coverImages depuis le JSON seed
  const projectCoverImages: Record<string, string> = {
    'proj_hugo_urban_core': seedImages.collections['proj_hugo_urban_core'] ?? '',
    'proj_hugo_mono': seedImages.collections['proj_hugo_mono'] ?? '',
    'proj_lea_matiere': seedImages.collections['proj_lea_matiere'] ?? '',
    'proj_lea_epure': seedImages.collections['proj_lea_epure'] ?? '',
    'proj_kais_trail': seedImages.collections['proj_kais_trail'] ?? '',
    'proj_kais_everyday': seedImages.collections['proj_kais_everyday'] ?? '',
  };

  for (const [projId, coverImage] of Object.entries(projectCoverImages)) {
    if (coverImage) {
      await prisma.project.update({ where: { id: projId }, data: { coverImage } });
    }
  }

  console.log('Projects created (6 collections) with cover images');

  // ============================================
  // SYSTEM STYLES
  // ============================================

  console.log('\nCreating system styles...');

  const systemStylesData = [
    { name: 'Streetwear', description: 'Mode urbaine, oversize, graphic tees, sneakers', imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=600&fit=crop' },
    { name: 'Minimaliste', description: 'Design epure, lignes nettes, palette neutre', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop' },
    { name: 'Sport', description: 'Vetements techniques et performants pour le sport', imageUrl: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&h=600&fit=crop' },
    { name: 'Artisanat', description: 'Pieces faites main, matieres naturelles, savoir-faire', imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=600&fit=crop' },
  ];

  const styleMap: Record<string, string> = {};
  for (const style of systemStylesData) {
    const s = await prisma.style.upsert({
      where: { name: style.name },
      update: { description: style.description, imageUrl: style.imageUrl },
      create: { name: style.name, description: style.description, imageUrl: style.imageUrl, isCustom: false, creatorId: null },
      select: { id: true, name: true },
    });
    styleMap[style.name] = s.id;
  }

  console.log(`   ${systemStylesData.length} system styles created`);

  // ============================================
  // PRODUCTS — 18 produits (3 créateurs × 2 collections × 3 produits)
  // ============================================

  type ProductData = {
    id: string;
    creatorId: string;
    projectId: string;
    name: string;
    description: string;
    price: number;
    status: ProductStatus;
    publishedAt: Date;
    category?: string;
    gender?: string;
    materials?: string;
    fit?: string;
    season?: string;
    madeIn?: string;
    careInstructions?: string;
    certifications?: string;
    weight?: number;
  };

  const allProducts: ProductData[] = [
    // ── HUGO TESSIER — Urban Core ─────────────────────────────────────────
    { id: 'prod_hugo_tshirt', creatorId: hugo.id, projectId: projHugoUrban.id, name: 'T-shirt Oversized', description: 'T-shirt oversize en coton bio 220g, coupe ample et tombante. Le basique ultime du streetwear.', price: 4900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(20), category: 'T-shirt', gender: 'Unisexe', materials: '100% Coton Bio 220g', fit: 'Oversize', season: 'Toute saison', madeIn: 'France', careInstructions: 'Lavage 30 degres', certifications: 'OEKO-TEX,GOTS Bio', weight: 220 },
    { id: 'prod_hugo_hoodie', creatorId: hugo.id, projectId: projHugoUrban.id, name: 'Hoodie Urbain', description: 'Hoodie oversize 350g molleton brosse interieur, poche kangourou double. Confort maximal.', price: 7900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(18), category: 'Sweat a capuche', gender: 'Unisexe', materials: '80% Coton Bio, 20% Polyester recycle, 350g', fit: 'Oversize', season: 'Automne-Hiver', madeIn: 'France', careInstructions: 'Lavage 30 degres a l envers', certifications: 'OEKO-TEX', weight: 350 },
    { id: 'prod_hugo_jogger', creatorId: hugo.id, projectId: projHugoUrban.id, name: 'Jogger Cargo', description: 'Jogger cargo en coton ripstop, 6 poches fonctionnelles, taille elastique ajustable.', price: 6500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(15), category: 'Pantalon', gender: 'Homme', materials: '100% Coton Ripstop', fit: 'Regular', season: 'Toute saison', madeIn: 'Portugal', careInstructions: 'Lavage 40 degres', weight: 280 },
    // ── HUGO TESSIER — Monochrome ─────────────────────────────────────────
    { id: 'prod_hugo_polo', creatorId: hugo.id, projectId: projHugoMono.id, name: 'Polo Piquet', description: 'Polo en coton piquet bio, col bord-cotes, boutons nacre. Elegance decontractee.', price: 5500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(12), category: 'Polo', gender: 'Homme', materials: '100% Coton Piquet Bio', fit: 'Regular', season: 'Printemps-Ete', madeIn: 'France', careInstructions: 'Lavage 30 degres', certifications: 'OEKO-TEX', weight: 200 },
    { id: 'prod_hugo_sweat', creatorId: hugo.id, projectId: projHugoMono.id, name: 'Sweat Col Rond', description: 'Sweat col rond en molleton bio ecru, coupe reguliere. L essentiel du dressing minimaliste.', price: 6900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(10), category: 'Sweat', gender: 'Unisexe', materials: '80% Coton Bio, 20% Polyester recycle, 300g', fit: 'Regular', season: 'Automne-Hiver', madeIn: 'France', careInstructions: 'Lavage 30 degres', certifications: 'OEKO-TEX', weight: 300 },
    { id: 'prod_hugo_short', creatorId: hugo.id, projectId: projHugoMono.id, name: 'Short Technique', description: 'Short technique en polyester recycle, coupe droite, poche zippee laterale.', price: 4500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(8), category: 'Short', gender: 'Homme', materials: '100% Polyester recycle', fit: 'Regular', season: 'Printemps-Ete', madeIn: 'Portugal', careInstructions: 'Lavage 40 degres', certifications: 'OEKO-TEX', weight: 150 },
    // ── LEA FONTAINE — Matiere Premiere ──────────────────────────────────
    { id: 'prod_lea_veste', creatorId: lea.id, projectId: projLeaMatiere.id, name: 'Veste en Lin', description: 'Veste en lin naturel tisse main, coupe structuree, doublure legere. Piece artisanale unique.', price: 14900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(22), category: 'Veste', gender: 'Femme', materials: '100% Lin naturel', fit: 'Regular', season: 'Printemps-Ete', madeIn: 'France', careInstructions: 'Lavage main 30 degres', certifications: 'OEKO-TEX', weight: 280 },
    { id: 'prod_lea_pantalon', creatorId: lea.id, projectId: projLeaMatiere.id, name: 'Pantalon Large', description: 'Pantalon a jambes larges en crepe, taille haute, coupe fluide et elegante.', price: 11900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(19), category: 'Pantalon', gender: 'Femme', materials: '70% Viscose, 30% Lin', fit: 'Wide', season: 'Printemps-Ete', madeIn: 'France', careInstructions: 'Lavage main 30 degres', weight: 180 },
    { id: 'prod_lea_chemise', creatorId: lea.id, projectId: projLeaMatiere.id, name: 'Chemise Oversize', description: 'Chemise oversize en lin blanc lavee, col classique, manches retroussables. Piece signature.', price: 8900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(16), category: 'Chemise', gender: 'Femme', materials: '100% Lin lave', fit: 'Oversize', season: 'Toute saison', madeIn: 'France', careInstructions: 'Lavage 40 degres', certifications: 'OEKO-TEX', weight: 160 },
    // ── LEA FONTAINE — Epure ─────────────────────────────────────────────
    { id: 'prod_lea_robe', creatorId: lea.id, projectId: projLeaEpure.id, name: 'Robe Longue', description: 'Robe longue en viscose fluide, col rond, manches courtes. Disponible en Terracotta et Ecru.', price: 13900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(14), category: 'Robe', gender: 'Femme', materials: '100% Viscose', fit: 'Regular', season: 'Printemps-Ete', madeIn: 'France', careInstructions: 'Lavage main 30 degres', weight: 200 },
    { id: 'prod_lea_top', creatorId: lea.id, projectId: projLeaEpure.id, name: 'Top Asymetrique', description: 'Top asymetrique noir en jersey stretch, bretelle unique, decollete geometrique. Piece editoriale.', price: 6900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(11), category: 'Top', gender: 'Femme', materials: '95% Coton, 5% Elasthane', fit: 'Slim', season: 'Toute saison', madeIn: 'France', careInstructions: 'Lavage 30 degres', certifications: 'OEKO-TEX', weight: 140 },
    { id: 'prod_lea_manteau', creatorId: lea.id, projectId: projLeaEpure.id, name: 'Manteau Court', description: 'Manteau court en laine camel double face, coupe droite structuree. Investissement intemporel.', price: 24900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(9), category: 'Manteau', gender: 'Femme', materials: '60% Laine, 40% Polyester', fit: 'Regular', season: 'Automne-Hiver', madeIn: 'France', careInstructions: 'Nettoyage a sec', weight: 600 },
    // ── KAIS BENALI — Trail Ready ─────────────────────────────────────────
    { id: 'prod_kais_veste', creatorId: kais.id, projectId: projKaisTrail.id, name: 'Veste Technique', description: 'Veste coupe-vent technique 3 couches, impermeabilisation DWR, coutures thermo-collees.', price: 18900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(20), category: 'Veste', gender: 'Homme', materials: '100% Polyester technique 3 couches', fit: 'Regular', season: 'Automne-Hiver', madeIn: 'Portugal', careInstructions: 'Lavage 30 degres sans assouplissant', certifications: 'OEKO-TEX', weight: 380 },
    { id: 'prod_kais_legging', creatorId: kais.id, projectId: projKaisTrail.id, name: 'Legging Running', description: 'Legging running taille haute en tissu compressif 4 directions, poche zippee, couture plate.', price: 6900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(17), category: 'Legging', gender: 'Homme', materials: '78% Polyester recycle, 22% Elasthane', fit: 'Slim', season: 'Toute saison', madeIn: 'Portugal', careInstructions: 'Lavage 30 degres', certifications: 'OEKO-TEX', weight: 180 },
    { id: 'prod_kais_debardeur', creatorId: kais.id, projectId: projKaisTrail.id, name: 'Debardeur Mesh', description: 'Debardeur en mesh technique ultra-ventile, coupe ajustee, serigraphie minimaliste.', price: 3900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(14), category: 'Debardeur', gender: 'Homme', materials: '100% Polyester mesh recycle', fit: 'Slim', season: 'Printemps-Ete', madeIn: 'Portugal', careInstructions: 'Lavage 40 degres', certifications: 'OEKO-TEX', weight: 90 },
    // ── KAIS BENALI — Everyday Active ─────────────────────────────────────
    { id: 'prod_kais_sweat', creatorId: kais.id, projectId: projKaisEveryday.id, name: 'Sweat Zippe', description: 'Sweat zippe en molleton technique 300g, col montant, zip YKK double curseur.', price: 7900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(12), category: 'Sweat', gender: 'Unisexe', materials: '80% Coton Bio, 20% Polyester recycle, 300g', fit: 'Regular', season: 'Automne-Hiver', madeIn: 'Portugal', careInstructions: 'Lavage 30 degres', certifications: 'OEKO-TEX', weight: 300 },
    { id: 'prod_kais_short', creatorId: kais.id, projectId: projKaisEveryday.id, name: 'Short Sport', description: 'Short sport 7 pouces en polyester technique leger, interieur filet integre, elastique ajustable.', price: 4900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(9), category: 'Short', gender: 'Homme', materials: '100% Polyester recycle leger', fit: 'Regular', season: 'Printemps-Ete', madeIn: 'Portugal', careInstructions: 'Lavage 40 degres', certifications: 'OEKO-TEX', weight: 140 },
    { id: 'prod_kais_brassiere', creatorId: kais.id, projectId: projKaisEveryday.id, name: 'Brassiere Sport', description: 'Brassiere sport maintien medium, bretelles reglables, tissu compressif anti-transpiration.', price: 4200, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(7), category: 'Brassiere', gender: 'Femme', materials: '80% Polyester recycle, 20% Elasthane', fit: 'Slim', season: 'Toute saison', madeIn: 'Portugal', careInstructions: 'Lavage 30 degres', certifications: 'OEKO-TEX', weight: 100 },
  ];

  for (const product of allProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: { name: product.name, description: product.description, price: product.price },
      create: product,
    });
  }
  console.log(`${allProducts.length} products created (Hugo:6, Lea:6, Kais:6)`);

  // ============================================
  // PRODUCT VARIANTS & SKUS (nouveau modele)
  // ============================================

  console.log('\nCreating product variants and SKUs...');

  // Cleanup complet
  await prisma.productSku.deleteMany({ where: { productId: { in: allProducts.map((p) => p.id) } } });
  await prisma.productVariant.deleteMany({ where: { productId: { in: allProducts.map((p) => p.id) } } });

  type SizeDef = { size: string | null; stock: number };
  type VariantDef = { id: string; name: string; color: string; colorCode: string; sizes: SizeDef[] };
  type ProductVariantConfig = { productId: string; variants: VariantDef[] };

  const PRODUCT_VARIANT_CONFIGS: ProductVariantConfig[] = [
    { productId: 'prod_hugo_tshirt', variants: [
      { id: 'var_hugo_tshirt_default', name: 'T-shirt Oversized', color: 'unique', colorCode: '#000000', sizes: [{ size: 'XS', stock: 10 }, { size: 'S', stock: 18 }, { size: 'M', stock: 20 }, { size: 'L', stock: 15 }, { size: 'XL', stock: 8 }] },
      { id: 'var_hugo_tshirt_blanc_casse', name: 'Blanc Casse', color: 'Blanc Casse', colorCode: '#f5f0e8', sizes: [{ size: 'XS', stock: 8 }, { size: 'S', stock: 14 }, { size: 'M', stock: 18 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 5 }] },
      { id: 'var_hugo_tshirt_noir', name: 'Noir', color: 'Noir', colorCode: '#1a1a1a', sizes: [{ size: 'XS', stock: 6 }, { size: 'S', stock: 12 }, { size: 'M', stock: 15 }, { size: 'L', stock: 10 }, { size: 'XL', stock: 4 }] },
    ]},
    { productId: 'prod_hugo_hoodie', variants: [
      { id: 'var_hugo_hoodie_default', name: 'Gris Chine', color: 'Gris Chine', colorCode: '#9e9e9e', sizes: [{ size: 'XS', stock: 8 }, { size: 'S', stock: 12 }, { size: 'M', stock: 15 }, { size: 'L', stock: 11 }, { size: 'XL', stock: 7 }, { size: 'XXL', stock: 3 }] },
      { id: 'var_hugo_hoodie_noir', name: 'Noir', color: 'Noir', colorCode: '#1a1a1a', sizes: [{ size: 'XS', stock: 5 }, { size: 'S', stock: 8 }, { size: 'M', stock: 0 }, { size: 'L', stock: 0 }, { size: 'XL', stock: 4 }, { size: 'XXL', stock: 6 }] },
    ]},
    { productId: 'prod_hugo_jogger', variants: [
      { id: 'var_hugo_jogger_default', name: 'Beige', color: 'Beige', colorCode: '#c8b89a', sizes: [{ size: 'XS', stock: 6 }, { size: 'S', stock: 10 }, { size: 'M', stock: 12 }, { size: 'L', stock: 9 }, { size: 'XL', stock: 4 }] },
    ]},
    { productId: 'prod_hugo_polo', variants: [
      { id: 'var_hugo_polo_default', name: 'Polo Piquet', color: 'unique', colorCode: '#000000', sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 16 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 8 }] },
      { id: 'var_hugo_polo_blanc', name: 'Blanc', color: 'Blanc', colorCode: '#ffffff', sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 14 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 6 }] },
    ]},
    { productId: 'prod_hugo_sweat', variants: [
      { id: 'var_hugo_sweat_default', name: 'Ecru', color: 'Ecru', colorCode: '#f0ebe0', sizes: [{ size: 'XS', stock: 8 }, { size: 'S', stock: 12 }, { size: 'M', stock: 14 }, { size: 'L', stock: 10 }] },
    ]},
    { productId: 'prod_hugo_short', variants: [
      { id: 'var_hugo_short_default', name: 'Kaki', color: 'Kaki', colorCode: '#6b7c4a', sizes: [{ size: 'XS', stock: 6 }, { size: 'S', stock: 10 }, { size: 'M', stock: 12 }, { size: 'L', stock: 9 }, { size: 'XL', stock: 4 }] },
    ]},
    { productId: 'prod_lea_veste', variants: [
      { id: 'var_lea_veste_default', name: 'Naturel', color: 'Naturel', colorCode: '#d4c5a9', sizes: [{ size: 'XS', stock: 3 }, { size: 'S', stock: 5 }, { size: 'M', stock: 4 }, { size: 'L', stock: 2 }] },
    ]},
    { productId: 'prod_lea_pantalon', variants: [
      { id: 'var_lea_pantalon_default', name: 'Sable', color: 'Sable', colorCode: '#c2a882', sizes: [{ size: '36', stock: 4 }, { size: '38', stock: 7 }, { size: '40', stock: 8 }, { size: '42', stock: 5 }, { size: '44', stock: 2 }] },
      { id: 'var_lea_pantalon_noir', name: 'Noir', color: 'Noir', colorCode: '#1a1a1a', sizes: [{ size: '36', stock: 3 }, { size: '38', stock: 6 }, { size: '40', stock: 7 }, { size: '42', stock: 4 }, { size: '44', stock: 1 }] },
    ]},
    { productId: 'prod_lea_chemise', variants: [
      { id: 'var_lea_chemise_default', name: 'Blanc Lin', color: 'Blanc Lin', colorCode: '#faf6ef', sizes: [{ size: 'XS', stock: 5 }, { size: 'S', stock: 8 }, { size: 'M', stock: 10 }, { size: 'L', stock: 7 }, { size: 'XL', stock: 3 }] },
    ]},
    { productId: 'prod_lea_robe', variants: [
      { id: 'var_lea_robe_default', name: 'Terracotta', color: 'Terracotta', colorCode: '#c17a5a', sizes: [{ size: 'XS', stock: 3 }, { size: 'S', stock: 5 }, { size: 'M', stock: 6 }, { size: 'L', stock: 4 }] },
      { id: 'var_lea_robe_ecru', name: 'Ecru', color: 'Ecru', colorCode: '#f0ebe0', sizes: [{ size: 'XS', stock: 4 }, { size: 'S', stock: 6 }, { size: 'M', stock: 7 }, { size: 'L', stock: 5 }] },
    ]},
    { productId: 'prod_lea_top', variants: [
      { id: 'var_lea_top_default', name: 'Noir', color: 'Noir', colorCode: '#1a1a1a', sizes: [{ size: 'XS', stock: 6 }, { size: 'S', stock: 9 }, { size: 'M', stock: 10 }, { size: 'L', stock: 7 }] },
    ]},
    { productId: 'prod_lea_manteau', variants: [
      { id: 'var_lea_manteau_default', name: 'Camel', color: 'Camel', colorCode: '#c69a6a', sizes: [{ size: 'XS', stock: 2 }, { size: 'S', stock: 4 }, { size: 'M', stock: 5 }, { size: 'L', stock: 3 }] },
    ]},
    { productId: 'prod_kais_veste', variants: [
      { id: 'var_kais_veste_default', name: 'Charcoal', color: 'Charcoal', colorCode: '#3d3d3d', sizes: [{ size: 'S', stock: 5 }, { size: 'M', stock: 8 }, { size: 'L', stock: 7 }, { size: 'XL', stock: 4 }] },
      { id: 'var_kais_veste_olive', name: 'Olive', color: 'Olive', colorCode: '#6b7c4a', sizes: [{ size: 'S', stock: 4 }, { size: 'M', stock: 6 }, { size: 'L', stock: 5 }, { size: 'XL', stock: 3 }] },
    ]},
    { productId: 'prod_kais_legging', variants: [
      { id: 'var_kais_legging_default', name: 'Noir', color: 'Noir', colorCode: '#1a1a1a', sizes: [{ size: 'XS', stock: 8 }, { size: 'S', stock: 14 }, { size: 'M', stock: 16 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 6 }] },
      { id: 'var_kais_legging_gris', name: 'Gris', color: 'Gris', colorCode: '#808080', sizes: [{ size: 'XS', stock: 6 }, { size: 'S', stock: 10 }, { size: 'M', stock: 12 }, { size: 'L', stock: 9 }, { size: 'XL', stock: 4 }] },
    ]},
    { productId: 'prod_kais_debardeur', variants: [
      { id: 'var_kais_debardeur_default', name: 'Blanc', color: 'Blanc', colorCode: '#ffffff', sizes: [{ size: 'XS', stock: 10 }, { size: 'S', stock: 14 }, { size: 'M', stock: 16 }, { size: 'L', stock: 12 }] },
      { id: 'var_kais_debardeur_gris_clair', name: 'Gris Clair', color: 'Gris Clair', colorCode: '#d0d0d0', sizes: [{ size: 'XS', stock: 8 }, { size: 'S', stock: 12 }, { size: 'M', stock: 14 }, { size: 'L', stock: 10 }] },
    ]},
    { productId: 'prod_kais_sweat', variants: [
      { id: 'var_kais_sweat_default', name: 'Marine', color: 'Marine', colorCode: '#1a2a4a', sizes: [{ size: 'XS', stock: 6 }, { size: 'S', stock: 10 }, { size: 'M', stock: 12 }, { size: 'L', stock: 9 }, { size: 'XL', stock: 4 }] },
    ]},
    { productId: 'prod_kais_short', variants: [
      { id: 'var_kais_short_default', name: 'Noir', color: 'Noir', colorCode: '#1a1a1a', sizes: [{ size: 'XS', stock: 6 }, { size: 'S', stock: 10 }, { size: 'M', stock: 12 }, { size: 'L', stock: 9 }, { size: 'XL', stock: 4 }] },
      { id: 'var_kais_short_marine', name: 'Bleu Marine', color: 'Bleu Marine', colorCode: '#1a2a4a', sizes: [{ size: 'XS', stock: 4 }, { size: 'S', stock: 7 }, { size: 'M', stock: 9 }, { size: 'L', stock: 6 }, { size: 'XL', stock: 3 }] },
    ]},
    { productId: 'prod_kais_brassiere', variants: [
      { id: 'var_kais_brassiere_default', name: 'Noir', color: 'Noir', colorCode: '#1a1a1a', sizes: [{ size: 'XS', stock: 8 }, { size: 'S', stock: 12 }, { size: 'M', stock: 14 }, { size: 'L', stock: 10 }] },
      { id: 'var_kais_brassiere_rose', name: 'Rose Poudre', color: 'Rose Poudre', colorCode: '#e8c4c4', sizes: [{ size: 'XS', stock: 6 }, { size: 'S', stock: 10 }, { size: 'M', stock: 12 }, { size: 'L', stock: 8 }] },
    ]},
  ];

  let variantCount = 0;
  let skuCount = 0;

  for (const config of PRODUCT_VARIANT_CONFIGS) {
    for (const vd of config.variants) {
      const variantImages = getVariantImages(seedImages, config.productId, vd.id);

      await prisma.productVariant.upsert({
        where: { id: vd.id },
        update: { name: vd.name, color: vd.color, colorCode: vd.colorCode, images: variantImages },
        create: { id: vd.id, productId: config.productId, name: vd.name, color: vd.color, colorCode: vd.colorCode, stock: 0, images: variantImages },
      });
      variantCount++;

      for (const skuDef of vd.sizes) {
        await prisma.productSku.create({
          data: { productId: config.productId, variantId: vd.id, size: skuDef.size, stock: skuDef.stock },
        });
        skuCount++;
      }
    }
  }

  console.log(`${variantCount} variants created, ${skuCount} SKUs created`);

  // Link styles to products
  const styleStreetware = styleMap['Streetwear'];
  const styleMinimaliste = styleMap['Minimaliste'];
  const styleSport = styleMap['Sport'];
  const styleArtisanat = styleMap['Artisanat'];

  if (styleStreetware) {
    for (const pid of ['prod_hugo_tshirt', 'prod_hugo_hoodie', 'prod_hugo_jogger', 'prod_hugo_polo', 'prod_hugo_sweat', 'prod_hugo_short']) {
      await prisma.product.update({ where: { id: pid }, data: { styleId: styleStreetware } });
    }
  }
  if (styleMinimaliste) {
    for (const pid of ['prod_lea_robe', 'prod_lea_top', 'prod_lea_manteau']) {
      await prisma.product.update({ where: { id: pid }, data: { styleId: styleMinimaliste } });
    }
  }
  if (styleArtisanat) {
    for (const pid of ['prod_lea_veste', 'prod_lea_pantalon', 'prod_lea_chemise']) {
      await prisma.product.update({ where: { id: pid }, data: { styleId: styleArtisanat } });
    }
  }
  if (styleSport) {
    for (const pid of ['prod_kais_veste', 'prod_kais_legging', 'prod_kais_debardeur', 'prod_kais_sweat', 'prod_kais_short', 'prod_kais_brassiere']) {
      await prisma.product.update({ where: { id: pid }, data: { styleId: styleSport } });
    }
  }
  console.log('   Styles linked to products');

  // ============================================
  // CREATOR PAGES
  // ============================================

  const pagesData = [
    { creatorId: hugo.id, slug: 'hugo-tessier', title: 'Hugo Tessier - Streetwear Urbain', description: 'Mode urbaine et coupes modernes. Le streetwear parisien reinvente.' },
    { creatorId: lea.id, slug: 'lea-fontaine', title: 'Lea Fontaine - Mode Artisanale', description: 'Pieces artisanales en matieres naturelles. Creations uniques faconnees a la main.' },
    { creatorId: kais.id, slug: 'kais-benali', title: 'Kais Benali - Sport & Outdoor', description: 'Vetements techniques pour le sport et la vie active. Performance et style.' },
  ];

  const pages = [];
  for (const pd of pagesData) {
    const page = await prisma.creatorPage.upsert({
      where: { creatorId: pd.creatorId },
      update: {},
      create: { creatorId: pd.creatorId, slug: pd.slug, title: pd.title, description: pd.description, status: PageStatus.PUBLISHED, publishedAt: daysAgo(30) },
    });
    pages.push(page);
  }

  const [pageHugo, pageLea, pageKais] = pages as [typeof pages[0], typeof pages[0], typeof pages[0]];
  console.log('Creator pages created (3 pages)');

  // ============================================
  // PAGE SECTIONS
  // ============================================

  await prisma.pageSection.deleteMany({ where: { pageId: { in: pages.map((p) => p.id) } } });

  await prisma.pageSection.createMany({ data: [
    { pageId: pageHugo.id, type: SectionType.HERO, position: 0, title: 'Hugo Tessier', content: JSON.stringify({ subtitle: 'Le streetwear parisien reinvente', backgroundImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1920&h=600&fit=crop', ctaText: 'Decouvrir', ctaLink: '#products' }) },
    { pageId: pageHugo.id, type: SectionType.PRODUCTS_GRID, position: 1, title: 'Nos creations', content: JSON.stringify({ columns: 3, limit: 6 }) },
    { pageId: pageLea.id, type: SectionType.HERO, position: 0, title: 'Lea Fontaine', content: JSON.stringify({ subtitle: 'Pieces artisanales en matieres naturelles', backgroundImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=600&fit=crop', ctaText: 'Explorer', ctaLink: '#products' }) },
    { pageId: pageLea.id, type: SectionType.PRODUCTS_GRID, position: 1, title: 'Mes creations', content: JSON.stringify({ columns: 3, limit: 6 }) },
    { pageId: pageKais.id, type: SectionType.HERO, position: 0, title: 'Kais Benali', content: JSON.stringify({ subtitle: 'Performance et style pour l actif moderne', backgroundImage: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=1920&h=600&fit=crop', ctaText: 'Voir la collection', ctaLink: '#products' }) },
    { pageId: pageKais.id, type: SectionType.PRODUCTS_GRID, position: 1, title: 'La collection', content: JSON.stringify({ columns: 3, limit: 6 }) },
  ]});
  console.log('Page sections created (6 sections)');

  // ============================================
  // ORDERS
  // ============================================

  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  console.log('Existing orders cleared');

  let orderCounter = 0;
  function nextOrderNumber(): string {
    orderCounter++;
    return `ORD-2026-${String(orderCounter).padStart(4, '0')}`;
  }

  type OrderItemInput = { productId: string; productName: string; quantity: number; price: number };

  async function createOrder(data: {
    creatorId: string;
    customer: typeof clients[0];
    status: OrderStatus;
    items: OrderItemInput[];
    trackingNumber?: string;
    carrier?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
    createdAt: Date;
  }) {
    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await prisma.order.create({
      data: {
        orderNumber: nextOrderNumber(),
        creatorId: data.creatorId,
        customerId: data.customer.id,
        customerName: data.customer.name ?? '',
        customerEmail: data.customer.email,
        status: data.status,
        totalAmount,
        shippingStreet: data.customer.address ?? '',
        shippingCity: data.customer.city ?? '',
        shippingPostalCode: data.customer.postalCode ?? '',
        shippingCountry: 'France',
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        shippedAt: data.shippedAt,
        deliveredAt: data.deliveredAt,
        createdAt: data.createdAt,
      },
    });
    await prisma.orderItem.createMany({
      data: data.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        image: `https://picsum.photos/seed/${item.productId.replace('prod_', '')}/200/200`,
      })),
    });
    return order;
  }

  const orderHugo1 = await createOrder({ creatorId: hugo.id, customer: alice!, status: OrderStatus.DELIVERED, items: [{ productId: 'prod_hugo_tshirt', productName: 'T-shirt Oversized', quantity: 1, price: 4900 }, { productId: 'prod_hugo_hoodie', productName: 'Hoodie Urbain', quantity: 1, price: 7900 }], trackingNumber: 'COL2026001001', carrier: 'colissimo', shippedAt: daysAgo(18), deliveredAt: daysAgo(15), createdAt: daysAgo(20) });
  await createOrder({ creatorId: hugo.id, customer: bob!, status: OrderStatus.SHIPPED, items: [{ productId: 'prod_hugo_jogger', productName: 'Jogger Cargo', quantity: 1, price: 6500 }], trackingNumber: 'COL2026001002', carrier: 'colissimo', shippedAt: daysAgo(2), createdAt: daysAgo(4) });
  await createOrder({ creatorId: hugo.id, customer: camille!, status: OrderStatus.PAID, items: [{ productId: 'prod_hugo_polo', productName: 'Polo Piquet', quantity: 1, price: 5500 }, { productId: 'prod_hugo_short', productName: 'Short Technique', quantity: 1, price: 4500 }], createdAt: daysAgo(1) });
  console.log('   3 orders for Hugo');

  const orderLea1 = await createOrder({ creatorId: lea.id, customer: alice!, status: OrderStatus.DELIVERED, items: [{ productId: 'prod_lea_veste', productName: 'Veste en Lin', quantity: 1, price: 14900 }], trackingNumber: 'COL2026002001', carrier: 'colissimo', shippedAt: daysAgo(14), deliveredAt: daysAgo(11), createdAt: daysAgo(16) });
  await createOrder({ creatorId: lea.id, customer: david!, status: OrderStatus.SHIPPED, items: [{ productId: 'prod_lea_robe', productName: 'Robe Longue', quantity: 1, price: 13900 }, { productId: 'prod_lea_top', productName: 'Top Asymetrique', quantity: 1, price: 6900 }], trackingNumber: 'COL2026002002', carrier: 'colissimo', shippedAt: daysAgo(1), createdAt: daysAgo(3) });
  await createOrder({ creatorId: lea.id, customer: emma!, status: OrderStatus.PENDING, items: [{ productId: 'prod_lea_manteau', productName: 'Manteau Court', quantity: 1, price: 24900 }], createdAt: new Date() });
  console.log('   3 orders for Lea');

  const orderKais1 = await createOrder({ creatorId: kais.id, customer: bob!, status: OrderStatus.DELIVERED, items: [{ productId: 'prod_kais_veste', productName: 'Veste Technique', quantity: 1, price: 18900 }, { productId: 'prod_kais_legging', productName: 'Legging Running', quantity: 1, price: 6900 }], trackingNumber: 'COL2026003001', carrier: 'colissimo', shippedAt: daysAgo(10), deliveredAt: daysAgo(7), createdAt: daysAgo(12) });
  await createOrder({ creatorId: kais.id, customer: camille!, status: OrderStatus.PAID, items: [{ productId: 'prod_kais_brassiere', productName: 'Brassiere Sport', quantity: 1, price: 4200 }, { productId: 'prod_kais_short', productName: 'Short Sport', quantity: 1, price: 4900 }], createdAt: daysAgo(1) });
  console.log('   2 orders for Kais');

  // ============================================
  // NOTIFICATION PREFERENCES
  // ============================================

  const clientNotifTypes = ['ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED', 'REFUND_PROCESSED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'DISPUTE_UPDATE'];
  const creatorNotifTypes = ['ORDER_RECEIVED', 'ORDER_PAID', 'RETURN_REQUEST_RECEIVED', 'DISPUTE_OPENED', 'REVIEW_RECEIVED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_EXPIRING', 'PAYMENT_FAILED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_REACTIVATED'];

  for (const user of [admin, ...clients]) {
    for (const type of clientNotifTypes) {
      await prisma.notificationPreference.upsert({ where: { userId_type: { userId: user.id, type } }, update: {}, create: { userId: user.id, type, email: true, inApp: true } });
    }
  }
  for (const creator of [hugo, lea, kais]) {
    for (const type of creatorNotifTypes) {
      await prisma.notificationPreference.upsert({ where: { userId_type: { userId: creator.id, type } }, update: {}, create: { userId: creator.id, type, email: true, inApp: true } });
    }
  }
  console.log('\nNotification preferences created');

  // ============================================
  // CARTS
  // ============================================

  await prisma.cart.upsert({ where: { userId: alice!.id }, update: { items: JSON.stringify([{ id: 'cart_alice_1', productId: 'prod_hugo_tshirt', variantId: 'var_hugo_tshirt_noir', name: 'T-shirt Oversized', price: 4900, quantity: 1, image: 'https://picsum.photos/seed/hugotshirt/200/200', variantInfo: { type: 'Couleur', value: 'Noir' }, creatorSlug: 'hugo-tessier' }]) }, create: { userId: alice!.id, items: JSON.stringify([{ id: 'cart_alice_1', productId: 'prod_hugo_tshirt', variantId: 'var_hugo_tshirt_noir', name: 'T-shirt Oversized', price: 4900, quantity: 1, image: 'https://picsum.photos/seed/hugotshirt/200/200', variantInfo: { type: 'Couleur', value: 'Noir' }, creatorSlug: 'hugo-tessier' }]) } });
  await prisma.cart.upsert({ where: { userId: bob!.id }, update: { items: JSON.stringify([{ id: 'cart_bob_1', productId: 'prod_lea_pantalon', variantId: 'var_lea_pantalon_default', name: 'Pantalon Large', price: 11900, quantity: 1, image: 'https://picsum.photos/seed/leapantalon/200/200', variantInfo: { type: 'Couleur', value: 'Sable' }, creatorSlug: 'lea-fontaine' }]) }, create: { userId: bob!.id, items: JSON.stringify([{ id: 'cart_bob_1', productId: 'prod_lea_pantalon', variantId: 'var_lea_pantalon_default', name: 'Pantalon Large', price: 11900, quantity: 1, image: 'https://picsum.photos/seed/leapantalon/200/200', variantInfo: { type: 'Couleur', value: 'Sable' }, creatorSlug: 'lea-fontaine' }]) } });
  console.log('Carts created (2)');

  // ============================================
  // RETURN REQUESTS
  // ============================================

  await prisma.returnRequest.create({ data: { orderId: orderHugo1.id, customerId: alice!.id, creatorId: hugo.id, reason: ReturnReason.CHANGED_MIND, status: ReturnStatus.APPROVED, deliveredAt: daysAgo(15), approvedAt: daysAgo(12) } });
  await prisma.returnRequest.create({ data: { orderId: orderLea1.id, customerId: alice!.id, creatorId: lea.id, reason: ReturnReason.NOT_AS_DESCRIBED, status: ReturnStatus.REQUESTED, deliveredAt: daysAgo(11) } });
  console.log('Return requests created (2)');

  // ============================================
  // DISPUTES
  // ============================================

  await prisma.dispute.create({ data: { orderId: orderKais1.id, customerId: bob!.id, creatorId: kais.id, type: DisputeType.DAMAGED, description: 'La veste technique est arrivee avec une couture dechiree sur le coude droit.', status: DisputeStatus.OPEN, createdAt: daysAgo(5) } });
  console.log('Dispute created (1)');

  // ============================================
  // FLAGGED CONTENT
  // ============================================

  await prisma.flaggedContent.create({ data: { contentId: 'prod_hugo_hoodie', contentType: 'PRODUCT', contentTitle: 'Hoodie Urbain', contentDescription: 'Hoodie oversize 350g molleton brosse interieur.', creatorId: hugo.id, flaggedBy: alice!.id, flagReason: FlagReason.MISLEADING_DESCRIPTION, flagDetails: 'La description mentionne "fait en France" mais etiquette indique Portugal.', status: ModerationStatus.PENDING, flaggedAt: daysAgo(3) } });

  const flagVeste = await prisma.flaggedContent.create({ data: { contentId: 'prod_kais_veste', contentType: 'PRODUCT', contentTitle: 'Veste Technique', contentDescription: 'Veste coupe-vent technique 3 couches.', contentImageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', creatorId: kais.id, flaggedBy: david!.id, flagReason: FlagReason.MISLEADING_DESCRIPTION, flagDetails: 'Impermeabilite annoncee non verifiable.', status: ModerationStatus.APPROVED, moderatorId: admin.id, moderatorNote: 'Caracteristiques techniques verifiees. Signalement non fonde.', flaggedAt: daysAgo(10), moderatedAt: daysAgo(7) } });

  await prisma.moderationActionRecord.create({ data: { flaggedContentId: flagVeste.id, action: ModerationActionType.APPROVE, moderatorId: admin.id, note: 'Caracteristiques techniques confirmees. Signalement rejete.', createdAt: daysAgo(7) } });

  console.log('Flagged content created (2) + moderation action (1)');

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\nSeed completed!\n');
  console.log('Summary:');
  console.log('   ──────────────────────────────────────────');
  console.log('   Admin: admin@kpsull.fr');
  console.log('   ──────────────────────────────────────────');
  console.log('   Creators (3):');
  console.log('     - hugo.tessier@kpsull.fr  -> /hugo-tessier  | 6 produits | 3 commandes');
  console.log('     - lea.fontaine@kpsull.fr   -> /lea-fontaine  | 6 produits | 3 commandes');
  console.log('     - kais.benali@kpsull.fr    -> /kais-benali   | 6 produits | 2 commandes');
  console.log('   ──────────────────────────────────────────');
  console.log(`   Clients: 5 (alice, bob, camille, david, emma)`);
  console.log(`   Products: 18 (Hugo:6, Lea:6, Kais:6)`);
  console.log(`   Orders: ${orderCounter} total`);
  console.log(`   Variants: ${variantCount} (images dans variants.images JSON)`);
  console.log(`   SKUs: ${skuCount} (variantId toujours non-null)`);
  console.log('   Carts: 2 | Returns: 2 | Disputes: 1 | Flagged: 2');
  console.log('   ──────────────────────────────────────────');
  console.log('   All accounts password: password123');
  console.log('   ──────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
