/**
 * Script de génération d'images seed avec upload Cloudinary
 *
 * Usage:
 *   bun prisma/scripts/upload-seed-images.ts
 *
 * Stratégie:
 *   1. Si UNSPLASH_ACCESS_KEY dispo: recherche Unsplash + validation Gemini Vision (optionnel)
 *   2. Fallback: Picsum.photos (gratuit, déterministe, 0 clé requise)
 *   3. Upload final vers Cloudinary (toujours requis)
 *
 * Variables d'environnement:
 *   CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET  → REQUIS
 *   UNSPLASH_ACCESS_KEY  → optionnel (meilleures photos)
 *   GOOGLE_AI_API_KEY    → optionnel (validation Gemini Vision si Unsplash activé)
 *
 * Résultat: prisma/seed-assets/product-images.json
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config({ path: '.env.local' });

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimpleImageSpec {
  productId: string;
  label: string;
  query: string;
  description: string;
}

interface SimpleCollectionSpec {
  collectionId: string;
  label: string;
  query: string;
  description: string;
}

interface ProductImageEntry {
  main: string[];
  variants: Record<string, string[]>;
}

interface SeedImagesOutput {
  products: Record<string, ProductImageEntry>;
  collections: Record<string, string>;
  categories: Record<string, string[]>;
}

// ─── IMAGE_SPECS — 1 entrée par produit ──────────────────────────────────────

const IMAGE_SPECS: SimpleImageSpec[] = [

  // ══ JOSE — Streetwear ══════════════════════════════════════════════════════

  {
    productId: 'prod_jose_hoodie_noir',
    label: 'jose-hoodie-noir',
    query: 'oversized black hoodie streetwear minimal white background',
    description: 'Oversized black organic cotton hoodie, streetwear style',
  },
  {
    productId: 'prod_jose_tshirt_graphic',
    label: 'jose-tshirt-graphic',
    query: 'graphic print t-shirt streetwear urban fashion',
    description: 'Graphic print t-shirt streetwear urban fashion',
  },
  {
    productId: 'prod_jose_pantalon_cargo',
    label: 'jose-pantalon-cargo',
    query: 'cargo pants khaki fashion streetwear minimal',
    description: 'Khaki cargo pants streetwear with multiple pockets',
  },
  {
    productId: 'prod_jose_bomber',
    label: 'jose-bomber',
    query: 'bomber jacket fashion minimal white background',
    description: 'Quilted bomber jacket with satin lining',
  },
  {
    productId: 'prod_jose_bonnet',
    label: 'jose-bonnet',
    query: 'merino wool beanie hat fashion accessories minimal',
    description: 'Merino wool knit beanie hat, fashion accessory',
  },
  {
    productId: 'prod_jose_casquette',
    label: 'jose-casquette',
    query: 'embroidered cap streetwear fashion accessories',
    description: 'Embroidered logo cap streetwear accessories',
  },
  {
    productId: 'prod_jose_tote',
    label: 'jose-tote',
    query: 'canvas tote bag fashion minimal white background',
    description: 'Canvas tote bag with screen print design',
  },
  {
    productId: 'prod_jose_sweat',
    label: 'jose-sweat',
    query: 'crew neck sweatshirt grey heather fashion minimal',
    description: 'Grey heather organic cotton crew neck sweatshirt',
  },

  // ══ SOPHIE — Céramique ═════════════════════════════════════════════════════

  {
    productId: 'prod_sophie_bol_raku',
    label: 'sophie-bol-raku',
    query: 'raku ceramic bowl handmade artisan pottery',
    description: 'Raku fired ceramic bowl handmade artisan pottery with copper reflections',
  },
  {
    productId: 'prod_sophie_vase_bleu',
    label: 'sophie-vase-bleu',
    query: 'cobalt blue ceramic vase handmade pottery minimal',
    description: 'Handmade porcelain vase with deep cobalt blue glaze',
  },
  {
    productId: 'prod_sophie_tasse_duo',
    label: 'sophie-tasse-duo',
    query: 'ceramic espresso cups set handmade minimal white',
    description: 'Set of two handmade stoneware espresso cups, minimalist design',
  },
  {
    productId: 'prod_sophie_assiette',
    label: 'sophie-assiette',
    query: 'wabi sabi ceramic plate handmade artisan pottery',
    description: 'Wabi-sabi style stoneware flat plate, handmade with organic edges',
  },
  {
    productId: 'prod_sophie_bougeoir',
    label: 'sophie-bougeoir',
    query: 'ceramic candle holder sculptural black matte handmade',
    description: 'Sculptural black matte stoneware candle holder',
  },

  // ══ LUCAS — Streetwear Design ══════════════════════════════════════════════

  {
    productId: 'prod_lucas_hoodie_art',
    label: 'lucas-hoodie-art',
    query: 'all over print hoodie street art graphic urban',
    description: 'Oversized hoodie with all-over street art graphic print',
  },
  {
    productId: 'prod_lucas_tshirt_typo',
    label: 'lucas-tshirt-typo',
    query: 'bold typography t-shirt streetwear fashion minimal',
    description: 'T-shirt with exclusive bold typography design',
  },
  {
    productId: 'prod_lucas_veste_jean',
    label: 'lucas-veste-jean',
    query: 'custom denim jacket patches embroidery streetwear',
    description: 'Vintage denim jacket with hand-sewn patches and embroidery',
  },
  {
    productId: 'prod_lucas_short_mesh',
    label: 'lucas-short-mesh',
    query: 'mesh basketball shorts athletic fashion streetwear',
    description: 'Mesh basketball shorts with side stripe print',
  },
  {
    productId: 'prod_lucas_sac_banane',
    label: 'lucas-sac-banane',
    query: 'reflective fanny pack bag streetwear accessories',
    description: 'Reflective 3M fabric fanny pack with waterproof zip',
  },

  // ══ CLAIRE — Mode Vintage ══════════════════════════════════════════════════

  {
    productId: 'prod_claire_robe_70s',
    label: 'claire-robe-70s',
    query: 'bohemian floral maxi dress 70s vintage fashion',
    description: 'Long floral bohemian dress 1970s vintage style',
  },
  {
    productId: 'prod_claire_blazer_xl',
    label: 'claire-blazer-xl',
    query: 'oversized blazer 90s vintage structured fashion',
    description: 'Oversized 90s blazer with structured shoulders, vintage',
  },
  {
    productId: 'prod_claire_jupe_plissee',
    label: 'claire-jupe-plissee',
    query: 'plaid tartan pleated skirt vintage fashion',
    description: 'Authentic tartan plaid pleated midi skirt vintage',
  },
  {
    productId: 'prod_claire_pull_mohair',
    label: 'claire-pull-mohair',
    query: 'mohair oversized sweater pastel pink fashion',
    description: 'Oversized Italian mohair sweater in dusty pink',
  },

  // ══ MARC — Accessoires Vintage ═════════════════════════════════════════════

  {
    productId: 'prod_marc_montre_auto',
    label: 'marc-montre-auto',
    query: 'vintage automatic watch restored leather strap luxury',
    description: 'Restored 1960s mechanical automatic watch with leather strap',
  },
  {
    productId: 'prod_marc_ceinture_cuir',
    label: 'marc-ceinture-cuir',
    query: 'patinated leather belt brass buckle handmade artisan',
    description: 'Full grain patinated leather belt with brass buckle',
  },
  {
    productId: 'prod_marc_lunettes_retro',
    label: 'marc-lunettes-retro',
    query: 'retro acetate sunglasses tortoise vintage fashion',
    description: 'Retro acetate tortoise sunglasses with polarized lenses',
  },

  // ══ JOSE — Nouveaux produits (avec variantes couleur) ═════════════════════

  {
    productId: 'prod_new_tshirt_basique',
    label: 'new-tshirt-basique',
    query: 'premium organic cotton t-shirt basic white background',
    description: 'Premium organic cotton basic t-shirt, regular fit',
  },
  {
    productId: 'prod_new_hoodie_premium',
    label: 'new-hoodie-premium',
    query: 'oversized premium hoodie organic cotton streetwear',
    description: 'Premium oversized hoodie with kangaroo pocket, brushed interior',
  },

  // ══ LUCAS — Nouveaux produits ══════════════════════════════════════════════

  {
    productId: 'prod_new_jogger_tech',
    label: 'new-jogger-tech',
    query: 'technical performance jogger pants athletic fashion',
    description: 'Technical performance jogger pants 4-way stretch with zip pockets',
  },
  {
    productId: 'prod_new_veste_coach',
    label: 'new-veste-coach',
    query: 'coach windbreaker jacket lightweight fashion minimal',
    description: 'Coach windbreaker jacket, oversize fit, full YKK zip',
  },
  {
    productId: 'prod_new_longline_tee',
    label: 'new-longline-tee',
    query: 'longline graphic t-shirt streetwear urban fashion',
    description: 'Longline t-shirt with back graphic print, heavy cotton 220g',
  },
  {
    productId: 'prod_new_sweat_zip',
    label: 'new-sweat-zip',
    query: 'zip up sweatshirt technical fashion minimal',
    description: 'Zipped sweatshirt with funnel collar and double-slider YKK zip',
  },

  // ══ CLAIRE — Nouveaux produits ═════════════════════════════════════════════

  {
    productId: 'prod_new_croptop',
    label: 'new-croptop',
    query: 'ribbed crop top athleisure women fashion minimal',
    description: 'Ribbed stretch crop top with adjustable straps, athleisure',
  },
  {
    productId: 'prod_new_pull_colroule',
    label: 'new-pull-colroule',
    query: 'merino wool turtleneck sweater women fashion minimal',
    description: 'Fine merino wool turtleneck sweater, soft and elegant',
  },
  {
    productId: 'prod_new_debardeur',
    label: 'new-debardeur',
    query: 'oversized organic cotton tank top women fashion',
    description: 'Oversized organic cotton tank top with wide neckline',
  },

  // ══ MARC — Nouveaux produits ═══════════════════════════════════════════════

  {
    productId: 'prod_new_short_sport',
    label: 'new-short-sport',
    query: 'sport running shorts premium athletic minimal',
    description: 'Premium 7-inch sport shorts with inner liner, recycled polyester',
  },
  {
    productId: 'prod_new_legging_sport',
    label: 'new-legging-sport',
    query: 'high waist compression legging sport women athletic',
    description: 'High-waist compression legging 4-way stretch for sport',
  },

  // ══ JOSE — Essentiels ══════════════════════════════════════════════════════

  {
    productId: 'prod_new_pantalon_velours',
    label: 'new-pantalon-velours',
    query: 'velvet jogger pants corduroy fashion comfortable',
    description: 'Corduroy velvet jogging pants, elastic waist, side pockets',
  },

  // ══ SOPHIE — Nouveaux ══════════════════════════════════════════════════════

  {
    productId: 'prod_new_mug_artisanal',
    label: 'new-mug-artisanal',
    query: 'handmade ceramic mug artisan pottery minimal',
    description: 'Handmade stoneware mug 350ml, unique glazed piece',
  },

  // ══ MARC — Maroquinerie ════════════════════════════════════════════════════

  {
    productId: 'prod_new_pochette_cuir',
    label: 'new-pochette-cuir',
    query: 'leather zipper pouch vintage handmade accessories',
    description: 'Vegetable tanned leather zipper pouch, aged brass closure',
  },

  // ══ LUCAS — Capsule ════════════════════════════════════════════════════════

  {
    productId: 'prod_new_bomber_capsule',
    label: 'new-bomber-capsule',
    query: 'graphic bomber jacket satin limited edition fashion',
    description: 'Oversized satin bomber jacket with hand-printed collar, limited edition',
  },

  // ══ ISABELLE BIJOUX — Collection Minérale ═════════════════════════════════

  {
    productId: 'prod_isabelle_bijoux_minerale_0',
    label: 'isabelle-collier-labradorite',
    query: 'labradorite gemstone necklace silver handmade jewelry',
    description: 'Labradorite gemstone sterling silver necklace, handcrafted',
  },
  {
    productId: 'prod_isabelle_bijoux_minerale_1',
    label: 'isabelle-bracelet-quartz',
    query: 'rose quartz bracelet silver handmade jewelry minimal',
    description: 'Rose quartz bracelet, sterling silver, artisan jewelry',
  },
  {
    productId: 'prod_isabelle_bijoux_minerale_2',
    label: 'isabelle-bague-opale',
    query: 'opal ring silver handmade fine jewelry minimal',
    description: 'Opal ring in sterling silver, artisan fine jewelry',
  },
  {
    productId: 'prod_isabelle_bijoux_minerale_3',
    label: 'isabelle-boucles-turquoise',
    query: 'turquoise earrings silver handmade jewelry minimal',
    description: 'Turquoise silver earrings, handmade artisan jewelry',
  },

  // ══ ISABELLE BIJOUX — Collection Dorée ════════════════════════════════════

  {
    productId: 'prod_isabelle_bijoux_doree_0',
    label: 'isabelle-jonc-or',
    query: 'solid gold bangle bracelet minimal luxury jewelry',
    description: 'Solid 18K gold bangle bracelet, luxury fine jewelry',
  },
  {
    productId: 'prod_isabelle_bijoux_doree_1',
    label: 'isabelle-bague-diamant',
    query: 'diamond engagement ring gold minimal luxury jewelry',
    description: 'Lab-grown diamond ring in 18K gold, luxury jewelry',
  },
  {
    productId: 'prod_isabelle_bijoux_doree_2',
    label: 'isabelle-chaine-forcats',
    query: 'gold chain necklace curb link luxury minimal jewelry',
    description: 'Curb link chain necklace in 18K gold',
  },
  {
    productId: 'prod_isabelle_bijoux_doree_3',
    label: 'isabelle-creoles-dorees',
    query: 'large gold hoop earrings minimal luxury jewelry',
    description: '30mm gold hoop earrings, luxury fine jewelry',
  },

  // ══ THOMAS SELLIER — Collection Héritage (femme) ══════════════════════════

  {
    productId: 'prod_thomas_sellier_heritage_0',
    label: 'thomas-sac-cabas',
    query: 'leather tote bag women luxury handmade france',
    description: 'Full grain leather tote bag for women, luxury French leather goods',
  },
  {
    productId: 'prod_thomas_sellier_heritage_1',
    label: 'thomas-pochette-soiree',
    query: 'leather evening clutch women luxury minimal',
    description: 'Leather evening clutch bag for women',
  },
  {
    productId: 'prod_thomas_sellier_heritage_2',
    label: 'thomas-sac-baguette',
    query: 'grain leather baguette bag women fashion luxury',
    description: 'Grained leather baguette bag, women luxury fashion',
  },
  {
    productId: 'prod_thomas_sellier_heritage_3',
    label: 'thomas-tote-pleine-fleur',
    query: 'full grain leather tote bag women luxury artisan',
    description: 'Full grain leather tote bag, artisan French leather goods',
  },

  // ══ THOMAS SELLIER — Collection Homme ═════════════════════════════════════

  {
    productId: 'prod_thomas_sellier_homme_0',
    label: 'thomas-sacoche-weekend',
    query: 'leather weekend duffle bag men minimal luxury',
    description: 'Leather weekend bag for men, luxury French leather goods',
  },
  {
    productId: 'prod_thomas_sellier_homme_1',
    label: 'thomas-porte-documents',
    query: 'leather briefcase portfolio men luxury minimal',
    description: 'Leather briefcase document bag for men',
  },
  {
    productId: 'prod_thomas_sellier_homme_2',
    label: 'thomas-portefeuille',
    query: 'slim leather wallet men minimal luxury',
    description: 'Slim leather wallet for men, minimal design',
  },
  {
    productId: 'prod_thomas_sellier_homme_3',
    label: 'thomas-ceinture-double',
    query: 'double wrap leather belt men artisan luxury',
    description: 'Double wrap leather belt for men, artisan crafted',
  },

  // ══ AMÉLIE HOME — Collection Cocooning (femme) ════════════════════════════

  {
    productId: 'prod_amelie_home_cocooning_0',
    label: 'amelie-pyjama-satin',
    query: 'satin pyjama set women pink loungewear fashion',
    description: 'Satin pyjama set in dusty pink for women, loungewear',
  },
  {
    productId: 'prod_amelie_home_cocooning_1',
    label: 'amelie-robe-chambre-polaire',
    query: 'fleece robe women comfortable loungewear cosy',
    description: 'Soft fleece bathrobe for women, cosy loungewear',
  },
  {
    productId: 'prod_amelie_home_cocooning_2',
    label: 'amelie-chemise-nuit',
    query: 'linen nightgown women minimal comfortable fashion',
    description: 'Linen nightgown for women, comfortable and elegant',
  },
  {
    productId: 'prod_amelie_home_cocooning_3',
    label: 'amelie-set-shorty',
    query: 'modal pyjama shorts set women loungewear minimal',
    description: 'Modal short pyjama set for women',
  },

  // ══ AMÉLIE HOME — Collection Relax Homme ══════════════════════════════════

  {
    productId: 'prod_amelie_home_relax_0',
    label: 'amelie-pyjama-flanelle',
    query: 'flannel pyjama set men comfortable loungewear',
    description: 'Long flannel pyjama set for men, comfortable loungewear',
  },
  {
    productId: 'prod_amelie_home_relax_1',
    label: 'amelie-jogging-coton',
    query: 'organic cotton jogger pants men loungewear comfortable',
    description: 'Organic cotton jogging pants for men',
  },
  {
    productId: 'prod_amelie_home_relax_2',
    label: 'amelie-tshirt-nuit',
    query: 'v neck sleep shirt men comfortable minimal',
    description: 'V-neck sleep t-shirt for men, soft fabric',
  },
  {
    productId: 'prod_amelie_home_relax_3',
    label: 'amelie-robe-chambre-eponge',
    query: 'terry cloth bathrobe men luxury comfortable',
    description: 'Terry cloth bathrobe for men, hotel quality',
  },

  // ══ KVNCSTM STUDIO — Collection Air Custom ════════════════════════════════

  {
    productId: 'prod_kvncstm_studio_air_0',
    label: 'kvncstm-air-max-galaxy',
    query: 'custom air max sneakers galaxy painted artistic',
    description: 'Custom Nike Air Max 90 with galaxy hand-painted design',
  },
  {
    productId: 'prod_kvncstm_studio_air_1',
    label: 'kvncstm-air-max-marble',
    query: 'custom sneakers marble design artistic painted shoes',
    description: 'Custom Nike Air Max 1 with marble effect design',
  },
  {
    productId: 'prod_kvncstm_studio_air_2',
    label: 'kvncstm-air-force-graffiti',
    query: 'custom air force 1 graffiti sneakers artistic',
    description: 'Custom Nike Air Force 1 with graffiti art design',
  },
  {
    productId: 'prod_kvncstm_studio_air_3',
    label: 'kvncstm-air-max-neotokyo',
    query: 'custom sneakers neo tokyo cyberpunk artistic painted',
    description: 'Custom Nike Air Max 97 with Neo-Tokyo cyberpunk design',
  },

  // ══ KVNCSTM STUDIO — Collection Jordan Custom ═════════════════════════════

  {
    productId: 'prod_kvncstm_studio_jordan_0',
    label: 'kvncstm-jordan4-sakura',
    query: 'custom jordan 4 sakura floral painted sneakers artistic',
    description: 'Custom Air Jordan 4 with sakura floral hand-painted design',
  },
  {
    productId: 'prod_kvncstm_studio_jordan_1',
    label: 'kvncstm-jordan3-streetart',
    query: 'custom jordan 3 street art graffiti artistic painted shoes',
    description: 'Custom Air Jordan 3 with street art graffiti design',
  },
  {
    productId: 'prod_kvncstm_studio_jordan_2',
    label: 'kvncstm-jordan6-luxury',
    query: 'custom jordan 6 luxury gold detail artistic sneakers',
    description: 'Custom Air Jordan 6 with luxury gold details',
  },
  {
    productId: 'prod_kvncstm_studio_jordan_3',
    label: 'kvncstm-jordan1-huile',
    query: 'custom jordan 1 oil painting artistic sneakers unique',
    description: 'Custom Air Jordan 1 High with oil painting hand-crafted design',
  },

  // ══ PAULINE PAPETERIE — Collection Carnets & Agendas ══════════════════════

  {
    productId: 'prod_pauline_papeterie_carnets_0',
    label: 'pauline-carnet-fleurs',
    query: 'illustrated notebook wildflowers stationery design',
    description: 'A5 illustrated notebook with wildflower design cover',
  },
  {
    productId: 'prod_pauline_papeterie_carnets_1',
    label: 'pauline-agenda-botanique',
    query: 'botanical illustrated agenda planner stationery design',
    description: 'Botanical illustrated 2026 agenda planner',
  },
  {
    productId: 'prod_pauline_papeterie_carnets_2',
    label: 'pauline-carnet-jungle',
    query: 'watercolor jungle notebook stationery illustrated',
    description: 'Watercolor jungle illustration A5 notebook',
  },
  {
    productId: 'prod_pauline_papeterie_carnets_3',
    label: 'pauline-bullet-journal',
    query: 'minimalist bullet journal dot grid notebook stationery',
    description: 'Minimalist dot grid bullet journal notebook',
  },

  // ══ PAULINE PAPETERIE — Collection Prints & Affiches ═════════════════════

  {
    productId: 'prod_pauline_papeterie_prints_0',
    label: 'pauline-affiche-herbier',
    query: 'botanical herbarium art print poster illustrated',
    description: 'Botanical herbarium illustration A3 art print',
  },
  {
    productId: 'prod_pauline_papeterie_prints_1',
    label: 'pauline-print-ville',
    query: 'watercolor city art print poster illustrated',
    description: 'Watercolor city illustration A4 art print',
  },
  {
    productId: 'prod_pauline_papeterie_prints_2',
    label: 'pauline-affiche-botanique',
    query: 'large botanical art poster illustration prints',
    description: 'Botanical illustration 50x70 large format art poster',
  },
  {
    productId: 'prod_pauline_papeterie_prints_3',
    label: 'pauline-print-champignons',
    query: 'mushroom illustration art print poster design',
    description: 'Mushroom illustration A3 art print, hand drawn',
  },
];

// ─── COLLECTION_SPECS — 1 entrée par collection ───────────────────────────────

const COLLECTION_SPECS: SimpleCollectionSpec[] = [
  // Jose collections
  {
    collectionId: 'proj_jose_streetwear',
    label: 'collection-jose-streetwear',
    query: 'streetwear collection editorial urban paris fashion',
    description: 'Urban streetwear collection editorial fashion',
  },
  {
    collectionId: 'proj_jose_accessoires',
    label: 'collection-jose-accessoires',
    query: 'streetwear accessories caps hats bags fashion',
    description: 'Streetwear accessories collection caps bags',
  },
  {
    collectionId: 'proj_jose_essentiels',
    label: 'collection-jose-essentiels',
    query: 'essential basics wardrobe fashion minimal clothing',
    description: 'Essential streetwear basics collection',
  },
  // Sophie collections
  {
    collectionId: 'proj_sophie_ceramique',
    label: 'collection-sophie-ceramique',
    query: 'artisan ceramics pottery collection studio handmade',
    description: 'Artisan ceramics collection handmade stoneware',
  },
  {
    collectionId: 'proj_sophie_terre',
    label: 'collection-sophie-terre',
    query: 'stoneware clay pottery earth tones handmade artisan',
    description: 'Earth tones stoneware collection',
  },
  {
    collectionId: 'proj_sophie_quotidien',
    label: 'collection-sophie-quotidien',
    query: 'everyday ceramic objects cups bowls handmade minimal',
    description: 'Everyday ceramic objects cups and bowls',
  },
  // Lucas collections
  {
    collectionId: 'proj_lucas_design',
    label: 'collection-lucas-design',
    query: 'graphic streetwear design collection editorial fashion',
    description: 'Graphic streetwear design collection',
  },
  {
    collectionId: 'proj_lucas_capsule',
    label: 'collection-lucas-capsule',
    query: 'capsule collection limited edition streetwear fashion',
    description: 'Limited capsule streetwear collection',
  },
  {
    collectionId: 'proj_lucas_limited',
    label: 'collection-lucas-limited',
    query: 'limited edition numbered fashion collaboration streetwear',
    description: 'Limited edition numbered fashion collection',
  },
  // Claire collections
  {
    collectionId: 'proj_claire_vintage',
    label: 'collection-claire-vintage',
    query: 'curated vintage fashion collection editorial minimal',
    description: 'Curated vintage fashion collection',
  },
  {
    collectionId: 'proj_claire_annees80',
    label: 'collection-claire-annees80',
    query: 'eighties power dressing fashion editorial colorful',
    description: '1980s power dressing fashion editorial',
  },
  {
    collectionId: 'proj_claire_rares',
    label: 'collection-claire-rares',
    query: 'rare vintage fashion pieces curated exclusive',
    description: 'Rare exclusive vintage fashion pieces',
  },
  // Marc collections
  {
    collectionId: 'proj_marc_accessories',
    label: 'collection-marc-accessories',
    query: 'vintage accessories watches belts fashion editorial',
    description: 'Vintage accessories watches and belts',
  },
  {
    collectionId: 'proj_marc_montres',
    label: 'collection-marc-montres',
    query: 'vintage watches jewelry restored luxury collection',
    description: 'Restored vintage watches and jewelry collection',
  },
  {
    collectionId: 'proj_marc_maroquinerie',
    label: 'collection-marc-maroquinerie',
    query: 'fine leather goods artisan collection luxury',
    description: 'Fine artisan leather goods collection',
  },
  // Isabelle Bijoux collections
  {
    collectionId: 'proj_isabelle_bijoux_minerale',
    label: 'collection-isabelle-minerale',
    query: 'gemstone jewelry collection editorial minimal luxury',
    description: 'Gemstone jewelry collection editorial',
  },
  {
    collectionId: 'proj_isabelle_bijoux_doree',
    label: 'collection-isabelle-doree',
    query: 'gold jewelry collection luxury editorial minimal',
    description: 'Gold fine jewelry collection luxury editorial',
  },
  // Thomas Sellier collections
  {
    collectionId: 'proj_thomas_sellier_heritage',
    label: 'collection-thomas-heritage',
    query: 'luxury leather bags women collection editorial',
    description: 'Heritage luxury leather bags collection for women',
  },
  {
    collectionId: 'proj_thomas_sellier_homme',
    label: 'collection-thomas-homme',
    query: 'leather goods men collection minimal luxury',
    description: 'Leather goods collection for men',
  },
  // Amélie Home collections
  {
    collectionId: 'proj_amelie_home_cocooning',
    label: 'collection-amelie-cocooning',
    query: 'cosy loungewear pyjamas women fashion soft',
    description: 'Cosy cocooning loungewear collection for women',
  },
  {
    collectionId: 'proj_amelie_home_relax',
    label: 'collection-amelie-relax',
    query: 'comfortable loungewear men fashion relaxed home',
    description: 'Relaxed loungewear collection for men',
  },
  // KvnCstm collections
  {
    collectionId: 'proj_kvncstm_studio_air',
    label: 'collection-kvncstm-air',
    query: 'custom sneakers air max collection artistic colorful',
    description: 'Custom Nike Air Max sneakers collection',
  },
  {
    collectionId: 'proj_kvncstm_studio_jordan',
    label: 'collection-kvncstm-jordan',
    query: 'custom jordan sneakers collection artistic unique',
    description: 'Custom Air Jordan sneakers collection',
  },
  // Pauline Papeterie collections
  {
    collectionId: 'proj_pauline_papeterie_carnets',
    label: 'collection-pauline-carnets',
    query: 'illustrated notebooks agendas stationery collection',
    description: 'Illustrated notebooks and agendas collection',
  },
  {
    collectionId: 'proj_pauline_papeterie_prints',
    label: 'collection-pauline-prints',
    query: 'art prints illustrations posters stationery collection',
    description: 'Art prints and illustration posters collection',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Picsum fallback: déterministe par label, 0 clé requise
 */
function getPicsumUrl(label: string, width = 800, height = 600): string {
  const seed = label.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Recherche Unsplash (si UNSPLASH_ACCESS_KEY dispo)
 * Retourne un tableau de regular URLs
 */
async function searchUnsplash(query: string): Promise<string[]> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) return [];

  try {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', '5');
    url.searchParams.set('orientation', 'squarish');

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${apiKey}` },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      results: Array<{ urls: { regular: string } }>;
    };

    return data.results.map((r) => r.urls.regular);
  } catch {
    return [];
  }
}

/**
 * Validation Gemini Vision (gemini-2.0-flash, gratuit)
 * Retourne true si l'image correspond à la description produit
 */
async function validateWithGemini(
  imageUrl: string,
  description: string,
  apiKey: string,
): Promise<boolean> {
  try {
    // Télécharger l'image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return false;
    const buffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = imgResponse.headers.get('content-type') ?? 'image/jpeg';

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Is this image suitable for an e-commerce product listing of: ${description}? Answer only YES or NO.`,
            },
            {
              inlineData: { mimeType, data: base64 },
            },
          ],
        },
      ],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return false;

    const result = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return text.toUpperCase().includes('YES');
  } catch {
    return false;
  }
}

/**
 * Upload vers Cloudinary (accepte une URL distante)
 */
async function uploadToCloudinary(sourceUrl: string, label: string): Promise<string> {
  const folder = 'kpsull-seed';
  const publicId = `${folder}/${label}`;

  // Vérifier si déjà uploadé (évite les doublons)
  try {
    const existing = await cloudinary.api.resource(publicId);
    return existing.secure_url as string;
  } catch {
    // Non trouvé, on continue l'upload
  }

  const result = await cloudinary.uploader.upload(sourceUrl, {
    public_id: publicId,
    overwrite: false,
    resource_type: 'image',
  });

  return result.secure_url;
}

/**
 * Résoudre l'URL finale pour un spec:
 * 1. Unsplash (si clé dispo) avec validation Gemini (si clé dispo)
 * 2. Fallback Picsum
 */
async function resolveImageUrl(spec: SimpleImageSpec | SimpleCollectionSpec): Promise<string> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const geminiKey = process.env.GOOGLE_AI_API_KEY;

  if (unsplashKey) {
    const results = await searchUnsplash(spec.query);

    for (const url of results) {
      if (geminiKey) {
        const valid = await validateWithGemini(url, spec.description, geminiKey);
        if (valid) return url;
      } else {
        // Sans Gemini, on prend le premier résultat Unsplash
        return url;
      }
    }
  }

  // Fallback Picsum déterministe
  return getPicsumUrl(spec.label);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Vérification Cloudinary (obligatoire)
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET sont requis.');
    process.exit(1);
  }

  const hasUnsplash = Boolean(process.env.UNSPLASH_ACCESS_KEY);
  const hasGemini = Boolean(process.env.GOOGLE_AI_API_KEY);

  if (hasUnsplash) {
    console.log(
      `Mode: Unsplash${hasGemini ? ' + Gemini Vision' : ''} → Cloudinary`,
    );
  } else {
    console.log('Mode: Picsum (fallback gratuit) → Cloudinary');
    console.log('   Astuce: définir UNSPLASH_ACCESS_KEY pour de meilleures photos');
  }

  const totalImages = IMAGE_SPECS.length + COLLECTION_SPECS.length;
  console.log(`\n${totalImages} images à traiter (${IMAGE_SPECS.length} produits + ${COLLECTION_SPECS.length} collections)`);
  console.log('Estimation: ~30s (picsum) ou quelques minutes (Unsplash)\n');

  const output: SeedImagesOutput = {
    products: {},
    collections: {},
    categories: {},
  };

  let processed = 0;

  // ── Produits ────────────────────────────────────────────────────────────────
  for (const spec of IMAGE_SPECS) {
    processed++;
    process.stdout.write(`[${processed}/${totalImages}] ${spec.label}... `);

    try {
      const sourceUrl = await resolveImageUrl(spec);
      const finalUrl = await uploadToCloudinary(sourceUrl, spec.label);

      if (!output.products[spec.productId]) {
        output.products[spec.productId] = { main: [], variants: {} };
      }
      output.products[spec.productId]!.main = [finalUrl];

      console.log('OK');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`ERREUR: ${message}`);
    }
  }

  // ── Collections ─────────────────────────────────────────────────────────────
  for (const spec of COLLECTION_SPECS) {
    processed++;
    process.stdout.write(`[${processed}/${totalImages}] ${spec.label}... `);

    try {
      const sourceUrl = await resolveImageUrl(spec);
      const finalUrl = await uploadToCloudinary(sourceUrl, spec.label);
      output.collections[spec.collectionId] = finalUrl;

      console.log('OK');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`ERREUR: ${message}`);
    }
  }

  // ── Sauvegarde JSON ──────────────────────────────────────────────────────────
  const outputDir = path.resolve('./prisma/seed-assets');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'product-images.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  const productsCount = Object.keys(output.products).length;
  const collectionsCount = Object.keys(output.collections).length;
  console.log(`\nTermine! ${productsCount} produits + ${collectionsCount} collections sauvegardés`);
  console.log(`Fichier: ${outputPath}`);
}

main().catch((err) => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
