/**
 * Script de génération d'images produit mode via HuggingFace FLUX.1-schnell + upload Cloudinary
 *
 * Usage:
 *   bun prisma/scripts/generate-images-gemini.ts              ← génère les images (reprend depuis checkpoint)
 *   bun prisma/scripts/generate-images-gemini.ts --status     ← affiche le statut du checkpoint
 *   bun prisma/scripts/generate-images-gemini.ts --reset      ← remet le checkpoint à zéro
 *   bun prisma/scripts/generate-images-gemini.ts --mini          ← mode mini (570 images pour seed-mini)
 *   bun prisma/scripts/generate-images-gemini.ts --reset-mini    ← remet le checkpoint mini à zéro
 *
 * HuggingFace Inference API (FLUX.1-schnell):
 *   - Gratuit avec compte HuggingFace (sans CB)
 *   - Limite: 300 req/h (free tier)
 *   - Durée: ~27h pour 7732 images (~2 sessions)
 *   - Qualité: excellente (FLUX.1-schnell 4 steps)
 *
 * Pour obtenir HF_TOKEN (gratuit, sans CB):
 *   1. https://huggingface.co/join  (créer un compte gratuit)
 *   2. https://huggingface.co/settings/tokens  (New Token → READ)
 *   3. Ajouter dans .env.local: HF_TOKEN=hf_...
 *
 * Variables d'environnement requises (.env.local):
 *   HF_TOKEN              ← HuggingFace API token (gratuit, sans CB)
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

import { config } from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import miniCreatorsData from './data/mini-creators.json';

config({ path: '.env.local' });

import { v2 as cloudinary } from 'cloudinary';

// ─── Configuration ────────────────────────────────────────────────────────────

const HF_MODEL = 'black-forest-labs/FLUX.1-schnell';
const HF_ENDPOINT = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;
const DELAY_BETWEEN_REQUESTS_MS = 13_000; // 13s = ~277 req/h, sous la limite 300 req/h free tier
const MAX_RETRIES = 3;
const RETRY_WAIT_MS = 30_000; // 30s en cas d'erreur (model loading ou rate limit)

const SEED_ASSETS_DIR = path.resolve('./prisma/seed-assets');
const CHECKPOINT_PATH = path.join(SEED_ASSETS_DIR, 'image-generation-progress.json');
const OUTPUT_PATH = path.join(SEED_ASSETS_DIR, 'product-images-complete.json');
const SPECS_PATH = path.join(SEED_ASSETS_DIR, 'generation-specs.json');

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerationSpec {
  variantId: string;
  productId: string;
  productName: string;
  category: string;
  color: string;
  colorName: string;
  brandName: string;
  brandStyle: string;
  gender: string;
  projectId: string;
  imageCount: number;
}

interface GenerationSpecsFile {
  variants: GenerationSpec[];
}

interface CheckpointImageEntry {
  images: string[];
  completedAt: string;
  prompt?: string;
}

interface Checkpoint {
  startedAt: string;
  lastUpdatedAt: string;
  totalImages: number;
  completedImages: number;
  failedImages: number;
  images: Record<string, CheckpointImageEntry>;
}

interface OutputVariants {
  variants: Record<string, string[]>;
}

interface SeedImagesOutput {
  products: Record<string, OutputVariants>;
  collections: Record<string, string>;
}

interface PromptOpts {
  color: string;
  colorName: string;
  brand: string;
  style: string;
  gender: string;
  category: string;
}

// ─── Prompt Templates Fashion Marketplace ─────────────────────────────────────

const PROMPT_TEMPLATES: Record<string, (opts: PromptOpts) => string> = {

  tshirt: ({ color, colorName, brand, style, gender }) => `
Professional fashion product photography for an exclusive French independent designer marketplace.
Shot in a minimalist Parisian studio with soft diffused natural light from a north-facing window.
The garment: a premium quality oversized t-shirt in ${colorName} (hex: ${color}), impeccably folded or hanging.
Brand aesthetic: ${brand} — ${style}.
Gender target: ${gender}.
Photography style: editorial fashion, clean white or pale grey seamless backdrop, subtle shadow underneath.
Details visible: premium cotton jersey 220g/m² fabric texture, clean topstitching, subtle label.
Camera: medium format, 85mm lens, f/2.8, shallow depth of field on fabric texture.
Lighting: key light soft box left, fill light right, no harsh shadows.
Color accuracy: ${colorName} must be perfectly reproduced, true to life.
No mannequin, no model. Flat lay or hanging product shot only.
Professional retouching: clean background, no dust, perfect exposure.
Style reference: A.P.C., Sandro Paris, Isabel Marant product photography.
High resolution, 8K quality, luxury e-commerce ready.
`.trim(),

  hoodie: ({ color, colorName, brand, style }) => `
Fashion e-commerce photography for a luxury French independent designer brand.
Product: premium heavyweight hoodie in ${colorName} (hex: ${color}), relaxed oversized silhouette.
Brand: ${brand} — ${style} aesthetic.
Studio setup: pure white seamless paper backdrop, controlled lighting with 2 large softboxes.
Composition: garment laid flat or on invisible mannequin, slight 3/4 angle to show volume and hood.
Fabric details: brushed fleece interior visible at hood opening, ribbed cuffs and hem clearly shown.
Camera: medium format, 70mm, perfect exposure, true color reproduction.
Post-processing: clean white background, professional retouch, no shadows on backdrop.
Reference: Jacquemus, Fear of God Essentials, Stüssy luxury product imagery.
Output: luxury e-commerce quality, 8K resolution.
`.trim(),

  veste_blouson: ({ color, colorName, brand, style }) => `
High-end fashion product photography for a French creator marketplace.
Subject: designer jacket or blouson in ${colorName} (hex: ${color}), structured silhouette.
Brand: ${brand} — ${style}.
Shot on invisible mannequin or hanging, 3/4 front angle to showcase construction and silhouette.
Lighting: dramatic but controlled, Rembrandt lighting setup, slight texture shadows showing fabric weight.
Background: pure white (#ffffff) seamless, no gradient.
Details: topstitching, collar construction, pocket placements, button quality — all clearly visible.
Fabric: true-to-life color and texture rendering.
Style reference: Sandro, Maje, A.P.C. outerwear catalog photography.
8K, e-commerce ready, luxury fashion quality.
`.trim(),

  pantalon: ({ color, colorName, brand, style, gender }) => `
Professional product photography for a French fashion marketplace.
Garment: premium trousers or pants in ${colorName} (hex: ${color}).
Cut: ${gender === 'Femme' ? 'wide leg or tailored feminine cut with fluid drape' : 'straight or slim masculine cut, clean lines'}.
Brand: ${brand} — ${style}.
Presentation: flat lay on clean white surface, perfectly pressed; or hanging vertically, full length visible.
Lighting: even, diffused, no harsh shadows, true color reproduction.
Details: waistband, belt loops, seam construction, and fabric drape clearly visible.
Camera: overhead 45° angle for flat lay, correct perspective.
Background: clean white seamless.
Reference: Acne Studios, The Row, Helmut Lang product photography.
Ultra high resolution, 8K, luxury e-commerce quality.
`.trim(),

  robe: ({ color, colorName, brand, style }) => `
Luxury fashion photography for an independent French female designer brand.
Product: an exquisite dress in ${colorName} (hex: ${color}), flowing and elegant silhouette.
Brand: ${brand} — ${style} feminine aesthetic.
Shot on an invisible mannequin or as a precise flat lay, full garment visible from neckline to hem.
Lighting: elegant, soft, directional light from one side, gentle shadows suggesting fabric movement.
Background: pure white seamless or very light dove grey.
Details: fabric movement and drape, neckline construction, hem finishing and lining quality.
Dress photography reference: Rouje, Sézane, Vanessa Bruno catalog imagery.
8K resolution, luxury e-commerce ready, editorial quality.
`.trim(),

  pull_knitwear: ({ color, colorName, brand, style }) => `
Artisan knitwear photography for an independent French designer brand.
Product: handcrafted knit sweater or cardigan in ${colorName} (hex: ${color}), visible stitch texture.
Brand: ${brand} — ${style}.
Presentation: flat lay showing full garment with knit texture prominent and clearly readable.
Lighting: soft diffused light, slightly raking angle to emphasize the knit relief and texture depth.
Background: warm white or natural linen-colored surface.
Details: knit pattern complexity, neckline construction, ribbing at cuffs and hem — clearly visible.
Macro details: yarn and individual stitch photography to showcase craftsmanship.
Reference: Jacquemus knitwear, Loewe, Les Féminines product imagery.
8K, warm artisanal tones, luxury e-commerce quality.
`.trim(),

  sport: ({ color, colorName, brand, style, gender }) => `
Athletic fashion product photography for a premium French sportswear brand.
Product: technical sportswear garment in ${colorName} (hex: ${color}), performance fabric construction.
Brand: ${brand} — ${style}.
Target: ${gender} athletic premium market.
Shot on pure white seamless, dynamic but clean product presentation.
Lighting: clean, bright studio strobe, even illumination showing fabric technology.
Details: technical fabric texture and weave, flatlock seaming, moisture-wicking surface quality.
Reference: Arc'teryx, On Running premium, Satisfy Running — technical performance catalog.
8K, hyper-sharp technical details, professional sportswear catalog quality.
`.trim(),

  denim: ({ color, colorName, brand, style }) => `
Premium selvedge denim product photography for an artisan French brand.
Product: handcrafted denim piece in ${colorName} (hex: ${color}), ${colorName.toLowerCase().includes('délavé') ? 'washed with character fade' : 'raw dry indigo finish'}.
Brand: ${brand} — ${style}.
Shot: flat lay perfectly pressed and aligned, full construction details visible.
Lighting: directional raking light to emphasize denim twill texture and indigo color depth.
Details: selvage ID stripe visible at outseam cuff, rivet quality, button construction, back pocket stitching artistry.
Background: clean white or very light warm grey surface.
Reference: A.P.C. raw denim, Edwin, Nudie Jeans — artisan denim product photography.
Ultra-sharp texture detail, 8K resolution, craftsmanship quality imagery.
`.trim(),

  bijoux: ({ color, colorName, brand, style }) => `
Luxury jewelry product photography for an independent French artisan brand.
Product: handcrafted jewelry piece with ${colorName} (hex: ${color}) finish.
Brand: ${brand} — ${style}.
Shot on clean flat white marble or velvet surface, perfect composition.
Lighting: precision multi-point lighting to capture metal reflections, gemstone brilliance, and surface texture.
Details: hallmarks, clasp mechanisms, chain links, stone settings — macro precision.
Background: pure white seamless or dark velvet jewelry showcase.
Reference: Dinh Van, Ginette NY, Goossens Paris — luxury jewelry photography standards.
Macro detail focus, 8K ultra-sharp, luxury retail gallery quality.
`.trim(),

  manteau: ({ color, colorName, brand, style }) => `
Premium outerwear product photography for an independent French designer.
Product: luxury coat or long jacket in ${colorName} (hex: ${color}), constructed structured silhouette.
Brand: ${brand} — ${style}.
Presentation: shot on an invisible mannequin showing full silhouette, front slightly open to suggest lining.
Lighting: dramatic studio lighting, one strong key light with subtle fill, showing fabric weight and drape.
Details: lapel construction and shaping, button quality and spacing, lining visibility if applicable, shoulder and hem precision.
Background: clean white seamless.
Reference: The Row, Totème, Lemaire outerwear catalog photography.
8K resolution, luxury fashion catalog quality.
`.trim(),

  lingerie: ({ color, colorName, brand, style }) => `
Tasteful luxury lingerie product photography for a French artisan brand.
Product: fine lingerie piece in ${colorName} (hex: ${color}), delicate lacework and satin details.
Brand: ${brand} — ${style}.
Shot tastefully: flat lay on padded surface or hanging on silk hanger, artistic and elegant composition.
Lighting: soft, romantic, beautifully diffused — boudoir studio aesthetic without being explicit.
Details: lace pattern intricacy, satin sheen and finish, bow and trim details, strap construction.
Background: clean white seamless or warm light marble or satin fabric surface.
Reference: Chantelle Haute Couture, Simone Pérèle, Eres — elegant and tasteful product photography.
8K, soft luxury feel, premium e-commerce appropriate, tasteful and artistic.
`.trim(),

  sneaker: ({ color, colorName, brand, style }) => `
Custom sneaker product photography for a French independent footwear brand.
Product: hand-customized sneaker in ${colorName} (hex: ${color}) colorway, one-of-a-kind artistic design.
Brand: ${brand} — ${style}.
Shot: clean 3/4 front angle showing full sneaker design, white seamless background.
Lighting: studio strobe setup with hard key light creating dramatic shadows on sole and upper details.
Details: sole profile and rubber texture, upper material and custom paint work, lacing, tongue logo area.
Background: clean white seamless.
Reference: Nike SNKRS editorial imagery, Footshop, Stadium Goods — premium sneaker photography.
Hyper-detailed, 8K, sneaker collector quality imagery.
`.trim(),

  default: ({ color, colorName, brand, style, category }) => `
Professional fashion product photography for an exclusive French designer marketplace.
Product category: ${category}. Colorway: ${colorName} (hex: ${color}).
Brand: ${brand} — ${style} aesthetic.
Studio photography: clean white seamless background, professional controlled lighting.
High resolution, 8K quality, luxury e-commerce standard.
True color reproduction, sharp detail throughout, no model, product only.
Reference: Parisian independent fashion brand e-commerce photography standards.
`.trim(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPrompt(spec: GenerationSpec): string {
  const opts: PromptOpts = {
    color: spec.color,
    colorName: spec.colorName,
    brand: spec.brandName,
    style: spec.brandStyle,
    gender: spec.gender,
    category: spec.category,
  };

  const templateFn = PROMPT_TEMPLATES[spec.category] ?? PROMPT_TEMPLATES['default'];
  return templateFn!(opts);
}

// ─── Checkpoint management ────────────────────────────────────────────────────

function ensureSeedAssetsDir(): void {
  if (!fs.existsSync(SEED_ASSETS_DIR)) {
    fs.mkdirSync(SEED_ASSETS_DIR, { recursive: true });
  }
}

function loadCheckpoint(filePath: string, totalImages: number): Checkpoint {
  ensureSeedAssetsDir();

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as Checkpoint;
    } catch {
      console.warn('⚠️  Checkpoint corrompu, création d\'un nouveau checkpoint.');
    }
  }

  return {
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    totalImages,
    completedImages: 0,
    failedImages: 0,
    images: {},
  };
}

function saveCheckpoint(filePath: string, checkpoint: Checkpoint): void {
  ensureSeedAssetsDir();
  checkpoint.lastUpdatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf-8');
}

function loadOutput(): SeedImagesOutput {
  ensureSeedAssetsDir();

  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const raw = fs.readFileSync(OUTPUT_PATH, 'utf-8');
      return JSON.parse(raw) as SeedImagesOutput;
    } catch {
      console.warn('⚠️  Output corrompu, création d\'un nouveau fichier output.');
    }
  }

  return { products: {}, collections: {} };
}

function saveOutput(output: SeedImagesOutput): void {
  ensureSeedAssetsDir();
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
}

// ─── Specs loading ────────────────────────────────────────────────────────────

function loadGenerationSpecs(): GenerationSpec[] {
  if (!fs.existsSync(SPECS_PATH)) {
    console.error(`❌ Fichier de spécifications introuvable: ${SPECS_PATH}`);
    console.error('');
    console.error('Ce fichier est généré automatiquement lors du seed Prisma :');
    console.error('  bun prisma/seed-complete.ts');
    console.error('');
    console.error('Format attendu (génération-specs.json) :');
    console.error(JSON.stringify({
      variants: [{
        variantId: 'var_example_tshirt_noir',
        productId: 'prod_example_tshirt',
        productName: 'T-Shirt Oversized',
        category: 'tshirt',
        color: '#1a1a1a',
        colorName: 'Noir',
        brandName: 'Example Studio',
        brandStyle: 'Streetwear minimaliste parisien',
        gender: 'Homme',
        projectId: 'proj_example_collection',
        imageCount: 2,
      }],
    }, null, 2));
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(SPECS_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as GenerationSpecsFile;

    if (!Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      console.error('❌ Le fichier generation-specs.json ne contient aucune variante.');
      process.exit(1);
    }

    return parsed.variants;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Erreur lecture generation-specs.json: ${message}`);
    process.exit(1);
  }
}

// ─── HuggingFace Inference API ────────────────────────────────────────────────

async function fetchImageFromHuggingFace(
  prompt: string,
  hfToken: string,
  dimensions?: { width: number; height: number },
): Promise<Buffer> {
  const response = await fetch(HF_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${hfToken}`,
      'Content-Type': 'application/json',
      Accept: 'image/jpeg',
    },
    body: JSON.stringify({
      inputs: prompt.slice(0, 500),
      ...(dimensions ? { parameters: { width: dimensions.width, height: dimensions.height } } : {}),
    }),
  });

  if (response.status === 401 || response.status === 403) {
    // Token invalide ou expiré → arrêt immédiat (pas de retry utile)
    const body = await response.text();
    const error = new Error(`❌ HF_TOKEN invalide (${response.status}). Regénérez votre token sur https://huggingface.co/settings/tokens\n   Détail: ${body.slice(0, 100)}`);
    Object.assign(error, { isFatal: true });
    throw error;
  }

  if (response.status === 429) {
    const error = new Error('Rate limit (429)');
    Object.assign(error, { isRateLimit: true });
    throw error;
  }

  if (response.status === 503) {
    const body = await response.text();
    const error = new Error(`Modèle en chargement (503): ${body.slice(0, 100)}`);
    Object.assign(error, { isLoading: true });
    throw error;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HuggingFace API erreur HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateImageWithRetry(
  prompt: string,
  hfToken: string,
  variantId: string,
  dimensions?: { width: number; height: number },
): Promise<Buffer> {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      return await fetchImageFromHuggingFace(prompt, hfToken, dimensions);
    } catch (err) {
      const error = err as Error & { isRateLimit?: boolean; isLoading?: boolean; isFatal?: boolean };

      // Erreur fatale (401/403) : pas de retry, terminer immédiatement
      if (error.isFatal === true) throw error;

      attempt++;

      if (attempt >= MAX_RETRIES) {
        throw new Error(`Échec après ${MAX_RETRIES} tentatives pour ${variantId}: ${error.message}`);
      }

      const waitSec = RETRY_WAIT_MS / 1000;
      const reason = error.isRateLimit === true ? 'Rate limit' : error.isLoading === true ? 'Modèle en chargement' : 'Erreur';
      console.log(`\n  ⏳ ${reason} — attente ${waitSec}s avant retry ${attempt}/${MAX_RETRIES}...`);
      await sleep(RETRY_WAIT_MS);
    }
  }

  throw new Error(`Échec après ${MAX_RETRIES} tentatives pour ${variantId}`);
}

// ─── Cloudinary upload ────────────────────────────────────────────────────────

async function uploadImageToCloudinary(
  imageBuffer: Buffer,
  variantId: string,
  imageIndex: number,
): Promise<string> {
  const base64 = imageBuffer.toString('base64');
  const dataUri = `data:image/jpeg;base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'kpsull-seed',
    public_id: `${variantId}-${imageIndex}`,
    overwrite: false,
    resource_type: 'image',
  });

  if (!result.secure_url) {
    throw new Error(`Cloudinary n'a pas retourné de secure_url pour ${variantId}-${imageIndex}`);
  }

  return result.secure_url;
}

// ─── Status display ───────────────────────────────────────────────────────────

function displayStatus(checkpoint: Checkpoint, totalSpecs: number): void {
  const remaining = checkpoint.totalImages - checkpoint.completedImages;
  const percentDone = checkpoint.totalImages > 0
    ? Math.round((checkpoint.completedImages / checkpoint.totalImages) * 100)
    : 0;

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  STATUT GÉNÉRATION IMAGES FLUX.1-schnell     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`Début session:       ${checkpoint.startedAt}`);
  console.log(`Dernière MAJ:        ${checkpoint.lastUpdatedAt}`);
  console.log(`Variantes totales:   ${totalSpecs}`);
  console.log(`Images totales:      ${checkpoint.totalImages}`);
  console.log(`Images terminées:    ${checkpoint.completedImages} (${percentDone}%)`);
  console.log(`Images échouées:     ${checkpoint.failedImages}`);
  console.log(`Images restantes:    ${remaining}`);
  console.log('');

  if (remaining > 0) {
    const hoursRemaining = ((remaining * DELAY_BETWEEN_REQUESTS_MS) / 3_600_000).toFixed(1);
    console.log(`⏱  Estimation: ~${hoursRemaining}h à ${DELAY_BETWEEN_REQUESTS_MS}ms/req`);
    console.log(`   Relancer: bun prisma/scripts/generate-images-gemini.ts`);
  } else {
    console.log('✅ Génération terminée !');
    console.log(`   Output: ${OUTPUT_PATH}`);
  }
  console.log('');
}

// ─── Main generation logic ────────────────────────────────────────────────────

function validateEnvironment(): void {
  const missing: string[] = [];

  if (!process.env.HF_TOKEN) missing.push('HF_TOKEN');
  if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');

  if (missing.length === 0) return;

  console.error('❌ Variables d\'environnement manquantes dans .env.local:');
  console.error('');
  for (const key of missing) {
    console.error(`  ${key}=<valeur>`);
  }
  console.error('');

  if (missing.includes('HF_TOKEN')) {
    console.error('Pour obtenir HF_TOKEN (gratuit, sans CB):');
    console.error('  1. https://huggingface.co/join  (créer un compte gratuit)');
    console.error('  2. https://huggingface.co/settings/tokens  (New Token → READ)');
    console.error('  3. Ajouter dans .env.local: HF_TOKEN=hf_...');
    console.error('');
    console.error('  Limites free tier: 300 req/h (~27h pour 7732 images)');
  }

  process.exit(1);
}

function computeTotalImages(specs: GenerationSpec[]): number {
  return specs.reduce((sum, s) => sum + s.imageCount, 0);
}

async function processVariant(
  spec: GenerationSpec,
  checkpoint: Checkpoint,
  output: SeedImagesOutput,
  hfToken: string,
  displayIndex: number,
  total: number,
): Promise<'ok' | 'error'> {
  const prompt = buildPrompt(spec);
  const imageUrls: string[] = [];

  for (let imgIdx = 0; imgIdx < spec.imageCount; imgIdx++) {
    process.stdout.write(
      `[${displayIndex}/${total}] ${spec.brandName} — ${spec.productName} (${spec.colorName}, img ${imgIdx + 1}/${spec.imageCount})... `,
    );

    try {
      const imageBuffer = await generateImageWithRetry(prompt, hfToken, spec.variantId);
      const uploadedUrl = await uploadImageToCloudinary(imageBuffer, spec.variantId, imgIdx + 1);

      imageUrls.push(uploadedUrl);
      checkpoint.completedImages++;
      saveCheckpoint(CHECKPOINT_PATH, checkpoint);

      console.log(`✅`);
    } catch (err) {
      const error = err as Error & { isFatal?: boolean };
      // Erreur fatale (token invalide) : re-throw pour arrêter toute la génération
      if (error.isFatal === true) throw error;
      const message = error.message || String(err);
      console.log(`❌ ${message.slice(0, 80)}`);
      checkpoint.failedImages++;
      saveCheckpoint(CHECKPOINT_PATH, checkpoint);
      return 'error';
    }

    // Délai entre images d'une même variante
    if (imgIdx < spec.imageCount - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  if (imageUrls.length > 0) {
    checkpoint.images[spec.variantId] = {
      images: imageUrls,
      completedAt: new Date().toISOString(),
    };

    output.products[spec.productId] ??= { variants: {} };
    output.products[spec.productId]!.variants[spec.variantId] = imageUrls;

    saveOutput(output);
    saveCheckpoint(CHECKPOINT_PATH, checkpoint);
  }

  return 'ok';
}

async function runGeneration(specs: GenerationSpec[]): Promise<void> {
  const hfToken = process.env.HF_TOKEN!;
  const totalImages = computeTotalImages(specs);

  const checkpoint = loadCheckpoint(CHECKPOINT_PATH, totalImages);
  const output = loadOutput();

  const pendingSpecs = specs.filter((s) => !(s.variantId in checkpoint.images));
  const pendingImages = computeTotalImages(pendingSpecs);
  const estimatedHours = ((pendingImages * DELAY_BETWEEN_REQUESTS_MS) / 3_600_000).toFixed(1);

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  GÉNÉRATION IMAGES FLUX.1-schnell — DÉMARRAGE║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`Modèle:              ${HF_MODEL} (HuggingFace free tier)`);
  console.log(`Variantes totales:   ${specs.length}`);
  console.log(`Variantes restantes: ${pendingSpecs.length}`);
  console.log(`Images restantes:    ${pendingImages}`);
  console.log(`Délai entre req:     ${DELAY_BETWEEN_REQUESTS_MS}ms (≤300 req/h)`);
  console.log(`Estimation:          ~${estimatedHours}h`);
  console.log('');

  if (pendingSpecs.length === 0) {
    console.log('✅ Toutes les images ont déjà été générées !');
    console.log(`   Output: ${OUTPUT_PATH}`);
    console.log('   Pour relancer: bun prisma/scripts/generate-images-gemini.ts --reset');
    return;
  }

  let processedCount = 0;

  for (let i = 0; i < pendingSpecs.length; i++) {
    const spec = pendingSpecs[i]!;
    const globalIndex = specs.indexOf(spec) + 1;

    await processVariant(spec, checkpoint, output, hfToken, globalIndex, specs.length);
    processedCount++;

    // Délai entre variantes (sauf dernière)
    if (i < pendingSpecs.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  // Résumé
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║    RÉSUMÉ SESSION                            ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`Variantes traitées cette session: ${processedCount}`);
  console.log(`Images complétées (total):        ${checkpoint.completedImages}/${checkpoint.totalImages}`);
  console.log(`Images échouées (total):          ${checkpoint.failedImages}`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log('');

  if (checkpoint.completedImages >= checkpoint.totalImages) {
    console.log('🎉 Génération complète ! Toutes les images sont prêtes.');
    console.log('   Vous pouvez maintenant lancer: bun prisma/seed-complete.ts');
  }
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

const MINI_CHECKPOINT_PATH = path.join(SEED_ASSETS_DIR, 'image-generation-mini-v3-progress.json');

function resetCheckpoint(): void {
  let removed = 0;

  if (fs.existsSync(CHECKPOINT_PATH)) {
    fs.unlinkSync(CHECKPOINT_PATH);
    console.log(`🗑  Checkpoint supprimé: ${CHECKPOINT_PATH}`);
    removed++;
  }

  if (fs.existsSync(OUTPUT_PATH)) {
    fs.unlinkSync(OUTPUT_PATH);
    console.log(`🗑  Output supprimé: ${OUTPUT_PATH}`);
    removed++;
  }

  if (removed === 0) {
    console.log('Aucun fichier checkpoint/output à supprimer.');
  } else {
    console.log('✅ Reset effectué. Relancez sans --reset pour repartir de zéro.');
  }
}

function resetMiniCheckpoint(): void {
  const filesToDelete = [
    MINI_CHECKPOINT_PATH,
    path.join(SEED_ASSETS_DIR, 'image-generation-mini-progress.json'),
    path.join(SEED_ASSETS_DIR, 'image-generation-mini-v2-progress.json'),
  ];
  let removed = 0;
  for (const f of filesToDelete) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      console.log(`🗑  Checkpoint supprimé: ${f}`);
      removed++;
    }
  }
  if (removed === 0) {
    console.log('Aucun checkpoint mini à supprimer.');
  } else {
    console.log('✅ Checkpoints mini réinitialisés. Relancez avec --mini pour repartir de zéro.');
  }
  process.exit(0);
}

// ─── MINI MODE ────────────────────────────────────────────────────────────────
//
// Usage : bun prisma/scripts/generate-images-gemini.ts --mini
//
// Génère 576 images pour le seed mini :
//   - 6 images styles éditoriaux (Style.imageUrl, 1/style)
//   - 6 profils créateurs (User.image)
//   - 6 bannières créateurs (CreatorPage.bannerImage)
//   - 18 covers collections (Project.coverImage)
//   - 540 images variantes produit (ProductVariant.images, 2/variante)
//
// Checkpoint : prisma/seed-assets/image-generation-mini-v3-progress.json
// ──────────────────────────────────────────────────────────────────────────────

interface MiniItem {
  key: string;        // checkpoint key + Cloudinary public_id prefix
  type: 'style' | 'profile' | 'banner' | 'cover' | 'variant';
  imageCount: number; // 1 pour profile/banner/cover/style, 2 pour variant
  width: number;
  height: number;
  prompts: string[];  // [heroPrompt] ou [heroPrompt, detailPrompt] pour variants
  displayName: string;
}

interface MiniCreatorProductJson {
  name: string;
  category: string;
  heroTemplate: string;
  detailTemplate: string;
}

interface MiniCreatorJson {
  id: string;
  name: string;
  brand: string;
  portraitPrompt: string;
  bannerPrompt: string;
  collections: { name: string; coverPrompt: string }[];
  products: MiniCreatorProductJson[];
  colors: { name: string; code: string }[];
}

interface MiniCreatorProduct {
  name: string;
  category: string;
  heroPrompt: (colorName: string, color: string) => string;
  detailPrompt: (colorName: string, color: string) => string;
}

interface MiniCreatorCollection {
  name: string;
  coverPrompt: string;
}

interface MiniCreatorConfig {
  id: string;
  name: string;
  brand: string;
  portraitPrompt: string;
  bannerPrompt: string;
  collections: MiniCreatorCollection[];
  products: MiniCreatorProduct[];
  colors: { name: string; code: string }[];
}

// ─── Couleur → anglais naturel ───────────────────────────────────────────────

const COLOR_EN: Record<string, string> = {
  'Noir': 'jet black',
  'Blanc cassé': 'off-white cream',
  'Kaki ardoise': 'slate khaki',
  'Ivoire': 'ivory',
  'Rose nude': 'nude blush pink',
  'Or': 'warm champagne gold',
  'Argent oxydé': 'oxidized silver grey',
  'Bronze': 'antique bronze brown',
  'Vert prune': 'deep plum purple',
  'Vert sauge': 'sage green',
  'Noir technique': 'matte technical black',
  'Olive terrain': 'military olive',
  'Marine profond': 'deep navy',
  'Rose poudré': 'dusty powder rose',
  'Bordeaux profond': 'deep burgundy',
  'Écru': 'ecru natural',
};
function toEn(colorName: string): string {
  return COLOR_EN[colorName] ?? colorName;
}

// ─── Styles système — images éditoriales ──────────────────────────────────────

interface MiniStyleConfig {
  key: string;   // checkpoint key: "style_streetwear", "style_boudoir", etc.
  name: string;
  prompt: string;
}

const MINI_STYLES_CFG: MiniStyleConfig[] = [
  {
    key: 'style_streetwear',
    name: 'Streetwear',
    prompt: `Editorial fashion photography for "Streetwear" style concept. Urban concrete underpass, late afternoon golden light cutting through. Deconstructed oversized black jacket and cargo trousers hung on exposed rusted pipe, industrial backdrop. Raw graffiti wall in soft background focus. Cinematic wide shot, strong diagonal shadows, 8K.`,
  },
  {
    key: 'style_boudoir',
    name: 'Boudoir',
    prompt: `Editorial fashion photography for "Boudoir" style concept. Intimate Parisian bedroom, late morning amber light through sheer ivory curtains. Fine French lingerie — silk charmeuse and Calais lace — draped over an antique chair edge and vintage perfume bottles on dressing table. Candle softly lit, warm sensual atmosphere, beautiful and tasteful. 8K cinematic.`,
  },
  {
    key: 'style_artisanat',
    name: 'Artisanat',
    prompt: `Editorial fashion photography for "Artisanat" maker style concept. Sunlit atelier workshop, rough wooden workbench. Hands of a female artisan mid-work — casting molten metal into geometric mold, tools and metal shavings surrounding. Raw materials: hammered brass, oxidized silver, wax casting blocks. Warm tungsten overhead light, honest craft beauty. 8K.`,
  },
  {
    key: 'style_cottagecore',
    name: 'Cottagecore',
    prompt: `Editorial fashion photography for "Cottagecore" style concept. Sun-dappled English garden, late morning soft light through apple tree canopy. White organic linen dress with hand-embroidered botanical flowers laid on wildflower meadow alongside pressed fern specimens, elderflower bunches, wicker basket. Dreamy pastoral atmosphere, gentle naturalistic beauty. 8K.`,
  },
  {
    key: 'style_techwear',
    name: 'Techwear',
    prompt: `Editorial fashion photography for "Techwear" style concept. Futuristic brutalist overpass at blue hour, dramatic city lights. Modular black technical outerwear — YKK zippers, sealed seams, multiple utility pockets — hanging on industrial scaffold with precision. Misty rain droplets on waterproof ripstop. Cinematic cold blue-grey palette, technical precision aesthetic. 8K.`,
  },
  {
    key: 'style_romantique',
    name: 'Romantique',
    prompt: `Editorial fashion photography for "Romantique" style concept. Wild rose garden at golden hour, dappled warm light through climbing roses. Flowing botanical-print silk midi dress and velvet evening gown draped over moss-covered stone bench. Fresh roses, dried lavender, illustrated sketchbook open. Ethereal romantic atmosphere, painterly beauty. 8K.`,
  },
];

const MINI_CREATORS_CFG: MiniCreatorConfig[] = (miniCreatorsData as MiniCreatorJson[]).map(c => ({
  ...c,
  products: c.products.map(p => ({
    name: p.name,
    category: p.category,
    heroPrompt: (colorName: string, _color: string) => p.heroTemplate.replace('{color}', toEn(colorName)),
    detailPrompt: (colorName: string, _color: string) => p.detailTemplate.replace('{color}', toEn(colorName)),
  })),
}));


function generateMiniSpecs(): MiniItem[] {
  const items: MiniItem[] = [];

  // 0. Style images (6 × 1 image = 6 images) — 768×512 landscape editorial
  for (const style of MINI_STYLES_CFG) {
    items.push({
      key: style.key,
      type: 'style',
      imageCount: 1,
      width: 768,
      height: 512,
      prompts: [style.prompt],
      displayName: `Style — ${style.name}`,
    });
  }

  for (const c of MINI_CREATORS_CFG) {
    // 1. Profile portrait (512×512)
    items.push({
      key: `profile_${c.id}`,
      type: 'profile',
      imageCount: 1,
      width: 512,
      height: 512,
      prompts: [c.portraitPrompt],
      displayName: `${c.name} — portrait`,
    });

    // 2. Brand banner (1024×512)
    items.push({
      key: `banner_${c.id}`,
      type: 'banner',
      imageCount: 1,
      width: 1024,
      height: 512,
      prompts: [c.bannerPrompt],
      displayName: `${c.name} — bannière`,
    });

    // 3. Collections : cover + variants produit
    for (let colIdx = 0; colIdx < c.collections.length; colIdx++) {
      const collection = c.collections[colIdx]!;

      // Cover (768×512)
      items.push({
        key: `cover_${c.id}_${colIdx}`,
        type: 'cover',
        imageCount: 1,
        width: 768,
        height: 512,
        prompts: [collection.coverPrompt],
        displayName: `${c.name} — "${collection.name}" cover`,
      });

      // Variantes produit (512×512, 2 prompts distincts hero+detail)
      for (let prodIdx = 0; prodIdx < c.products.length; prodIdx++) {
        const prod = c.products[prodIdx]!;
        for (let colorIdx = 0; colorIdx < c.colors.length; colorIdx++) {
          const clr = c.colors[colorIdx]!;
          items.push({
            key: `var_${c.id}_${colIdx}_${prodIdx}_${colorIdx}`,
            type: 'variant',
            imageCount: 2,
            width: 512,
            height: 512,
            prompts: [
              prod.heroPrompt(clr.name, clr.code),
              prod.detailPrompt(clr.name, clr.code),
            ],
            displayName: `${c.name} — ${prod.name} ${clr.name}`,
          });
        }
      }
    }
  }

  return items;
}

async function processMiniItem(
  item: MiniItem,
  checkpoint: Checkpoint,
  hfToken: string,
  displayIndex: number,
  total: number,
): Promise<'ok' | 'error'> {
  const imageUrls: string[] = [];

  for (let imgIdx = 0; imgIdx < item.imageCount; imgIdx++) {
    process.stdout.write(
      `[${displayIndex}/${total}] ${item.displayName}${item.imageCount > 1 ? ` (img ${imgIdx + 1}/${item.imageCount})` : ''}... `,
    );

    try {
      const prompt = (item.prompts[imgIdx] ?? item.prompts[0]!).slice(0, 700);
      const imageBuffer = await generateImageWithRetry(
        prompt,
        hfToken,
        item.key,
        { width: item.width, height: item.height },
      );
      const uploadedUrl = await uploadImageToCloudinary(imageBuffer, item.key, imgIdx + 1);

      imageUrls.push(uploadedUrl);
      checkpoint.completedImages++;
      saveCheckpoint(MINI_CHECKPOINT_PATH, checkpoint);
      console.log('✅');
    } catch (err) {
      const error = err as Error & { isFatal?: boolean };
      if (error.isFatal === true) throw error;
      const message = error.message || String(err);
      console.log(`❌ ${message.slice(0, 80)}`);
      checkpoint.failedImages++;
      saveCheckpoint(MINI_CHECKPOINT_PATH, checkpoint);
      return 'error';
    }

    if (imgIdx < item.imageCount - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  if (imageUrls.length > 0) {
    checkpoint.images[item.key] = {
      images: imageUrls,
      completedAt: new Date().toISOString(),
    };
    saveCheckpoint(MINI_CHECKPOINT_PATH, checkpoint);
  }

  return 'ok';
}

async function runMiniGeneration(): Promise<void> {
  const hfToken = process.env.HF_TOKEN!;
  const allItems = generateMiniSpecs();
  const checkpoint = loadCheckpoint(MINI_CHECKPOINT_PATH, 570);

  const pending = allItems.filter((item) => !(item.key in checkpoint.images));
  const pendingImageCount = pending.reduce((s, i) => s + i.imageCount, 0);
  const estimatedHours = ((pendingImageCount * DELAY_BETWEEN_REQUESTS_MS) / 3_600_000).toFixed(1);

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  GÉNÉRATION MINI — FLUX.1-schnell             ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`Modèle:              ${HF_MODEL} (free tier)`);
  console.log(`Items totaux:        ${allItems.length} (6 styles + 6 profils + 6 bannières + 18 covers + 270 variants)`);
  console.log(`Images totales:      576`);
  console.log(`Items restants:      ${pending.length}`);
  console.log(`Images restantes:    ${pendingImageCount}`);
  console.log(`Délai entre req:     ${DELAY_BETWEEN_REQUESTS_MS}ms`);
  console.log(`Estimation:          ~${estimatedHours}h`);
  console.log('');

  if (pending.length === 0) {
    console.log('✅ Toutes les images mini ont déjà été générées !');
    console.log('   Relancer le seed : bun prisma/seed-mini.ts');
    return;
  }

  let processedCount = 0;

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i]!;
    const globalIndex = allItems.indexOf(item) + 1;

    await processMiniItem(item, checkpoint, hfToken, globalIndex, allItems.length);
    processedCount++;

    if (i < pending.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║    RÉSUMÉ SESSION MINI                       ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`Items traités:          ${processedCount}`);
  console.log(`Images complétées:      ${checkpoint.completedImages}/570`);
  console.log(`Images échouées:        ${checkpoint.failedImages}`);
  console.log(`Checkpoint:             ${MINI_CHECKPOINT_PATH}`);
  console.log('');

  if (checkpoint.completedImages >= 570) {
    console.log('🎉 Génération mini complète ! Lancez le seed :');
    console.log('   bun prisma/seed-mini.ts');
  } else {
    console.log('💡 Relancez pour continuer : bun prisma/scripts/generate-images-gemini.ts --mini');
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isStatus = args.includes('--status');
  const isReset = args.includes('--reset');
  const isResetMini = args.includes('--reset-mini');
  const isMini = args.includes('--mini');

  if (isReset) {
    resetCheckpoint();
    return;
  }

  if (isResetMini) {
    resetMiniCheckpoint();
    return;
  }

  if (isMini) {
    validateEnvironment();
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    await runMiniGeneration();
    return;
  }

  const specs = loadGenerationSpecs();

  if (isStatus) {
    const totalImages = computeTotalImages(specs);
    const checkpoint = loadCheckpoint(CHECKPOINT_PATH, totalImages);
    displayStatus(checkpoint, specs.length);
    return;
  }

  validateEnvironment();

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  await runGeneration(specs);
}

try {
  await main();
} catch (err) {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
}
