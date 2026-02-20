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
  heroImg: string;
  pageTitle: string;
  pageDesc: string;
  collections: CollectionDef[];
}

interface CatDef {
  imgs: string[];
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
    imgs: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1573408301185-9521efc4048f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1603574670812-d489dba371ab?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1627293509741-7b2e7dc0c57d?w=800&h=800&fit=crop',
    ],
    materials: ['Argent 925', 'Or 18K', 'Plaqué or 24K', 'Laiton doré', 'Argent 925, pierre naturelle'],
    care: 'Éviter contact eau et parfums. Ranger séparément.',
    madeIn: 'France',
  },
  maroquinerie: {
    imgs: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1524498577639-a4c94d9f26ea?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=800&h=800&fit=crop',
    ],
    materials: ['Cuir vachette pleine fleur', 'Cuir de veau tanné végétal', 'Cuir nappa souple', 'Cuir grainé'],
    care: 'Entretenir avec crème protectrice cuir. Éviter humidité.',
    madeIn: 'France',
  },
  loungewear: {
    imgs: [
      'https://images.unsplash.com/photo-1631163897053-0d7ef2484df4?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=800&fit=crop',
    ],
    materials: ['Coton peigné 200g', 'Modal doux', 'Bambou 95% Élasthanne 5%', 'Jersey coton bio'],
    care: 'Lavage 30° délicat. Séchage à plat.',
    certif: 'OEKO-TEX',
    madeIn: 'Portugal',
    weights: [180, 200, 220],
    fits: ['Regular', 'Loose', 'Oversized'],
    seasons: ['Toute saison', 'Automne-Hiver'],
  },
  sneakers: {
    imgs: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1608231387042-66d1773d3028?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop',
    ],
    materials: ['Cuir premium, semelle vulcanisée', 'Toile canvas, semelle caoutchouc', 'Suède, détails cuir'],
    care: 'Nettoyage avec éponge humide. Imperméabilisant recommandé.',
    madeIn: 'Atelier artisanal Lyon',
  },
  papeterie: {
    imgs: [
      'https://images.unsplash.com/photo-1553729784-e153d1be99b6?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1618517351616-38fb9c5210c6?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1455390582262-e45503f6b182?w=800&h=800&fit=crop',
    ],
    materials: ['Papier recyclé 120g', 'Papier aquarelle coton', 'Carton certifié FSC', 'Papier vergé 90g'],
    care: "Conserver à l'abri de l'humidité.",
    certif: 'FSC',
    madeIn: 'France',
  },
  parfum: {
    imgs: [
      'https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1563170351-be15ab59fb3d?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1588776813871-9a5e6a2a42b9?w=800&h=800&fit=crop',
    ],
    materials: [
      'Alcool éthylique, huiles essentielles naturelles',
      'Cire de soja, huiles essentielles',
      'Fragrance naturelle',
    ],
    care: "Conserver à l'abri de la lumière et de la chaleur.",
    certif: 'Naturel',
    madeIn: 'Grasse, France',
  },
  broderie: {
    imgs: [
      'https://images.unsplash.com/photo-1558770145-d3d49d7b0c98?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
    ],
    materials: ['Lin 100%', 'Coton 100%', 'Fils DMC coton', 'Lin et coton mélangés'],
    care: "Lavage main 30°. Repassage à l'envers.",
    madeIn: 'France',
  },
  horlogerie: {
    imgs: [
      'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=800&h=800&fit=crop',
    ],
    materials: [
      'Boîtier acier inoxydable',
      'Boîtier laiton doré',
      'Bracelet cuir vachette',
      'Mouvement automatique',
    ],
    care: 'Révision recommandée tous les 3-5 ans. Éviter immersion.',
    madeIn: 'Suisse / France',
  },
  cosmetique: {
    imgs: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1522335789-2c04a2a10e68?w=800&h=800&fit=crop',
    ],
    materials: ['Ingrédients naturels certifiés bio', 'Formule vegan', 'Sans parabène ni silicone'],
    care: "Tenir au frais. Utiliser dans les 12 mois après ouverture.",
    certif: 'Cosmos Organic',
    madeIn: 'France',
  },
  art: {
    imgs: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1579762593131-b8945254345c?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1574158622682-e719cc69b98d?w=800&h=800&fit=crop',
    ],
    materials: ['Impression giclée sur papier Hahnemühle', 'Sérigraphie 6 couleurs', 'Tirage argentique'],
    care: "Encadrer à l'abri de la lumière directe.",
    certif: 'Tirage limité signé',
    madeIn: 'France',
  },
  deco: {
    imgs: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1493552832879-9d6fe2df67c1?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1484101100232-91340226237a?w=800&h=800&fit=crop',
    ],
    materials: ['Lin naturel', 'Coton recyclé', 'Céramique émaillée', 'Bois massif', 'Verre soufflé'],
    care: 'Nettoyage à sec ou essuyage humide selon matière.',
    madeIn: 'France',
  },
  sport: {
    imgs: [
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1556909190-8dbfca9bd73c?w=800&h=800&fit=crop',
    ],
    materials: [
      'Polyester recyclé 85%, Élasthanne 15%',
      'DryFit Polyester technique',
      'Nylon léger anti-UV',
    ],
    care: 'Lavage 40° machine. Ne pas adoucir.',
    certif: 'OEKO-TEX',
    madeIn: 'Portugal',
    weights: [150, 180, 200],
    fits: ['Slim', 'Regular', 'Loose'],
    seasons: ['Toute saison', 'Printemps-Été'],
  },
  enfants: {
    imgs: [
      'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1471286174890-9c112ac6476a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1503919545889-aef584234a35?w=800&h=800&fit=crop',
    ],
    materials: ['Coton bio GOTS 100%', 'Velours coton doux', 'Jersey coton bio', 'Polaire recyclée'],
    care: 'Lavage 40° doux. Séchage à basse température.',
    certif: 'GOTS Bio',
    madeIn: 'Portugal',
    weights: [150, 180, 200],
    fits: ['Regular'],
    seasons: ['Toute saison', 'Automne-Hiver'],
  },
  gastro: {
    imgs: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1505253304499-671c55fb57fe?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=800&fit=crop',
    ],
    materials: [
      'Produits artisanaux français',
      'Ingrédients naturels sélectionnés',
      'Sans conservateur ajouté',
    ],
    care: 'Conserver au frais après ouverture.',
    certif: 'Artisan',
    madeIn: 'France',
  },
  oriental: {
    imgs: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800&h=800&fit=crop',
    ],
    materials: ['Satin brodé', 'Soie naturelle', 'Mousseline légère', 'Dentelle artisanale', 'Brocart'],
    care: 'Lavage main 30° délicat ou nettoyage à sec.',
    madeIn: 'Maroc / France',
    fits: ['Regular', 'Ample', 'Évasé'],
    seasons: ['Toute saison', 'Printemps-Été'],
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], i: number): T {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return arr[i % arr.length]!;
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

// ─── 15 NEW CREATORS ─────────────────────────────────────────────────────────

const NEW_CREATORS: CreatorDef[] = [
  // ── 1. Isabelle Martin ────────────────────────────────────────────────────
  {
    email: 'isabelle.bijoux@kpsull.fr', name: 'Isabelle Martin', plan: Plan.STUDIO,
    brandName: 'Isabelle Bijoux Créations', slug: 'isabelle-bijoux',
    siret: '61234567890123', stripeId: 'acct_demo_isabelle',
    phone: '+33677881122', address: '14 rue de la Paix', city: 'Paris', postalCode: '75011',
    heroImg: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=600&fit=crop',
    pageTitle: "Isabelle Bijoux - L'élégance artisanale",
    pageDesc: 'Bijoux en argent sterling et pierres naturelles, fabriqués à la main dans mon atelier parisien.',
    collections: [
      {
        id: 'proj_isabelle_minerale', name: 'Collection Minérale', desc: 'Bijoux sertis de pierres semi-précieuses.',
        products: [
          ['Collier Labradorite', 5200, 'bijou'], ['Bracelet Quartz Rose', 3800, 'bijou'],
          ['Bague Opale', 8900, 'bijou'], ['Boucles Turquoise', 4200, 'bijou'],
          ['Collier Amazonite', 4900, 'bijou'], ['Bracelet Lapis-Lazuli', 3200, 'bijou'],
          ['Pendentif Malachite', 6500, 'bijou'], ['Bague Améthyste', 5800, 'bijou'],
          ['Collier Pyrite Brute', 3500, 'bijou'], ['Parure Cristal de Roche', 12000, 'bijou'],
        ],
      },
      {
        id: 'proj_isabelle_doree', name: 'Collection Dorée', desc: 'Bijoux en or 18K et vermeil.',
        products: [
          ['Jonc Or Massif', 18000, 'bijou'], ['Bague Diamant Lab-Grown', 25000, 'bijou'],
          ['Chaîne Forçat Or', 9500, 'bijou'], ['Créoles Dorées 30mm', 6500, 'bijou'],
          ['Pendentif Cœur Vermeil', 4500, 'bijou'], ['Chevillière Dorée', 3900, 'bijou'],
          ['Bague Chevalière', 8500, 'bijou'], ['Collier Tennis Vermeil', 14500, 'bijou'],
          ['Épingle à Chignon Dorée', 2200, 'bijou'], ['Bracelet Manchette Dorée', 11000, 'bijou'],
        ],
      },
      {
        id: 'proj_isabelle_cuir', name: 'Collection Cuir & Métal', desc: 'Bijoux mixtes en cuir et métal.',
        products: [
          ['Bracelet Cuir Tressé Doré', 3200, 'bijou'], ['Collier Métal Brut', 4100, 'bijou'],
          ['Boucles Minimalistes Argent', 2800, 'bijou'], ['Bague Réglable Gravée', 2200, 'bijou'],
          ['Broche Art Déco', 5500, 'bijou'], ['Bracelet Perles Miyuki', 3600, 'bijou'],
          ['Collier Chaîne Grosse Maille', 6200, 'bijou'], ['Parure Acier Noir', 7800, 'bijou'],
          ['Clip Cheveux Métal', 1800, 'bijou'], ['Set Bagues Empilables', 4500, 'bijou'],
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
    heroImg: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1920&h=600&fit=crop',
    pageTitle: 'Thomas Sellier - Maroquinerie française',
    pageDesc: 'Sacs et accessoires en cuir pleine fleur, tannés végétal, fabriqués à Limoges.',
    collections: [
      {
        id: 'proj_thomas_heritage', name: 'Collection Héritage', desc: 'Sacs à main et cabas femme en cuir de luxe.',
        products: [
          ['Sac Cabas Cuir Naturel', 28500, 'maroquinerie', 'F'], ['Pochette Soirée Cuir', 14500, 'maroquinerie', 'F'],
          ['Sac Baguette Cuir Grain', 22000, 'maroquinerie', 'F'], ['Tote Cuir Pleine Fleur', 19500, 'maroquinerie', 'F'],
          ['Sac Hobo Cuir Souple', 24000, 'maroquinerie', 'F'], ['Clutch Cuir Perforé', 9500, 'maroquinerie', 'F'],
          ['Sac Bandoulière Mini', 16500, 'maroquinerie', 'F'], ['Shopper Cuir Veau', 31000, 'maroquinerie', 'F'],
          ['Sac Reporter Cuir', 18000, 'maroquinerie', 'F'], ['Pochette Plate Cuir', 8500, 'maroquinerie', 'F'],
        ],
      },
      {
        id: 'proj_thomas_homme', name: 'Collection Homme', desc: 'Sacoches, portefeuilles et ceintures.',
        products: [
          ['Sacoche Week-End Cuir', 21500, 'maroquinerie', 'H'], ['Porte-Documents Cuir', 19000, 'maroquinerie', 'H'],
          ['Portefeuille Slim Cuir', 7500, 'maroquinerie', 'H'], ['Ceinture Cuir Double Tour', 6500, 'maroquinerie', 'H'],
          ['Sacoche Ordinateur 15"', 25000, 'maroquinerie', 'H'], ['Porte-Monnaie Cuir', 4500, 'maroquinerie', 'H'],
          ['Porte-Cartes Cuir', 3200, 'maroquinerie', 'H'], ['Sac à Dos Cuir', 32000, 'maroquinerie', 'H'],
          ['Vanity Cuir de Voyage', 18500, 'maroquinerie', 'H'], ['Clé USB Cuir', 2800, 'maroquinerie', 'H'],
        ],
      },
      {
        id: 'proj_thomas_maison', name: 'Collection Maison', desc: 'Accessoires de bureau et de maison en cuir.',
        products: [
          ['Vide-Poche Cuir', 4200, 'maroquinerie'], ['Sous-Main Cuir', 8900, 'maroquinerie'],
          ['Carnet A5 Couverture Cuir', 3800, 'maroquinerie'], ['Étui iPad Cuir', 7500, 'maroquinerie'],
          ['Porte-Clés Cuir', 2400, 'maroquinerie'], ['Range-Câbles Cuir', 1800, 'maroquinerie'],
          ['Plateau Cuir Bureau', 5500, 'maroquinerie'], ['Marque-Page Cuir', 1200, 'maroquinerie'],
          ['Couvre-Cahier Cuir', 3200, 'maroquinerie'], ['Étui Lunettes Cuir', 4800, 'maroquinerie'],
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
    heroImg: 'https://images.unsplash.com/photo-1631163897053-0d7ef2484df4?w=1920&h=600&fit=crop',
    pageTitle: 'Amélie Home - Douceur à la maison',
    pageDesc: "Pyjamas, robes de chambre et vêtements d'intérieur en matières naturelles douces.",
    collections: [
      {
        id: 'proj_amelie_cocooning', name: 'Collection Cocooning', desc: 'Pyjamas et robes de chambre femme.',
        products: [
          ['Pyjama Satin Rose Poudré', 6500, 'loungewear', 'F'], ['Robe de Chambre Polaire', 7800, 'loungewear', 'F'],
          ['Chemise de Nuit Lin', 5200, 'loungewear', 'F'], ['Set Shorty Pyjama Modal', 4900, 'loungewear', 'F'],
          ['Pyjama Flanelle Imprimé', 5800, 'loungewear', 'F'], ['Robe de Chambre Velours', 9500, 'loungewear', 'F'],
          ['Nuisette Dentelle', 3900, 'loungewear', 'F'], ['Pyjama Long Bambou', 6200, 'loungewear', 'F'],
          ['Gilet Maille Douce', 4500, 'loungewear', 'F'], ['Short Loungewear Coton', 2800, 'loungewear', 'F'],
        ],
      },
      {
        id: 'proj_amelie_relax', name: 'Collection Relax Homme', desc: 'Loungewear confortable pour hommes.',
        products: [
          ['Pyjama Long Flanelle', 5800, 'loungewear', 'H'], ['Jogging Coton Bio', 5200, 'loungewear', 'H'],
          ['T-Shirt Nuit Col V', 2900, 'loungewear', 'H'], ['Short Yoga Modal', 3400, 'loungewear', 'H'],
          ['Robe de Chambre Éponge', 8900, 'loungewear', 'H'], ['Sweat Molleton Lourd', 6500, 'loungewear', 'H'],
          ['Pantalon Cocooning', 4800, 'loungewear', 'H'], ['Pyjama Rayé Classique', 5500, 'loungewear', 'H'],
          ['Slip Boxer Bambou', 2200, 'loungewear', 'H'], ['Chaussettes Coton Bio', 1500, 'loungewear', 'H'],
        ],
      },
      {
        id: 'proj_amelie_enfants', name: 'Collection Enfants Doux', desc: 'Pyjamas et vêtements nuit enfants.',
        products: [
          ['Pyjama Grenouillère Étoiles', 3800, 'loungewear', 'E'], ['Pyjama 2 Pièces Dinosaures', 3200, 'loungewear', 'E'],
          ['Gigoteuse Bio 0-6M', 4500, 'loungewear', 'B'], ['Body Nuit Coton Bio', 2200, 'loungewear', 'B'],
          ['Pyjama Combinaison Peluche', 4900, 'loungewear', 'E'], ['Robe de Chambre Enfant', 4200, 'loungewear', 'E'],
          ['Chausson Polaire Enfant', 1800, 'loungewear', 'E'], ['Gigoteuse Hiver 6-18M', 5500, 'loungewear', 'B'],
          ['Pyjama Brodé Prénom', 4800, 'loungewear', 'E'], ['Body Manches Longues', 2500, 'loungewear', 'B'],
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
    heroImg: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1920&h=600&fit=crop',
    pageTitle: 'KvnCstm - Sneakers customs uniques',
    pageDesc: 'Chaque paire est une œuvre unique. Customs Air Max, Jordan, Vans et plus.',
    collections: [
      {
        id: 'proj_kevin_air', name: 'Collection Air Custom', desc: 'Customs sur base Nike Air Max.',
        products: [
          ['Air Max 90 "Galaxy" Custom', 28000, 'sneakers', 'U'], ['Air Max 1 "Marble" Custom', 24500, 'sneakers', 'U'],
          ['Air Force 1 "Graffiti" Custom', 19500, 'sneakers', 'U'], ['Air Max 97 "Neo-Tokyo" Custom', 32000, 'sneakers', 'U'],
          ['Air Jordan 1 "Fade" Custom', 38500, 'sneakers', 'U'], ['Air Max 270 "Tie-Dye" Custom', 21500, 'sneakers', 'U'],
          ['Air Dunk Low "Patchwork" Custom', 26000, 'sneakers', 'U'], ['Air Pegasus "Botanical" Custom', 18500, 'sneakers', 'U'],
          ['Air Tailwind "Chrome" Custom', 22000, 'sneakers', 'U'], ['Air Max Plus "Dragon" Custom', 35000, 'sneakers', 'U'],
        ],
      },
      {
        id: 'proj_kevin_jordan', name: 'Collection Jordan Custom', desc: 'Customs sur base Air Jordan.',
        products: [
          ['Jordan 4 "Sakura" Custom', 45000, 'sneakers', 'U'], ['Jordan 3 "Street Art" Custom', 42000, 'sneakers', 'U'],
          ['Jordan 6 "Luxury" Custom', 48000, 'sneakers', 'U'], ['Jordan 1 High "Peinture Huile" Custom', 39500, 'sneakers', 'U'],
          ['Jordan 11 "Iridescent" Custom', 44000, 'sneakers', 'U'], ['Jordan 5 "Floral" Custom', 41000, 'sneakers', 'U'],
          ['Jordan 12 "Urban Camo" Custom', 40500, 'sneakers', 'U'], ['Jordan Low "Vintage" Custom', 36000, 'sneakers', 'U'],
          ['Jordan 8 "Holographic" Custom', 43000, 'sneakers', 'U'], ['Jordan 13 "Gold Leaf" Custom', 46500, 'sneakers', 'U'],
        ],
      },
      {
        id: 'proj_kevin_basics', name: 'Collection Basics Custom', desc: 'Customs accessibles sur bases classiques.',
        products: [
          ['Vans Old Skool "Fleurs" Custom', 12500, 'sneakers', 'U'], ['Converse "Aquarelle" Custom', 11000, 'sneakers', 'U'],
          ['New Balance 574 "Abstract" Custom', 14000, 'sneakers', 'U'], ['Vans Slip-On "Cartoon" Custom', 10500, 'sneakers', 'U'],
          ['Converse Chuck "Disco" Custom', 12000, 'sneakers', 'U'], ['Vans Era "Geometric" Custom', 11500, 'sneakers', 'U'],
          ['NB 990 "Suede Custom"', 22000, 'sneakers', 'U'], ['Converse Run "Neon" Custom', 13000, 'sneakers', 'U'],
          ['Vans Platform "Roses" Custom', 14500, 'sneakers', 'U'], ['NB 550 "Minimal" Custom', 19000, 'sneakers', 'U'],
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
    heroImg: 'https://images.unsplash.com/photo-1553729784-e153d1be99b6?w=1920&h=600&fit=crop',
    pageTitle: 'Pauline Papeterie - Illustrations & Carnets',
    pageDesc: 'Papeterie illustrée à la main, carnets, affiches et kits créatifs.',
    collections: [
      {
        id: 'proj_pauline_carnets', name: 'Collection Carnets & Agendas', desc: 'Carnets A5/A6 illustrés.',
        products: [
          ['Carnet A5 Fleurs des Champs', 1400, 'papeterie'], ['Agenda 2026 Botanique', 2800, 'papeterie'],
          ['Carnet Aquarelle Jungle', 1600, 'papeterie'], ['Bullet Journal Minimaliste', 2200, 'papeterie'],
          ['Carnet A6 Poche Floral', 900, 'papeterie'], ['Carnet Dots 160 pages', 1800, 'papeterie'],
          ['Agenda Perpétuel Linen', 3200, 'papeterie'], ['Carnet Couverture Brodée', 3800, 'papeterie'],
          ['Notebook Kraft Recyclé', 1200, 'papeterie'], ['Planner Mensuel Spiral', 2500, 'papeterie'],
        ],
      },
      {
        id: 'proj_pauline_prints', name: 'Collection Prints & Affiches', desc: "Tirages d'art numérotés.",
        products: [
          ['Affiche A3 "Herbier"', 2200, 'papeterie'], ['Print A4 "Ville Aquarelle"', 1500, 'papeterie'],
          ['Affiche 50x70 "Botanique"', 5500, 'papeterie'], ['Print A3 "Champignons"', 2800, 'papeterie'],
          ['Affiche "Astres & Planètes"', 3200, 'papeterie'], ['Print "Architecture Paris"', 2500, 'papeterie'],
          ['Affiche Grand Format "Océan"', 8000, 'papeterie'], ['Illustration "Forêt Enchantée"', 1900, 'papeterie'],
          ['Poster Typographie "Citation"', 1600, 'papeterie'], ['Set 3 Prints Assorties', 4500, 'papeterie'],
        ],
      },
      {
        id: 'proj_pauline_kits', name: 'Collection Kits Créatifs', desc: 'Kits papeterie et créativité.',
        products: [
          ['Kit Calligraphie Débutant', 3500, 'papeterie'], ['Set Tampon Floral + Encre', 2800, 'papeterie'],
          ['Kit Bullet Journal Complet', 6500, 'papeterie'], ['Set Washi Tapes x10', 1800, 'papeterie'],
          ['Box Papeterie Mensuelle', 8500, 'papeterie'], ['Kit Lettering Pinceaux', 3200, 'papeterie'],
          ['Set Stickers Journaling x80', 1200, 'papeterie'], ['Kit Origami 100 feuilles', 2200, 'papeterie'],
          ['Set Enveloppes & Papier Lettres', 1500, 'papeterie'], ['Kit Aquarelle Voyage', 9500, 'papeterie'],
        ],
      },
    ],
  },
  // ── 6. Romain Garnier ─────────────────────────────────────────────────────
  {
    email: 'romain.parfums@kpsull.fr', name: 'Romain Garnier', plan: Plan.ATELIER,
    brandName: 'Maison Garnier Parfums', slug: 'maison-garnier-parfums',
    siret: '66789012345678', stripeId: 'acct_demo_romain',
    phone: '+33633445566', address: '2 rue des Parfumeurs', city: 'Grasse', postalCode: '06130',
    heroImg: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=1920&h=600&fit=crop',
    pageTitle: 'Maison Garnier - Parfumerie de Grasse',
    pageDesc: 'Parfums artisanaux créés à Grasse avec les meilleures matières premières naturelles.',
    collections: [
      {
        id: 'proj_romain_boisee', name: 'Collection Boisée', desc: 'Eaux de parfum masculines aux notes boisées.',
        products: [
          ['Cèdre & Vétiver EDP 50ml', 8500, 'parfum', 'H'], ['Oud Intense EDP 30ml', 15000, 'parfum', 'H'],
          ['Musc Blanc EDT 100ml', 6500, 'parfum', 'H'], ['Tabac & Cuir EDP 50ml', 9500, 'parfum', 'H'],
          ['Pin Sylvestre EDT 75ml', 7200, 'parfum', 'H'], ['Santal & Vanille EDP 50ml', 8800, 'parfum', 'H'],
          ['Terre Ardente EDP 100ml', 11000, 'parfum', 'H'], ['Encens & Ambre EDP 50ml', 9200, 'parfum', 'H'],
          ['Bergamote & Poivre EDT 75ml', 6800, 'parfum', 'H'], ['Fougère Atlantique EDP 50ml', 7900, 'parfum', 'H'],
        ],
      },
      {
        id: 'proj_romain_florale', name: 'Collection Florale', desc: 'Eaux de parfum féminines florales.',
        products: [
          ['Rose de Mai EDP 50ml', 10500, 'parfum', 'F'], ['Jasmin & Néroli EDP 30ml', 12000, 'parfum', 'F'],
          ['Iris Poudré EDP 75ml', 8500, 'parfum', 'F'], ['Pivoine Sauvage EDT 100ml', 6500, 'parfum', 'F'],
          ['Ylang & Monoï EDP 50ml', 9200, 'parfum', 'F'], ["Fleur d'Oranger EDT 75ml", 7800, 'parfum', 'F'],
          ['Freesia & Litchi EDP 50ml', 8200, 'parfum', 'F'], ['Gardénia Blanc EDP 50ml', 9500, 'parfum', 'F'],
          ['Violette & Musc EDP 50ml', 7500, 'parfum', 'F'], ['Magnolia Infusé EDP 100ml', 11500, 'parfum', 'F'],
        ],
      },
      {
        id: 'proj_romain_bougies', name: 'Collection Bougies & Ambiance', desc: 'Bougies artisanales et diffuseurs.',
        products: [
          ['Bougie Soja "Lavande" 200g', 2800, 'parfum'], ['Diffuseur Roseau "Bergamote" 100ml', 3500, 'parfum'],
          ['Bougie "Feu de Cheminée" 350g', 4500, 'parfum'], ['Set 3 Bougies Voyage', 3200, 'parfum'],
          ['Bougie Architecte "Minuit" 500g', 6500, 'parfum'], ['Spray Textile "Linge Frais"', 1900, 'parfum'],
          ['Encens Cônes x20 "Zen"', 1500, 'parfum'], ['Huile Diffuseur "Forêt Boréale"', 2200, 'parfum'],
          ['Cire Parfumée Fondue', 2500, 'parfum'], ['Coffret Initiation Bougies', 7500, 'parfum'],
        ],
      },
    ],
  },
  // ── 7. Léa Fontaine ───────────────────────────────────────────────────────
  {
    email: 'lea.broderie@kpsull.fr', name: 'Léa Fontaine', plan: Plan.ESSENTIEL,
    brandName: 'Léa Broderies', slug: 'lea-broderies',
    siret: '67890123456789', stripeId: 'acct_demo_lea_fontaine',
    phone: '+33644556677', address: '9 rue du Fil', city: 'Angers', postalCode: '49000',
    heroImg: 'https://images.unsplash.com/photo-1558770145-d3d49d7b0c98?w=1920&h=600&fit=crop',
    pageTitle: "Léa Broderies - L'art du fil",
    pageDesc: 'Créations brodées à la main, textiles de maison et kits DIY pour apprendre la broderie.',
    collections: [
      {
        id: 'proj_lea_maison', name: 'Collection Maison Brodée', desc: 'Textiles de maison ornés de broderies.',
        products: [
          ['Coussin Lin Brodé "Flores"', 4800, 'broderie'], ['Nappe Coton Brodée Fleurie', 8500, 'broderie'],
          ['Torchon Lin Monogramme', 2200, 'broderie'], ['Chemin de Table Brodé', 6500, 'broderie'],
          ['Housse Oreiller Brodée', 3800, 'broderie'], ['Set 4 Serviettes Brodées', 5500, 'broderie'],
          ['Tote Bag Lin Brodé', 2900, 'broderie'], ['Pochon Lavande Brodé', 1500, 'broderie'],
          ['Drap de Bain Brodé Initiales', 4200, 'broderie'], ['Couvre-Livre Lin Brodé', 2800, 'broderie'],
        ],
      },
      {
        id: 'proj_lea_mode', name: 'Collection Mode Brodée', desc: 'Vêtements et accessoires brodés.',
        products: [
          ['T-Shirt Brodé "Cerisiers"', 3800, 'broderie', 'F'], ['Veste Jean Brodée Main', 14500, 'broderie', 'F'],
          ['Robe Lin Brodée Oeillets', 8900, 'broderie', 'F'], ['Casquette Brodée Fleurs', 3200, 'broderie', 'U'],
          ['Sweat Brodé Patchwork', 7500, 'broderie', 'U'], ['Jupe Lin Brodée Ethnique', 6500, 'broderie', 'F'],
          ['Pochette Brodée Faune', 2800, 'broderie', 'U'], ['T-Shirt Brodé Prénom', 4200, 'broderie', 'U'],
          ['Tablier Cuisinier Brodé', 3500, 'broderie'], ['Chapeau Paille Brodé', 2500, 'broderie', 'F'],
        ],
      },
      {
        id: 'proj_lea_kits', name: 'Collection Kits DIY', desc: 'Kits de broderie pour débutants et confirmés.',
        products: [
          ['Kit Broderie "Roses" Débutant', 2800, 'broderie'], ['Kit Point de Croix "Renard"', 3200, 'broderie'],
          ['Kit Broderie "Monstera"', 2500, 'broderie'], ['Set Fils DMC 100 couleurs', 4500, 'broderie'],
          ['Tambour Bois 20cm + Tissu', 1900, 'broderie'], ['Kit Broderie "Constellation"', 3600, 'broderie'],
          ['Coffret Initiation Complète', 6500, 'broderie'], ['Kit "Animaux de la Forêt"', 2900, 'broderie'],
          ['Aiguilles Broderie Assortiment', 800, 'broderie'], ['Kit Broderie Japonaise Sashiko', 4200, 'broderie'],
        ],
      },
    ],
  },
  // ── 8. Antoine Leblanc ────────────────────────────────────────────────────
  {
    email: 'antoine.horlogerie@kpsull.fr', name: 'Antoine Leblanc', plan: Plan.ATELIER,
    brandName: 'Antoine Horloger', slug: 'antoine-horloger',
    siret: '68901234567890', stripeId: 'acct_demo_antoine',
    phone: '+33655667788', address: "1 rue de l'Horlogerie", city: 'Besançon', postalCode: '25000',
    heroImg: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1920&h=600&fit=crop',
    pageTitle: 'Antoine Horloger - Montres vintage restaurées',
    pageDesc: 'Horloger de métier, je restaure et vends des montres mécaniques vintage des années 50-80.',
    collections: [
      {
        id: 'proj_antoine_homme', name: 'Collection Montres Homme', desc: 'Montres automatiques vintage restaurées.',
        products: [
          ['Longines Conquest Auto 1968', 55000, 'horlogerie', 'H'], ['Omega Seamaster 1972', 48000, 'horlogerie', 'H'],
          ['Zenith El Primero 1975', 72000, 'horlogerie', 'H'], ['IWC Schaffhausen 1963', 45000, 'horlogerie', 'H'],
          ['Jaeger-LeCoultre 1960', 68000, 'horlogerie', 'H'], ['Tissot PR516 1969', 22000, 'horlogerie', 'H'],
          ['Mido Multifort 1958', 18500, 'horlogerie', 'H'], ['Rado Golden Horse 1962', 24000, 'horlogerie', 'H'],
          ['Hamilton Khaki 1970', 19500, 'horlogerie', 'H'], ['Certina DS 1975', 15000, 'horlogerie', 'H'],
        ],
      },
      {
        id: 'proj_antoine_femme', name: 'Collection Montres Femme', desc: 'Montres à remontage manuel vintage.',
        products: [
          ['Longines Automatique 1965', 32000, 'horlogerie', 'F'], ['Tissot Lady 1958', 18000, 'horlogerie', 'F'],
          ['Omega De Ville 1970', 28000, 'horlogerie', 'F'], ['Eterna Matic 1962', 22000, 'horlogerie', 'F'],
          ['Mido Dorada 1955', 15500, 'horlogerie', 'F'], ['Universal Genève 1968', 35000, 'horlogerie', 'F'],
          ['Roamer Anfibio 1972', 12500, 'horlogerie', 'F'], ['Baume & Mercier 1969', 25000, 'horlogerie', 'F'],
          ['Movado Museum 1963', 20000, 'horlogerie', 'F'], ['Certina Lady 1975', 10500, 'horlogerie', 'F'],
        ],
      },
      {
        id: 'proj_antoine_access', name: 'Collection Accessoires Horlogers', desc: 'Bracelets et accessoires pour montres.',
        products: [
          ['Bracelet Alligator Bordeaux', 6500, 'horlogerie'], ['Bracelet Nato Vintage', 2800, 'horlogerie'],
          ['Bracelet Acier Jubilé 18mm', 4500, 'horlogerie'], ['Boîte Montre Bois 6 emplacements', 8500, 'horlogerie'],
          ['Remontoir Automatique', 12000, 'horlogerie'], ['Outil Changement Bracelet', 1500, 'horlogerie'],
          ['Verre Hesalite de Rechange', 3200, 'horlogerie'], ['Bracelet Cuir Vintage Whisky', 5500, 'horlogerie'],
          ['Loupe Horloger 10x', 2200, 'horlogerie'], ['Kit Révision Montre DIY', 4800, 'horlogerie'],
        ],
      },
    ],
  },
  // ── 9. Marine Petit ───────────────────────────────────────────────────────
  {
    email: 'marine.cosmetiques@kpsull.fr', name: 'Marine Petit', plan: Plan.STUDIO,
    brandName: 'Marine Naturelle', slug: 'marine-naturelle',
    siret: '69012345678901', stripeId: 'acct_demo_marine',
    phone: '+33666778899', address: '18 allée des Herbes', city: 'Bordeaux', postalCode: '33300',
    heroImg: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1920&h=600&fit=crop',
    pageTitle: 'Marine Naturelle - Cosmétiques bio',
    pageDesc: 'Soins naturels certifiés bio, formulés en France avec des plantes locales.',
    collections: [
      {
        id: 'proj_marine_visage', name: 'Collection Visage', desc: 'Soins visage naturels et bio.',
        products: [
          ['Sérum Vitamine C Rose Hip', 4800, 'cosmetique'], ['Crème Hydratante Aloe Vera', 3500, 'cosmetique'],
          ['Huile Démaquillante Jojoba', 2900, 'cosmetique'], ['Masque Argile Verte', 2200, 'cosmetique'],
          ['Contour Yeux Caféine', 5500, 'cosmetique'], ['Tonique Eau Florale Rose', 1800, 'cosmetique'],
          ['Exfoliant Sucre & Abricot', 2500, 'cosmetique'], ['Baume Lèvres Miel & Cire', 1200, 'cosmetique'],
          ['Crème SPF50 Naturelle', 4200, 'cosmetique'], ['Sérum Hyaluronique Vegan', 6500, 'cosmetique'],
        ],
      },
      {
        id: 'proj_marine_corps', name: 'Collection Corps & Bain', desc: 'Soins corps et rituels de bain.',
        products: [
          ['Huile Corps Amande Douce', 2800, 'cosmetique'], ['Gommage Café & Coco', 2400, 'cosmetique'],
          ['Beurre Corps Karité Pur', 3200, 'cosmetique'], ['Savon Naturel Lavande 100g', 900, 'cosmetique'],
          ['Sel de Bain Détente Magnésium', 1800, 'cosmetique'], ['Lait Corps Lait de Chèvre', 2900, 'cosmetique'],
          ['Bombe de Bain x6', 2200, 'cosmetique'], ['Huile Sèche Eclat', 3800, 'cosmetique'],
          ['Déodorant Naturel Minéral', 1500, 'cosmetique'], ['Set Douche Zéro Déchet', 4500, 'cosmetique'],
        ],
      },
      {
        id: 'proj_marine_cheveux', name: 'Collection Cheveux', desc: 'Soins capillaires naturels.',
        products: [
          ['Shampoing Solide Cheveux Secs', 1800, 'cosmetique'], ['Masque Kératine Végétale', 3500, 'cosmetique'],
          ['Huile Capillaire Argan & Avocat', 3200, 'cosmetique'], ['Après-Shampoing Nourrissant', 2500, 'cosmetique'],
          ['Sérum Anti-Chute Caféine', 4800, 'cosmetique'], ['Shampoing Solide Cheveux Gras', 1800, 'cosmetique'],
          ['Beurre Coiffant Naturel', 2200, 'cosmetique'], ['Eau de Rinçage Vinaigre ACV', 1500, 'cosmetique'],
          ['Masque Pousse Ricin & Ortie', 3800, 'cosmetique'], ['Kit Capillaire Complet', 8500, 'cosmetique'],
        ],
      },
    ],
  },
  // ── 10. Julien Moreau ─────────────────────────────────────────────────────
  {
    email: 'julien.arturbain@kpsull.fr', name: 'Julien Moreau', plan: Plan.STUDIO,
    brandName: 'Julien M. Art', slug: 'julien-m-art',
    siret: '70123456789012', stripeId: 'acct_demo_julien',
    phone: '+33677889900', address: '22 rue de la Friche', city: 'Marseille', postalCode: '13004',
    heroImg: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1920&h=600&fit=crop',
    pageTitle: 'Julien M. Art - Street Art & Prints',
    pageDesc: "Artiste marseillais, je vends des tirages d'art et vêtements sérigraphiés en édition limitée.",
    collections: [
      {
        id: 'proj_julien_prints', name: 'Collection Prints A4/A3', desc: "Tirages d'art numériques signés.",
        products: [
          ['Print "Marseille Abstrait" A3', 2500, 'art'], ['Affiche "Vieux-Port Nuit" A3', 2800, 'art'],
          ['Print "Typographie MRS" A4', 1500, 'art'], ['Poster "Calanques Géométrique"', 3200, 'art'],
          ['Print "Graffiti Letters" A3', 2200, 'art'], ['Affiche "La Bonne Mère" A3', 2500, 'art'],
          ['Print "Corbusier Lines" A4', 1800, 'art'], ['Poster "Street Faces" A3', 3500, 'art'],
          ['Print "Sunset Over Sea" A3', 2900, 'art'], ['Affiche "Notre-Dame de Paris" A3', 2600, 'art'],
        ],
      },
      {
        id: 'proj_julien_grandformat', name: 'Collection Grands Formats', desc: 'Tirages 50x70 et 70x100cm.',
        products: [
          ['Tirage 50x70 "Skyline MRS"', 8500, 'art'], ['Tirage 70x100 "Urban Colors"', 18000, 'art'],
          ['Impression 50x70 "Manifeste"', 9500, 'art'], ['Tirage 70x100 "Carte Blanche"', 22000, 'art'],
          ['Print 50x70 "Jazz Club"', 10500, 'art'], ['Tirage 70x100 "Mer Abstraite"', 25000, 'art'],
          ['Affiche 50x70 "Révolution"', 8000, 'art'], ['Impression 60x80 "Street View"', 14000, 'art'],
          ['Tirage 50x70 "Provence"', 9000, 'art'], ['Tirage Numéroté 1/30 70x100', 32000, 'art'],
        ],
      },
      {
        id: 'proj_julien_textiles', name: 'Collection Textiles', desc: 'Vêtements sérigraphiés en édition limitée.',
        products: [
          ['T-Shirt "MRS" Sérigraphié Noir', 3500, 'art', 'U'], ['Sweat "Calanques" Écriture', 5800, 'art', 'U'],
          ['Tote Bag "Port de Marseille"', 2200, 'art', 'U'], ['T-Shirt "Graffiti Poster"', 4200, 'art', 'U'],
          ['Casquette "Marseille 13"', 2800, 'art', 'U'], ['Hoodie "Streetwear Art" Limited', 7500, 'art', 'U'],
          ['T-Shirt Femme "Calanques" V', 3800, 'art', 'F'], ['T-Shirt "Tag Wall" Blanc', 3200, 'art', 'U'],
          ['Sweat "Bonne Mère" Brodé', 6500, 'art', 'U'], ['Long-Sleeve "Urban Lines"', 4500, 'art', 'U'],
        ],
      },
    ],
  },
  // ── 11. Céline Lambert ────────────────────────────────────────────────────
  {
    email: 'celine.deco@kpsull.fr', name: 'Céline Lambert', plan: Plan.ATELIER,
    brandName: 'Céline Intérieur', slug: 'celine-interieur',
    siret: '71234567890123', stripeId: 'acct_demo_celine',
    phone: '+33688990011', address: '5 quai du Bateleur', city: 'Strasbourg', postalCode: '67000',
    heroImg: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&h=600&fit=crop',
    pageTitle: 'Céline Intérieur - Décoration artisanale',
    pageDesc: 'Textiles, luminaires et objets de décoration fabriqués artisanalement en Alsace.',
    collections: [
      {
        id: 'proj_celine_textile', name: 'Collection Textile Maison', desc: 'Textiles de décoration artisanaux.',
        products: [
          ['Coussin Velours Terracotta', 4500, 'deco'], ['Plaid Lin & Laine Naturel', 7800, 'deco'],
          ['Rideau Lin Stonewashed 140x280', 12500, 'deco'], ['Jeté de Canapé Coton Recyclé', 5500, 'deco'],
          ['Coussin Macramé Naturel', 3800, 'deco'], ['Tapis Berbère Coton 120x180', 15000, 'deco'],
          ['Nappe Damassée Lin', 4800, 'deco'], ['Set Coussins x2 Coordonnés', 7500, 'deco'],
          ['Couverture Bébé Maille', 4200, 'deco'], ['Housse Pouf Lin Naturel', 5900, 'deco'],
        ],
      },
      {
        id: 'proj_celine_luminaires', name: 'Collection Luminaires', desc: 'Lampes et luminaires artisanaux.',
        products: [
          ['Lampe Suspension Osier Naturel', 8500, 'deco'], ['Lampe à Poser Céramique Texturée', 12000, 'deco'],
          ['Guirlande Lumineuse Lin 3m', 4500, 'deco'], ['Abat-Jour Lin Plissé', 5800, 'deco'],
          ['Lanterne Métal Dorée', 6500, 'deco'], ['Lampe Terrazzo Rose', 9800, 'deco'],
          ['Veilleuse Bois & Coton', 3200, 'deco'], ['Lampe Sol Rotin XL', 18000, 'deco'],
          ['Suspension Papier Japonais', 7500, 'deco'], ['Applique Murale Tissu', 11500, 'deco'],
        ],
      },
      {
        id: 'proj_celine_petitdeco', name: 'Collection Petit Décor', desc: 'Objets décoratifs et vases.',
        products: [
          ['Vase Soliflore Céramique Grège', 2800, 'deco'], ['Cache-Pot Tressé Jonc de Mer', 3500, 'deco'],
          ['Cadre Photo Bois Flotté', 2200, 'deco'], ['Bougeoir Béton Ciré x2', 1800, 'deco'],
          ['Plateau Tressé Rotin', 4500, 'deco'], ['Miroir Jonc Naturel Ovale', 8500, 'deco'],
          ['Set Vases Soliflores x3', 4800, 'deco'], ['Panier Osier Rangement', 3200, 'deco'],
          ['Planche Charcuterie Bois', 3800, 'deco'], ['Mobile Décoratif Origami', 2500, 'deco'],
        ],
      },
    ],
  },
  // ── 12. Maxime Arnaud ─────────────────────────────────────────────────────
  {
    email: 'maxime.sport@kpsull.fr', name: 'Maxime Arnaud', plan: Plan.STUDIO,
    brandName: 'Maxime Sport Lab', slug: 'maxime-sport-lab',
    siret: '72345678901234', stripeId: 'acct_demo_maxime',
    phone: '+33699001122', address: '8 avenue du Vercors', city: 'Grenoble', postalCode: '38000',
    heroImg: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=1920&h=600&fit=crop',
    pageTitle: 'Maxime Sport Lab - Sportswear technique',
    pageDesc: 'Vêtements de sport techniques, durables et stylés pour running, yoga et outdoor.',
    collections: [
      {
        id: 'proj_maxime_running', name: 'Collection Running', desc: 'Tenues de course légères et respirantes.',
        products: [
          ['Legging Running Haute Taille', 4800, 'sport', 'F'], ['Short Running 2-en-1 Homme', 3500, 'sport', 'H'],
          ['Brassière Impact Moyen', 3200, 'sport', 'F'], ['T-Shirt Running Compression', 2900, 'sport', 'H'],
          ['Collant Running Thermique', 5500, 'sport', 'H'], ['Top Running Dos Nu', 2800, 'sport', 'F'],
          ['Short Femme Trail', 3800, 'sport', 'F'], ['Veste Coupe-Vent Running', 6500, 'sport', 'U'],
          ['Chaussettes Running x3', 1800, 'sport', 'U'], ['Gilet Réfléchissant LED', 4200, 'sport', 'U'],
        ],
      },
      {
        id: 'proj_maxime_training', name: 'Collection Training', desc: 'Tenues fitness et salle de sport.',
        products: [
          ['Legging 7/8 Squat-Proof', 4500, 'sport', 'F'], ['Short Training Poches Zippées', 3200, 'sport', 'H'],
          ['Tank Top Coton Bio Gym', 2500, 'sport', 'U'], ['Sweat Training Oversize', 5500, 'sport', 'U'],
          ['Brassière Push-Up Sport', 3800, 'sport', 'F'], ['Jogging Training Stretch', 4800, 'sport', 'H'],
          ['T-Shirt Compression Manches L.', 3500, 'sport', 'H'], ['Crop Top Training', 2800, 'sport', 'F'],
          ['Short Cycliste Femme', 3200, 'sport', 'F'], ['Veste Training Légère', 5800, 'sport', 'U'],
        ],
      },
      {
        id: 'proj_maxime_outdoor', name: 'Collection Outdoor', desc: 'Vêtements techniques pour la montagne.',
        products: [
          ['Veste Softshell Déperlante', 8900, 'sport', 'U'], ['Pantalon Rando Stretch 2en1', 7500, 'sport', 'H'],
          ['Maillot Merinos Anti-Odeur', 6500, 'sport', 'U'], ['Doudoune Trail Ultra-Légère', 9800, 'sport', 'U'],
          ['Legging Merinos Randonnée', 6200, 'sport', 'F'], ['Polaire Micro Fleece', 5500, 'sport', 'U'],
          ['Short Escalade Libre', 5200, 'sport', 'H'], ['T-Shirt Technique UPF50+', 4500, 'sport', 'U'],
          ['Collant Thermique Ski', 5800, 'sport', 'U'], ['Bonnet Merinos Réversible', 2800, 'sport', 'U'],
        ],
      },
    ],
  },
  // ── 13. Audrey Simon ──────────────────────────────────────────────────────
  {
    email: 'audrey.enfants@kpsull.fr', name: 'Audrey Simon', plan: Plan.ESSENTIEL,
    brandName: "Petit Atelier d'Audrey", slug: 'petit-atelier-audrey',
    siret: '73456789012345', stripeId: 'acct_demo_audrey',
    phone: '+33610111213', address: '2 impasse du Moulin', city: 'Nantes', postalCode: '44100',
    heroImg: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=1920&h=600&fit=crop',
    pageTitle: "Petit Atelier d'Audrey - Mode enfants éco-responsable",
    pageDesc: 'Vêtements bébé et enfants en coton bio certifié GOTS, fabriqués en Europe.',
    collections: [
      {
        id: 'proj_audrey_bebe', name: 'Collection Bébé 0-3 ans', desc: 'Corps, grenouillères et turbulettes.',
        products: [
          ['Body Manches Courtes "Lune"', 1800, 'enfants', 'B'], ['Grenouillère Velours Étoilée', 2900, 'enfants', 'B'],
          ['Turbulette 70cm Forêt', 4500, 'enfants', 'B'], ['Brassière Nouveau-Né x3', 1500, 'enfants', 'B'],
          ['Bonnet Coton Bio', 1200, 'enfants', 'B'], ['Chaussons Antipluie 17-18', 1400, 'enfants', 'B'],
          ['Bavoir Coton Bio x3', 1500, 'enfants', 'B'], ['Body Lange Manches Longues', 1900, 'enfants', 'B'],
          ['Dors-bien Velours 1-6M', 3200, 'enfants', 'B'], ['Ensemble 2 Pièces Été', 2500, 'enfants', 'B'],
        ],
      },
      {
        id: 'proj_audrey_enfant', name: 'Collection Enfant 4-8 ans', desc: 'Vêtements quotidiens et fête.',
        products: [
          ['Robe Lin Imprimée 4-8ans', 3500, 'enfants', 'E'], ['Pantalon Coton Bio Élastiqué', 2800, 'enfants', 'E'],
          ['T-Shirt Brodé Licorne', 2200, 'enfants', 'E'], ['Robe de Fête Brodée', 5500, 'enfants', 'E'],
          ['Jeans Organic Enfant', 3800, 'enfants', 'E'], ['Sweat Capuche Animaux', 3500, 'enfants', 'E'],
          ['Short Été Coton Bio', 2000, 'enfants', 'E'], ['Ensemble Pyjama Étoiles', 3200, 'enfants', 'E'],
          ['Manteau Laine Douce', 6500, 'enfants', 'E'], ['Tenue de Scène Tutu', 4200, 'enfants', 'E'],
        ],
      },
      {
        id: 'proj_audrey_access', name: 'Collection Accessoires Bébé', desc: 'Doudous, hochets et sacs.',
        products: [
          ['Doudou Lapin Coton Bio', 1800, 'enfants'], ['Hochet Bois Naturel', 1400, 'enfants'],
          ['Sac à Langer Personnalisé', 4500, 'enfants'], ['Attache Sucette Silicone', 900, 'enfants'],
          ['Mobile Bois Étoiles', 2800, 'enfants'], ['Coussin Allaitement Bio', 3500, 'enfants'],
          ['Cape de Bain Panda', 2200, 'enfants'], ['Veilleuse Champignon', 2500, 'enfants'],
          ['Bavoirs Waterproof x4', 1600, 'enfants'], ['Kit Naissance Essentiel', 8500, 'enfants'],
        ],
      },
    ],
  },
  // ── 14. Nicolas Girard ────────────────────────────────────────────────────
  {
    email: 'nicolas.gastro@kpsull.fr', name: 'Nicolas Girard', plan: Plan.ESSENTIEL,
    brandName: 'Nicolas Terroir', slug: 'nicolas-terroir',
    siret: '74567890123456', stripeId: 'acct_demo_nicolas',
    phone: '+33621222324', address: '7 rue des Canuts', city: 'Lyon', postalCode: '69001',
    heroImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&h=600&fit=crop',
    pageTitle: 'Nicolas Terroir - Épicerie fine artisanale',
    pageDesc: 'Sélection rigoureuse de produits artisanaux français: confitures, miels, charcuteries.',
    collections: [
      {
        id: 'proj_nicolas_confitures', name: 'Collection Confitures & Miels', desc: 'Confitures artisanales et miels de France.',
        products: [
          ['Confiture Fraise Artisanale 370g', 680, 'gastro'], ['Miel de Lavande Provence 500g', 1450, 'gastro'],
          ['Confiture Abricot Romarin 370g', 720, 'gastro'], ['Miel Châtaignier Ardèche 500g', 1350, 'gastro'],
          ["Confiture Figue & Noix 250g", 850, 'gastro'], ['Miel Toutes Fleurs Bio 1kg', 1800, 'gastro'],
          ["Gelée Piment d'Espelette", 780, 'gastro'], ['Miel de Sapin Vosges 250g', 1200, 'gastro'],
          ['Confiture Mangue Passion', 720, 'gastro'], ['Assortiment 3 Confitures', 1950, 'gastro'],
        ],
      },
      {
        id: 'proj_nicolas_charcuterie', name: 'Collection Charcuterie & Fromages', desc: 'Artisans sélectionnés.',
        products: [
          ['Saucisson Sec Auvergne 200g', 1200, 'gastro'], ['Rosette de Lyon 200g', 1380, 'gastro'],
          ['Terrine de Campagne 200g', 980, 'gastro'], ['Fromage Comté 12 mois 300g', 1650, 'gastro'],
          ['Plateau Apéro Charcuterie', 3200, 'gastro'], ['Jambon Sec 24 mois 200g', 2800, 'gastro'],
          ['Rillettes du Mans 200g', 880, 'gastro'], ['Fromage Beaufort Alpage 300g', 1850, 'gastro'],
          ['Bresaola Italienne 100g', 1450, 'gastro'], ['Assortiment Charcuterie Fine', 4500, 'gastro'],
        ],
      },
      {
        id: 'proj_nicolas_coffrets', name: 'Collection Coffrets Cadeaux', desc: 'Coffrets gastronomiques pour offrir.',
        products: [
          ['Coffret "Terroir Lyonnais"', 3500, 'gastro'], ['Box "Petit-Déjeuner Luxe"', 4200, 'gastro'],
          ['Coffret Apéro "Prestige"', 5500, 'gastro'], ['Box "Fromages Affinage"', 4800, 'gastro'],
          ['Coffret "Huiles & Vinaigres"', 3800, 'gastro'], ['Box "Épices du Monde"', 2900, 'gastro'],
          ['Coffret "Pâtes Artisanales"', 2500, 'gastro'], ['Box "Chocolats Fins" 500g', 4500, 'gastro'],
          ['Coffret "Vins & Mignardises"', 6500, 'gastro'], ['Grande Box "L\'Artisan"', 8500, 'gastro'],
        ],
      },
    ],
  },
  // ── 15. Yasmin Khalil ─────────────────────────────────────────────────────
  {
    email: 'yasmin.orient@kpsull.fr', name: 'Yasmin Khalil', plan: Plan.STUDIO,
    brandName: 'Yasmin Oriental', slug: 'yasmin-oriental',
    siret: '75678901234567', stripeId: 'acct_demo_yasmin',
    phone: '+33632333435', address: '15 passage de la Médina', city: 'Paris', postalCode: '75018',
    heroImg: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1920&h=600&fit=crop',
    pageTitle: 'Yasmin Oriental - Mode orientale contemporaine',
    pageDesc: 'Caftans, abayas et accessoires orientaux alliant traditions et modernité.',
    collections: [
      {
        id: 'proj_yasmin_caftan', name: 'Collection Caftan', desc: 'Caftans marocains brodés à la main.',
        products: [
          ['Caftan Brodé Or Bleu Nuit', 32000, 'oriental', 'F'], ['Caftan Satin Ivoire Perles', 28500, 'oriental', 'F'],
          ['Caftan Moderne Mousseline', 18500, 'oriental', 'F'], ['Takchita Mariée Bordeaux', 45000, 'oriental', 'F'],
          ['Caftan Casual Imprimé', 12500, 'oriental', 'F'], ['Djellaba Femme Couleur', 15000, 'oriental', 'F'],
          ['Caftan Lin Été Brodé', 14000, 'oriental', 'F'], ['Abaya Fluide Noire', 11500, 'oriental', 'F'],
          ['Caftan Velours Automne', 22000, 'oriental', 'F'], ['Ensemble Caftan & Ceinture', 19500, 'oriental', 'F'],
        ],
      },
      {
        id: 'proj_yasmin_kimono', name: 'Collection Abaya & Kimono', desc: 'Abayas modernes et kimonos.',
        products: [
          ['Abaya Couture Dentelle', 18500, 'oriental', 'F'], ['Kimono Imprimé Japonisant', 9500, 'oriental', 'F'],
          ['Abaya Sport Modest', 8500, 'oriental', 'F'], ['Kimono Soie Floral', 15000, 'oriental', 'F'],
          ['Abaya Brodée Étoiles', 14500, 'oriental', 'F'], ['Kimono Lin Été', 7500, 'oriental', 'F'],
          ['Abaya Farasha Papillon', 16000, 'oriental', 'F'], ['Kimono Velours Hiver', 12000, 'oriental', 'F'],
          ['Abaya Casual Quotidien', 6500, 'oriental', 'F'], ['Ensemble Abaya & Hijab', 9800, 'oriental', 'F'],
        ],
      },
      {
        id: 'proj_yasmin_access', name: 'Collection Accessoires Orient', desc: 'Foulards et bijoux orientaux.',
        products: [
          ['Hijab Soie Floral 185cm', 4500, 'oriental', 'F'], ['Foulard Châle Cachemire', 8500, 'oriental', 'F'],
          ['Clutch Soirée Brodée Dorée', 6500, 'oriental', 'F'], ['Ceinture Kenza Taille Haute', 3800, 'oriental', 'F'],
          ['Hijab Jersey Premium', 2200, 'oriental', 'F'], ['Collier Berbère Argent', 5500, 'oriental', 'F'],
          ['Sac Orientale Brodé', 7200, 'oriental', 'F'], ['Bracelets Dorés Set x5', 3500, 'oriental', 'F'],
          ['Turban Prêt à Porter', 3200, 'oriental', 'F'], ['Parure Mariage Complète', 22000, 'oriental', 'F'],
        ],
      },
    ],
  },
];

// ─── MAIN EXPORT FUNCTION ─────────────────────────────────────────────────────

export async function seedNewCreators(
  prisma: PrismaClient,
  hashedPassword: string,
  admin: { id: string },
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
): Promise<{ users: Array<{ id: string; email: string }>; totalProducts: number; totalOrders: number }> {
  // Suppress unused variable warning for admin - used for future admin actions
  void admin;

  const createdUsers: Array<{ id: string; email: string }> = [];
  let totalProducts = 0;
  let orderCounter = 10000;
  let totalOrders = 0;

  function nextOrderNum(): string {
    orderCounter++;
    return `ORD-2026-${String(orderCounter).padStart(4, '0')}`;
  }

  const orderStatuses: OrderStatus[] = [
    OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
    OrderStatus.SHIPPED, OrderStatus.SHIPPED,
    OrderStatus.PAID, OrderStatus.PAID,
    OrderStatus.PENDING, OrderStatus.PENDING,
    OrderStatus.CANCELED,
    OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PAID, OrderStatus.DELIVERED, OrderStatus.PENDING,
  ];

  for (const def of NEW_CREATORS) {
    // ── 1. User ──────────────────────────────────────────────────────────────
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
    createdUsers.push({ id: user.id, email: user.email });

    // ── 2. Onboarding ────────────────────────────────────────────────────────
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

    // ── 3. Subscription ──────────────────────────────────────────────────────
    const commissionRate = def.plan === Plan.ATELIER ? 0.03 : def.plan === Plan.STUDIO ? 0.04 : 0.05;
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id, creatorId: user.id, plan: def.plan,
        status: SubscriptionStatus.ACTIVE, billingInterval: 'year',
        currentPeriodStart: daysAgo(45), currentPeriodEnd: daysFromNow(320),
        commissionRate,
        stripeSubscriptionId: `sub_demo_${def.slug}`,
        stripeCustomerId: `cus_demo_${def.slug}`,
        stripePriceId: `price_demo_${def.plan.toLowerCase()}_yearly`,
        productsUsed: def.collections.reduce((s, c) => s + c.products.length, 0),
      },
    });

    // ── 4. Creator Page ──────────────────────────────────────────────────────
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
            backgroundImage: def.heroImg,
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

    // ── 5. Collections & Products ────────────────────────────────────────────
    const allProductIds: string[] = [];

    for (const coll of def.collections) {
      await prisma.project.upsert({
        where: { id: coll.id },
        update: {},
        create: { id: coll.id, creatorId: user.id, name: coll.name, description: coll.desc },
      });

      for (let i = 0; i < coll.products.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const prodDef = coll.products[i]!;
        const collKey = coll.id.replace(`proj_${def.slug.replace(/-/g, '_')}_`, '');
        const prodId = `prod_${def.slug.replace(/-/g, '_')}_${collKey}_${i}`;
        const productData = buildProduct(prodDef, i, user.id, coll.id, daysAgo(30 - i));
        const cat: CatDef = (CAT[prodDef[2]] ?? CAT['bijou']) as CatDef;

        await prisma.product.upsert({
          where: { id: prodId },
          update: { ...productData },
          create: { id: prodId, ...productData },
        });

        await prisma.productImage.deleteMany({ where: { productId: prodId } });
        await prisma.productImage.createMany({
          data: [
            { productId: prodId, url: pick(cat.imgs, i), alt: `${prodDef[0]} - vue principale`, position: 0 },
            { productId: prodId, url: pick(cat.imgs, i + 1), alt: `${prodDef[0]} - vue détail`, position: 1 },
          ],
        });

        allProductIds.push(prodId);
        totalProducts++;
      }
    }

    // ── 6. Orders (5-15 per creator) ────────────────────────────────────────
    const orderCount = Math.min(15, Math.max(5, allProductIds.length));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const firstProd: ProdDef = def.collections[0]!.products[0]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const firstCat: CatDef = (CAT[firstProd[2]] ?? CAT['bijou']) as CatDef;
    const firstCollProductCount = def.collections[0]!.products.length;

    for (let o = 0; o < orderCount; o++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const client = allClients[o % allClients.length]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const status = orderStatuses[o % orderStatuses.length]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const prodId = allProductIds[o % allProductIds.length]!;
      const collIdx = Math.floor(o / firstCollProductCount) % def.collections.length;
      const price = def.collections[collIdx]?.products[o % 10]?.[1] ?? firstProd[1];
      const isDelivered = status === OrderStatus.DELIVERED;
      const isShipped = status === OrderStatus.SHIPPED;

      await prisma.order.create({
        data: {
          orderNumber: nextOrderNum(),
          creatorId: user.id, customerId: client.id,
          customerName: client.name ?? 'Client', customerEmail: client.email,
          status, totalAmount: price,
          shippingStreet: client.address ?? '1 rue Test',
          shippingCity: client.city ?? 'Paris',
          shippingPostalCode: client.postalCode ?? '75001',
          shippingCountry: 'France',
          trackingNumber: (isDelivered || isShipped)
            ? `COL2026${def.slug.slice(0, 4).toUpperCase()}${String(o).padStart(3, '0')}`
            : null,
          carrier: (isDelivered || isShipped) ? 'colissimo' : null,
          shippedAt: isDelivered ? daysAgo(10 - (o % 5)) : isShipped ? daysAgo(2) : null,
          deliveredAt: isDelivered ? daysAgo(7 - (o % 4)) : null,
          createdAt: daysAgo(14 - o),
          items: {
            create: [{
              productId: prodId,
              productName: firstProd[0],
              quantity: 1,
              price,
              image: pick(firstCat.imgs, 0),
            }],
          },
        },
      });
      totalOrders++;
    }
  }

  // ── 7. New System Styles ──────────────────────────────────────────────────
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
