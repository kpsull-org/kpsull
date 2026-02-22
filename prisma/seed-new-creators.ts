import {
  PrismaClient,
  Role,
  Plan,
  SubscriptionStatus,
  ProductStatus,
  OnboardingStep,
  PageStatus,
  SectionType,
  OrderStatus,
} from '@prisma/client';

// ─── TYPES ────────────────────────────────────────────────────────────────────

// Tuple: [name, priceInCents, categoryKey, gender?]
// gender: 'H'=Homme, 'F'=Femme, 'U'=Unisexe, 'E'=Enfant, 'B'=Bébé, null=N/A
type ProdDef = [string, number, string, ('H' | 'F' | 'U' | 'E' | 'B' | null)?];

interface CollectionDef {
  id: string;
  name: string;
  desc: string;
  products: ProdDef[];
}

interface CreatorDef {
  email: string;
  name: string;
  plan: Plan;
  brandName: string;
  slug: string;
  siret: string;
  stripeId: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  pageTitle: string;
  pageDesc: string;
  collections: CollectionDef[];
}

interface CatDef {
  materials: string[];
  care: string;
  certif?: string;
  madeIn: string;
  weights?: number[];
  fits?: string[];
  seasons?: string[];
}

interface ProductCreateData {
  creatorId: string;
  projectId: string;
  name: string;
  description: null;
  price: number;
  status: ProductStatus;
  publishedAt: Date;
  category: string;
  gender: string | null;
  materials: string;
  fit: string | null;
  season: string | null;
  madeIn: string;
  careInstructions: string | null;
  certifications: string | null;
  weight: number | null;
}

// ─── CATEGORY TEMPLATES ───────────────────────────────────────────────────────

const CAT: Record<string, CatDef> = {
  bijou: {
    materials: ['Argent 925', 'Or 18K', 'Plaqué or 24K', 'Laiton doré', 'Argent 925, pierre naturelle'],
    care: 'Éviter contact eau et parfums. Ranger séparément.',
    madeIn: 'France',
  },
  maroquinerie: {
    materials: ['Cuir vachette pleine fleur', 'Cuir de veau tanné végétal', 'Cuir nappa souple', 'Cuir grainé'],
    care: 'Entretenir avec crème protectrice cuir. Éviter humidité.',
    madeIn: 'France',
  },
  loungewear: {
    materials: ['Coton peigné 200g', 'Modal doux', 'Bambou 95% Élasthanne 5%', 'Jersey coton bio'],
    care: 'Lavage 30° délicat. Séchage à plat.',
    certif: 'OEKO-TEX',
    madeIn: 'Portugal',
    weights: [180, 200, 220],
    fits: ['Regular', 'Loose', 'Oversized'],
    seasons: ['Toute saison', 'Automne-Hiver'],
  },
  sneakers: {
    materials: ['Cuir premium, semelle vulcanisée', 'Toile canvas, semelle caoutchouc', 'Suède, détails cuir'],
    care: 'Nettoyage avec éponge humide. Imperméabilisant recommandé.',
    madeIn: 'Atelier artisanal Lyon',
  },
  papeterie: {
    materials: ['Papier recyclé 120g', 'Papier aquarelle coton', 'Carton certifié FSC', 'Papier vergé 90g'],
    care: "Conserver à l'abri de l'humidité.",
    certif: 'FSC',
    madeIn: 'France',
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length] as T;
}

function genderLabel(g: 'H' | 'F' | 'U' | 'E' | 'B' | null | undefined): string | null {
  if (g === 'H') return 'Homme';
  if (g === 'F') return 'Femme';
  if (g === 'U') return 'Unisexe';
  if (g === 'E') return 'Enfant';
  if (g === 'B') return 'Bébé';
  return null;
}

function buildProduct(
  prodDef: ProdDef,
  idx: number,
  creatorId: string,
  projectId: string,
  publishedAt: Date,
): ProductCreateData {
  const [name, price, catKey, gender] = prodDef;
  const cat: CatDef = (CAT[catKey] ?? CAT['bijou']) as CatDef;
  const skipOptional = idx % 4 === 3;
  return {
    creatorId,
    projectId,
    name,
    description: null,
    price,
    status: ProductStatus.PUBLISHED,
    publishedAt,
    category: name.split(' ')[0] ?? name,
    gender: genderLabel(gender),
    materials: pick(cat.materials, idx),
    fit: cat.fits ? pick(cat.fits, idx) : null,
    season: cat.seasons ? pick(cat.seasons, idx) : null,
    madeIn: cat.madeIn ?? '',
    careInstructions: skipOptional ? null : cat.care,
    certifications: skipOptional ? null : (cat.certif ?? null),
    weight: cat.weights ? pick(cat.weights, idx) : null,
  };
}

// ─── 5 NEW CREATORS ──────────────────────────────────────────────────────────

const NEW_CREATORS: CreatorDef[] = [
  // ── 1. Isabelle Martin ────────────────────────────────────────────────────
  {
    email: 'isabelle.bijoux@kpsull.fr', name: 'Isabelle Martin', plan: Plan.STUDIO,
    brandName: 'Isabelle Bijoux Créations', slug: 'isabelle-bijoux',
    siret: '61234567890123', stripeId: 'acct_demo_isabelle',
    phone: '+33677881122', address: '14 rue de la Paix', city: 'Paris', postalCode: '75011',
    pageTitle: "Isabelle Bijoux - L'élégance artisanale",
    pageDesc: 'Bijoux en argent sterling et pierres naturelles, fabriqués à la main dans mon atelier parisien.',
    collections: [
      {
        id: 'proj_isabelle_bijoux_minerale', name: 'Collection Minérale', desc: 'Bijoux sertis de pierres semi-précieuses.',
        products: [
          ['Collier Labradorite', 5200, 'bijou'], ['Bracelet Quartz Rose', 3800, 'bijou'],
          ['Bague Opale', 8900, 'bijou'], ['Boucles Turquoise', 4200, 'bijou'],
        ],
      },
      {
        id: 'proj_isabelle_bijoux_doree', name: 'Collection Dorée', desc: 'Bijoux en or 18K et vermeil.',
        products: [
          ['Jonc Or Massif', 18000, 'bijou'], ['Bague Diamant Lab-Grown', 25000, 'bijou'],
          ['Chaîne Forçat Or', 9500, 'bijou'], ['Créoles Dorées 30mm', 6500, 'bijou'],
        ],
      },
    ],
  },
  // ── 2. Thomas Bernard ─────────────────────────────────────────────────────
  {
    email: 'thomas.maroquinerie@kpsull.fr', name: 'Thomas Bernard', plan: Plan.ATELIER,
    brandName: 'Thomas Sellier', slug: 'thomas-sellier',
    siret: '62345678901234', stripeId: 'acct_demo_thomas',
    phone: '+33688991122', address: '5 avenue du Cuir', city: 'Limoges', postalCode: '87000',
    pageTitle: 'Thomas Sellier - Maroquinerie française',
    pageDesc: 'Sacs et accessoires en cuir pleine fleur, tannés végétal, fabriqués à Limoges.',
    collections: [
      {
        id: 'proj_thomas_sellier_heritage', name: 'Collection Héritage', desc: 'Sacs à main et cabas femme en cuir de luxe.',
        products: [
          ['Sac Cabas Cuir Naturel', 28500, 'maroquinerie', 'F'], ['Pochette Soirée Cuir', 14500, 'maroquinerie', 'F'],
          ['Sac Baguette Cuir Grain', 22000, 'maroquinerie', 'F'], ['Tote Cuir Pleine Fleur', 19500, 'maroquinerie', 'F'],
        ],
      },
      {
        id: 'proj_thomas_sellier_homme', name: 'Collection Homme', desc: 'Sacoches, portefeuilles et ceintures.',
        products: [
          ['Sacoche Week-End Cuir', 21500, 'maroquinerie', 'H'], ['Porte-Documents Cuir', 19000, 'maroquinerie', 'H'],
          ['Portefeuille Slim Cuir', 7500, 'maroquinerie', 'H'], ['Ceinture Cuir Double Tour', 6500, 'maroquinerie', 'H'],
        ],
      },
    ],
  },
  // ── 3. Amélie Rousseau ────────────────────────────────────────────────────
  {
    email: 'amelie.homewear@kpsull.fr', name: 'Amélie Rousseau', plan: Plan.STUDIO,
    brandName: 'Amélie Home', slug: 'amelie-home',
    siret: '63456789012345', stripeId: 'acct_demo_amelie',
    phone: '+33699001122', address: '7 rue des Capucines', city: 'Nantes', postalCode: '44000',
    pageTitle: 'Amélie Home - Douceur à la maison',
    pageDesc: "Pyjamas, robes de chambre et vêtements d'intérieur en matières naturelles douces.",
    collections: [
      {
        id: 'proj_amelie_home_cocooning', name: 'Collection Cocooning', desc: 'Pyjamas et robes de chambre femme.',
        products: [
          ['Pyjama Satin Rose Poudré', 6500, 'loungewear', 'F'], ['Robe de Chambre Polaire', 7800, 'loungewear', 'F'],
          ['Chemise de Nuit Lin', 5200, 'loungewear', 'F'], ['Set Shorty Pyjama Modal', 4900, 'loungewear', 'F'],
        ],
      },
      {
        id: 'proj_amelie_home_relax', name: 'Collection Relax Homme', desc: 'Loungewear confortable pour hommes.',
        products: [
          ['Pyjama Long Flanelle', 5800, 'loungewear', 'H'], ['Jogging Coton Bio', 5200, 'loungewear', 'H'],
          ['T-Shirt Nuit Col V', 2900, 'loungewear', 'H'], ['Robe de Chambre Éponge', 8900, 'loungewear', 'H'],
        ],
      },
    ],
  },
  // ── 4. Kévin Chen ─────────────────────────────────────────────────────────
  {
    email: 'kevin.sneakers@kpsull.fr', name: 'Kévin Chen', plan: Plan.STUDIO,
    brandName: 'KvnCstm Studio', slug: 'kvncstm-studio',
    siret: '64567890123456', stripeId: 'acct_demo_kevin',
    phone: '+33611223344', address: '12 rue de la Création', city: 'Lyon', postalCode: '69003',
    pageTitle: 'KvnCstm - Sneakers customs uniques',
    pageDesc: 'Chaque paire est une œuvre unique. Customs Air Max, Jordan, Vans et plus.',
    collections: [
      {
        id: 'proj_kvncstm_studio_air', name: 'Collection Air Custom', desc: 'Customs sur base Nike Air Max.',
        products: [
          ['Air Max 90 "Galaxy" Custom', 28000, 'sneakers', 'U'], ['Air Max 1 "Marble" Custom', 24500, 'sneakers', 'U'],
          ['Air Force 1 "Graffiti" Custom', 19500, 'sneakers', 'U'], ['Air Max 97 "Neo-Tokyo" Custom', 32000, 'sneakers', 'U'],
        ],
      },
      {
        id: 'proj_kvncstm_studio_jordan', name: 'Collection Jordan Custom', desc: 'Customs sur base Air Jordan.',
        products: [
          ['Jordan 4 "Sakura" Custom', 45000, 'sneakers', 'U'], ['Jordan 3 "Street Art" Custom', 42000, 'sneakers', 'U'],
          ['Jordan 6 "Luxury" Custom', 48000, 'sneakers', 'U'], ['Jordan 1 High "Peinture Huile" Custom', 39500, 'sneakers', 'U'],
        ],
      },
    ],
  },
  // ── 5. Pauline Dupont ─────────────────────────────────────────────────────
  {
    email: 'pauline.papeterie@kpsull.fr', name: 'Pauline Dupont', plan: Plan.ESSENTIEL,
    brandName: 'Pauline Papeterie', slug: 'pauline-papeterie',
    siret: '65678901234567', stripeId: 'acct_demo_pauline',
    phone: '+33622334455', address: '3 allée des Arts', city: 'Rennes', postalCode: '35000',
    pageTitle: 'Pauline Papeterie - Illustrations & Carnets',
    pageDesc: 'Papeterie illustrée à la main, carnets, affiches et kits créatifs.',
    collections: [
      {
        id: 'proj_pauline_papeterie_carnets', name: 'Collection Carnets & Agendas', desc: 'Carnets A5/A6 illustrés.',
        products: [
          ['Carnet A5 Fleurs des Champs', 1400, 'papeterie'], ['Agenda 2026 Botanique', 2800, 'papeterie'],
          ['Carnet Aquarelle Jungle', 1600, 'papeterie'], ['Bullet Journal Minimaliste', 2200, 'papeterie'],
        ],
      },
      {
        id: 'proj_pauline_papeterie_prints', name: 'Collection Prints & Affiches', desc: "Tirages d'art numérotés.",
        products: [
          ['Affiche A3 "Herbier"', 2200, 'papeterie'], ['Print A4 "Ville Aquarelle"', 1500, 'papeterie'],
          ['Affiche 50x70 "Botanique"', 5500, 'papeterie'], ['Print A3 "Champignons"', 2800, 'papeterie'],
        ],
      },
    ],
  },
];

// ─── HELPERS FOR seedNewCreators ─────────────────────────────────────────────

interface SeedCreatorsContext {
  prisma: PrismaClient;
  hashedPassword: string;
  allClients: Array<{
    id: string;
    email: string;
    name: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
  }>;
  daysAgo: (n: number) => Date;
  daysFromNow: (n: number) => Date;
  productImages: Record<string, { main: string[] }>;
  collectionCovers: Record<string, string>;
}

function getCommissionRate(plan: Plan): number {
  if (plan === Plan.ATELIER) return 0.03;
  if (plan === Plan.STUDIO) return 0.04;
  return 0.05;
}

function buildTrackingNumber(slug: string, orderIndex: number): string {
  return `COL2026${slug.slice(0, 4).toUpperCase()}${String(orderIndex).padStart(3, '0')}`;
}

function getShippedAt(
  isDelivered: boolean,
  isShipped: boolean,
  orderIndex: number,
  daysAgoFn: (n: number) => Date,
): Date | null {
  if (isDelivered) return daysAgoFn(10 - (orderIndex % 5));
  if (isShipped) return daysAgoFn(2);
  return null;
}

async function seedCreatorEntity(
  def: CreatorDef,
  ctx: SeedCreatorsContext,
): Promise<{ id: string; email: string }> {
  const { prisma, hashedPassword, daysAgo, daysFromNow, collectionCovers } = ctx;

  const user = await prisma.user.upsert({
    where: { email: def.email },
    update: { role: Role.CREATOR, hashedPassword, accountTypeChosen: true, wantsToBeCreator: true },
    create: {
      email: def.email, name: def.name, role: Role.CREATOR,
      accountTypeChosen: true, wantsToBeCreator: true,
      emailVerified: new Date(), hashedPassword,
      phone: def.phone, address: def.address, city: def.city,
      postalCode: def.postalCode, country: 'France',
    },
  });

  await prisma.creatorOnboarding.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currentStep: OnboardingStep.COMPLETED,
      professionalInfoCompleted: true, siretVerified: true, stripeOnboarded: true,
      dashboardTourCompleted: true,
      brandName: def.brandName, siret: def.siret,
      professionalAddress: `${def.address}, ${def.postalCode} ${def.city}`,
      stripeAccountId: def.stripeId,
      completedAt: daysAgo(45),
    },
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id, creatorId: user.id, plan: def.plan,
      status: SubscriptionStatus.ACTIVE, billingInterval: 'year',
      currentPeriodStart: daysAgo(45), currentPeriodEnd: daysFromNow(320),
      commissionRate: getCommissionRate(def.plan),
      stripeSubscriptionId: `sub_demo_${def.slug}`,
      stripeCustomerId: `cus_demo_${def.slug}`,
      stripePriceId: `price_demo_${def.plan.toLowerCase()}_yearly`,
      productsUsed: def.collections.reduce((s, c) => s + c.products.length, 0),
    },
  });

  const page = await prisma.creatorPage.upsert({
    where: { creatorId: user.id },
    update: {},
    create: {
      creatorId: user.id, slug: def.slug, title: def.pageTitle,
      description: def.pageDesc, status: PageStatus.PUBLISHED, publishedAt: daysAgo(40),
    },
  });

  await prisma.pageSection.deleteMany({ where: { pageId: page.id } });
  await prisma.pageSection.createMany({
    data: [
      {
        pageId: page.id, type: SectionType.HERO, position: 0, title: def.brandName, isVisible: true,
        content: JSON.stringify({
          subtitle: def.pageDesc.slice(0, 80),
          backgroundImage: collectionCovers[`hero_${def.slug}`] ?? '',
          ctaText: 'Découvrir',
          ctaLink: '#products',
        }),
      },
      {
        pageId: page.id, type: SectionType.PRODUCTS_GRID, position: 1, title: 'Nos créations', isVisible: true,
        content: JSON.stringify({ columns: 3, limit: 12 }),
      },
    ],
  });

  return { id: user.id, email: user.email };
}

async function seedCreatorProducts(
  def: CreatorDef,
  userId: string,
  ctx: SeedCreatorsContext,
): Promise<string[]> {
  const { prisma, daysAgo, productImages } = ctx;
  const allProductIds: string[] = [];

  for (const coll of def.collections) {
    await prisma.project.upsert({
      where: { id: coll.id },
      update: {},
      create: { id: coll.id, creatorId: userId, name: coll.name, description: coll.desc },
    });

    for (let i = 0; i < coll.products.length; i++) {
      const prodDef = coll.products[i] as ProdDef;
      const collKey = coll.id.replace(`proj_${def.slug.replaceAll('-', '_')}_`, '');
      const prodId = `prod_${def.slug.replaceAll('-', '_')}_${collKey}_${i}`;
      const productData = buildProduct(prodDef, i, userId, coll.id, daysAgo(30 - i));

      await prisma.product.upsert({
        where: { id: prodId },
        update: { ...productData },
        create: { id: prodId, ...productData },
      });

      const imgs = productImages[prodId]?.main ?? [];
      const variantId = `var_${prodId}_default`;
      await prisma.productVariant.upsert({
        where: { id: variantId },
        update: { images: imgs.slice(0, 3) },
        create: {
          id: variantId,
          productId: prodId,
          name: 'Default',
          color: 'unique',
          colorCode: '#000000',
          stock: 50,
          images: imgs.slice(0, 3),
        },
      });

      allProductIds.push(prodId);
    }
  }

  return allProductIds;
}

const ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
  OrderStatus.SHIPPED, OrderStatus.SHIPPED,
  OrderStatus.PAID, OrderStatus.PAID,
  OrderStatus.PENDING, OrderStatus.PENDING,
  OrderStatus.CANCELED,
  OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PAID, OrderStatus.DELIVERED, OrderStatus.PENDING,
];

async function seedCreatorOrders(
  def: CreatorDef,
  userId: string,
  allProductIds: string[],
  orderCounter: { value: number },
  ctx: SeedCreatorsContext,
): Promise<number> {
  const { prisma, allClients, daysAgo, productImages } = ctx;

  const orderCount = Math.min(15, Math.max(5, allProductIds.length));
  const firstProd: ProdDef = def.collections[0]!.products[0]!;
  const firstCollProductCount = def.collections[0]!.products.length;
  const firstCollKey = def.collections[0]!.id.replace(`proj_${def.slug.replaceAll('-', '_')}_`, '');
  const firstProdId = `prod_${def.slug.replaceAll('-', '_')}_${firstCollKey}_0`;
  const orderItemImage = productImages[firstProdId]?.main?.[0] ?? '';

  for (let o = 0; o < orderCount; o++) {
    const client = allClients[o % allClients.length]!;
    const status = ORDER_STATUSES[o % ORDER_STATUSES.length]!;
    const prodId = allProductIds[o % allProductIds.length]!;
    const collIdx = Math.floor(o / firstCollProductCount) % def.collections.length;
    const price = def.collections[collIdx]?.products[o % 4]?.[1] ?? firstProd[1];
    const isDelivered = status === OrderStatus.DELIVERED;
    const isShipped = status === OrderStatus.SHIPPED;
    const hasTracking = isDelivered || isShipped;

    orderCounter.value++;
    await prisma.order.create({
      data: {
        orderNumber: `ORD-2026-${String(orderCounter.value).padStart(4, '0')}`,
        creatorId: userId, customerId: client.id,
        customerName: client.name ?? 'Client', customerEmail: client.email,
        status, totalAmount: price,
        shippingStreet: client.address ?? '1 rue Test',
        shippingCity: client.city ?? 'Paris',
        shippingPostalCode: client.postalCode ?? '75001',
        shippingCountry: 'France',
        trackingNumber: hasTracking ? buildTrackingNumber(def.slug, o) : null,
        carrier: hasTracking ? 'colissimo' : null,
        shippedAt: getShippedAt(isDelivered, isShipped, o, daysAgo),
        deliveredAt: isDelivered ? daysAgo(7 - (o % 4)) : null,
        createdAt: daysAgo(14 - o),
        items: {
          create: [{
            productId: prodId,
            productName: firstProd[0],
            quantity: 1,
            price,
            image: orderItemImage,
          }],
        },
      },
    });
  }

  return orderCount;
}

// ─── MAIN EXPORT FUNCTION ─────────────────────────────────────────────────────

export async function seedNewCreators(
  prisma: PrismaClient,
  hashedPassword: string,
  allClients: Array<{
    id: string;
    email: string;
    name: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
  }>,
  daysAgo: (n: number) => Date,
  daysFromNow: (n: number) => Date,
  productImages: Record<string, { main: string[] }>,
  collectionCovers: Record<string, string>,
): Promise<{ users: Array<{ id: string; email: string }>; totalProducts: number; totalOrders: number }> {
  const ctx: SeedCreatorsContext = {
    prisma, hashedPassword, allClients, daysAgo, daysFromNow, productImages, collectionCovers,
  };

  const createdUsers: Array<{ id: string; email: string }> = [];
  let totalProducts = 0;
  let totalOrders = 0;
  const orderCounter = { value: 10000 };

  for (const def of NEW_CREATORS) {
    const userInfo = await seedCreatorEntity(def, ctx);
    createdUsers.push(userInfo);

    const allProductIds = await seedCreatorProducts(def, userInfo.id, ctx);
    totalProducts += allProductIds.length;

    const ordersCreated = await seedCreatorOrders(def, userInfo.id, allProductIds, orderCounter, ctx);
    totalOrders += ordersCreated;
  }

  // ── New System Styles ──────────────────────────────────────────────────
  const newStyles = [
    { name: 'Bijoux', description: 'Bijoux artisanaux et joaillerie fine' },
    { name: 'Maroquinerie', description: 'Sacs et accessoires en cuir' },
    { name: 'Sport', description: 'Vêtements et équipements sportifs' },
    { name: 'Enfants', description: 'Mode enfant et bébé' },
    { name: 'Gastronomie', description: 'Épicerie fine et artisanat alimentaire' },
    { name: 'Oriental', description: 'Mode et accessoires orientaux' },
    { name: 'Cosmétique', description: 'Beauté et soins naturels' },
  ];

  for (const s of newStyles) {
    await prisma.style.upsert({
      where: { name: s.name },
      update: {},
      create: { name: s.name, description: s.description, isCustom: false, creatorId: null },
    });
  }

  return { users: createdUsers, totalProducts, totalOrders };
}
