/**
 * Prisma Seed - Donnees de developpement pour Kpsull Marketplace
 *
 * Cree:
 * - 1 admin (admin@kpsull.fr)
 * - 20 createurs (5 originaux + 15 via seed-new-creators.ts)
 * - 20 clients avec profils complets
 * - ~475 produits repartis entre les createurs
 * - ~100+ commandes avec differents statuts
 * - Pages, sections, images, subscriptions, onboardings
 *
 * Tous les comptes utilisent le mot de passe: password123
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
import { seedNewCreators } from './seed-new-creators';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/kpsull-db';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================
// HELPERS
// ============================================

/** Date N days ago */
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/** Date N days from now */
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

/** Charge les images seed générées par prisma/scripts/upload-seed-images.ts */
function loadSeedImages(): Record<string, { main: string[]; variants: Record<string, string[]> }> {
  try {
    const raw = fs.readFileSync('./prisma/seed-assets/product-images.json', 'utf-8');
    return JSON.parse(raw) as Record<string, { main: string[]; variants: Record<string, string[]> }>;
  } catch {
    return {}; // Fallback: URLs Unsplash hardcodées dans les données
  }
}

async function main() {
  console.log('🌱 Seeding Kpsull marketplace database...\n');

  // Hash password once for all users
  const hashedPassword = await bcrypt.hash('password123', 10);
  console.log('🔐 Password hashed for all accounts (password123)\n');

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
  console.log('✅ Admin:', admin.email);

  // ============================================
  // CREATORS
  // ============================================

  const jose = await prisma.user.upsert({
    where: { email: 'jose.lecreateur@kpsull.fr' },
    update: { role: Role.CREATOR, hashedPassword, accountTypeChosen: true, wantsToBeCreator: true },
    create: {
      email: 'jose.lecreateur@kpsull.fr',
      name: 'Jose Le Createur',
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: '+33612345678',
      address: '42 rue de la Mode',
      city: 'Paris',
      postalCode: '75003',
      country: 'France',
    },
  });
  console.log('✅ Creator:', jose.email, '(STUDIO)');

  const sophie = await prisma.user.upsert({
    where: { email: 'sophie.artisan@kpsull.fr' },
    update: { role: Role.CREATOR, hashedPassword, accountTypeChosen: true, wantsToBeCreator: true },
    create: {
      email: 'sophie.artisan@kpsull.fr',
      name: 'Sophie Artisan',
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: '+33623456789',
      address: '8 rue des Potiers',
      city: 'Vallauris',
      postalCode: '06220',
      country: 'France',
    },
  });
  console.log('✅ Creator:', sophie.email, '(ATELIER)');

  const lucas = await prisma.user.upsert({
    where: { email: 'lucas.design@kpsull.fr' },
    update: { role: Role.CREATOR, hashedPassword, accountTypeChosen: true, wantsToBeCreator: true },
    create: {
      email: 'lucas.design@kpsull.fr',
      name: 'Lucas Design',
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: '+33634567890',
      address: '15 rue du Design',
      city: 'Bordeaux',
      postalCode: '33000',
      country: 'France',
    },
  });
  console.log('✅ Creator:', lucas.email, '(STUDIO)');

  const claire = await prisma.user.upsert({
    where: { email: 'claire.mode@kpsull.fr' },
    update: { role: Role.CREATOR, hashedPassword, accountTypeChosen: true, wantsToBeCreator: true },
    create: {
      email: 'claire.mode@kpsull.fr',
      name: 'Claire Mode',
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: '+33645678901',
      address: '22 rue Vintage',
      city: 'Lyon',
      postalCode: '69002',
      country: 'France',
    },
  });
  console.log('✅ Creator:', claire.email, '(ESSENTIEL)');

  const marc = await prisma.user.upsert({
    where: { email: 'marc.vintage@kpsull.fr' },
    update: { role: Role.CREATOR, hashedPassword, accountTypeChosen: true, wantsToBeCreator: true },
    create: {
      email: 'marc.vintage@kpsull.fr',
      name: 'Marc Vintage',
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: '+33656789012',
      address: '5 passage des Antiquaires',
      city: 'Marseille',
      postalCode: '13001',
      country: 'France',
    },
  });
  console.log('✅ Creator:', marc.email, '(ESSENTIEL)');

  // ============================================
  // CLIENTS (20)
  // ============================================

  const clientsData = [
    { email: 'alice.bernard@example.com', name: 'Alice Bernard', phone: '+33611111111', city: 'Paris', postalCode: '75002', address: '15 rue de la Paix' },
    { email: 'bob.leroy@example.com', name: 'Bob Leroy', phone: '+33622222222', city: 'Lyon', postalCode: '69006', address: '28 avenue Victor Hugo' },
    { email: 'camille.moreau@example.com', name: 'Camille Moreau', phone: '+33633333333', city: 'Marseille', postalCode: '13001', address: '5 cours Julien' },
    { email: 'david.petit@example.com', name: 'David Petit', phone: '+33644444444', city: 'Bordeaux', postalCode: '33000', address: '18 rue Sainte-Catherine' },
    { email: 'emma.garcia@example.com', name: 'Emma Garcia', phone: '+33655555555', city: 'Toulouse', postalCode: '31000', address: '7 place du Capitole' },
    { email: 'felix.roux@example.com', name: 'Felix Roux', phone: '+33666666666', city: 'Nantes', postalCode: '44000', address: '33 quai de la Fosse' },
    { email: 'lea.martin@example.com', name: 'Lea Martin', phone: '+33677777777', city: 'Strasbourg', postalCode: '67000', address: '10 place Kleber' },
    { email: 'hugo.durand@example.com', name: 'Hugo Durand', phone: '+33688888888', city: 'Lille', postalCode: '59000', address: '22 rue de Bethune' },
    { email: 'manon.girard@example.com', name: 'Manon Girard', phone: '+33699999999', city: 'Montpellier', postalCode: '34000', address: '14 place de la Comedie' },
    { email: 'nathan.fournier@example.com', name: 'Nathan Fournier', phone: '+33610101010', city: 'Rennes', postalCode: '35000', address: '6 rue Le Bastard' },
    { email: 'oceane.lambert@example.com', name: 'Oceane Lambert', phone: '+33620202020', city: 'Nice', postalCode: '06000', address: '25 promenade des Anglais' },
    { email: 'paul.mercier@example.com', name: 'Paul Mercier', phone: '+33630303030', city: 'Grenoble', postalCode: '38000', address: '3 place Grenette' },
    { email: 'romane.bonnet@example.com', name: 'Romane Bonnet', phone: '+33640404040', city: 'Dijon', postalCode: '21000', address: '12 rue de la Liberte' },
    { email: 'samuel.blanc@example.com', name: 'Samuel Blanc', phone: '+33650505050', city: 'Rouen', postalCode: '76000', address: '8 rue du Gros-Horloge' },
    { email: 'tessa.guerin@example.com', name: 'Tessa Guerin', phone: '+33660606060', city: 'Reims', postalCode: '51100', address: "20 place Drouet-d'Erlon" },
    { email: 'ulysse.faure@example.com', name: 'Ulysse Faure', phone: '+33670707070', city: 'Tours', postalCode: '37000', address: '11 rue Nationale' },
    { email: 'victoire.robin@example.com', name: 'Victoire Robin', phone: '+33680808080', city: 'Angers', postalCode: '49000', address: '9 boulevard Foch' },
    { email: 'william.morel@example.com', name: 'William Morel', phone: '+33690909090', city: 'Brest', postalCode: '29200', address: '17 rue de Siam' },
    { email: 'yasmine.perrin@example.com', name: 'Yasmine Perrin', phone: '+33611121314', city: 'Metz', postalCode: '57000', address: '4 place Saint-Louis' },
    { email: 'zoe.chevalier@example.com', name: 'Zoe Chevalier', phone: '+33615161718', city: 'Aix-en-Provence', postalCode: '13100', address: '30 cours Mirabeau' },
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
  console.log(`✅ ${clients.length} clients created`);

  // Type assertion to avoid "possibly undefined" errors
  const [
    alice, bob, camille, david, emma, felix, lea, hugo,
    manon, nathan, oceane, paul, romane, samuel, tessa,
    ulysse, victoire, william, yasmine, zoe,
  ] = clients as [
    typeof clients[0], typeof clients[0], typeof clients[0], typeof clients[0],
    typeof clients[0], typeof clients[0], typeof clients[0], typeof clients[0],
    typeof clients[0], typeof clients[0], typeof clients[0], typeof clients[0],
    typeof clients[0], typeof clients[0], typeof clients[0], typeof clients[0],
    typeof clients[0], typeof clients[0], typeof clients[0], typeof clients[0],
  ];

  // ============================================
  // CREATOR ONBOARDING (all completed)
  // ============================================

  const creatorsOnboarding = [
    { userId: jose.id, brandName: 'KPSULL Officiel', siret: '12345678901234', address: '42 rue de la Mode, 75003 Paris', stripeAccountId: 'acct_demo_jose' },
    { userId: sophie.id, brandName: 'Sophie Ceramique', siret: '23456789012345', address: '8 rue des Potiers, 06220 Vallauris', stripeAccountId: 'acct_demo_sophie' },
    { userId: lucas.id, brandName: 'Lucas Design Studio', siret: '34567890123456', address: '15 rue du Design, 33000 Bordeaux', stripeAccountId: 'acct_demo_lucas' },
    { userId: claire.id, brandName: 'Claire Vintage', siret: '45678901234567', address: '22 rue Vintage, 69002 Lyon', stripeAccountId: 'acct_demo_claire' },
    { userId: marc.id, brandName: 'Marc Accessories', siret: '56789012345678', address: '5 passage des Antiquaires, 13001 Marseille', stripeAccountId: 'acct_demo_marc' },
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
  console.log('✅ Creator onboardings created (5 creators, all COMPLETED)');

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  const subscriptionsData = [
    { userId: jose.id, creatorId: jose.id, plan: Plan.STUDIO, interval: 'year', productsUsed: 8, pinnedProductsUsed: 3, commissionRate: 0.04, subId: 'sub_demo_jose', cusId: 'cus_demo_jose', priceId: 'price_demo_studio_yearly' },
    { userId: sophie.id, creatorId: sophie.id, plan: Plan.ATELIER, interval: 'year', productsUsed: 5, pinnedProductsUsed: 2, commissionRate: 0.03, subId: 'sub_demo_sophie', cusId: 'cus_demo_sophie', priceId: 'price_demo_atelier_yearly' },
    { userId: lucas.id, creatorId: lucas.id, plan: Plan.STUDIO, interval: 'month', productsUsed: 5, pinnedProductsUsed: 2, commissionRate: 0.04, subId: 'sub_demo_lucas', cusId: 'cus_demo_lucas', priceId: 'price_demo_studio_monthly' },
    { userId: claire.id, creatorId: claire.id, plan: Plan.ESSENTIEL, interval: 'month', productsUsed: 4, pinnedProductsUsed: 1, commissionRate: 0.05, subId: 'sub_demo_claire', cusId: 'cus_demo_claire', priceId: 'price_demo_essentiel_monthly' },
    { userId: marc.id, creatorId: marc.id, plan: Plan.ESSENTIEL, interval: 'month', productsUsed: 3, pinnedProductsUsed: 1, commissionRate: 0.05, subId: 'sub_demo_marc', cusId: 'cus_demo_marc', priceId: 'price_demo_essentiel_monthly' },
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
  console.log('✅ Subscriptions created (5 creators)');

  // ============================================
  // PROJECTS (Collections)
  // ============================================

  const projJoseStreet = await prisma.project.upsert({
    where: { id: 'proj_jose_streetwear' },
    update: {},
    create: { id: 'proj_jose_streetwear', creatorId: jose.id, name: 'Streetwear 2026', description: 'Collection streetwear urbaine, coupes modernes et tissus techniques.' },
  });

  const projJoseAccess = await prisma.project.upsert({
    where: { id: 'proj_jose_accessoires' },
    update: {},
    create: { id: 'proj_jose_accessoires', creatorId: jose.id, name: 'Accessoires', description: 'Bonnets, casquettes et sacs faits main.' },
  });

  const projSophie = await prisma.project.upsert({
    where: { id: 'proj_sophie_ceramique' },
    update: {},
    create: { id: 'proj_sophie_ceramique', creatorId: sophie.id, name: 'Ceramique Artisanale', description: 'Pieces uniques en gres et porcelaine, tournees et emaillees a la main.' },
  });

  const projLucas = await prisma.project.upsert({
    where: { id: 'proj_lucas_design' },
    update: {},
    create: { id: 'proj_lucas_design', creatorId: lucas.id, name: 'Streetwear Design', description: 'Vetements streetwear avec prints graphiques originaux.' },
  });

  const projClaire = await prisma.project.upsert({
    where: { id: 'proj_claire_vintage' },
    update: {},
    create: { id: 'proj_claire_vintage', creatorId: claire.id, name: 'Mode Vintage', description: 'Pieces vintage chinees et restaurees avec soin.' },
  });

  const projMarc = await prisma.project.upsert({
    where: { id: 'proj_marc_accessories' },
    update: {},
    create: { id: 'proj_marc_accessories', creatorId: marc.id, name: 'Accessoires Vintage', description: "Montres, ceintures et accessoires d'epoque restaures." },
  });

  console.log('✅ Projects created (6 collections)');

  // ============================================
  // SYSTEM STYLES
  // ============================================

  console.log('\n🎨 Creating system styles...');

  const systemStylesData = [
    { name: 'Streetwear', description: 'Mode urbaine, oversize, graphic tees, sneakers' },
    { name: 'Vintage', description: 'Pieces retro et secondes mains revisitees' },
    { name: 'Ceramique', description: 'Artisanat ceramique, poterie et creations en argile' },
    { name: 'Minimaliste', description: 'Design epure, lignes nettes, palette neutre' },
    { name: 'Boheme', description: 'Esprit libre, matieres naturelles, imprimés ethniques' },
    { name: 'Sportswear', description: 'Vetements techniques et confortables pour le sport' },
    { name: 'Luxe', description: 'Matieres nobles, finitions haut de gamme, editions limitees' },
    { name: 'Art', description: 'Creations artistiques uniques, editions limitees signees' },
  ];

  const styleMap: Record<string, string> = {};
  for (const style of systemStylesData) {
    const s = await prisma.style.upsert({
      where: { name: style.name },
      update: {},
      create: { name: style.name, description: style.description, isCustom: false, creatorId: null },
      select: { id: true, name: true },
    });
    styleMap[style.name] = s.id;
  }

  console.log(`   ✅ ${systemStylesData.length} system styles created`);

  // ============================================
  // PRODUCTS
  // ============================================

  // --- Jose: 8 products streetwear ---
  const joseProductsData = [
    {
      id: 'prod_jose_hoodie_noir', creatorId: jose.id, projectId: projJoseStreet.id,
      name: 'Hoodie Oversize Noir', description: 'Hoodie oversize en coton bio 350g, coupe ample et capuche doublee.',
      price: 8900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(25),
      category: 'Sweat à capuche', gender: 'Homme', materials: '100% Coton Bio 350g',
      fit: 'Oversize', season: 'Automne-Hiver', madeIn: 'France',
      careInstructions: "Lavage 30° à l'envers", certifications: 'OEKO-TEX', weight: 350,
    },
    {
      id: 'prod_jose_tshirt_graphic', creatorId: jose.id, projectId: projJoseStreet.id,
      name: 'T-shirt Graphique "Antidote"', description: 'T-shirt en coton epais avec serigraphie "Antidote" sur le dos.',
      price: 4500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(22),
      category: 'T-shirt', gender: 'Unisexe', materials: '100% Coton Bio 180g',
      fit: 'Regular', season: 'Printemps-Été', madeIn: 'France',
      careInstructions: 'Lavage 30°', certifications: 'OEKO-TEX,GOTS Bio', weight: 180,
    },
    {
      id: 'prod_jose_pantalon_cargo', creatorId: jose.id, projectId: projJoseStreet.id,
      name: 'Pantalon Cargo Kaki', description: 'Cargo coupe droite avec 6 poches, tissu ripstop.',
      price: 7500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(20),
      category: 'Pantalon', gender: 'Homme', materials: '100% Coton Ripstop',
      fit: 'Regular', season: 'Printemps-Été', madeIn: 'Portugal',
      careInstructions: 'Lavage 40°', weight: 280,
    },
    {
      id: 'prod_jose_bomber', creatorId: jose.id, projectId: projJoseStreet.id,
      name: 'Bomber Matelasse', description: 'Bomber leger matelasse, zip YKK, doublure satin.',
      price: 12500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(18),
      category: 'Veste', gender: 'Unisexe', materials: 'Coque Polyester 100%, Matelassage Polyester recyclé',
      fit: 'Regular', season: 'Automne-Hiver', madeIn: 'France',
      careInstructions: 'Nettoyage à sec', weight: 450,
    },
    {
      id: 'prod_jose_bonnet', creatorId: jose.id, projectId: projJoseAccess.id,
      name: 'Bonnet Laine Merinos', description: 'Bonnet tricote en laine merinos, taille unique.',
      price: 3500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(15),
      category: 'Accessoire', gender: 'Unisexe', materials: '100% Laine Mérinos',
      fit: 'Taille unique', season: 'Automne-Hiver', madeIn: 'France',
      careInstructions: 'Lavage main 30°', certifications: 'OEKO-TEX',
    },
    {
      id: 'prod_jose_casquette', creatorId: jose.id, projectId: projJoseAccess.id,
      name: 'Casquette Brodee KPSULL', description: 'Casquette 5 panels avec broderie logo, fermeture metal.',
      price: 3900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(12),
      category: 'Accessoire', gender: 'Unisexe', materials: '100% Coton',
      madeIn: 'France', careInstructions: 'Lavage à la main',
    },
    {
      id: 'prod_jose_tote', creatorId: jose.id, projectId: projJoseAccess.id,
      name: 'Tote Bag Canvas', description: 'Tote bag en toile canvas resistante, serigraphie artisanale.',
      price: 2500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(10),
      category: 'Accessoire', gender: 'Unisexe', materials: '100% Coton Canvas 400g',
      madeIn: 'France', careInstructions: 'Lavage machine 40°',
    },
    {
      id: 'prod_jose_sweat', creatorId: jose.id, projectId: projJoseStreet.id,
      name: 'Sweat Col Rond Gris Chine', description: 'Sweat classique col rond en molleton bio, coupe reguliere.',
      price: 6900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(8),
      category: 'Sweat', gender: 'Unisexe', materials: '80% Coton Bio, 20% Polyester recyclé',
      fit: 'Regular', season: 'Automne-Hiver', madeIn: 'France',
      careInstructions: 'Lavage 30°', certifications: 'OEKO-TEX', weight: 320,
    },
  ];

  // --- Sophie: 5 products ceramique ---
  const sophieProductsData = [
    {
      id: 'prod_sophie_bol_raku', creatorId: sophie.id, projectId: projSophie.id,
      name: 'Bol Raku Terre & Feu', description: 'Bol en gres emaille raku, piece unique aux reflets cuivres.',
      price: 4500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(28),
      category: 'Bol', materials: 'Grès émaillé Raku', madeIn: 'France',
      careInstructions: 'Lavage main recommandé',
    },
    {
      id: 'prod_sophie_vase_bleu', creatorId: sophie.id, projectId: projSophie.id,
      name: 'Vase Bleu Cobalt', description: 'Vase tourne main en porcelaine, email bleu cobalt profond.',
      price: 7800, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(25),
      category: 'Vase', materials: 'Porcelaine émail cobalt', madeIn: 'France',
      careInstructions: 'Lavage main uniquement',
    },
    {
      id: 'prod_sophie_tasse_duo', creatorId: sophie.id, projectId: projSophie.id,
      name: 'Duo de Tasses Espresso', description: 'Deux tasses espresso en gres blanc, anse minimaliste.',
      price: 3200, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(22),
      category: 'Tasse', materials: 'Grès blanc, émail naturel', madeIn: 'France',
      careInstructions: 'Compatible lave-vaisselle (déconseillé)',
    },
    {
      id: 'prod_sophie_assiette', creatorId: sophie.id, projectId: projSophie.id,
      name: 'Assiette Plate Wabi-Sabi', description: 'Assiette plate en gres chamotte, bords irreguliers volontaires.',
      price: 3800, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(18),
      category: 'Assiette', materials: 'Grès chamotte', madeIn: 'France',
      careInstructions: 'Lavage main recommandé',
    },
    {
      id: 'prod_sophie_bougeoir', creatorId: sophie.id, projectId: projSophie.id,
      name: 'Bougeoir Sculpte', description: 'Bougeoir en gres noir mat, forme organique sculptee a la main.',
      price: 2900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(14),
      category: 'Bougeoir', materials: 'Grès noir mat', madeIn: 'France',
      careInstructions: 'Essuyer avec chiffon humide',
    },
  ];

  // --- Lucas: 5 products streetwear design ---
  const lucasProductsData = [
    {
      id: 'prod_lucas_hoodie_art', creatorId: lucas.id, projectId: projLucas.id,
      name: 'Hoodie "Urban Canvas"', description: 'Hoodie avec print all-over graphique inspire du street art bordelais.',
      price: 9500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(20),
      category: 'Sweat à capuche', gender: 'Unisexe', materials: '100% Coton Bio 350g',
      fit: 'Oversize', season: 'Automne-Hiver', madeIn: 'Portugal',
      careInstructions: "Lavage 30° à l'envers", certifications: 'OEKO-TEX', weight: 350,
    },
    {
      id: 'prod_lucas_tshirt_typo', creatorId: lucas.id, projectId: projLucas.id,
      name: 'T-shirt Typo Bold', description: 'T-shirt avec typographie bold exclusive, coton bio 180g.',
      price: 3900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(18),
      category: 'T-shirt', gender: 'Unisexe', materials: '100% Coton Bio 180g',
      fit: 'Regular', season: 'Toute saison', madeIn: 'Portugal',
      careInstructions: 'Lavage 30°', certifications: 'OEKO-TEX', weight: 180,
    },
    {
      id: 'prod_lucas_veste_jean', creatorId: lucas.id, projectId: projLucas.id,
      name: 'Veste Jean Customisee', description: 'Veste en jean vintage avec patchs et broderies faites main.',
      price: 14500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(15),
      category: 'Veste', gender: 'Unisexe', materials: '100% Coton Denim',
      fit: 'Oversize', season: 'Printemps-Été', madeIn: 'France',
      careInstructions: 'Lavage 30° rare',
    },
    {
      id: 'prod_lucas_short_mesh', creatorId: lucas.id, projectId: projLucas.id,
      name: 'Short Mesh Basketball', description: 'Short en mesh avec bandes laterales imprimees.',
      price: 5500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(12),
      category: 'Short', gender: 'Homme', materials: '100% Polyester recyclé',
      fit: 'Regular', season: 'Printemps-Été', madeIn: 'Portugal',
      careInstructions: 'Lavage 40°', certifications: 'OEKO-TEX', weight: 150,
    },
    {
      id: 'prod_lucas_sac_banane', creatorId: lucas.id, projectId: projLucas.id,
      name: 'Sac Banane Reflectif', description: 'Sac banane en tissu reflectif 3M, zip etanche.',
      price: 4200, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(10),
      category: 'Accessoire', gender: 'Unisexe', materials: 'Tissu Réfléchissant 3M + Polyester',
      madeIn: 'France', careInstructions: 'Essuyage humide uniquement',
    },
  ];

  // --- Claire: 4 products mode vintage ---
  const claireProductsData = [
    {
      id: 'prod_claire_robe_70s', creatorId: claire.id, projectId: projClaire.id,
      name: 'Robe Boheme 70s', description: 'Robe longue fleurie style 70s, tissu fluide et ceinture macrame.',
      price: 8500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(22),
      category: 'Robe', gender: 'Femme', materials: 'Viscose fluide imprimée',
      fit: 'Regular', season: 'Printemps-Été', madeIn: 'France (vintage)',
      careInstructions: 'Lavage main 30°',
    },
    {
      id: 'prod_claire_blazer_xl', creatorId: claire.id, projectId: projClaire.id,
      name: 'Blazer Oversize 90s', description: 'Blazer oversize prince-de-galles, epaulettes structurees.',
      price: 9500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(18),
      category: 'Blazer', gender: 'Femme', materials: '55% Polyester, 45% Viscose',
      fit: 'Oversize', season: 'Automne-Hiver', madeIn: 'France (vintage)',
      careInstructions: 'Nettoyage à sec',
    },
    {
      id: 'prod_claire_jupe_plissee', creatorId: claire.id, projectId: projClaire.id,
      name: 'Jupe Plissee Ecossaise', description: 'Jupe plissee mi-longue en tartan ecossais authentique.',
      price: 6500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(14),
      category: 'Jupe', gender: 'Femme', materials: '100% Laine Tartan',
      fit: 'Regular', season: 'Automne-Hiver', madeIn: 'Écosse (vintage)',
      careInstructions: 'Nettoyage à sec',
    },
    {
      id: 'prod_claire_pull_mohair', creatorId: claire.id, projectId: projClaire.id,
      name: 'Pull Mohair Pastel', description: 'Pull oversize en mohair italien, coloris rose poudre.',
      price: 7800, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(10),
      category: 'Pull', gender: 'Femme', materials: '70% Mohair, 30% Soie',
      fit: 'Oversize', season: 'Automne-Hiver', madeIn: 'Italie (vintage)',
      careInstructions: 'Lavage main eau froide',
    },
  ];

  // --- Marc: 3 products accessoires vintage ---
  const marcProductsData = [
    {
      id: 'prod_marc_montre_auto', creatorId: marc.id, projectId: projMarc.id,
      name: 'Montre Automatique Restauree', description: 'Montre mecanique des annees 60 entierement restauree, bracelet cuir.',
      price: 18500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(15),
      category: 'Montre', gender: 'Homme', materials: 'Boîtier Acier, Bracelet Cuir vachette',
      madeIn: 'Suisse (vintage années 60)', careInstructions: 'Éviter contact eau',
    },
    {
      id: 'prod_marc_ceinture_cuir', creatorId: marc.id, projectId: projMarc.id,
      name: 'Ceinture Cuir Patine', description: 'Ceinture en cuir pleine fleur patine a la main, boucle laiton.',
      price: 6500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(12),
      category: 'Ceinture', gender: 'Unisexe', materials: 'Cuir pleine fleur patiné',
      madeIn: 'France (vintage)', careInstructions: 'Crème protectrice cuir',
    },
    {
      id: 'prod_marc_lunettes_retro', creatorId: marc.id, projectId: projMarc.id,
      name: 'Lunettes Retro Ecaille', description: 'Monture retro en acetate ecaille, verres solaires polarises.',
      price: 12000, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(8),
      category: 'Lunettes', gender: 'Unisexe', materials: 'Monture Acétate, Verres polycarbonate polarisés',
      madeIn: 'France (vintage années 70)', careInstructions: 'Chiffon microfibre',
    },
  ];

  const allProducts = [
    ...joseProductsData, ...sophieProductsData, ...lucasProductsData,
    ...claireProductsData, ...marcProductsData,
  ];

  for (const product of allProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        category: product.category,
        gender: (product as { gender?: string }).gender ?? null,
        materials: (product as { materials?: string }).materials ?? null,
        fit: (product as { fit?: string }).fit ?? null,
        season: (product as { season?: string }).season ?? null,
        madeIn: (product as { madeIn?: string }).madeIn ?? null,
        careInstructions: (product as { careInstructions?: string }).careInstructions ?? null,
        certifications: (product as { certifications?: string }).certifications ?? null,
        weight: (product as { weight?: number }).weight ?? null,
      },
      create: product,
    });
  }
  console.log(`✅ ${allProducts.length} products created/updated with metadata (Jose:8, Sophie:5, Lucas:5, Claire:4, Marc:3)`);

  // ============================================
  // PRODUCT IMAGES
  // ============================================

  const PRODUCT_IMAGES: Record<string, { url: string; alt: string; position: number }[]> = {
    // ─── JOSE - Streetwear ───────────────────────────────────────────────
    'prod_jose_hoodie_noir': [
      { url: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&h=800&fit=crop', alt: 'Hoodie Oversize Noir - Vue face', position: 0 },
      { url: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&h=800&fit=crop', alt: 'Hoodie Oversize Noir - Vue dos', position: 1 },
      { url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&h=800&fit=crop', alt: 'Hoodie Oversize Noir - Détail capuche', position: 2 },
    ],
    'prod_jose_tshirt_graphic': [
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop', alt: 'T-shirt Graphique Antidote - Vue face', position: 0 },
      { url: 'https://images.unsplash.com/photo-1503341338985-95661e5a8f6e?w=800&h=800&fit=crop', alt: 'T-shirt Graphique Antidote - Vue dos', position: 1 },
    ],
    'prod_jose_pantalon_cargo': [
      { url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=800&fit=crop', alt: 'Pantalon Cargo Kaki - Vue face', position: 0 },
      { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=800&fit=crop', alt: 'Pantalon Cargo Kaki - Détail poches', position: 1 },
    ],
    'prod_jose_bomber': [
      { url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=800&fit=crop', alt: 'Bomber Matelassé - Vue face', position: 0 },
      { url: 'https://images.unsplash.com/photo-1553143820-6bb68bc34679?w=800&h=800&fit=crop', alt: 'Bomber Matelassé - Vue détail', position: 1 },
    ],
    'prod_jose_bonnet': [
      { url: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&h=800&fit=crop', alt: 'Bonnet Laine Merinos - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1510598155534-9b4a5da5c9e5?w=800&h=800&fit=crop', alt: 'Bonnet Laine Merinos - Porté', position: 1 },
    ],
    'prod_jose_casquette': [
      { url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=800&fit=crop', alt: 'Casquette Brodée KPSULL - Vue face', position: 0 },
      { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=800&fit=crop', alt: 'Casquette Brodée KPSULL - Portée', position: 1 },
    ],
    'prod_jose_tote': [
      { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop', alt: 'Tote Bag Canvas - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&h=800&fit=crop', alt: 'Tote Bag Canvas - Détail', position: 1 },
    ],
    'prod_jose_sweat': [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop', alt: 'Sweat Col Rond Gris Chiné - Vue face', position: 0 },
      { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&h=800&fit=crop', alt: 'Sweat Col Rond Gris Chiné - Vue dos', position: 1 },
    ],

    // ─── SOPHIE - Céramique ──────────────────────────────────────────────
    'prod_sophie_bol_raku': [
      { url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=800&fit=crop', alt: 'Bol Raku Terre & Feu - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1603903631918-a8c8a40e4c25?w=800&h=800&fit=crop', alt: 'Bol Raku Terre & Feu - Vue de dessus', position: 1 },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop', alt: 'Bol Raku Terre & Feu - Détail émaillage', position: 2 },
    ],
    'prod_sophie_vase_bleu': [
      { url: 'https://images.unsplash.com/photo-1612196808214-b7c07b51e12b?w=800&h=800&fit=crop', alt: 'Vase Bleu Cobalt - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&h=800&fit=crop', alt: 'Vase Bleu Cobalt - Détail émail', position: 1 },
    ],
    'prod_sophie_tasse_duo': [
      { url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&h=800&fit=crop', alt: 'Duo de Tasses Espresso - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop', alt: 'Duo de Tasses Espresso - Mise en scène', position: 1 },
    ],
    'prod_sophie_assiette': [
      { url: 'https://images.unsplash.com/photo-1588951291046-c66b4f9875e5?w=800&h=800&fit=crop', alt: 'Assiette Plate Wabi-Sabi - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1601699165292-b3b1acd6472c?w=800&h=800&fit=crop', alt: 'Assiette Plate Wabi-Sabi - Détail bords', position: 1 },
    ],
    'prod_sophie_bougeoir': [
      { url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=800&fit=crop', alt: 'Bougeoir Sculpté - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1603905830888-36f4f0bf9a96?w=800&h=800&fit=crop', alt: 'Bougeoir Sculpté - Avec bougie', position: 1 },
    ],

    // ─── LUCAS - Streetwear Design ───────────────────────────────────────
    'prod_lucas_hoodie_art': [
      { url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop', alt: 'Hoodie Urban Canvas - Vue face', position: 0 },
      { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=800&fit=crop', alt: 'Hoodie Urban Canvas - Détail print', position: 1 },
      { url: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=800&h=800&fit=crop', alt: 'Hoodie Urban Canvas - Porté', position: 2 },
    ],
    'prod_lucas_tshirt_typo': [
      { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop', alt: 'T-shirt Typo Bold - Vue face', position: 0 },
      { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&h=800&fit=crop', alt: 'T-shirt Typo Bold - Vue dos', position: 1 },
    ],
    'prod_lucas_veste_jean': [
      { url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=800&fit=crop', alt: 'Veste Jean Customisée - Vue face', position: 0 },
      { url: 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=800&h=800&fit=crop', alt: 'Veste Jean Customisée - Détail patches', position: 1 },
    ],
    'prod_lucas_short_mesh': [
      { url: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&h=800&fit=crop', alt: 'Short Mesh Basketball - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&h=800&fit=crop', alt: 'Short Mesh Basketball - Vue détail', position: 1 },
    ],
    'prod_lucas_sac_banane': [
      { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop', alt: 'Sac Banane Réflectif - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=800&h=800&fit=crop', alt: 'Sac Banane Réflectif - Porté', position: 1 },
    ],

    // ─── CLAIRE - Mode Vintage ───────────────────────────────────────────
    'prod_claire_robe_70s': [
      { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=800&fit=crop', alt: 'Robe Bohème 70s - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&h=800&fit=crop', alt: 'Robe Bohème 70s - Vue fleurie', position: 1 },
      { url: 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800&h=800&fit=crop', alt: 'Robe Bohème 70s - Vue de détail', position: 2 },
    ],
    'prod_claire_blazer_xl': [
      { url: 'https://images.unsplash.com/photo-1562184552-9f081a2ce676?w=800&h=800&fit=crop', alt: 'Blazer Oversize 90s - Vue face', position: 0 },
      { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop', alt: 'Blazer Oversize 90s - Vue dos', position: 1 },
    ],
    'prod_claire_jupe_plissee': [
      { url: 'https://images.unsplash.com/photo-1594035035756-5e9cd6a03781?w=800&h=800&fit=crop', alt: 'Jupe Plissée Écossaise - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1583496661160-fb5218afa9a1?w=800&h=800&fit=crop', alt: 'Jupe Plissée Écossaise - Détail tartan', position: 1 },
    ],
    'prod_claire_pull_mohair': [
      { url: 'https://images.unsplash.com/photo-1549465220-1a629bd08dbd?w=800&h=800&fit=crop', alt: 'Pull Mohair Pastel - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=800&fit=crop', alt: 'Pull Mohair Pastel - Détail texture', position: 1 },
    ],

    // ─── MARC - Accessoires Vintage ──────────────────────────────────────
    'prod_marc_montre_auto': [
      { url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=800&fit=crop', alt: 'Montre Automatique Restaurée - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800&h=800&fit=crop', alt: 'Montre Automatique Restaurée - Détail cadran', position: 1 },
      { url: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=800&h=800&fit=crop', alt: 'Montre Automatique Restaurée - Bracelet cuir', position: 2 },
    ],
    'prod_marc_ceinture_cuir': [
      { url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&h=800&fit=crop', alt: 'Ceinture Cuir Patiné - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&h=800&fit=crop', alt: 'Ceinture Cuir Patiné - Détail boucle', position: 1 },
    ],
    'prod_marc_lunettes_retro': [
      { url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=800&fit=crop', alt: 'Lunettes Rétro Écaille - Vue principale', position: 0 },
      { url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=800&fit=crop', alt: 'Lunettes Rétro Écaille - Vue de profil', position: 1 },
    ],
  };

  await prisma.productImage.deleteMany({
    where: { productId: { in: allProducts.map((p) => p.id) } },
  });

  let imageCount = 0;
  for (const [productId, images] of Object.entries(PRODUCT_IMAGES)) {
    for (const img of images) {
      await prisma.productImage.create({ data: { productId, ...img } });
      imageCount++;
    }
  }
  console.log(`✅ ${imageCount} product images created (2-3 per product)`);

  // ============================================
  // CREATOR PAGES
  // ============================================

  const pagesData = [
    { creatorId: jose.id, slug: 'kpsull-officiel', title: 'KPSULL Officiel - Streetwear Artisanal', description: "Mode urbaine et accessoires faits main. L'antidote a l'uniforme." },
    { creatorId: sophie.id, slug: 'sophie-ceramique', title: 'Sophie Ceramique - Art de la Table', description: 'Pieces uniques en ceramique, tournees et emaillees a la main.' },
    { creatorId: lucas.id, slug: 'lucas-design-studio', title: 'Lucas Design Studio - Streetwear Graphique', description: 'Vetements streetwear avec des designs graphiques uniques.' },
    { creatorId: claire.id, slug: 'claire-vintage', title: 'Claire Vintage - Mode Intemporelle', description: 'Selection de pieces vintage soigneusement chinees et restaurees.' },
    { creatorId: marc.id, slug: 'marc-accessories', title: 'Marc Accessories - Le Charme du Vintage', description: 'Accessoires vintage restaures avec passion.' },
  ];

  const pages = [];
  for (const pd of pagesData) {
    const page = await prisma.creatorPage.upsert({
      where: { creatorId: pd.creatorId },
      update: {},
      create: {
        creatorId: pd.creatorId,
        slug: pd.slug,
        title: pd.title,
        description: pd.description,
        status: PageStatus.PUBLISHED,
        publishedAt: daysAgo(30),
      },
    });
    pages.push(page);
  }

  const [pageJose, pageSophie, pageLucas, pageClaire, pageMarc] = pages as [
    typeof pages[0], typeof pages[0], typeof pages[0], typeof pages[0], typeof pages[0],
  ];

  console.log('✅ Creator pages created (5 pages)');

  // ============================================
  // PAGE SECTIONS
  // ============================================

  await prisma.pageSection.deleteMany({
    where: { pageId: { in: pages.map((p) => p.id) } },
  });

  const sectionsData = [
    // Jose
    { pageId: pageJose.id, type: SectionType.HERO, position: 0, title: 'KPSULL Officiel', content: JSON.stringify({ subtitle: "L'antidote a l'uniforme", backgroundImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1920&h=600&fit=crop', ctaText: 'Decouvrir', ctaLink: '#products' }) },
    { pageId: pageJose.id, type: SectionType.ABOUT, position: 1, title: 'Notre histoire', content: JSON.stringify({ text: 'KPSULL est ne de la conviction que la mode peut etre unique, locale et accessible. Chaque piece est concue et fabriquee en France.', image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&h=400&fit=crop' }) },
    { pageId: pageJose.id, type: SectionType.PRODUCTS_GRID, position: 2, title: 'Nos creations', content: JSON.stringify({ columns: 3, limit: 9 }) },
    { pageId: pageJose.id, type: SectionType.CONTACT, position: 3, title: 'Contact', content: JSON.stringify({ email: 'jose.lecreateur@kpsull.fr', instagram: '@kpsull', showForm: true }) },
    // Sophie
    { pageId: pageSophie.id, type: SectionType.HERO, position: 0, title: 'Sophie Ceramique', content: JSON.stringify({ subtitle: "L'art du feu et de la terre", backgroundImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1920&h=600&fit=crop', ctaText: 'Explorer', ctaLink: '#products' }) },
    { pageId: pageSophie.id, type: SectionType.PRODUCTS_GRID, position: 1, title: 'Mes creations', content: JSON.stringify({ columns: 3, limit: 6 }) },
    // Lucas
    { pageId: pageLucas.id, type: SectionType.HERO, position: 0, title: 'Lucas Design Studio', content: JSON.stringify({ subtitle: 'Le streetwear comme une toile', backgroundImage: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1920&h=600&fit=crop', ctaText: 'Voir la collection', ctaLink: '#products' }) },
    { pageId: pageLucas.id, type: SectionType.PRODUCTS_GRID, position: 1, title: 'La collection', content: JSON.stringify({ columns: 3, limit: 6 }) },
    // Claire
    { pageId: pageClaire.id, type: SectionType.HERO, position: 0, title: 'Claire Vintage', content: JSON.stringify({ subtitle: 'La mode qui traverse le temps', backgroundImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&h=600&fit=crop', ctaText: 'Chiner', ctaLink: '#products' }) },
    { pageId: pageClaire.id, type: SectionType.PRODUCTS_GRID, position: 1, title: 'Pieces chinees', content: JSON.stringify({ columns: 2, limit: 4 }) },
    // Marc
    { pageId: pageMarc.id, type: SectionType.HERO, position: 0, title: 'Marc Accessories', content: JSON.stringify({ subtitle: "Le charme des accessoires d'antan", backgroundImage: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1920&h=600&fit=crop', ctaText: 'Decouvrir', ctaLink: '#products' }) },
    { pageId: pageMarc.id, type: SectionType.PRODUCTS_GRID, position: 1, title: 'Mes trouvailles', content: JSON.stringify({ columns: 3, limit: 3 }) },
  ];

  await prisma.pageSection.createMany({ data: sectionsData });
  console.log('✅ Page sections created (12 sections)');

  // ============================================
  // ORDERS - Clean slate
  // ============================================

  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  console.log('🧹 Existing orders cleared');

  let orderCounter = 0;
  function nextOrderNumber(): string {
    orderCounter++;
    return `ORD-2026-${String(orderCounter).padStart(4, '0')}`;
  }

  // Helper to create an order and its items
  async function createOrder(data: {
    creatorId: string;
    customer: typeof clients[0];
    status: OrderStatus;
    items: { productId: string; productName: string; quantity: number; price: number }[];
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

  // ============================================
  // JOSE ORDERS (15)
  // ============================================

  console.log('\n📦 Creating Jose orders...');

  // Jose Order 1: DELIVERED - Alice bought hoodie + tshirt
  const orderJose1 = await createOrder({
    creatorId: jose.id, customer: alice, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_jose_hoodie_noir', productName: 'Hoodie Oversize Noir', quantity: 1, price: 8900 },
      { productId: 'prod_jose_tshirt_graphic', productName: 'T-shirt Graphique "Antidote"', quantity: 1, price: 4500 },
    ],
    trackingNumber: 'COL2026001001', carrier: 'colissimo', shippedAt: daysAgo(20), deliveredAt: daysAgo(17), createdAt: daysAgo(22),
  });

  // Jose Order 2: DELIVERED - Bob bought cargo + bonnet
  await createOrder({
    creatorId: jose.id, customer: bob, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_jose_pantalon_cargo', productName: 'Pantalon Cargo Kaki', quantity: 1, price: 7500 },
      { productId: 'prod_jose_bonnet', productName: 'Bonnet Laine Merinos', quantity: 1, price: 3500 },
    ],
    trackingNumber: 'COL2026001002', carrier: 'colissimo', shippedAt: daysAgo(18), deliveredAt: daysAgo(15), createdAt: daysAgo(20),
  });

  // Jose Order 3: DELIVERED - Lea bought bomber
  const orderJose3 = await createOrder({
    creatorId: jose.id, customer: lea, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_jose_bomber', productName: 'Bomber Matelasse', quantity: 1, price: 12500 },
    ],
    trackingNumber: 'CHR2026005001', carrier: 'chronopost', shippedAt: daysAgo(15), deliveredAt: daysAgo(13), createdAt: daysAgo(17),
  });

  // Jose Order 4: DELIVERED - Hugo bought sweat + casquette
  await createOrder({
    creatorId: jose.id, customer: hugo, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_jose_sweat', productName: 'Sweat Col Rond Gris Chine', quantity: 1, price: 6900 },
      { productId: 'prod_jose_casquette', productName: 'Casquette Brodee KPSULL', quantity: 1, price: 3900 },
    ],
    trackingNumber: 'COL2026001003', carrier: 'colissimo', shippedAt: daysAgo(12), deliveredAt: daysAgo(9), createdAt: daysAgo(14),
  });

  // Jose Order 5: DELIVERED - Manon bought tshirt x2 + tote
  await createOrder({
    creatorId: jose.id, customer: manon, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_jose_tshirt_graphic', productName: 'T-shirt Graphique "Antidote"', quantity: 2, price: 4500 },
      { productId: 'prod_jose_tote', productName: 'Tote Bag Canvas', quantity: 1, price: 2500 },
    ],
    trackingNumber: 'COL2026001004', carrier: 'colissimo', shippedAt: daysAgo(10), deliveredAt: daysAgo(7), createdAt: daysAgo(12),
  });

  // Jose Order 6: SHIPPED - Camille bought hoodie + cargo
  await createOrder({
    creatorId: jose.id, customer: camille, status: OrderStatus.SHIPPED,
    items: [
      { productId: 'prod_jose_hoodie_noir', productName: 'Hoodie Oversize Noir', quantity: 1, price: 8900 },
      { productId: 'prod_jose_pantalon_cargo', productName: 'Pantalon Cargo Kaki', quantity: 1, price: 7500 },
    ],
    trackingNumber: 'CHR2026005002', carrier: 'chronopost', shippedAt: daysAgo(2), createdAt: daysAgo(5),
  });

  // Jose Order 7: SHIPPED - Nathan bought bomber + tote
  await createOrder({
    creatorId: jose.id, customer: nathan, status: OrderStatus.SHIPPED,
    items: [
      { productId: 'prod_jose_bomber', productName: 'Bomber Matelasse', quantity: 1, price: 12500 },
      { productId: 'prod_jose_tote', productName: 'Tote Bag Canvas', quantity: 1, price: 2500 },
    ],
    trackingNumber: 'COL2026001005', carrier: 'colissimo', shippedAt: daysAgo(1), createdAt: daysAgo(3),
  });

  // Jose Order 8: SHIPPED - Oceane bought sweat
  await createOrder({
    creatorId: jose.id, customer: oceane, status: OrderStatus.SHIPPED,
    items: [
      { productId: 'prod_jose_sweat', productName: 'Sweat Col Rond Gris Chine', quantity: 1, price: 6900 },
    ],
    trackingNumber: 'COL2026001006', carrier: 'colissimo', shippedAt: daysAgo(1), createdAt: daysAgo(2),
  });

  // Jose Order 9: PAID - Emma bought hoodie + bonnet
  await createOrder({
    creatorId: jose.id, customer: emma, status: OrderStatus.PAID,
    items: [
      { productId: 'prod_jose_hoodie_noir', productName: 'Hoodie Oversize Noir', quantity: 1, price: 8900 },
      { productId: 'prod_jose_bonnet', productName: 'Bonnet Laine Merinos', quantity: 1, price: 3500 },
    ],
    createdAt: daysAgo(1),
  });

  // Jose Order 10: PAID - David bought tshirt + casquette
  await createOrder({
    creatorId: jose.id, customer: david, status: OrderStatus.PAID,
    items: [
      { productId: 'prod_jose_tshirt_graphic', productName: 'T-shirt Graphique "Antidote"', quantity: 1, price: 4500 },
      { productId: 'prod_jose_casquette', productName: 'Casquette Brodee KPSULL', quantity: 1, price: 3900 },
    ],
    createdAt: daysAgo(0),
  });

  // Jose Order 11: PAID - Felix bought cargo
  await createOrder({
    creatorId: jose.id, customer: felix, status: OrderStatus.PAID,
    items: [
      { productId: 'prod_jose_pantalon_cargo', productName: 'Pantalon Cargo Kaki', quantity: 1, price: 7500 },
    ],
    createdAt: daysAgo(0),
  });

  // Jose Order 12: PENDING - Paul just placed order
  await createOrder({
    creatorId: jose.id, customer: paul, status: OrderStatus.PENDING,
    items: [
      { productId: 'prod_jose_bomber', productName: 'Bomber Matelasse', quantity: 1, price: 12500 },
      { productId: 'prod_jose_bonnet', productName: 'Bonnet Laine Merinos', quantity: 1, price: 3500 },
    ],
    createdAt: new Date(),
  });

  // Jose Order 13: PENDING - Romane just placed order
  await createOrder({
    creatorId: jose.id, customer: romane, status: OrderStatus.PENDING,
    items: [
      { productId: 'prod_jose_sweat', productName: 'Sweat Col Rond Gris Chine', quantity: 1, price: 6900 },
      { productId: 'prod_jose_tote', productName: 'Tote Bag Canvas', quantity: 1, price: 2500 },
    ],
    createdAt: new Date(),
  });

  // Jose Order 14: CANCELED - Samuel canceled
  await createOrder({
    creatorId: jose.id, customer: samuel, status: OrderStatus.CANCELED,
    items: [
      { productId: 'prod_jose_hoodie_noir', productName: 'Hoodie Oversize Noir', quantity: 1, price: 8900 },
    ],
    createdAt: daysAgo(8),
  });

  // Jose Order 15: DISPUTE_OPENED - Tessa dispute
  const orderJose15 = await createOrder({
    creatorId: jose.id, customer: tessa, status: OrderStatus.DISPUTE_OPENED,
    items: [
      { productId: 'prod_jose_tshirt_graphic', productName: 'T-shirt Graphique "Antidote"', quantity: 1, price: 4500 },
      { productId: 'prod_jose_casquette', productName: 'Casquette Brodee KPSULL', quantity: 1, price: 3900 },
    ],
    trackingNumber: 'COL2026001007', carrier: 'colissimo', shippedAt: daysAgo(10), deliveredAt: daysAgo(7), createdAt: daysAgo(12),
  });

  console.log('   ✅ 15 orders for Jose');

  // ============================================
  // SOPHIE ORDERS (10)
  // ============================================

  console.log('📦 Creating Sophie orders...');

  // Sophie Order 1: DELIVERED - Alice bought bol raku + vase
  const orderSophie1 = await createOrder({
    creatorId: sophie.id, customer: alice, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_sophie_bol_raku', productName: 'Bol Raku Terre & Feu', quantity: 1, price: 4500 },
      { productId: 'prod_sophie_vase_bleu', productName: 'Vase Bleu Cobalt', quantity: 1, price: 7800 },
    ],
    trackingNumber: 'COL2026002001', carrier: 'colissimo', shippedAt: daysAgo(18), deliveredAt: daysAgo(15), createdAt: daysAgo(20),
  });

  // Sophie Order 2: DELIVERED - Camille bought tasses duo x2
  const orderSophie2 = await createOrder({
    creatorId: sophie.id, customer: camille, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_sophie_tasse_duo', productName: 'Duo de Tasses Espresso', quantity: 2, price: 3200 },
    ],
    trackingNumber: 'COL2026002002', carrier: 'colissimo', shippedAt: daysAgo(15), deliveredAt: daysAgo(12), createdAt: daysAgo(17),
  });

  // Sophie Order 3: DELIVERED - Manon bought assiette + bougeoir
  await createOrder({
    creatorId: sophie.id, customer: manon, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_sophie_assiette', productName: 'Assiette Plate Wabi-Sabi', quantity: 1, price: 3800 },
      { productId: 'prod_sophie_bougeoir', productName: 'Bougeoir Sculpte', quantity: 1, price: 2900 },
    ],
    trackingNumber: 'COL2026002003', carrier: 'colissimo', shippedAt: daysAgo(12), deliveredAt: daysAgo(9), createdAt: daysAgo(14),
  });

  // Sophie Order 4: DELIVERED - Ulysse bought vase
  await createOrder({
    creatorId: sophie.id, customer: ulysse, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_sophie_vase_bleu', productName: 'Vase Bleu Cobalt', quantity: 1, price: 7800 },
    ],
    trackingNumber: 'COL2026002004', carrier: 'colissimo', shippedAt: daysAgo(10), deliveredAt: daysAgo(7), createdAt: daysAgo(12),
  });

  // Sophie Order 5: SHIPPED - Victoire bought bol + assiette x2
  await createOrder({
    creatorId: sophie.id, customer: victoire, status: OrderStatus.SHIPPED,
    items: [
      { productId: 'prod_sophie_bol_raku', productName: 'Bol Raku Terre & Feu', quantity: 1, price: 4500 },
      { productId: 'prod_sophie_assiette', productName: 'Assiette Plate Wabi-Sabi', quantity: 2, price: 3800 },
    ],
    trackingNumber: 'COL2026002005', carrier: 'colissimo', shippedAt: daysAgo(1), createdAt: daysAgo(3),
  });

  // Sophie Order 6: SHIPPED - Yasmine bought bougeoir x2
  await createOrder({
    creatorId: sophie.id, customer: yasmine, status: OrderStatus.SHIPPED,
    items: [
      { productId: 'prod_sophie_bougeoir', productName: 'Bougeoir Sculpte', quantity: 2, price: 2900 },
    ],
    trackingNumber: 'COL2026002006', carrier: 'colissimo', shippedAt: daysAgo(1), createdAt: daysAgo(2),
  });

  // Sophie Order 7: PAID - Zoe bought tasses + vase
  await createOrder({
    creatorId: sophie.id, customer: zoe, status: OrderStatus.PAID,
    items: [
      { productId: 'prod_sophie_tasse_duo', productName: 'Duo de Tasses Espresso', quantity: 1, price: 3200 },
      { productId: 'prod_sophie_vase_bleu', productName: 'Vase Bleu Cobalt', quantity: 1, price: 7800 },
    ],
    createdAt: daysAgo(0),
  });

  // Sophie Order 8: PAID - William bought bol raku
  await createOrder({
    creatorId: sophie.id, customer: william, status: OrderStatus.PAID,
    items: [
      { productId: 'prod_sophie_bol_raku', productName: 'Bol Raku Terre & Feu', quantity: 1, price: 4500 },
    ],
    createdAt: daysAgo(0),
  });

  // Sophie Order 9: PENDING - Bob just placed order
  await createOrder({
    creatorId: sophie.id, customer: bob, status: OrderStatus.PENDING,
    items: [
      { productId: 'prod_sophie_assiette', productName: 'Assiette Plate Wabi-Sabi', quantity: 4, price: 3800 },
    ],
    createdAt: new Date(),
  });

  // Sophie Order 10: CANCELED - Emma canceled
  await createOrder({
    creatorId: sophie.id, customer: emma, status: OrderStatus.CANCELED,
    items: [
      { productId: 'prod_sophie_bougeoir', productName: 'Bougeoir Sculpte', quantity: 1, price: 2900 },
    ],
    createdAt: daysAgo(5),
  });

  console.log('   ✅ 10 orders for Sophie');

  // ============================================
  // LUCAS ORDERS (8)
  // ============================================

  console.log('📦 Creating Lucas orders...');

  // Lucas Order 1: DELIVERED - David bought hoodie art
  await createOrder({
    creatorId: lucas.id, customer: david, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_lucas_hoodie_art', productName: 'Hoodie "Urban Canvas"', quantity: 1, price: 9500 },
    ],
    trackingNumber: 'COL2026003001', carrier: 'colissimo', shippedAt: daysAgo(14), deliveredAt: daysAgo(11), createdAt: daysAgo(16),
  });

  // Lucas Order 2: DELIVERED - Nathan bought tshirt typo + sac banane
  await createOrder({
    creatorId: lucas.id, customer: nathan, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_lucas_tshirt_typo', productName: 'T-shirt Typo Bold', quantity: 1, price: 3900 },
      { productId: 'prod_lucas_sac_banane', productName: 'Sac Banane Reflectif', quantity: 1, price: 4200 },
    ],
    trackingNumber: 'COL2026003002', carrier: 'colissimo', shippedAt: daysAgo(12), deliveredAt: daysAgo(9), createdAt: daysAgo(14),
  });

  // Lucas Order 3: DELIVERED - Oceane bought veste jean
  const orderLucas3 = await createOrder({
    creatorId: lucas.id, customer: oceane, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_lucas_veste_jean', productName: 'Veste Jean Customisee', quantity: 1, price: 14500 },
    ],
    trackingNumber: 'CHR2026006001', carrier: 'chronopost', shippedAt: daysAgo(8), deliveredAt: daysAgo(6), createdAt: daysAgo(10),
  });

  // Lucas Order 4: SHIPPED - Hugo bought hoodie art + short
  await createOrder({
    creatorId: lucas.id, customer: hugo, status: OrderStatus.SHIPPED,
    items: [
      { productId: 'prod_lucas_hoodie_art', productName: 'Hoodie "Urban Canvas"', quantity: 1, price: 9500 },
      { productId: 'prod_lucas_short_mesh', productName: 'Short Mesh Basketball', quantity: 1, price: 5500 },
    ],
    trackingNumber: 'COL2026003003', carrier: 'colissimo', shippedAt: daysAgo(1), createdAt: daysAgo(3),
  });

  // Lucas Order 5: SHIPPED - Felix bought tshirt typo x2
  await createOrder({
    creatorId: lucas.id, customer: felix, status: OrderStatus.SHIPPED,
    items: [
      { productId: 'prod_lucas_tshirt_typo', productName: 'T-shirt Typo Bold', quantity: 2, price: 3900 },
    ],
    trackingNumber: 'COL2026003004', carrier: 'colissimo', shippedAt: daysAgo(1), createdAt: daysAgo(2),
  });

  // Lucas Order 6: PAID - Alice bought sac banane + short
  await createOrder({
    creatorId: lucas.id, customer: alice, status: OrderStatus.PAID,
    items: [
      { productId: 'prod_lucas_sac_banane', productName: 'Sac Banane Reflectif', quantity: 1, price: 4200 },
      { productId: 'prod_lucas_short_mesh', productName: 'Short Mesh Basketball', quantity: 1, price: 5500 },
    ],
    createdAt: daysAgo(0),
  });

  // Lucas Order 7: PENDING - Paul just placed order
  await createOrder({
    creatorId: lucas.id, customer: paul, status: OrderStatus.PENDING,
    items: [
      { productId: 'prod_lucas_veste_jean', productName: 'Veste Jean Customisee', quantity: 1, price: 14500 },
    ],
    createdAt: new Date(),
  });

  // Lucas Order 8: CANCELED - Romane canceled
  await createOrder({
    creatorId: lucas.id, customer: romane, status: OrderStatus.CANCELED,
    items: [
      { productId: 'prod_lucas_tshirt_typo', productName: 'T-shirt Typo Bold', quantity: 1, price: 3900 },
    ],
    createdAt: daysAgo(6),
  });

  console.log('   ✅ 8 orders for Lucas');

  // ============================================
  // CLAIRE ORDERS (5)
  // ============================================

  console.log('📦 Creating Claire orders...');

  // Claire Order 1: DELIVERED - Lea bought robe 70s
  await createOrder({
    creatorId: claire.id, customer: lea, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_claire_robe_70s', productName: 'Robe Boheme 70s', quantity: 1, price: 8500 },
    ],
    trackingNumber: 'COL2026004001', carrier: 'colissimo', shippedAt: daysAgo(14), deliveredAt: daysAgo(11), createdAt: daysAgo(16),
  });

  // Claire Order 2: DELIVERED - Tessa bought blazer + jupe
  await createOrder({
    creatorId: claire.id, customer: tessa, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_claire_blazer_xl', productName: 'Blazer Oversize 90s', quantity: 1, price: 9500 },
      { productId: 'prod_claire_jupe_plissee', productName: 'Jupe Plissee Ecossaise', quantity: 1, price: 6500 },
    ],
    trackingNumber: 'COL2026004002', carrier: 'colissimo', shippedAt: daysAgo(10), deliveredAt: daysAgo(7), createdAt: daysAgo(12),
  });

  // Claire Order 3: SHIPPED - Yasmine bought pull mohair
  await createOrder({
    creatorId: claire.id, customer: yasmine, status: OrderStatus.SHIPPED,
    items: [
      { productId: 'prod_claire_pull_mohair', productName: 'Pull Mohair Pastel', quantity: 1, price: 7800 },
    ],
    trackingNumber: 'COL2026004003', carrier: 'colissimo', shippedAt: daysAgo(1), createdAt: daysAgo(3),
  });

  // Claire Order 4: PAID - Victoire bought robe + blazer
  await createOrder({
    creatorId: claire.id, customer: victoire, status: OrderStatus.PAID,
    items: [
      { productId: 'prod_claire_robe_70s', productName: 'Robe Boheme 70s', quantity: 1, price: 8500 },
      { productId: 'prod_claire_blazer_xl', productName: 'Blazer Oversize 90s', quantity: 1, price: 9500 },
    ],
    createdAt: daysAgo(0),
  });

  // Claire Order 5: PENDING - Zoe just placed order
  await createOrder({
    creatorId: claire.id, customer: zoe, status: OrderStatus.PENDING,
    items: [
      { productId: 'prod_claire_jupe_plissee', productName: 'Jupe Plissee Ecossaise', quantity: 1, price: 6500 },
      { productId: 'prod_claire_pull_mohair', productName: 'Pull Mohair Pastel', quantity: 1, price: 7800 },
    ],
    createdAt: new Date(),
  });

  console.log('   ✅ 5 orders for Claire');

  // ============================================
  // MARC ORDERS (4)
  // ============================================

  console.log('📦 Creating Marc orders...');

  // Marc Order 1: DELIVERED - William bought montre
  await createOrder({
    creatorId: marc.id, customer: william, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_marc_montre_auto', productName: 'Montre Automatique Restauree', quantity: 1, price: 18500 },
    ],
    trackingNumber: 'CHR2026007001', carrier: 'chronopost', shippedAt: daysAgo(10), deliveredAt: daysAgo(8), createdAt: daysAgo(12),
  });

  // Marc Order 2: SHIPPED - Ulysse bought ceinture + lunettes
  await createOrder({
    creatorId: marc.id, customer: ulysse, status: OrderStatus.SHIPPED,
    items: [
      { productId: 'prod_marc_ceinture_cuir', productName: 'Ceinture Cuir Patine', quantity: 1, price: 6500 },
      { productId: 'prod_marc_lunettes_retro', productName: 'Lunettes Retro Ecaille', quantity: 1, price: 12000 },
    ],
    trackingNumber: 'COL2026005001', carrier: 'colissimo', shippedAt: daysAgo(1), createdAt: daysAgo(3),
  });

  // Marc Order 3: PAID - Samuel bought ceinture
  await createOrder({
    creatorId: marc.id, customer: samuel, status: OrderStatus.PAID,
    items: [
      { productId: 'prod_marc_ceinture_cuir', productName: 'Ceinture Cuir Patine', quantity: 1, price: 6500 },
    ],
    createdAt: daysAgo(0),
  });

  // Marc Order 4: PENDING - Manon just placed order
  await createOrder({
    creatorId: marc.id, customer: manon, status: OrderStatus.PENDING,
    items: [
      { productId: 'prod_marc_lunettes_retro', productName: 'Lunettes Retro Ecaille', quantity: 1, price: 12000 },
    ],
    createdAt: new Date(),
  });

  console.log('   ✅ 4 orders for Marc');

  // ============================================
  // SYSTEM STYLES
  // ============================================

  console.log('\n🎨 Creating system styles...');

  const systemStyles = [
    { name: 'Streetwear', description: 'Mode urbaine, oversize, graphic tees, sneakers' },
    { name: 'Vintage', description: 'Pieces retro et secondes mains revisitees' },
    { name: 'Ceramique', description: 'Artisanat ceramique, poterie et creations en argile' },
    { name: 'Minimaliste', description: 'Design epure, lignes nettes, palette neutre' },
    { name: 'Boheme', description: 'Esprit libre, matieres naturelles, imprimés ethniques' },
    { name: 'Sportswear', description: 'Vetements techniques et confortables pour le sport' },
    { name: 'Luxe', description: 'Matieres nobles, finitions haut de gamme, editions limitees' },
    { name: 'Art', description: 'Creations artistiques uniques, editions limitees signees' },
  ];

  for (const style of systemStyles) {
    await prisma.style.upsert({
      where: { name: style.name },
      update: {},
      create: {
        name: style.name,
        description: style.description,
        isCustom: false,
        creatorId: null,
      },
    });
  }

  console.log(`   ✅ ${systemStyles.length} system styles created`);

  // Lier les styles aux produits
  const styleStreetware = await prisma.style.findFirst({ where: { name: 'Streetwear' } });
  const styleVintage = await prisma.style.findFirst({ where: { name: 'Vintage' } });
  const styleCeramique = await prisma.style.findFirst({ where: { name: 'Ceramique' } });

  if (styleStreetware) {
    const streetwearProductIds = [
      'prod_jose_hoodie_noir', 'prod_jose_tshirt_graphic', 'prod_jose_pantalon_cargo',
      'prod_jose_bomber', 'prod_jose_bonnet', 'prod_jose_casquette', 'prod_jose_tote',
      'prod_jose_sweat', 'prod_lucas_hoodie_art', 'prod_lucas_tshirt_typo',
      'prod_lucas_veste_jean', 'prod_lucas_short_mesh', 'prod_lucas_sac_banane',
    ];
    for (const pid of streetwearProductIds) {
      await prisma.product.update({ where: { id: pid }, data: { styleId: styleStreetware.id } });
    }
  }
  if (styleVintage) {
    const vintageProductIds = [
      'prod_claire_robe_70s', 'prod_claire_blazer_xl', 'prod_claire_jupe_plissee',
      'prod_claire_pull_mohair', 'prod_marc_montre_auto', 'prod_marc_ceinture_cuir',
      'prod_marc_lunettes_retro',
    ];
    for (const pid of vintageProductIds) {
      await prisma.product.update({ where: { id: pid }, data: { styleId: styleVintage.id } });
    }
  }
  if (styleCeramique) {
    const ceramiqueProductIds = [
      'prod_sophie_bol_raku', 'prod_sophie_vase_bleu', 'prod_sophie_tasse_duo',
      'prod_sophie_assiette', 'prod_sophie_bougeoir',
    ];
    for (const pid of ceramiqueProductIds) {
      await prisma.product.update({ where: { id: pid }, data: { styleId: styleCeramique.id } });
    }
  }
  console.log('   ✅ Styles linked to products');

  // ============================================
  // NOTIFICATION PREFERENCES
  // ============================================

  console.log('\n🔔 Creating notification preferences...');

  const clientNotifTypes = [
    'ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED',
    'REFUND_PROCESSED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'DISPUTE_UPDATE',
  ];
  const creatorNotifTypes = [
    'ORDER_RECEIVED', 'ORDER_PAID', 'RETURN_REQUEST_RECEIVED', 'DISPUTE_OPENED',
    'REVIEW_RECEIVED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_EXPIRING',
    'PAYMENT_FAILED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_REACTIVATED',
  ];

  const allClientUsers = [admin, ...clients];
  for (const user of allClientUsers) {
    for (const type of clientNotifTypes) {
      await prisma.notificationPreference.upsert({
        where: { userId_type: { userId: user.id, type } },
        update: {},
        create: { userId: user.id, type, email: true, inApp: true },
      });
    }
  }
  const creatorUsers = [jose, sophie, lucas, claire, marc];
  for (const creator of creatorUsers) {
    for (const type of creatorNotifTypes) {
      await prisma.notificationPreference.upsert({
        where: { userId_type: { userId: creator.id, type } },
        update: {},
        create: { userId: creator.id, type, email: true, inApp: true },
      });
    }
  }
  console.log('   ✅ Notification preferences created for all users');

  // ============================================
  // CARTS
  // ============================================

  console.log('\n🛒 Creating carts...');

  const cartsData = [
    {
      userId: alice.id,
      items: JSON.stringify([{
        id: 'cart_item_alice_1',
        productId: 'prod_jose_hoodie_noir',
        variantId: 'var_jose_hoodie_noir',
        name: 'Hoodie Oversize Noir',
        price: 8900,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&h=800&fit=crop',
        variantInfo: { type: 'Couleur', value: 'Noir' },
        creatorSlug: 'kpsull-officiel',
      }]),
    },
    {
      userId: bob.id,
      items: JSON.stringify([
        {
          id: 'cart_item_bob_1',
          productId: 'prod_sophie_bol_raku',
          variantId: null,
          name: 'Bol Raku Terre & Feu',
          price: 4500,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=800&fit=crop',
          variantInfo: null,
          creatorSlug: 'sophie-ceramique',
        },
        {
          id: 'cart_item_bob_2',
          productId: 'prod_sophie_vase_bleu',
          variantId: null,
          name: 'Vase Bleu Cobalt',
          price: 7800,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1612196808214-b7c07b51e12b?w=800&h=800&fit=crop',
          variantInfo: null,
          creatorSlug: 'sophie-ceramique',
        },
      ]),
    },
    {
      userId: david.id,
      items: JSON.stringify([{
        id: 'cart_item_david_1',
        productId: 'prod_lucas_hoodie_art',
        variantId: 'var_lucas_hoodie_noir',
        name: 'Hoodie "Urban Canvas"',
        price: 9500,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop',
        variantInfo: { type: 'Couleur', value: 'Noir' },
        creatorSlug: 'lucas-design-studio',
      }]),
    },
    {
      userId: emma.id,
      items: JSON.stringify([{
        id: 'cart_item_emma_1',
        productId: 'prod_claire_robe_70s',
        variantId: null,
        name: 'Robe Boheme 70s',
        price: 8500,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=800&fit=crop',
        variantInfo: null,
        creatorSlug: 'claire-vintage',
      }]),
    },
    {
      userId: felix.id,
      items: JSON.stringify([{
        id: 'cart_item_felix_1',
        productId: 'prod_marc_montre_auto',
        variantId: null,
        name: 'Montre Automatique Restauree',
        price: 18500,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=800&fit=crop',
        variantInfo: null,
        creatorSlug: 'marc-accessories',
      }]),
    },
  ];

  for (const cart of cartsData) {
    await prisma.cart.upsert({
      where: { userId: cart.userId },
      update: { items: cart.items },
      create: { userId: cart.userId, items: cart.items },
    });
  }
  console.log(`   ✅ ${cartsData.length} carts created`);

  // ============================================
  // RETURN REQUESTS
  // ============================================

  console.log('\n↩️  Creating return requests...');

  // orderJose1 (Alice, Hoodie): APPROVED, CHANGED_MIND
  await prisma.returnRequest.create({
    data: {
      orderId: orderJose1.id,
      customerId: alice.id,
      creatorId: jose.id,
      reason: ReturnReason.CHANGED_MIND,
      status: ReturnStatus.APPROVED,
      deliveredAt: daysAgo(17),
      approvedAt: daysAgo(14),
    },
  });

  // orderJose3 (Lea, Bomber): REQUESTED, NOT_AS_DESCRIBED
  await prisma.returnRequest.create({
    data: {
      orderId: orderJose3.id,
      customerId: lea.id,
      creatorId: jose.id,
      reason: ReturnReason.NOT_AS_DESCRIBED,
      status: ReturnStatus.REQUESTED,
      deliveredAt: daysAgo(13),
    },
  });

  // orderSophie1 (Alice, Bol+Vase): REFUNDED, DEFECTIVE
  await prisma.returnRequest.create({
    data: {
      orderId: orderSophie1.id,
      customerId: alice.id,
      creatorId: sophie.id,
      reason: ReturnReason.DEFECTIVE,
      status: ReturnStatus.REFUNDED,
      deliveredAt: daysAgo(15),
      approvedAt: daysAgo(12),
      refundedAt: daysAgo(8),
    },
  });

  // orderLucas3 (Oceane, Veste Jean): SHIPPED_BACK, NOT_AS_DESCRIBED
  await prisma.returnRequest.create({
    data: {
      orderId: orderLucas3.id,
      customerId: oceane.id,
      creatorId: lucas.id,
      reason: ReturnReason.NOT_AS_DESCRIBED,
      status: ReturnStatus.SHIPPED_BACK,
      deliveredAt: daysAgo(6),
      approvedAt: daysAgo(4),
      shippedAt: daysAgo(2),
    },
  });

  console.log('   ✅ 4 return requests created');

  // ============================================
  // DISPUTES
  // ============================================

  console.log('\n⚖️  Creating disputes...');

  // orderJose15 (Tessa) - OPEN, NOT_RECEIVED
  await prisma.dispute.create({
    data: {
      orderId: orderJose15.id,
      customerId: tessa.id,
      creatorId: jose.id,
      type: DisputeType.NOT_RECEIVED,
      description: "La commande est marquée comme livrée mais je n'ai rien reçu. Mon voisin n'a pas vu de colis non plus.",
      status: DisputeStatus.OPEN,
      createdAt: daysAgo(5),
    },
  });

  // orderSophie2 (Camille, Tasses) - RESOLVED, DAMAGED
  await prisma.dispute.create({
    data: {
      orderId: orderSophie2.id,
      customerId: camille.id,
      creatorId: sophie.id,
      type: DisputeType.DAMAGED,
      description: "Une des tasses est arrivée cassée malgré l'emballage.",
      status: DisputeStatus.RESOLVED,
      resolution: 'Remboursement partiel de 50% accepté par les deux parties.',
      resolvedAt: daysAgo(5),
      createdAt: daysAgo(12),
    },
  });

  console.log('   ✅ 2 disputes created');

  // ============================================
  // FLAGGED CONTENT
  // ============================================

  console.log('\n🚩 Creating flagged content...');

  await prisma.flaggedContent.create({
    data: {
      contentId: 'prod_lucas_veste_jean',
      contentType: 'PRODUCT',
      contentTitle: 'Veste Jean Customisée',
      contentDescription: 'Veste en jean vintage avec patchs et broderies faites main.',
      contentImageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
      creatorId: lucas.id,
      flaggedBy: alice.id,
      flagReason: FlagReason.MISLEADING_DESCRIPTION,
      flagDetails: 'La description mentionne "vintage" mais le produit semble neuf.',
      status: ModerationStatus.PENDING,
      flaggedAt: daysAgo(3),
    },
  });

  await prisma.flaggedContent.create({
    data: {
      contentId: 'prod_marc_montre_auto',
      contentType: 'PRODUCT',
      contentTitle: 'Montre Automatique Restaurée',
      contentDescription: 'Montre mécanique des années 60 restaurée.',
      contentImageUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400',
      creatorId: marc.id,
      flaggedBy: bob.id,
      flagReason: FlagReason.COUNTERFEIT,
      flagDetails: "La référence du mouvement ne correspond pas à une montre authentique des années 60.",
      status: ModerationStatus.APPROVED,
      moderatorId: admin.id,
      moderatorNote: "Vérifié avec l'expert horlogerie. Pièce authentique confirmée.",
      flaggedAt: daysAgo(15),
      moderatedAt: daysAgo(10),
    },
  });

  await prisma.flaggedContent.create({
    data: {
      contentId: 'prod_jose_tshirt_graphic',
      contentType: 'PRODUCT',
      contentTitle: 'T-shirt Graphique "Antidote"',
      contentDescription: 'T-shirt avec sérigraphie.',
      creatorId: jose.id,
      flaggedBy: camille.id,
      flagReason: FlagReason.INAPPROPRIATE_CONTENT,
      flagDetails: 'Le design "Antidote" pourrait être perçu comme une référence aux drogues.',
      status: ModerationStatus.HIDDEN,
      moderatorId: admin.id,
      moderatorNote: 'Design ambigu. Demande au créateur de modifier la description.',
      flaggedAt: daysAgo(20),
      moderatedAt: daysAgo(18),
    },
  });

  console.log('   ✅ 3 flagged content entries created');

  // ============================================
  // MODERATION ACTION RECORDS
  // ============================================

  console.log('\n🔨 Creating moderation action records...');

  const flaggedMontre = await prisma.flaggedContent.findFirst({
    where: { contentId: 'prod_marc_montre_auto', contentType: 'PRODUCT' },
  });
  if (flaggedMontre) {
    await prisma.moderationActionRecord.create({
      data: {
        flaggedContentId: flaggedMontre.id,
        action: ModerationActionType.APPROVE,
        moderatorId: admin.id,
        note: 'Pièce authentique vérifiée par expert horlogerie. Signalement non fondé.',
        createdAt: daysAgo(10),
      },
    });
  }

  const flaggedTshirt = await prisma.flaggedContent.findFirst({
    where: { contentId: 'prod_jose_tshirt_graphic', contentType: 'PRODUCT' },
  });
  if (flaggedTshirt) {
    await prisma.moderationActionRecord.create({
      data: {
        flaggedContentId: flaggedTshirt.id,
        action: ModerationActionType.HIDE,
        moderatorId: admin.id,
        note: 'Contenu temporairement masqué en attente de modification par le créateur.',
        createdAt: daysAgo(18),
      },
    });
  }

  console.log('   ✅ Moderation action records created');

  // ============================================
  // CREATOR SUSPENSION
  // ============================================

  console.log('\n🔒 Creating creator suspension...');

  await prisma.creatorSuspension.create({
    data: {
      creatorId: marc.id,
      suspendedBy: admin.id,
      reason: 'Vente de produits ne correspondant pas à la description. 3 plaintes clients consécutives.',
      suspendedAt: daysAgo(60),
      reactivatedAt: daysAgo(50),
      reactivatedBy: admin.id,
      reactivationReason: "Le créateur a mis à jour ses fiches produits et s'est engagé à améliorer ses descriptions.",
    },
  });

  console.log('   ✅ Creator suspension created (Marc - reactivated after 10 days)');

  // ============================================
  // NEW CREATORS (modular seed)
  // ============================================

  console.log('\n🚀 Seeding new creators (15 additional)...');

  const {
    users: newCreators,
    totalProducts: newProducts,
    totalOrders: newOrders,
  } = await seedNewCreators(prisma, hashedPassword, admin, clients, daysAgo, daysFromNow);

  console.log(`   ✅ ${newCreators.length} new creators seeded with ${newProducts} products and ${newOrders} orders`);

  // ============================================
  // SUMMARY
  // ============================================

  const totalOrders = orderCounter + newOrders;

  // ============================================
  // NEW PRODUCTS WITH VARIANTS (10 products)
  // ============================================

  console.log('\n🆕 Creating 10 new products with color variants...');

  const seedImages = loadSeedImages();

  // Helper: récupère les images d'une variante depuis seed-assets ou fallback Unsplash
  function getVariantImages(productId: string, variantId: string, fallbackUrls: string[]): string[] {
    const productEntry = seedImages[productId];
    if (productEntry?.variants?.[variantId]?.length) {
      return productEntry.variants[variantId] ?? fallbackUrls;
    }
    return fallbackUrls;
  }

  function getMainImages(productId: string, fallbackUrls: string[]): string[] {
    const productEntry = seedImages[productId];
    if (productEntry?.main?.length) {
      return productEntry.main;
    }
    return fallbackUrls;
  }

  // ── Nouveaux produits Jose (STUDIO) ──────────────────────────────────────
  const newProductsJose = [
    {
      id: 'prod_new_tshirt_basique',
      name: 'T-Shirt Basique Premium',
      description: 'T-shirt en coton bio 180g, coupe régulière, coutures renforcées. L\'essentiel du vestiaire.',
      price: 3900,
      creatorId: jose.id,
      projectId: projJoseStreet.id,
      category: 'T-shirt',
      gender: 'Unisexe',
      materials: '100% Coton Bio 180g',
      fit: 'Regular',
      season: 'Toute saison',
      madeIn: 'France',
      careInstructions: 'Lavage 30°',
      certifications: 'OEKO-TEX,GOTS Bio',
      weight: 180,
    },
    {
      id: 'prod_new_hoodie_premium',
      name: 'Hoodie Premium Oversize',
      description: 'Hoodie oversize 350g, molleton brossé intérieur, poche kangourou double. Confort maximal.',
      price: 7900,
      creatorId: jose.id,
      projectId: projJoseStreet.id,
      category: 'Sweat à capuche',
      gender: 'Unisexe',
      materials: '80% Coton Bio, 20% Polyester recyclé, 350g',
      fit: 'Oversize',
      season: 'Automne-Hiver',
      madeIn: 'France',
      careInstructions: 'Lavage 30° à l\'envers',
      certifications: 'OEKO-TEX',
      weight: 350,
    },
  ];

  // ── Nouveaux produits Lucas (STUDIO) ─────────────────────────────────────
  const newProductsLucas = [
    {
      id: 'prod_new_jogger_tech',
      name: 'Jogger Technique Performance',
      description: 'Jogging en tissu technique stretch 4 directions, taille élastique ajustable, poches zippées.',
      price: 6500,
      creatorId: lucas.id,
      projectId: projLucas.id,
      category: 'Pantalon',
      gender: 'Unisexe',
      materials: '88% Polyester recyclé, 12% Elasthane',
      fit: 'Regular',
      season: 'Toute saison',
      madeIn: 'Portugal',
      careInstructions: 'Lavage 40°',
      certifications: 'OEKO-TEX',
      weight: 200,
    },
    {
      id: 'prod_new_veste_coach',
      name: 'Veste Coach Windbreaker',
      description: 'Veste coupe-vent légère, coupe coach oversize, zip YKK intégral, poches latérales.',
      price: 8900,
      creatorId: lucas.id,
      projectId: projLucas.id,
      category: 'Veste',
      gender: 'Unisexe',
      materials: '100% Polyester ripstop',
      fit: 'Oversize',
      season: 'Printemps-Été',
      madeIn: 'Portugal',
      careInstructions: 'Lavage 30°',
      certifications: 'OEKO-TEX',
      weight: 180,
    },
    {
      id: 'prod_new_longline_tee',
      name: 'Longline Tee Graphique',
      description: 'T-shirt long tombant sous les hanches, print dos exclusif, coton épais 220g.',
      price: 4900,
      creatorId: lucas.id,
      projectId: projLucas.id,
      category: 'T-shirt',
      gender: 'Unisexe',
      materials: '100% Coton Bio 220g',
      fit: 'Oversize',
      season: 'Toute saison',
      madeIn: 'Portugal',
      careInstructions: 'Lavage 30° à l\'envers',
      certifications: 'OEKO-TEX',
      weight: 220,
    },
    {
      id: 'prod_new_sweat_zip',
      name: 'Sweat Zip Technique',
      description: 'Sweat zippé en molleton technique 300g, col montant, zip YKK double curseur.',
      price: 6900,
      creatorId: lucas.id,
      projectId: projLucas.id,
      category: 'Sweat',
      gender: 'Unisexe',
      materials: '80% Coton Bio, 20% Polyester recyclé, 300g',
      fit: 'Regular',
      season: 'Automne-Hiver',
      madeIn: 'Portugal',
      careInstructions: 'Lavage 30°',
      certifications: 'OEKO-TEX',
      weight: 300,
    },
  ];

  // ── Nouveaux produits Claire (ESSENTIEL) ──────────────────────────────────
  const newProductsClaire = [
    {
      id: 'prod_new_croptop',
      name: 'Crop Top Athleisure Côtelé',
      description: 'Crop top en jersey côtelé stretch, bretelles réglables, coupe ajustée. Idéal sport ou casual.',
      price: 2900,
      creatorId: claire.id,
      projectId: projClaire.id,
      category: 'Top',
      gender: 'Femme',
      materials: '95% Coton, 5% Elasthane',
      fit: 'Slim',
      season: 'Toute saison',
      madeIn: 'France',
      careInstructions: 'Lavage 30°',
      certifications: 'OEKO-TEX',
      weight: 120,
    },
    {
      id: 'prod_new_pull_colroule',
      name: 'Pull Col Roulé Essentiel',
      description: 'Pull col roulé en laine fine mérinos, toucher doux, coupe légèrement oversize.',
      price: 7500,
      creatorId: claire.id,
      projectId: projClaire.id,
      category: 'Pull',
      gender: 'Femme',
      materials: '100% Laine Mérinos fine',
      fit: 'Regular',
      season: 'Automne-Hiver',
      madeIn: 'France',
      careInstructions: 'Lavage main 30°',
      certifications: 'OEKO-TEX',
      weight: 280,
    },
    {
      id: 'prod_new_debardeur',
      name: 'Débardeur Oversize Coton',
      description: 'Débardeur oversize en coton biologique, encolure large, bretelles tombantes.',
      price: 2500,
      creatorId: claire.id,
      projectId: projClaire.id,
      category: 'Top',
      gender: 'Femme',
      materials: '100% Coton Bio 160g',
      fit: 'Oversize',
      season: 'Printemps-Été',
      madeIn: 'France',
      careInstructions: 'Lavage 30°',
      certifications: 'OEKO-TEX,GOTS Bio',
      weight: 160,
    },
  ];

  // ── Nouveau produit Marc (ESSENTIEL) ─────────────────────────────────────
  const newProductsMarc = [
    {
      id: 'prod_new_short_sport',
      name: 'Short Sport Premium 7"',
      description: 'Short de sport 7 pouces en polyester technique léger, intérieur filet intégré, ceinture élastique.',
      price: 4500,
      creatorId: marc.id,
      projectId: projMarc.id,
      category: 'Short',
      gender: 'Homme',
      materials: '100% Polyester recyclé léger',
      fit: 'Regular',
      season: 'Printemps-Été',
      madeIn: 'Portugal',
      careInstructions: 'Lavage 40°',
      certifications: 'OEKO-TEX',
      weight: 140,
    },
    {
      id: 'prod_new_legging_sport',
      name: 'Legging Sport Taille Haute',
      description: 'Legging sport taille haute en tissu compressif 4 directions, couture plate anti-frottements.',
      price: 5500,
      creatorId: marc.id,
      projectId: projMarc.id,
      category: 'Legging',
      gender: 'Femme',
      materials: '78% Polyester recyclé, 22% Elasthane',
      fit: 'Slim',
      season: 'Toute saison',
      madeIn: 'Portugal',
      careInstructions: 'Lavage 30°',
      certifications: 'OEKO-TEX',
      weight: 180,
    },
  ];

  const allNewProducts = [
    ...newProductsJose,
    ...newProductsLucas,
    ...newProductsClaire,
    ...newProductsMarc,
  ];

  for (const product of allNewProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        gender: product.gender,
        materials: product.materials,
        fit: product.fit,
        season: product.season,
        madeIn: product.madeIn,
        careInstructions: product.careInstructions,
        certifications: (product as { certifications?: string }).certifications ?? null,
        weight: (product as { weight?: number }).weight ?? null,
      },
      create: {
        id: product.id,
        creatorId: product.creatorId,
        projectId: product.projectId,
        name: product.name,
        description: product.description,
        price: product.price,
        status: ProductStatus.PUBLISHED,
        publishedAt: daysAgo(5),
        category: product.category,
        gender: product.gender,
        materials: product.materials,
        fit: product.fit,
        season: product.season,
        madeIn: product.madeIn,
        careInstructions: product.careInstructions,
        certifications: (product as { certifications?: string }).certifications ?? null,
        weight: (product as { weight?: number }).weight ?? null,
      },
    });
  }

  // ── Images des nouveaux produits ─────────────────────────────────────────
  // Fallbacks: tableaux d'URLs string (format attendu par getMainImages)
  const NEW_PRODUCT_IMAGES: Record<string, { url: string; alt: string; position: number }[]> = {
    'prod_new_tshirt_basique': getMainImages('prod_new_tshirt_basique', [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1503341338985-95661e5a8f6e?w=800&h=800&fit=crop',
    ]).map((url, position) => ({ url, alt: `T-Shirt Basique Premium - ${position === 0 ? 'Vue face' : 'Vue dos'}`, position })),

    'prod_new_hoodie_premium': getMainImages('prod_new_hoodie_premium', [
      'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&h=800&fit=crop',
    ]).map((url, position) => ({ url, alt: `Hoodie Premium Oversize - ${position === 0 ? 'Vue face' : 'Vue dos'}`, position })),

    'prod_new_jogger_tech': getMainImages('prod_new_jogger_tech', [
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&h=800&fit=crop',
    ]).map((url, position) => ({ url, alt: `Jogger Technique - ${position === 0 ? 'Vue principale' : 'Détail taille'}`, position })),

    'prod_new_veste_coach': getMainImages('prod_new_veste_coach', [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=800&h=800&fit=crop',
    ]).map((url, position) => ({ url, alt: `Veste Coach - ${position === 0 ? 'Vue face' : 'Vue dos'}`, position })),

    'prod_new_croptop': getMainImages('prod_new_croptop', [
      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=800&fit=crop',
    ]).map((url, position) => ({ url, alt: `Crop Top Athleisure - ${position === 0 ? 'Vue principale' : 'Détail tissu'}`, position })),

    'prod_new_short_sport': getMainImages('prod_new_short_sport', [
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&h=800&fit=crop',
    ]).map((url, position) => ({ url, alt: `Short Sport - ${position === 0 ? 'Vue principale' : 'Vue détail'}`, position })),

    'prod_new_pull_colroule': getMainImages('prod_new_pull_colroule', [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1458530308642-23cf011179e0?w=800&h=800&fit=crop',
    ]).map((url, position) => ({ url, alt: `Pull Col Roulé - ${position === 0 ? 'Vue principale' : 'Détail col'}`, position })),

    'prod_new_debardeur': getMainImages('prod_new_debardeur', [
      'https://images.unsplash.com/photo-1503341338985-95661e5a8f6e?w=800&h=800&fit=crop',
    ]).map((url, position) => ({ url, alt: `Débardeur Oversize - Vue principale`, position })),

    'prod_new_longline_tee': getMainImages('prod_new_longline_tee', [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop',
    ]).map((url, position) => ({ url, alt: `Longline Tee - ${position === 0 ? 'Vue face' : 'Vue dos'}`, position })),

    'prod_new_sweat_zip': getMainImages('prod_new_sweat_zip', [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&h=800&fit=crop',
    ]).map((url, position) => ({ url, alt: `Sweat Zip - ${position === 0 ? 'Vue face' : 'Vue dos'}`, position })),

    'prod_new_legging_sport': getMainImages('prod_new_legging_sport', [
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=800&fit=crop',
    ]).map((url, position) => ({ url, alt: `Legging Sport - Vue principale`, position })),
  };

  await prisma.productImage.deleteMany({
    where: { productId: { in: allNewProducts.map((p) => p.id) } },
  });

  let newImageCount = 0;
  for (const [productId, images] of Object.entries(NEW_PRODUCT_IMAGES)) {
    for (const img of images) {
      await prisma.productImage.create({ data: { productId, url: img.url, alt: img.alt, position: img.position } });
      newImageCount++;
    }
  }

  // ── Tailles des nouveaux produits ────────────────────────────────────────
  const NEW_PRODUCT_SIZES: Record<string, { size: string }[]> = {
    'prod_new_tshirt_basique':  [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }, { size: 'XXL' }],
    'prod_new_hoodie_premium':  [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }, { size: 'XXL' }],
    'prod_new_jogger_tech':     [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }, { size: 'XXL' }],
    'prod_new_veste_coach':     [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }],
    'prod_new_croptop':         [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }],
    'prod_new_short_sport':     [{ size: 'S'  }, { size: 'M' }, { size: 'L' }, { size: 'XL' }, { size: 'XXL' }],
    'prod_new_pull_colroule':   [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }],
    'prod_new_debardeur':       [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }],
    'prod_new_longline_tee':    [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }, { size: 'XXL' }],
    'prod_new_sweat_zip':       [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }, { size: 'XXL' }],
    'prod_new_legging_sport':   [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }],
  };

  for (const [productId, sizes] of Object.entries(NEW_PRODUCT_SIZES)) {
    await prisma.product.update({ where: { id: productId }, data: { sizes } });
  }

  // ── Variantes couleur des nouveaux produits ───────────────────────────────
  // stock[i] = stock pour la taille i (même ordre que NEW_PRODUCT_SIZES[productId])
  type NewVariantDef = {
    id: string;
    name: string;
    color: string;
    colorCode: string;
    stock: number[];
    fallbackImages: string[];
  };

  const NEW_PRODUCT_VARIANT_DEFS: Record<string, NewVariantDef[]> = {
    // ── T-Shirt Basique (XS S M L XL XXL) ──────────────────────────────────
    'prod_new_tshirt_basique': [
      { id: 'var_new_tshirt_blanc',  name: 'Blanc',  color: 'Blanc',  colorCode: '#f5f5f5', stock: [10, 18, 20, 15,  8,  4], fallbackImages: ['https://images.unsplash.com/photo-1581655353564-df123364d42e?w=800&h=800&fit=crop'] },
      { id: 'var_new_tshirt_noir',   name: 'Noir',   color: 'Noir',   colorCode: '#1a1a1a', stock: [8,  14, 18, 12,  6,  2], fallbackImages: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop'] },
      { id: 'var_new_tshirt_marine', name: 'Marine', color: 'Marine', colorCode: '#1B2A4A', stock: [6,  12, 15, 10,  5,  2], fallbackImages: ['https://images.unsplash.com/photo-1529374255-1e9231d7a1a4?w=800&h=800&fit=crop'] },
      { id: 'var_new_tshirt_rouge',  name: 'Rouge',  color: 'Rouge',  colorCode: '#C0392B', stock: [5,  10, 12,  8,  4,  1], fallbackImages: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop'] },
    ],

    // ── Hoodie Premium (XS S M L XL XXL) ───────────────────────────────────
    'prod_new_hoodie_premium': [
      { id: 'var_new_hoodie_noir',  name: 'Noir',  color: 'Noir',  colorCode: '#1a1a1a', stock: [8, 12, 15, 10,  6,  3], fallbackImages: ['https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&h=800&fit=crop'] },
      { id: 'var_new_hoodie_blanc', name: 'Blanc', color: 'Blanc', colorCode: '#f5f5f5', stock: [6, 10, 14,  8,  4,  2], fallbackImages: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop'] },
      { id: 'var_new_hoodie_ecru',  name: 'Écru',  color: 'Écru',  colorCode: '#f5f0e8', stock: [5,  9, 12,  7,  4,  2], fallbackImages: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=800&fit=crop'] },
      { id: 'var_new_hoodie_kaki',  name: 'Kaki',  color: 'Kaki',  colorCode: '#7d7c5e', stock: [4,  8, 10,  6,  3,  1], fallbackImages: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=800&fit=crop'] },
    ],

    // ── Jogger Technique (XS S M L XL XXL) ─────────────────────────────────
    'prod_new_jogger_tech': [
      { id: 'var_new_jogger_noir',   name: 'Noir',   color: 'Noir',   colorCode: '#1a1a1a', stock: [6, 10, 14,  9,  5,  2], fallbackImages: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=800&fit=crop'] },
      { id: 'var_new_jogger_grey',   name: 'Gris',   color: 'Gris',   colorCode: '#9e9e9e', stock: [5,  9, 12,  8,  4,  2], fallbackImages: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=800&fit=crop'] },
      { id: 'var_new_jogger_marine', name: 'Marine', color: 'Marine', colorCode: '#1B2A4A', stock: [4,  8, 10,  7,  3,  1], fallbackImages: ['https://images.unsplash.com/photo-1553143820-6bb68bc34679?w=800&h=800&fit=crop'] },
    ],

    // ── Veste Coach (XS S M L XL) ──────────────────────────────────────────
    'prod_new_veste_coach': [
      { id: 'var_new_coach_noir', name: 'Noir',         color: 'Noir',         colorCode: '#1a1a1a', stock: [5, 8, 10, 7, 3], fallbackImages: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop'] },
      { id: 'var_new_coach_vert', name: 'Vert Forêt',   color: 'Vert Forêt',   colorCode: '#2d5016', stock: [4, 7,  9, 6, 2], fallbackImages: ['https://images.unsplash.com/photo-1590739225338-0e6f5d1da7c1?w=800&h=800&fit=crop'] },
      { id: 'var_new_coach_navy', name: 'Marine',        color: 'Marine',       colorCode: '#1B2A4A', stock: [4, 6,  8, 5, 2], fallbackImages: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop'] },
    ],

    // ── Crop Top Athleisure (XS S M L XL) ──────────────────────────────────
    'prod_new_croptop': [
      { id: 'var_new_croptop_blanc', name: 'Blanc',      color: 'Blanc',      colorCode: '#f5f5f5', stock: [8, 12, 14, 10, 5], fallbackImages: ['https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&h=800&fit=crop'] },
      { id: 'var_new_croptop_noir',  name: 'Noir',       color: 'Noir',       colorCode: '#1a1a1a', stock: [7, 11, 13,  9, 4], fallbackImages: ['https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800&h=800&fit=crop'] },
      { id: 'var_new_croptop_rose',  name: 'Rose Poudre', color: 'Rose Poudre', colorCode: '#f8bbd9', stock: [6,  9, 11,  8, 3], fallbackImages: ['https://images.unsplash.com/photo-1549465220-1a629bd08dbd?w=800&h=800&fit=crop'] },
    ],

    // ── Short Sport (S M L XL XXL) ──────────────────────────────────────────
    'prod_new_short_sport': [
      { id: 'var_new_short_noir', name: 'Noir',  color: 'Noir',  colorCode: '#1a1a1a', stock: [6, 10, 12, 8, 4], fallbackImages: ['https://images.unsplash.com/photo-1499400955083-4b29b88f5f28?w=800&h=800&fit=crop'] },
      { id: 'var_new_short_grey', name: 'Gris',  color: 'Gris',  colorCode: '#9e9e9e', stock: [5,  9, 10, 7, 3], fallbackImages: ['https://images.unsplash.com/photo-1539710094960-3c18b5a6e5e3?w=800&h=800&fit=crop'] },
      { id: 'var_new_short_bleu', name: 'Bleu',  color: 'Bleu',  colorCode: '#1565c0', stock: [4,  7,  9, 6, 2], fallbackImages: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=800&fit=crop'] },
    ],

    // ── Pull Col Roulé (XS S M L XL) ───────────────────────────────────────
    'prod_new_pull_colroule': [
      { id: 'var_new_pull_creme', name: 'Crème',  color: 'Crème',  colorCode: '#f5f0e8', stock: [10, 15, 18, 12, 6], fallbackImages: ['https://images.unsplash.com/photo-1551488831-00ddcf7b4aad?w=800&h=800&fit=crop'] },
      { id: 'var_new_pull_noir',  name: 'Noir',   color: 'Noir',   colorCode: '#1a1a1a', stock: [8,  12, 15, 10, 5], fallbackImages: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&h=800&fit=crop'] },
      { id: 'var_new_pull_camel', name: 'Camel',  color: 'Camel',  colorCode: '#c9a05a', stock: [7,  10, 13,  8, 4], fallbackImages: ['https://images.unsplash.com/photo-1512327428351-61cf032f5a32?w=800&h=800&fit=crop'] },
    ],

    // ── Débardeur Oversize (XS S M L XL) ───────────────────────────────────
    'prod_new_debardeur': [
      { id: 'var_new_debardeur_blanc', name: 'Blanc', color: 'Blanc', colorCode: '#f5f5f5', stock: [8, 12, 14, 10, 5], fallbackImages: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop'] },
      { id: 'var_new_debardeur_noir',  name: 'Noir',  color: 'Noir',  colorCode: '#1a1a1a', stock: [7, 10, 12,  9, 4], fallbackImages: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop'] },
      { id: 'var_new_debardeur_gris',  name: 'Gris',  color: 'Gris',  colorCode: '#9e9e9e', stock: [5,  8, 10,  7, 3], fallbackImages: ['https://images.unsplash.com/photo-1559136555-9303baea8eae?w=800&h=800&fit=crop'] },
    ],

    // ── Longline Tee (XS S M L XL XXL) ─────────────────────────────────────
    'prod_new_longline_tee': [
      { id: 'var_new_longline_noir',  name: 'Noir',  color: 'Noir',  colorCode: '#1a1a1a', stock: [6, 10, 14, 10,  6,  2], fallbackImages: ['https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=800&h=800&fit=crop'] },
      { id: 'var_new_longline_blanc', name: 'Blanc', color: 'Blanc', colorCode: '#f5f5f5', stock: [5,  9, 12,  9,  5,  2], fallbackImages: ['https://images.unsplash.com/photo-1581655353564-df123364d42e?w=800&h=800&fit=crop'] },
      { id: 'var_new_longline_gris',  name: 'Gris',  color: 'Gris',  colorCode: '#9e9e9e', stock: [4,  8, 10,  8,  4,  1], fallbackImages: ['https://images.unsplash.com/photo-1529374255-1e9231d7a1a4?w=800&h=800&fit=crop'] },
    ],

    // ── Sweat Zip (XS S M L XL XXL) ────────────────────────────────────────
    'prod_new_sweat_zip': [
      { id: 'var_new_sweatzip_noir', name: 'Noir',  color: 'Noir',  colorCode: '#1a1a1a', stock: [6, 10, 12,  8,  5,  2], fallbackImages: ['https://images.unsplash.com/photo-1610386648444-4af6fbec5fa5?w=800&h=800&fit=crop'] },
      { id: 'var_new_sweatzip_gris', name: 'Gris',  color: 'Gris',  colorCode: '#9e9e9e', stock: [5,  9, 11,  7,  4,  2], fallbackImages: ['https://images.unsplash.com/photo-1611312449408-fcedd27dff05?w=800&h=800&fit=crop'] },
      { id: 'var_new_sweatzip_navy', name: 'Marine', color: 'Marine', colorCode: '#1B2A4A', stock: [4,  7, 10,  6,  3,  1], fallbackImages: ['https://images.unsplash.com/photo-1612336469928-4a0eb8fef58a?w=800&h=800&fit=crop'] },
    ],

    // ── Legging Sport (XS S M L XL) ────────────────────────────────────────
    'prod_new_legging_sport': [
      { id: 'var_new_legging_noir',   name: 'Noir',   color: 'Noir',   colorCode: '#1a1a1a', stock: [8, 14, 16, 12, 6], fallbackImages: ['https://images.unsplash.com/photo-1576551488405-560c52818de7?w=800&h=800&fit=crop'] },
      { id: 'var_new_legging_marine', name: 'Marine', color: 'Marine', colorCode: '#1B2A4A', stock: [6, 11, 14, 10, 5], fallbackImages: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop'] },
      { id: 'var_new_legging_rose',   name: 'Rose',   color: 'Rose',   colorCode: '#f8bbd9', stock: [5,  9, 12,  8, 4], fallbackImages: ['https://images.unsplash.com/photo-1494436261687-24a14bc27e69?w=800&h=800&fit=crop'] },
    ],
  };

  // Cleanup des variantes/SKUs existants pour les nouveaux produits
  await prisma.productSku.deleteMany({ where: { productId: { in: allNewProducts.map((p) => p.id) } } });
  await prisma.productVariant.deleteMany({ where: { productId: { in: allNewProducts.map((p) => p.id) } } });

  let newVariantCount = 0;
  let newSkuCount = 0;

  for (const [productId, variantDefs] of Object.entries(NEW_PRODUCT_VARIANT_DEFS)) {
    const productSizes = NEW_PRODUCT_SIZES[productId] ?? [];

    for (const vd of variantDefs) {
      const variantImages = getVariantImages(productId, vd.id, vd.fallbackImages);

      await prisma.productVariant.upsert({
        where: { id: vd.id },
        update: { name: vd.name, color: vd.color, colorCode: vd.colorCode, images: variantImages },
        create: {
          id: vd.id,
          productId,
          name: vd.name,
          color: vd.color,
          colorCode: vd.colorCode,
          stock: 0,
          images: variantImages,
        },
      });
      newVariantCount++;

      for (const [si, sizeEntry] of productSizes.entries()) {
        await prisma.productSku.create({
          data: { productId, variantId: vd.id, size: sizeEntry.size, stock: vd.stock[si] ?? 0 },
        });
        newSkuCount++;
      }
    }
  }

  console.log(`✅ ${allNewProducts.length} new products created (Jose:2, Lucas:4, Claire:3, Marc:2)`);
  console.log(`✅ ${newImageCount} product images created for new products`);
  console.log(`✅ ${newVariantCount} new variants created, ${newSkuCount} new SKUs created`);

  // ============================================
  // PRODUCT VARIANTS & SKUS (Couleurs & Stocks)
  // ============================================

  console.log('\n👗 Creating product variants and SKUs...');

  // Clean up existing variants/SKUs for demo products
  await prisma.productSku.deleteMany({ where: { productId: { in: allProducts.map((p) => p.id) } } });
  await prisma.productVariant.deleteMany({ where: { productId: { in: allProducts.map((p) => p.id) } } });

  // ─── Tailles par produit (JSON field) ────────────────────────────────────
  // Seuls les vêtements ont des tailles. Accessoires, céramiques, sacs → pas de taille.
  // prod_jose_pantalon_cargo et prod_claire_jupe_plissee: mono-coloris → pas de variante, juste des tailles.
  const PRODUCT_SIZES: Record<string, { size: string }[]> = {
    // Jose - Streetwear
    'prod_jose_hoodie_noir':    [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }, { size: 'XXL' }],
    'prod_jose_tshirt_graphic': [{ size: 'S'  }, { size: 'M' }, { size: 'L' }, { size: 'XL' }, { size: 'XXL' }],
    'prod_jose_pantalon_cargo': [{ size: '38' }, { size: '40' }, { size: '42' }, { size: '44' }, { size: '46' }],
    'prod_jose_bomber':         [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L'  }, { size: 'XL'  }],
    'prod_jose_sweat':          [{ size: 'S'  }, { size: 'M' }, { size: 'L' }, { size: 'XL' }, { size: 'XXL' }],
    'prod_jose_bonnet':         [{ size: 'Unique' }],
    'prod_jose_casquette':      [{ size: 'Unique' }],
    // Lucas - Streetwear Design
    'prod_lucas_hoodie_art':    [{ size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }],
    'prod_lucas_tshirt_typo':   [{ size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }],
    'prod_lucas_short_mesh':    [{ size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }],
    'prod_lucas_veste_jean':    [{ size: 'S' }, { size: 'M' }, { size: 'L' }, { size: 'XL' }],
    // Claire - Mode Vintage
    'prod_claire_robe_70s':     [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L'  }],
    'prod_claire_blazer_xl':    [{ size: 'S'  }, { size: 'M' }, { size: 'L' }, { size: 'XL' }, { size: 'XXL' }],
    'prod_claire_jupe_plissee': [{ size: '34' }, { size: '36' }, { size: '38' }, { size: '40' }, { size: '42' }],
    'prod_claire_pull_mohair':  [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L'  }, { size: 'XL'  }],
  };

  for (const [productId, sizes] of Object.entries(PRODUCT_SIZES)) {
    await prisma.product.update({ where: { id: productId }, data: { sizes } });
  }

  // ─── Produits AVEC variantes couleur ─────────────────────────────────────
  // stock[i] = stock pour la taille i (même ordre que PRODUCT_SIZES[productId]).
  // Profils utilisés :
  //   new_launch  → stock abondant, collection fraîchement lancée
  //   mid_season  → mi-saison, les tailles populaires (M/L) se vendent bien
  //   bestseller  → tailles cœur (M/L) sold out, stock résiduel sur les extrêmes
  //   end_season  → quasi épuisé, derniers exemplaires
  //   rare        → pièce artisanale, très peu d'unités
  type VariantDef = { id: string; name: string; color: string; colorCode: string; stock: number[] };

  const PRODUCT_VARIANT_DEFS: Record<string, VariantDef[]> = {

    // ── Jose Hoodie (XS S M L XL XXL) ─────────────────────────────────────
    // Bestseller : Noir avec M/L sold out, Gris chiné mi-saison
    'prod_jose_hoodie_noir': [
      { id: 'var_jose_hoodie_blk',  name: 'Noir',       color: 'Noir',       colorCode: '#1a1a1a', stock: [3, 5,  0,  0,  4,  8] },
      { id: 'var_jose_hoodie_grey', name: 'Gris Chiné', color: 'Gris Chiné', colorCode: '#9e9e9e', stock: [8, 12, 15, 11,  7,  3] },
    ],

    // ── Jose T-shirt Graphic (S M L XL XXL) ───────────────────────────────
    // Mi-saison : Blanc équilibré, Noir taille M en rupture, Gris bien stocké
    'prod_jose_tshirt_graphic': [
      { id: 'var_jose_ts_white', name: 'Blanc', color: 'Blanc', colorCode: '#f5f5f5', stock: [5,  8, 10,  8,  4] },
      { id: 'var_jose_ts_black', name: 'Noir',  color: 'Noir',  colorCode: '#1a1a1a', stock: [2,  4,  0,  3,  6] },
      { id: 'var_jose_ts_grey',  name: 'Gris',  color: 'Gris',  colorCode: '#757575', stock: [10, 14, 16, 12,  5] },
    ],

    // ── Jose Bomber (XS S M L XL) ─────────────────────────────────────────
    // Nouveau lancement : stock abondant, Noir légèrement plus demandé
    'prod_jose_bomber': [
      { id: 'var_jose_bomber_black', name: 'Noir', color: 'Noir', colorCode: '#1a1a1a', stock: [12, 18, 20, 15,  9] },
      { id: 'var_jose_bomber_khaki', name: 'Kaki', color: 'Kaki', colorCode: '#7d7c5e', stock: [10, 15, 18, 13,  8] },
    ],

    // ── Jose Sweat Col Rond (S M L XL XXL) ───────────────────────────────
    // Mi-saison : Gris chiné bestseller, Blanc cassé nouveau coloris
    'prod_jose_sweat': [
      { id: 'var_jose_sweat_grey',  name: 'Gris Chiné',  color: 'Gris Chiné',  colorCode: '#9e9e9e', stock: [6, 10, 12,  8,  3] },
      { id: 'var_jose_sweat_black', name: 'Noir',         color: 'Noir',         colorCode: '#1a1a1a', stock: [4,  7,  9,  5,  2] },
      { id: 'var_jose_sweat_white', name: 'Blanc Cassé',  color: 'Blanc Cassé',  colorCode: '#faf7f2', stock: [8, 12, 14, 10,  4] },
    ],

    // ── Jose Bonnet (Taille Unique) ───────────────────────────────────────
    // Accessoire : stock par couleur, 1 seule taille
    'prod_jose_bonnet': [
      { id: 'var_jose_bonnet_grey',  name: 'Gris',   color: 'Gris',   colorCode: '#9e9e9e', stock: [14] },
      { id: 'var_jose_bonnet_black', name: 'Noir',   color: 'Noir',   colorCode: '#1a1a1a', stock: [8]  },
      { id: 'var_jose_bonnet_navy',  name: 'Marine', color: 'Marine', colorCode: '#1a237e', stock: [5]  },
    ],

    // ── Jose Casquette (Taille Unique) ────────────────────────────────────
    'prod_jose_casquette': [
      { id: 'var_jose_cap_black', name: 'Noir',  color: 'Noir',  colorCode: '#1a1a1a', stock: [12] },
      { id: 'var_jose_cap_white', name: 'Blanc', color: 'Blanc', colorCode: '#f5f5f5', stock: [7]  },
    ],

    // ── Lucas Hoodie Art (S M L XL) ───────────────────────────────────────
    // Mi-saison : Noir légèrement plus populaire que Blanc
    'prod_lucas_hoodie_art': [
      { id: 'var_lucas_hoodie_black', name: 'Noir',  color: 'Noir',  colorCode: '#1a1a1a', stock: [5,  8,  6, 4] },
      { id: 'var_lucas_hoodie_white', name: 'Blanc', color: 'Blanc', colorCode: '#f5f5f5', stock: [7, 10,  9, 5] },
    ],

    // ── Lucas T-shirt Typo (S M L XL) ────────────────────────────────────
    // Nouveau lancement : stock abondant sur les 3 coloris
    'prod_lucas_tshirt_typo': [
      { id: 'var_lucas_ts_white', name: 'Blanc', color: 'Blanc', colorCode: '#f5f5f5', stock: [15, 20, 18, 12] },
      { id: 'var_lucas_ts_black', name: 'Noir',  color: 'Noir',  colorCode: '#1a1a1a', stock: [14, 18, 16, 11] },
      { id: 'var_lucas_ts_ecru',  name: 'Écru',  color: 'Écru',  colorCode: '#f5f0e8', stock: [12, 17, 15,  9] },
    ],

    // ── Lucas Short Mesh (S M L XL) ───────────────────────────────────────
    // Bestseller : M et L sold out, stock résiduel sur S et XL
    'prod_lucas_short_mesh': [
      { id: 'var_lucas_short_black', name: 'Noir',   color: 'Noir',   colorCode: '#1a1a1a', stock: [4, 0, 0, 3] },
      { id: 'var_lucas_short_navy',  name: 'Marine', color: 'Marine', colorCode: '#1a237e', stock: [6, 2, 1, 5] },
    ],

    // ── Lucas Veste Jean Customisée (S M L XL) ───────────────────────────
    // Pièce artisanale rare : très peu d'unités (chaque veste est unique)
    'prod_lucas_veste_jean': [
      { id: 'var_lucas_jean_blue',  name: 'Denim Bleu', color: 'Denim Bleu', colorCode: '#5c7fa3', stock: [1, 1, 0, 1] },
      { id: 'var_lucas_jean_black', name: 'Denim Noir', color: 'Denim Noir', colorCode: '#2d2d2d', stock: [1, 0, 1, 0] },
    ],

    // ── Claire Robe Bohème 70s (XS S M L) ────────────────────────────────
    // Fin de saison : quasi épuisée, quelques exemplaires restants
    'prod_claire_robe_70s': [
      { id: 'var_claire_robe_floral', name: 'Floral', color: 'Floral', colorCode: '#e91e63', stock: [1, 0, 0, 1] },
      { id: 'var_claire_robe_bleu',   name: 'Bleu',   color: 'Bleu',   colorCode: '#1565c0', stock: [2, 1, 0, 0] },
    ],

    // ── Claire Blazer Oversize 90s (S M L XL XXL) ────────────────────────
    // Mi-saison : bon stock général, Prince-de-galles légèrement plus rare
    'prod_claire_blazer_xl': [
      { id: 'var_claire_blazer_pdg',  name: 'Prince-de-galles', color: 'Prince-de-galles', colorCode: '#78909c', stock: [4,  7,  9,  6, 2] },
      { id: 'var_claire_blazer_noir', name: 'Noir',             color: 'Noir',             colorCode: '#1a1a1a', stock: [5,  8, 10,  7, 3] },
    ],

    // ── Claire Pull Mohair Pastel (XS S M L XL) ──────────────────────────
    // Nouveau lancement automne : stock complet, 3 coloris disponibles
    'prod_claire_pull_mohair': [
      { id: 'var_claire_pull_rose',  name: 'Rose Poudre', color: 'Rose Poudre', colorCode: '#f8bbd9', stock: [14, 20, 22, 17, 9] },
      { id: 'var_claire_pull_blanc', name: 'Blanc Cassé', color: 'Blanc Cassé', colorCode: '#faf7f2', stock: [12, 18, 20, 15, 7] },
      { id: 'var_claire_pull_bleu',  name: 'Bleu Ciel',   color: 'Bleu Ciel',   colorCode: '#b3d9f7', stock: [10, 16, 18, 13, 6] },
    ],
  };

  // ─── Produits SANS variante couleur, AVEC tailles ────────────────────────
  // Coloris unique dans le nom (kaki, tartan) → pas de choix couleur,
  // juste des SKUs par taille (variantId = null).
  const PRODUCTS_SIZE_ONLY: Record<string, number[]> = {
    // Mi-saison : grandes tailles moins demandées
    'prod_jose_pantalon_cargo': [6, 9, 11, 7, 3],  // 38 40 42 44 46
    // Fin de saison : grandes tailles épuisées
    'prod_claire_jupe_plissee': [2, 3,  1, 0, 0],  // 34 36 38 40 42
  };

  // ─── Produits SANS variante ET SANS taille ───────────────────────────────
  // Pièces uniques (céramique), accessoires non déclinés, tote bag.
  const PRODUCTS_BASE_STOCK: Record<string, number> = {
    'prod_jose_tote':           25,  // Tote basique, réapprovisionné régulièrement
    'prod_sophie_bol_raku':      3,  // Gres raku, tirage très limité (pièce unique)
    'prod_sophie_vase_bleu':     2,  // Porcelaine tournée main, quasi épuisé
    'prod_sophie_tasse_duo':     5,  // Quelques paires disponibles
    'prod_sophie_assiette':      4,  // Pièces wabi-sabi, stock limité
    'prod_sophie_bougeoir':      6,  // Petit objet, stock correct
    'prod_lucas_sac_banane':    12,  // Produit réapprovisionnable, bon stock
    'prod_marc_montre_auto':     1,  // Montre vintage = pièce unique restaurée
    'prod_marc_ceinture_cuir':   4,  // Quelques ceintures patinées disponibles
    'prod_marc_lunettes_retro':  2,  // Montures rares, quasi épuisées
  };

  let variantCount = 0;
  let skuCount = 0;

  // 1. Créer les variantes couleur + SKUs par taille
  for (const [productId, variantDefs] of Object.entries(PRODUCT_VARIANT_DEFS)) {
    const productSizes = PRODUCT_SIZES[productId] ?? [];

    for (const vd of variantDefs) {
      const variant = await prisma.productVariant.upsert({
        where: { id: vd.id },
        update: { name: vd.name, color: vd.color, colorCode: vd.colorCode },
        create: { id: vd.id, productId, name: vd.name, color: vd.color, colorCode: vd.colorCode, stock: 0, images: [] },
      });
      variantCount++;

      if (productSizes.length > 0) {
        // SKU par taille (ex: Hoodie XS/Noir → 3 unités)
        for (const [si, sizeEntry] of productSizes.entries()) {
          await prisma.productSku.create({
            data: { productId, variantId: variant.id, size: sizeEntry.size, stock: vd.stock[si] ?? 0 },
          });
          skuCount++;
        }
      } else {
        // Pas de taille définie → SKU global sans taille
        await prisma.productSku.create({
          data: { productId, variantId: variant.id, size: null, stock: vd.stock[0] ?? 0 },
        });
        skuCount++;
      }
    }
  }

  // 2. Créer les SKUs taille seulement (sans variante couleur)
  for (const [productId, stockPerSize] of Object.entries(PRODUCTS_SIZE_ONLY)) {
    const productSizes = PRODUCT_SIZES[productId] ?? [];
    for (const [si, sizeEntry] of productSizes.entries()) {
      await prisma.productSku.create({
        data: { productId, variantId: null, size: sizeEntry.size, stock: stockPerSize[si] ?? 0 },
      });
      skuCount++;
    }
  }

  // 3. Créer les SKUs globaux (sans variante, sans taille)
  for (const [productId, stock] of Object.entries(PRODUCTS_BASE_STOCK)) {
    await prisma.productSku.create({
      data: { productId, variantId: null, size: null, stock },
    });
    skuCount++;
  }

  console.log(`✅ ${variantCount} variants created, ${skuCount} SKUs created`);

  console.log('\n🎉 Seed completed!\n');
  console.log('📊 Summary:');
  console.log('   ──────────────────────────────────────────');
  console.log('   Admin:');
  console.log('     - admin@kpsull.fr (ADMIN)');
  console.log('   ──────────────────────────────────────────');
  console.log('   Creators (original 5):');
  console.log('     - jose.lecreateur@kpsull.fr (STUDIO)     -> /kpsull-officiel       | 8 products | 15 orders');
  console.log('     - sophie.artisan@kpsull.fr (ATELIER)     -> /sophie-ceramique      | 5 products | 10 orders');
  console.log('     - lucas.design@kpsull.fr (STUDIO)        -> /lucas-design-studio   | 5 products | 8 orders');
  console.log('     - claire.mode@kpsull.fr (ESSENTIEL)      -> /claire-vintage        | 4 products | 5 orders');
  console.log('     - marc.vintage@kpsull.fr (ESSENTIEL)     -> /marc-accessories      | 3 products | 4 orders');
  console.log(`   + ${newCreators.length} new creators (bijoux, maroquinerie, sport, enfants, etc.)`);
  console.log(`   = 20 créateurs total`);
  console.log('   ──────────────────────────────────────────');
  console.log(`   Clients: 20`);
  console.log(`   Products: ${allProducts.length + newProducts} total (${allProducts.length} original + ${newProducts} new)`);
  console.log(`   Orders: ${totalOrders} total`);
  console.log(`   Product Variants: ${variantCount} (original creators)`);
  console.log('   Product SKUs: created (tailles S/M/L/XL pour vetements, TU pour accessoires, unique pour ceramique/vintage)');
  console.log('   Notification Preferences: all users (client: 8 types, creator: 10 types)');
  console.log('   Carts: 5 (alice, bob, david, emma, felix)');
  console.log('   Return Requests: 4');
  console.log('   Disputes: 2');
  console.log('   Flagged Content: 3');
  console.log('   Moderation Actions: 2');
  console.log('   Creator Suspensions: 1 (Marc)');
  console.log('   ──────────────────────────────────────────');
  console.log('   All accounts password: password123');
  console.log('   ──────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });