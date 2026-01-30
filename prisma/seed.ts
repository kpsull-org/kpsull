/**
 * Prisma Seed - Données de développement pour Kpsull
 *
 * Crée:
 * - 1 Admin
 * - 2 Créateurs (1 ESSENTIEL, 1 STUDIO) avec pages et produits
 * - 2 Clients avec commandes
 * - Données de test pour toutes les fonctionnalités
 */

import { PrismaClient, Role, Plan, SubscriptionStatus, ProductStatus, OrderStatus, SectionType, OnboardingStep, PageStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kpsull-db';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // USERS
  // ============================================

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kpsull.com' },
    update: {},
    create: {
      email: 'admin@kpsull.com',
      name: 'Admin Kpsull',
      role: Role.ADMIN,
      accountTypeChosen: true,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Créateur ESSENTIEL - Marie
  const creatorEssentiel = await prisma.user.upsert({
    where: { email: 'marie@example.com' },
    update: {},
    create: {
      email: 'marie@example.com',
      name: 'Marie Dupont',
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Creator ESSENTIEL created:', creatorEssentiel.email);

  // Créateur STUDIO - Thomas
  const creatorStudio = await prisma.user.upsert({
    where: { email: 'thomas@example.com' },
    update: {},
    create: {
      email: 'thomas@example.com',
      name: 'Thomas Martin',
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Creator STUDIO created:', creatorStudio.email);

  // Clients
  const client1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Bernard',
      role: Role.CLIENT,
      accountTypeChosen: true,
      emailVerified: new Date(),
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Leroy',
      role: Role.CLIENT,
      accountTypeChosen: true,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Clients created:', client1.email, client2.email);

  // ============================================
  // CREATOR ONBOARDING (completed)
  // ============================================

  await prisma.creatorOnboarding.upsert({
    where: { userId: creatorEssentiel.id },
    update: {},
    create: {
      userId: creatorEssentiel.id,
      currentStep: OnboardingStep.COMPLETED,
      professionalInfoCompleted: true,
      siretVerified: true,
      stripeOnboarded: true,
      brandName: 'Marie Creates',
      siret: '12345678901234',
      professionalAddress: '12 rue des Artisans, 75011 Paris',
      stripeAccountId: 'acct_demo_free',
    },
  });

  await prisma.creatorOnboarding.upsert({
    where: { userId: creatorStudio.id },
    update: {},
    create: {
      userId: creatorStudio.id,
      currentStep: OnboardingStep.COMPLETED,
      professionalInfoCompleted: true,
      siretVerified: true,
      stripeOnboarded: true,
      brandName: 'Thomas Art Studio',
      siret: '98765432109876',
      professionalAddress: '45 avenue du Design, 69002 Lyon',
      stripeAccountId: 'acct_demo_pro',
    },
  });
  console.log('✅ Creator onboardings created');

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  await prisma.subscription.upsert({
    where: { userId: creatorEssentiel.id },
    update: {},
    create: {
      userId: creatorEssentiel.id,
      creatorId: creatorEssentiel.id,
      plan: Plan.ESSENTIEL,
      status: SubscriptionStatus.ACTIVE,
      billingInterval: 'year',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      productsUsed: 5,
      pinnedProductsUsed: 2,
      commissionRate: 0.05,
    },
  });

  await prisma.subscription.upsert({
    where: { userId: creatorStudio.id },
    update: {},
    create: {
      userId: creatorStudio.id,
      creatorId: creatorStudio.id,
      plan: Plan.STUDIO,
      status: SubscriptionStatus.ACTIVE,
      billingInterval: 'year',
      stripeSubscriptionId: 'sub_demo_studio',
      stripeCustomerId: 'cus_demo_studio',
      stripePriceId: 'price_demo_studio_yearly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      productsUsed: 12,
      pinnedProductsUsed: 3,
      commissionRate: 0.04,
    },
  });
  console.log('✅ Subscriptions created');

  // ============================================
  // PROJECTS (Collections)
  // ============================================

  const projectBijoux = await prisma.project.upsert({
    where: { id: 'proj_bijoux_ete' },
    update: {},
    create: {
      id: 'proj_bijoux_ete',
      creatorId: creatorEssentiel.id,
      name: 'Collection Été 2026',
      description: 'Bijoux inspirés par les couleurs de l\'été méditerranéen.',
    },
  });

  const projectPrints = await prisma.project.upsert({
    where: { id: 'proj_prints_nature' },
    update: {},
    create: {
      id: 'proj_prints_nature',
      creatorId: creatorStudio.id,
      name: 'Nature Sauvage',
      description: 'Illustrations de la faune et flore française.',
    },
  });

  const projectAbstrait = await prisma.project.upsert({
    where: { id: 'proj_abstrait' },
    update: {},
    create: {
      id: 'proj_abstrait',
      creatorId: creatorStudio.id,
      name: 'Abstractions',
      description: 'Œuvres abstraites aux couleurs vibrantes.',
    },
  });
  console.log('✅ Projects created');

  // ============================================
  // PRODUCTS
  // ============================================

  const products = [
    // Produits Marie (FREE creator)
    {
      id: 'prod_boucles_or',
      creatorId: creatorEssentiel.id,
      projectId: projectBijoux.id,
      name: 'Boucles d\'oreilles Soleil',
      description: 'Boucles d\'oreilles dorées inspirées des rayons du soleil.',
      price: 3500, // 35.00€
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      id: 'prod_collier_turquoise',
      creatorId: creatorEssentiel.id,
      projectId: projectBijoux.id,
      name: 'Collier Turquoise',
      description: 'Collier avec pierre turquoise naturelle.',
      price: 4500,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      id: 'prod_bracelet_perles',
      creatorId: creatorEssentiel.id,
      projectId: projectBijoux.id,
      name: 'Bracelet Perles Océan',
      description: 'Bracelet en perles naturelles aux teintes océan.',
      price: 2800,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    // Produits Thomas (PRO creator)
    {
      id: 'prod_print_renard',
      creatorId: creatorStudio.id,
      projectId: projectPrints.id,
      name: 'Print Renard Roux',
      description: 'Illustration A3 d\'un renard roux dans la forêt.',
      price: 2900,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      id: 'prod_print_cerf',
      creatorId: creatorStudio.id,
      projectId: projectPrints.id,
      name: 'Print Cerf Majestueux',
      description: 'Illustration A2 d\'un cerf au lever du soleil.',
      price: 4500,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      id: 'prod_print_hibou',
      creatorId: creatorStudio.id,
      projectId: projectPrints.id,
      name: 'Print Hibou Nocturne',
      description: 'Illustration A3 d\'un grand-duc sous la lune.',
      price: 2900,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      id: 'prod_abstract_bleu',
      creatorId: creatorStudio.id,
      projectId: projectAbstrait.id,
      name: 'Vagues Abstraites',
      description: 'Œuvre abstraite aux nuances de bleu océan.',
      price: 8900,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      id: 'prod_abstract_rouge',
      creatorId: creatorStudio.id,
      projectId: projectAbstrait.id,
      name: 'Feu Intérieur',
      description: 'Explosion de couleurs chaudes sur toile.',
      price: 12000,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    });
  }
  console.log('✅ Products created:', products.length);

  // ============================================
  // PRODUCT IMAGES
  // ============================================

  // Delete existing images first to avoid duplicates
  await prisma.productImage.deleteMany({
    where: {
      productId: { in: products.map(p => p.id) }
    }
  });

  const productImages = [
    { productId: 'prod_boucles_or', url: 'https://picsum.photos/seed/boucles/800/800', position: 0 },
    { productId: 'prod_collier_turquoise', url: 'https://picsum.photos/seed/collier/800/800', position: 0 },
    { productId: 'prod_bracelet_perles', url: 'https://picsum.photos/seed/bracelet/800/800', position: 0 },
    { productId: 'prod_print_renard', url: 'https://picsum.photos/seed/renard/800/800', position: 0 },
    { productId: 'prod_print_cerf', url: 'https://picsum.photos/seed/cerf/800/800', position: 0 },
    { productId: 'prod_print_hibou', url: 'https://picsum.photos/seed/hibou/800/800', position: 0 },
    { productId: 'prod_abstract_bleu', url: 'https://picsum.photos/seed/bleu/800/800', position: 0 },
    { productId: 'prod_abstract_rouge', url: 'https://picsum.photos/seed/rouge/800/800', position: 0 },
  ];

  for (const img of productImages) {
    await prisma.productImage.create({ data: img });
  }
  console.log('✅ Product images created');

  // ============================================
  // CREATOR PAGES
  // ============================================

  const pageMarie = await prisma.creatorPage.upsert({
    where: { creatorId: creatorEssentiel.id },
    update: {},
    create: {
      creatorId: creatorEssentiel.id,
      slug: 'marie-creates',
      title: 'Marie Creates - Bijoux Artisanaux',
      description: 'Découvrez mes créations de bijoux faits main avec passion.',
      status: PageStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  const pageThomas = await prisma.creatorPage.upsert({
    where: { creatorId: creatorStudio.id },
    update: {},
    create: {
      creatorId: creatorStudio.id,
      slug: 'thomas-art',
      title: 'Thomas Art Studio',
      description: 'Art digital et illustrations originales.',
      status: PageStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });
  console.log('✅ Creator pages created');

  // ============================================
  // PAGE SECTIONS
  // ============================================

  // Delete existing sections first
  await prisma.pageSection.deleteMany({
    where: { pageId: { in: [pageMarie.id, pageThomas.id] } }
  });

  // Sections pour Marie
  await prisma.pageSection.createMany({
    data: [
      {
        pageId: pageMarie.id,
        type: SectionType.HERO,
        position: 0,
        title: 'Bienvenue chez Marie Creates',
        content: JSON.stringify({
          subtitle: 'Des bijoux uniques, faits main avec amour',
          backgroundImage: 'https://picsum.photos/seed/marie-hero/1920/600',
          ctaText: 'Découvrir la collection',
          ctaLink: '#products',
        }),
      },
      {
        pageId: pageMarie.id,
        type: SectionType.ABOUT,
        position: 1,
        title: 'Mon histoire',
        content: JSON.stringify({
          text: 'Passionnée de création depuis mon enfance, j\'ai lancé Marie Creates en 2023 pour partager mes bijoux artisanaux. Chaque pièce est unique et fabriquée avec des matériaux de qualité.',
          image: 'https://picsum.photos/seed/marie-about/400/400',
        }),
      },
      {
        pageId: pageMarie.id,
        type: SectionType.PRODUCTS_GRID,
        position: 2,
        title: 'Mes créations',
        content: JSON.stringify({
          columns: 3,
          limit: 6,
        }),
      },
      {
        pageId: pageMarie.id,
        type: SectionType.CONTACT,
        position: 3,
        title: 'Me contacter',
        content: JSON.stringify({
          email: 'marie@example.com',
          instagram: '@marie.creates',
          showForm: true,
        }),
      },
    ],
  });

  // Sections pour Thomas
  await prisma.pageSection.createMany({
    data: [
      {
        pageId: pageThomas.id,
        type: SectionType.HERO,
        position: 0,
        title: 'Thomas Art Studio',
        content: JSON.stringify({
          subtitle: 'L\'art digital qui raconte des histoires',
          backgroundImage: 'https://picsum.photos/seed/thomas-hero/1920/600',
          ctaText: 'Explorer les œuvres',
          ctaLink: '#gallery',
        }),
      },
      {
        pageId: pageThomas.id,
        type: SectionType.ABOUT,
        position: 1,
        title: 'L\'artiste',
        content: JSON.stringify({
          text: 'Illustrateur digital depuis 10 ans, je crée des œuvres qui capturent la beauté de la nature et l\'émotion de l\'abstrait. Chaque print est imprimé sur papier d\'art premium.',
          image: 'https://picsum.photos/seed/thomas-about/400/400',
        }),
      },
      {
        pageId: pageThomas.id,
        type: SectionType.BENTO_GRID,
        position: 2,
        title: 'Galerie',
        content: JSON.stringify({
          images: [
            'https://picsum.photos/seed/bento1/400/400',
            'https://picsum.photos/seed/bento2/400/600',
            'https://picsum.photos/seed/bento3/600/400',
            'https://picsum.photos/seed/bento4/400/400',
          ],
        }),
      },
      {
        pageId: pageThomas.id,
        type: SectionType.PRODUCTS_FEATURED,
        position: 3,
        title: 'Œuvres à la une',
        content: JSON.stringify({
          productIds: ['prod_print_cerf', 'prod_abstract_bleu'],
        }),
      },
      {
        pageId: pageThomas.id,
        type: SectionType.PRODUCTS_GRID,
        position: 4,
        title: 'Toutes les œuvres',
        content: JSON.stringify({
          columns: 4,
          limit: 12,
        }),
      },
    ],
  });
  console.log('✅ Page sections created');

  // ============================================
  // ORDERS
  // ============================================

  // Delete existing orders for clean seed
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  // Commande livrée pour Alice (chez Marie)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-0001',
      creatorId: creatorEssentiel.id,
      customerId: client1.id,
      customerName: 'Alice Bernard',
      customerEmail: 'alice@example.com',
      status: OrderStatus.DELIVERED,
      totalAmount: 8000,
      shippingStreet: '15 rue de la Paix',
      shippingCity: 'Paris',
      shippingPostalCode: '75002',
      shippingCountry: 'France',
      trackingNumber: 'COLISSIMO123456',
      carrier: 'colissimo',
      shippedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        productId: 'prod_boucles_or',
        productName: 'Boucles d\'oreilles Soleil',
        quantity: 1,
        price: 3500,
        image: 'https://picsum.photos/seed/boucles/200/200',
      },
      {
        orderId: order1.id,
        productId: 'prod_collier_turquoise',
        productName: 'Collier Turquoise',
        quantity: 1,
        price: 4500,
        image: 'https://picsum.photos/seed/collier/200/200',
      },
    ],
  });

  // Commande expédiée pour Bob (chez Thomas)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-0002',
      creatorId: creatorStudio.id,
      customerId: client2.id,
      customerName: 'Bob Leroy',
      customerEmail: 'bob@example.com',
      status: OrderStatus.SHIPPED,
      totalAmount: 7400,
      shippingStreet: '28 avenue Victor Hugo',
      shippingCity: 'Lyon',
      shippingPostalCode: '69006',
      shippingCountry: 'France',
      trackingNumber: 'CHRONOPOST789012',
      carrier: 'chronopost',
      shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order2.id,
        productId: 'prod_print_renard',
        productName: 'Print Renard Roux',
        quantity: 1,
        price: 2900,
        image: 'https://picsum.photos/seed/renard/200/200',
      },
      {
        orderId: order2.id,
        productId: 'prod_print_cerf',
        productName: 'Print Cerf Majestueux',
        quantity: 1,
        price: 4500,
        image: 'https://picsum.photos/seed/cerf/200/200',
      },
    ],
  });

  // Commande payée en attente d'expédition (chez Thomas)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-0003',
      creatorId: creatorStudio.id,
      customerId: client1.id,
      customerName: 'Alice Bernard',
      customerEmail: 'alice@example.com',
      status: OrderStatus.PAID,
      totalAmount: 8900,
      shippingStreet: '15 rue de la Paix',
      shippingCity: 'Paris',
      shippingPostalCode: '75002',
      shippingCountry: 'France',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order3.id,
      productId: 'prod_abstract_bleu',
      productName: 'Vagues Abstraites',
      quantity: 1,
      price: 8900,
      image: 'https://picsum.photos/seed/bleu/200/200',
    },
  });

  console.log('✅ Orders created: 3');

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - 1 Admin: admin@kpsull.com');
  console.log('   - 2 Creators:');
  console.log('     • marie@example.com (ESSENTIEL) → /marie-creates');
  console.log('     • thomas@example.com (STUDIO) → /thomas-art');
  console.log('   - 2 Clients: alice@example.com, bob@example.com');
  console.log('   - 8 Products');
  console.log('   - 3 Orders (delivered, shipped, paid)');
  console.log('\n🔗 Pages publiques à tester:');
  console.log('   - http://localhost:3002/marie-creates');
  console.log('   - http://localhost:3002/thomas-art');
  console.log('   - http://localhost:3002/marie-creates/products');
  console.log('   - http://localhost:3002/thomas-art/products');
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
