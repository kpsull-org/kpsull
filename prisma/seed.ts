/**
 * Prisma Seed - Donnees de developpement pour Kpsull Marketplace
 *
 * Cree:
 * - 1 admin (admin@kpsull.fr)
 * - 5 createurs (Jose STUDIO, Sophie ATELIER, Lucas STUDIO, Claire ESSENTIEL, Marc ESSENTIEL)
 * - 20 clients avec profils complets
 * - ~25 produits repartis entre les createurs
 * - ~42 commandes avec differents statuts
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
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

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
  // PRODUCTS
  // ============================================

  // --- Jose: 8 products streetwear ---
  const joseProducts = [
    { id: 'prod_jose_hoodie_noir', creatorId: jose.id, projectId: projJoseStreet.id, name: 'Hoodie Oversize Noir', description: 'Hoodie oversize en coton bio 350g, coupe ample et capuche doublee.', price: 8900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(25) },
    { id: 'prod_jose_tshirt_graphic', creatorId: jose.id, projectId: projJoseStreet.id, name: 'T-shirt Graphique "Antidote"', description: 'T-shirt en coton epais avec serigraphie "Antidote" sur le dos.', price: 4500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(22) },
    { id: 'prod_jose_pantalon_cargo', creatorId: jose.id, projectId: projJoseStreet.id, name: 'Pantalon Cargo Kaki', description: 'Cargo coupe droite avec 6 poches, tissu ripstop.', price: 7500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(20) },
    { id: 'prod_jose_bomber', creatorId: jose.id, projectId: projJoseStreet.id, name: 'Bomber Matelasse', description: 'Bomber leger matelasse, zip YKK, doublure satin.', price: 12500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(18) },
    { id: 'prod_jose_bonnet', creatorId: jose.id, projectId: projJoseAccess.id, name: 'Bonnet Laine Merinos', description: 'Bonnet tricote en laine merinos, taille unique.', price: 3500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(15) },
    { id: 'prod_jose_casquette', creatorId: jose.id, projectId: projJoseAccess.id, name: 'Casquette Brodee KPSULL', description: 'Casquette 5 panels avec broderie logo, fermeture metal.', price: 3900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(12) },
    { id: 'prod_jose_tote', creatorId: jose.id, projectId: projJoseAccess.id, name: 'Tote Bag Canvas', description: 'Tote bag en toile canvas resistante, serigraphie artisanale.', price: 2500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(10) },
    { id: 'prod_jose_sweat', creatorId: jose.id, projectId: projJoseStreet.id, name: 'Sweat Col Rond Gris Chine', description: 'Sweat classique col rond en molleton bio, coupe reguliere.', price: 6900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(8) },
  ];

  // --- Sophie: 5 products ceramique ---
  const sophieProducts = [
    { id: 'prod_sophie_bol_raku', creatorId: sophie.id, projectId: projSophie.id, name: 'Bol Raku Terre & Feu', description: 'Bol en gres emaille raku, piece unique aux reflets cuivres.', price: 4500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(28) },
    { id: 'prod_sophie_vase_bleu', creatorId: sophie.id, projectId: projSophie.id, name: 'Vase Bleu Cobalt', description: 'Vase tourne main en porcelaine, email bleu cobalt profond.', price: 7800, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(25) },
    { id: 'prod_sophie_tasse_duo', creatorId: sophie.id, projectId: projSophie.id, name: 'Duo de Tasses Espresso', description: 'Deux tasses espresso en gres blanc, anse minimaliste.', price: 3200, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(22) },
    { id: 'prod_sophie_assiette', creatorId: sophie.id, projectId: projSophie.id, name: 'Assiette Plate Wabi-Sabi', description: 'Assiette plate en gres chamotte, bords irreguliers volontaires.', price: 3800, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(18) },
    { id: 'prod_sophie_bougeoir', creatorId: sophie.id, projectId: projSophie.id, name: 'Bougeoir Sculpte', description: 'Bougeoir en gres noir mat, forme organique sculptee a la main.', price: 2900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(14) },
  ];

  // --- Lucas: 5 products streetwear design ---
  const lucasProducts = [
    { id: 'prod_lucas_hoodie_art', creatorId: lucas.id, projectId: projLucas.id, name: 'Hoodie "Urban Canvas"', description: 'Hoodie avec print all-over graphique inspire du street art bordelais.', price: 9500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(20) },
    { id: 'prod_lucas_tshirt_typo', creatorId: lucas.id, projectId: projLucas.id, name: 'T-shirt Typo Bold', description: 'T-shirt avec typographie bold exclusive, coton bio 180g.', price: 3900, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(18) },
    { id: 'prod_lucas_veste_jean', creatorId: lucas.id, projectId: projLucas.id, name: 'Veste Jean Customisee', description: 'Veste en jean vintage avec patchs et broderies faites main.', price: 14500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(15) },
    { id: 'prod_lucas_short_mesh', creatorId: lucas.id, projectId: projLucas.id, name: 'Short Mesh Basketball', description: 'Short en mesh avec bandes laterales imprimees.', price: 5500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(12) },
    { id: 'prod_lucas_sac_banane', creatorId: lucas.id, projectId: projLucas.id, name: 'Sac Banane Reflectif', description: 'Sac banane en tissu reflectif 3M, zip etanche.', price: 4200, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(10) },
  ];

  // --- Claire: 4 products mode vintage ---
  const claireProducts = [
    { id: 'prod_claire_robe_70s', creatorId: claire.id, projectId: projClaire.id, name: 'Robe Boheme 70s', description: 'Robe longue fleurie style 70s, tissu fluide et ceinture macrame.', price: 8500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(22) },
    { id: 'prod_claire_blazer_xl', creatorId: claire.id, projectId: projClaire.id, name: 'Blazer Oversize 90s', description: 'Blazer oversize prince-de-galles, epaulettes structurees.', price: 9500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(18) },
    { id: 'prod_claire_jupe_plissee', creatorId: claire.id, projectId: projClaire.id, name: 'Jupe Plissee Ecossaise', description: 'Jupe plissee mi-longue en tartan ecossais authentique.', price: 6500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(14) },
    { id: 'prod_claire_pull_mohair', creatorId: claire.id, projectId: projClaire.id, name: 'Pull Mohair Pastel', description: 'Pull oversize en mohair italien, coloris rose poudre.', price: 7800, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(10) },
  ];

  // --- Marc: 3 products accessoires vintage ---
  const marcProducts = [
    { id: 'prod_marc_montre_auto', creatorId: marc.id, projectId: projMarc.id, name: 'Montre Automatique Restauree', description: 'Montre mecanique des annees 60 entierement restauree, bracelet cuir.', price: 18500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(15) },
    { id: 'prod_marc_ceinture_cuir', creatorId: marc.id, projectId: projMarc.id, name: 'Ceinture Cuir Patine', description: 'Ceinture en cuir pleine fleur patine a la main, boucle laiton.', price: 6500, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(12) },
    { id: 'prod_marc_lunettes_retro', creatorId: marc.id, projectId: projMarc.id, name: 'Lunettes Retro Ecaille', description: 'Monture retro en acetate ecaille, verres solaires polarises.', price: 12000, status: ProductStatus.PUBLISHED, publishedAt: daysAgo(8) },
  ];

  const allProducts = [...joseProducts, ...sophieProducts, ...lucasProducts, ...claireProducts, ...marcProducts];

  for (const product of allProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    });
  }
  console.log(`✅ ${allProducts.length} products created (Jose:8, Sophie:5, Lucas:5, Claire:4, Marc:3)`);

  // ============================================
  // PRODUCT IMAGES
  // ============================================

  await prisma.productImage.deleteMany({
    where: { productId: { in: allProducts.map((p) => p.id) } },
  });

  const productImages = allProducts.map((p) => ({
    productId: p.id,
    url: `https://picsum.photos/seed/${p.id.replace('prod_', '')}/800/800`,
    position: 0,
  }));

  for (const img of productImages) {
    await prisma.productImage.create({ data: img });
  }
  console.log(`✅ ${productImages.length} product images created`);

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
    { pageId: pageJose.id, type: SectionType.HERO, position: 0, title: 'KPSULL Officiel', content: JSON.stringify({ subtitle: "L'antidote a l'uniforme", backgroundImage: 'https://picsum.photos/seed/kpsull-hero/1920/600', ctaText: 'Decouvrir', ctaLink: '#products' }) },
    { pageId: pageJose.id, type: SectionType.ABOUT, position: 1, title: 'Notre histoire', content: JSON.stringify({ text: 'KPSULL est ne de la conviction que la mode peut etre unique, locale et accessible. Chaque piece est concue et fabriquee en France.', image: 'https://picsum.photos/seed/kpsull-about/400/400' }) },
    { pageId: pageJose.id, type: SectionType.PRODUCTS_GRID, position: 2, title: 'Nos creations', content: JSON.stringify({ columns: 3, limit: 9 }) },
    { pageId: pageJose.id, type: SectionType.CONTACT, position: 3, title: 'Contact', content: JSON.stringify({ email: 'jose.lecreateur@kpsull.fr', instagram: '@kpsull', showForm: true }) },
    // Sophie
    { pageId: pageSophie.id, type: SectionType.HERO, position: 0, title: 'Sophie Ceramique', content: JSON.stringify({ subtitle: "L'art du feu et de la terre", backgroundImage: 'https://picsum.photos/seed/sophie-hero/1920/600', ctaText: 'Explorer', ctaLink: '#products' }) },
    { pageId: pageSophie.id, type: SectionType.PRODUCTS_GRID, position: 1, title: 'Mes creations', content: JSON.stringify({ columns: 3, limit: 6 }) },
    // Lucas
    { pageId: pageLucas.id, type: SectionType.HERO, position: 0, title: 'Lucas Design Studio', content: JSON.stringify({ subtitle: 'Le streetwear comme une toile', backgroundImage: 'https://picsum.photos/seed/lucas-hero/1920/600', ctaText: 'Voir la collection', ctaLink: '#products' }) },
    { pageId: pageLucas.id, type: SectionType.PRODUCTS_GRID, position: 1, title: 'La collection', content: JSON.stringify({ columns: 3, limit: 6 }) },
    // Claire
    { pageId: pageClaire.id, type: SectionType.HERO, position: 0, title: 'Claire Vintage', content: JSON.stringify({ subtitle: 'La mode qui traverse le temps', backgroundImage: 'https://picsum.photos/seed/claire-hero/1920/600', ctaText: 'Chiner', ctaLink: '#products' }) },
    { pageId: pageClaire.id, type: SectionType.PRODUCTS_GRID, position: 1, title: 'Pieces chinees', content: JSON.stringify({ columns: 2, limit: 4 }) },
    // Marc
    { pageId: pageMarc.id, type: SectionType.HERO, position: 0, title: 'Marc Accessories', content: JSON.stringify({ subtitle: "Le charme des accessoires d'antan", backgroundImage: 'https://picsum.photos/seed/marc-hero/1920/600', ctaText: 'Decouvrir', ctaLink: '#products' }) },
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
  await createOrder({
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
  await createOrder({
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
  await createOrder({
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
  await createOrder({
    creatorId: sophie.id, customer: alice, status: OrderStatus.DELIVERED,
    items: [
      { productId: 'prod_sophie_bol_raku', productName: 'Bol Raku Terre & Feu', quantity: 1, price: 4500 },
      { productId: 'prod_sophie_vase_bleu', productName: 'Vase Bleu Cobalt', quantity: 1, price: 7800 },
    ],
    trackingNumber: 'COL2026002001', carrier: 'colissimo', shippedAt: daysAgo(18), deliveredAt: daysAgo(15), createdAt: daysAgo(20),
  });

  // Sophie Order 2: DELIVERED - Camille bought tasses duo x2
  await createOrder({
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
  await createOrder({
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
  // SUMMARY
  // ============================================

  const totalOrders = orderCounter;

  console.log('\n🎉 Seed completed!\n');
  console.log('📊 Summary:');
  console.log('   ──────────────────────────────────────────');
  console.log('   Admin:');
  console.log('     - admin@kpsull.fr (ADMIN)');
  console.log('   ──────────────────────────────────────────');
  console.log('   Creators:');
  console.log('     - jose.lecreateur@kpsull.fr (STUDIO)     -> /kpsull-officiel       | 8 products | 15 orders');
  console.log('     - sophie.artisan@kpsull.fr (ATELIER)     -> /sophie-ceramique      | 5 products | 10 orders');
  console.log('     - lucas.design@kpsull.fr (STUDIO)        -> /lucas-design-studio   | 5 products | 8 orders');
  console.log('     - claire.mode@kpsull.fr (ESSENTIEL)      -> /claire-vintage        | 4 products | 5 orders');
  console.log('     - marc.vintage@kpsull.fr (ESSENTIEL)     -> /marc-accessories      | 3 products | 4 orders');
  console.log('   ──────────────────────────────────────────');
  console.log(`   Clients: 20`);
  console.log(`   Products: ${allProducts.length}`);
  console.log(`   Orders: ${totalOrders}`);
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