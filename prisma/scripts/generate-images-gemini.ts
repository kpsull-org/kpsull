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

const MINI_CREATORS_CFG: MiniCreatorConfig[] = [
  // ─── 1. HUGO TESSIER — Streetwear déconstruit post-industriel ───────────────
  {
    id: 'hugo_tessier',
    name: 'Hugo Tessier',
    brand: 'Hugo Tessier Studio',
    portraitPrompt: `Portrait of Hugo Tessier, French male fashion designer. Post-industrial concrete studio, dramatic chiaroscuro side lighting, raw textured walls. Wears deconstructed oversized jacket with exposed seams and raw hem trousers. Intense focused gaze, artist confidence. High-contrast editorial photography, 8K.`,
    bannerPrompt: `Brand editorial banner for Hugo Tessier Studio. Industrial warehouse space, concrete floors, deconstructed black garments draped over rusted steel girders. Chiaroscuro lighting, deep architectural shadows, raw material textures. Post-industrial fashion atmosphere. No text, wide cinematic format, 8K.`,
    collections: [
      {
        name: 'Void',
        coverPrompt: `Fashion collection editorial "Void" by Hugo Tessier Studio. All-black deconstructed garments on pure black concrete floor, single dramatic spotlight. Void aesthetic, architectural negative space composition. Raw edges. No text, 8K.`,
      },
      {
        name: 'Industrial',
        coverPrompt: `Collection "Industrial" by Hugo Tessier Studio. Khaki and rust deconstructed pieces with metal hardware on rusted corrugated iron surface. Harsh overhead industrial light, deep texture shadows, utilitarian rawness. No text, 8K.`,
      },
      {
        name: 'Ghost',
        coverPrompt: `Collection "Ghost" by Hugo Tessier Studio. Bleached and undyed deconstructed garments, ash-white spectral tones, on foggy white concrete. Diffused atmospheric light, deliberate spectral deconstruction, ethereal. No text, 8K.`,
      },
    ],
    products: [
      {
        name: 'Veste déconstruite',
        category: 'veste_blouson',
        heroPrompt: (colorName, _color) => `FRONT VIEW, full garment shot. Deconstructed asymmetric canvas jacket in ${toEn(colorName)}, hanging on industrial hook. Raw unhemmed edges, asymmetric lapels, exposed interior seams, metal grommets. Hard sidelight, concrete background. Hugo Tessier Studio. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, rear product shot. Deconstructed jacket back in ${toEn(colorName)} heavy canvas. Raw unhemmed back hem, visible interior seam allowances, asymmetric back panel construction. Industrial raking light, concrete. Hugo Tessier Studio. 8K.`,
      },
      {
        name: 'Cargo déconstruit',
        category: 'pantalon',
        heroPrompt: (colorName, _color) => `FRONT VIEW, full silhouette. Raw-hem cargo trousers in ${toEn(colorName)} ripstop cotton, ghost mannequin. Oversized asymmetric patch pockets front, raw waistband seaming, deconstructed fly. Hard industrial directional light. Hugo Tessier Studio. 8K.`,
        detailPrompt: (colorName, _color) => `MACRO DETAIL. Cargo pocket surface in ${toEn(colorName)} cotton ripstop. Raw unhemmed pocket edge showing weave, visible tack stitching, worn canvas texture. Raking macro industrial light. Hugo Tessier Studio. 8K.`,
      },
      {
        name: 'Hoodie déstructuré',
        category: 'hoodie',
        heroPrompt: (colorName, _color) => `FRONT VIEW, overhead flat lay. Deconstructed oversized hoodie in ${toEn(colorName)} French terry on raw concrete floor. Dropped asymmetric shoulders, raw-cut hood, elongated hem. Top-down directional light. Hugo Tessier Studio. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, flat lay rear. Hoodie back in ${toEn(colorName)} French terry on concrete. Asymmetric dropped back seam, exposed raw hood edge rear, two-layer fleece cross-section. Raking macro light. Hugo Tessier Studio. 8K.`,
      },
      {
        name: 'Crewneck architectural',
        category: 'hoodie',
        heroPrompt: (colorName, _color) => `FRONT VIEW, worn torso shot. Architectural oversized crewneck in ${toEn(colorName)} midweight cotton, male model neck to waist only. Deep front pleat construction, extended elongated hem, boxy dropped shoulder front. Natural post-industrial light. Hugo Tessier Studio. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, worn torso rear. Crewneck back in ${toEn(colorName)} sweat jersey, male model neck to waist. Rear asymmetric seam construction, elongated back hem drop, ribbed cuff rear detail. Directional light. Hugo Tessier Studio. 8K.`,
      },
      {
        name: 'Veste coach utilitaire',
        category: 'veste_blouson',
        heroPrompt: (colorName, _color) => `FRONT VIEW, flat lay. Utility coach jacket in ${toEn(colorName)} nylon-cotton twill, snaps open showing interior. Multiple utility pockets front, raw edges, woven brand label at chest. Hard overhead industrial light. Hugo Tessier Studio. 8K.`,
        detailPrompt: (colorName, _color) => `MACRO DETAIL. Coach jacket snap and pocket in ${toEn(colorName)} twill. Metal snap button mechanism close-up, welt pocket raw edge construction layers, woven label texture. Industrial macro. Hugo Tessier Studio. 8K.`,
      },
    ],
    colors: [
      { name: 'Noir', code: '#1a1a1a' },
      { name: 'Blanc cassé', code: '#f0ede8' },
      { name: 'Kaki ardoise', code: '#6b7355' },
    ],
  },

  // ─── 2. NADIA FORTE — Lingerie boudoir artisan ──────────────────────────────
  {
    id: 'nadia_forte',
    name: 'Nadia Forte',
    brand: 'Forte Lingerie',
    portraitPrompt: `Portrait of Nadia Forte, French female lingerie designer. Elegant boudoir studio, warm amber ambient light, antique silk draped in background. Refined ivory blouse and delicate gold chain. Calm artisan confidence, precise and gentle. Soft editorial photography, 8K.`,
    bannerPrompt: `Brand banner for Forte Lingerie. Intimate boudoir still life: Calais needle-lace fabric draped on warm Carrara marble, single fresh rose petal, antique perfume bottle, warm amber light. Artisan lingerie brand identity. No text, wide horizontal, 8K.`,
    collections: [
      {
        name: 'Dentelle Héritage',
        coverPrompt: `Collection "Dentelle Héritage" by Forte Lingerie. Black Calais needle-lace arranged on antique silk, intricate lace medallion pattern in warm directional light. Heritage boudoir aesthetic, heirloom craft. No text, 8K.`,
      },
      {
        name: 'Soie Nue',
        coverPrompt: `Collection "Soie Nue" by Forte Lingerie. Nude silk charmeuse draped in soft natural daylight on white marble, second-skin sheen and bias movement. Single dried rose. Minimal, intimate, pure elegance. No text, 8K.`,
      },
      {
        name: 'Velours Rouge',
        coverPrompt: `Collection "Velours Rouge" by Forte Lingerie. Burgundy velvet draped dramatically over marble, deep jewel tones, pile texture revealing direction in raking candlelight. Opulent boudoir atmosphere. No text, 8K.`,
      },
    ],
    products: [
      {
        name: 'Body dentelle',
        category: 'lingerie',
        heroPrompt: (colorName, _color) => `FRONT VIEW, flat lay boudoir. Artisan lace body in ${toEn(colorName)} on ivory silk. Intricate needle-lace front pattern, scalloped hem, snap crotch visible. Soft warm light from above. Forte Lingerie. Tasteful. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, flat lay rear boudoir. Lace body back in ${toEn(colorName)} on ivory silk. Rear snap crotch closure, back seam lace construction, scalloped back hem. Warm candlelight macro. Forte Lingerie. 8K.`,
      },
      {
        name: 'Soutien-gorge balconnet',
        category: 'lingerie',
        heroPrompt: (colorName, _color) => `FRONT VIEW, worn torso. Balconnet bra in ${toEn(colorName)} on female model torso, tasteful boudoir. Half-cup front structure, delicate straps, satin bow at center front. Warm amber side light. Forte Lingerie. Tasteful. 8K.`,
        detailPrompt: (colorName, _color) => `MACRO DETAIL, close-up. Balconnet bra front detail in ${toEn(colorName)}: underwire cup stitching, satin bow trim, strap-to-cup hardware, fine picot elastic edge. Warm boudoir macro. Forte Lingerie. 8K.`,
      },
      {
        name: 'Culotte taille haute',
        category: 'lingerie',
        heroPrompt: (colorName, _color) => `FRONT VIEW, marble flat lay. High-waist lingerie brief in ${toEn(colorName)} on warm Carrara marble. Smooth jersey front panel, lace waistband insert front, French-cut leg lace trim. Soft boudoir light. Forte Lingerie. Tasteful. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, marble flat lay rear. High-waist brief back in ${toEn(colorName)} on marble. Full lace back panel, scalloped rear hem, picot elastic leg edge rear. Warm boudoir macro. Forte Lingerie. 8K.`,
      },
      {
        name: 'Nuisette',
        category: 'lingerie',
        heroPrompt: (colorName, _color) => `FRONT VIEW, hanging on hanger. Silk charmeuse nuisette in ${toEn(colorName)} on antique silver satin hanger. Bias-cut front silhouette, lace bodice insert front, thin spaghetti straps. Romantic backlight showing sheer quality. Forte Lingerie. Tasteful. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, hanging rear. Nuisette back in ${toEn(colorName)} silk charmeuse on hanger. Lace back panel, bias-cut back drape, thin strap rear, adjustable clasp hardware. Warm candlelight. Forte Lingerie. 8K.`,
      },
      {
        name: 'Ensemble 2 pièces',
        category: 'lingerie',
        heroPrompt: (colorName, _color) => `FRONT VIEW, flat lay boudoir. Matching lingerie set in ${toEn(colorName)}: bralette above and high-waist brief below on ivory silk. Coordinated Calais lace trim front, matching bow hardware. Soft warm overhead light. Forte Lingerie. Tasteful. 8K.`,
        detailPrompt: (colorName, _color) => `MACRO DETAIL. Lingerie set lace detail in ${toEn(colorName)}: matching needle-lace pattern on bralette cup and brief waistband edge side by side. Bow and elastic trim. Warm boudoir macro. Forte Lingerie. 8K.`,
      },
    ],
    colors: [
      { name: 'Noir', code: '#1a1a1a' },
      { name: 'Ivoire', code: '#FFFFF0' },
      { name: 'Rose nude', code: '#E8B4A0' },
    ],
  },

  // ─── 3. YASMINE LARBI — Bijoux géo-culturel ────────────────────────────────
  {
    id: 'yasmine_larbi',
    name: 'Yasmine Larbi',
    brand: 'Yasmine Bijoux',
    portraitPrompt: `Portrait of Yasmine Larbi, French-Algerian female jewelry designer. Clean white atelier, natural soft sidelight. Wears her own layered geometric gold necklaces and wide sculptural cuff bracelet. Serene artisan precision, creative confidence. Editorial portrait, 8K.`,
    bannerPrompt: `Brand banner for Yasmine Bijoux. Geometric gold and bronze jewelry pieces on white Carrara marble, casting precise geometric shadow patterns. Zellij mosaic tile reference in composition. Contemporary artisan jewelry identity. No text, wide horizontal, 8K.`,
    collections: [
      {
        name: 'Zellige',
        coverPrompt: `Collection "Zellige" by Yasmine Bijoux. Gold metal geometric jewelry arranged in deliberate zellij mosaic pattern on white marble. Warm dramatic raking light revealing metal facets and hand-stamped textures. No text, 8K.`,
      },
      {
        name: 'Touareg',
        coverPrompt: `Collection "Touareg" by Yasmine Bijoux. Oxidized silver jewelry with protective cross and compass-rose motifs on dark desert-sand stone. Atmospheric North African cultural reference, moody directional light. No text, 8K.`,
      },
      {
        name: 'Nuit de Blida',
        coverPrompt: `Collection "Nuit de Blida" by Yasmine Bijoux. Dark bronze jewelry with crescent and star forms on deep midnight blue velvet. Night sky atmosphere, low key dramatic light. Romantic cultural poetry. No text, 8K.`,
      },
    ],
    products: [
      {
        name: 'Collier architecture',
        category: 'bijoux',
        heroPrompt: (colorName, _color) => `FRONT VIEW, flat lay jewelry. Architectural statement necklace in ${toEn(colorName)} cast metal on white Carrara marble. Large geometric pendant front face, zellij-inspired facets, hand-stamped surface, adjustable chain. Multi-point jewelry lighting. Yasmine Bijoux. 8K.`,
        detailPrompt: (colorName, _color) => `MACRO DETAIL, pendant reverse. Necklace pendant back in ${toEn(colorName)} cast metal. Rear bail attachment, hand-stamped back surface, chain-to-bail soldering, patina texture depth. Raking macro jewelry light. Yasmine Bijoux. 8K.`,
      },
      {
        name: 'Boucles asymétriques',
        category: 'bijoux',
        heroPrompt: (colorName, _color) => `FRONT VIEW, worn portrait. Asymmetric statement earrings in ${toEn(colorName)} cast metal, female model ear and jaw close-up. Different geometric drop form per ear, hand-stamped front surface. Soft directional studio light. Yasmine Bijoux. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, velvet display. Earring pair rear in ${toEn(colorName)} cast metal on dark velvet. Both ear post attachments visible, back surface texture, fastening clasps detail. Macro jewelry light. Yasmine Bijoux. 8K.`,
      },
      {
        name: 'Bracelet manchette',
        category: 'bijoux',
        heroPrompt: (colorName, _color) => `FRONT VIEW, worn wrist. Wide cuff bracelet in ${toEn(colorName)} metal on female wrist and forearm. Full front face of hand-stamped geometric pattern across surface, open-back form visible at sides. Raking sidelight. Yasmine Bijoux. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW / INTERIOR. Cuff bracelet interior and open edge in ${toEn(colorName)} metal. Interior curve surface texture, open-back edge construction profile, hammered background. Extreme raking macro light. Yasmine Bijoux. 8K.`,
      },
      {
        name: 'Bague sculptée',
        category: 'bijoux',
        heroPrompt: (colorName, _color) => `FRONT VIEW, flat lay jewelry. Sculptural wide-band ring in ${toEn(colorName)} cast metal on black velvet display. Geometric zellij-inspired faceted front surface, architectural band. Precision multi-point jewelry lighting. Yasmine Bijoux. 8K.`,
        detailPrompt: (colorName, _color) => `MACRO DETAIL, interior view. Ring interior and side profile in ${toEn(colorName)} cast metal. Interior comfort-fit curve surface, hand-filed edge profile, band thickness cross-section. Multi-light macro. Yasmine Bijoux. 8K.`,
      },
      {
        name: 'Parure complète',
        category: 'bijoux',
        heroPrompt: (colorName, _color) => `FRONT VIEW, editorial flat lay. Complete jewelry parure in ${toEn(colorName)}: statement necklace, asymmetric earrings, wide cuff bracelet, sculptural ring arranged on white marble. Dramatic raking light showing all textures. Yasmine Bijoux. 8K.`,
        detailPrompt: (colorName, _color) => `MACRO DETAIL, cluster. Parure detail in ${toEn(colorName)}: necklace pendant, bracelet surface, ring band clustered together showing scale relationships and consistent geometric hand-stamped vocabulary. Yasmine Bijoux. 8K.`,
      },
    ],
    colors: [
      { name: 'Or', code: '#C8A951' },
      { name: 'Argent oxydé', code: '#8C8C8C' },
      { name: 'Bronze', code: '#8B5E3C' },
    ],
  },

  // ─── 4. MARIE DURAND — Bébé & Enfant artisanal ─────────────────────────────
  {
    id: 'marie_durand',
    name: 'Marie Durand',
    brand: 'Petit Atelier Marie',
    portraitPrompt: `Portrait of Marie Durand, French female children's clothing designer. Warm natural-light atelier, undyed linen backdrop, wooden toys and fabric swatches as props. Simple organic cotton blouse. Warm maternal creative energy. Soft artisan editorial portrait, 8K.`,
    bannerPrompt: `Brand banner for Petit Atelier Marie Durand. Aerial flat lay of tiny handmade children's garments on natural undyed linen: white onesie, knitted booties, smocked dress. Embroidery hoop with flower motif in progress, wooden buttons, organic cotton thread spools. Warm window light. No text, 8K.`,
    collections: [
      {
        name: 'Premiers Pas',
        coverPrompt: `Collection "Premiers Pas" by Petit Atelier Marie Durand. Baby garments in pure white and ecru organic cotton on undyed linen: onesie, knitted cardigan, soft booties. Single dried chamomile flower. Warm natural window light. Pure and gentle. No text, 8K.`,
      },
      {
        name: 'Grandir Doucement',
        coverPrompt: `Collection "Grandir Doucement" by Petit Atelier Marie Durand. Children's garments in warm earth tones - camel, sage green, terracotta - with wooden toys and autumn leaves on linen. Warm natural light. Playful and refined. No text, 8K.`,
      },
      {
        name: 'Dimanche Matin',
        coverPrompt: `Collection "Dimanche Matin" by Petit Atelier Marie Durand. Special occasion children's garments in fine white linen with broderie anglaise, arranged with fresh lily-of-the-valley. Soft Sunday-morning light. Tender and celebratory. No text, 8K.`,
      },
    ],
    products: [
      {
        name: 'Barboteuse brodée',
        category: 'tshirt',
        heroPrompt: (colorName, _color) => `FRONT VIEW, flat lay natural. Baby onesie barboteuse in ${toEn(colorName)} GOTS organic cotton on undyed linen. Hand-embroidered botanical flower on chest front, pearl snap shoulder closures. Warm natural window daylight overhead. Petit Atelier Durand. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, flat lay rear. Baby onesie back in ${toEn(colorName)} organic cotton on linen. Rear snap shoulder closure, back yoke seaming, organic fabric texture rear. Natural light macro, warm tones. Petit Atelier Durand. 8K.`,
      },
      {
        name: 'Cardigan bébé',
        category: 'pull_knitwear',
        heroPrompt: (colorName, _color) => `FRONT VIEW, flat lay. Hand-knitted baby cardigan in ${toEn(colorName)} organic merino wool on cotton muslin. 2x2 rib button band front, small round collar, three carved wooden buttons. Soft natural overhead daylight. Petit Atelier Durand. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, flat lay rear. Baby cardigan back in ${toEn(colorName)} organic merino on muslin. Seamless knit back panel, ribbed back collar edge, knit stitch pattern rear, cuff detail. Warm natural light macro. Petit Atelier Durand. 8K.`,
      },
      {
        name: 'Robe enfant smockée',
        category: 'robe',
        heroPrompt: (colorName, _color) => `FRONT VIEW, dress form. Hand-smocked child's dress in ${toEn(colorName)} cotton voile on children's dress form. Honeycomb smocking bodice front, Peter Pan collar, puff sleeves front. Soft natural studio light. Petit Atelier Durand. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, dress form rear. Smocked dress back in ${toEn(colorName)} cotton voile on form. Rear button closure at back neck, back bodice gathering, puff sleeve rear construction. Natural light. Petit Atelier Durand. 8K.`,
      },
      {
        name: 'Salopette enfant',
        category: 'pantalon',
        heroPrompt: (colorName, _color) => `FRONT VIEW, flat lay. Child's dungarees in ${toEn(colorName)} organic cotton canvas on linen. Front bib with hand-embroidered sun motif, brass button adjustable straps, deep side pockets front. Warm natural light. Petit Atelier Durand. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, flat lay rear. Dungarees rear in ${toEn(colorName)} cotton canvas on linen. Back bib strap attachment, reinforced knee seat area, back pocket, strap buckle rear. Natural light macro. Petit Atelier Durand. 8K.`,
      },
      {
        name: 'Veste réversible',
        category: 'veste_blouson',
        heroPrompt: (colorName, _color) => `FRONT VIEW, flat lay. Reversible child's jacket in ${toEn(colorName)} outer with botanical-print inner, half-turned to reveal both fabric sides simultaneously. Snap closures front, spread collar. Soft natural light. Petit Atelier Durand. 8K.`,
        detailPrompt: (colorName, _color) => `MACRO DETAIL. Reversible jacket edge binding in ${toEn(colorName)}: solid outer and botanical-print inner fabric visible simultaneously at folded edge, snap button mechanism, collar seam quality. Natural light macro. Petit Atelier Durand. 8K.`,
      },
    ],
    colors: [
      { name: 'Blanc naturel', code: '#FAF7F2' },
      { name: 'Caramel doux', code: '#C8956C' },
      { name: 'Vert sauge', code: '#8FA88A' },
    ],
  },

  // ─── 5. LOUIS RENARD — Techwear modulaire futuriste ────────────────────────
  {
    id: 'louis_renard',
    name: 'Louis Renard',
    brand: 'Renard Outerwear',
    portraitPrompt: `Portrait of Louis Renard, French male techwear outerwear designer. Minimalist clinical white studio, precise flat panel lighting. Wears his own modular technical jacket: multiple sealed pockets, YKK zipper systems, hardware details. Analytical engineering mindset. Sharp editorial photography, 8K.`,
    bannerPrompt: `Brand editorial banner for Renard Outerwear. Technical flat lay on white grid paper: modular jacket components separated, YKK zipper samples, waxed canvas swatch, taped seam cross-section. Engineering blueprint meets fashion. No text, wide horizontal, 8K.`,
    collections: [
      {
        name: 'System_01',
        coverPrompt: `Collection "System_01" by Renard Outerwear. All-black technical garments with military precision on white grid surface, modular pocket systems open showing internal organization. Stealth techwear engineering aesthetic. No text, 8K.`,
      },
      {
        name: 'Terroir',
        coverPrompt: `Collection "Terroir" by Renard Outerwear. Waxed canvas garments in earth tones - olive, dark ochre, bark brown - on raw weathered oak surface. Waxed fabric sheen, technical seams, functional heritage craft. No text, 8K.`,
      },
      {
        name: 'Surplus',
        coverPrompt: `Collection "Surplus" by Renard Outerwear. Military surplus-inspired garments in field olive, rust oxide, sand arranged with precision on distressed concrete. Utilitarian reinterpretation, technical detail focus. No text, 8K.`,
      },
    ],
    products: [
      {
        name: 'Parka modulaire',
        category: 'manteau',
        heroPrompt: (colorName, _color) => `FRONT VIEW, ghost mannequin. Modular technical parka in ${toEn(colorName)} ripstop nylon, full front silhouette. Zip-off hood attached, six sealed YKK zipper pockets front, articulated sleeve, taped waterproof seams visible. Precision studio light. Renard Outerwear. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, ghost mannequin rear. Technical parka back in ${toEn(colorName)} ripstop. Rear hood zip attachment, back seam taping, articulated rear sleeve panel, taped back hem construction. Engineering macro. Renard Outerwear. 8K.`,
      },
      {
        name: 'Manteau architecturale',
        category: 'manteau',
        heroPrompt: (colorName, _color) => `FRONT VIEW, worn torso. Architectural structured overcoat in ${toEn(colorName)} heavy wool-nylon on male model shoulders to mid-thigh. Exaggerated dropped shoulders, geometric hem, concealed magnetic snap placket closed, lapels. Clean editorial light. Renard Outerwear. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, worn torso rear. Overcoat back in ${toEn(colorName)} wool blend, male model. Back seam precision stitching, rear dropped shoulder seam, geometric back hem. Clean editorial light rear. Renard Outerwear. 8K.`,
      },
      {
        name: 'Veste matelassée',
        category: 'veste_blouson',
        heroPrompt: (colorName, _color) => `FRONT VIEW, flat lay on grid. Technical quilted vest in ${toEn(colorName)} ripstop nylon on white grid paper. Engineered baffle channel quilting front, three sealed zipper pockets front, technical collar with cinch. Sharp overhead light. Renard Outerwear. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, flat lay rear. Quilted vest rear in ${toEn(colorName)} ripstop nylon on grid paper. Back baffle channel quilting pattern, rear zipper pocket, cinch cord at back hem. Technical overhead light. Renard Outerwear. 8K.`,
      },
      {
        name: 'Trench technique',
        category: 'manteau',
        heroPrompt: (colorName, _color) => `FRONT VIEW, hanging on hook. Technical trench coat in ${toEn(colorName)} waxed cotton-nylon. Traditional silhouette front: double-breasted storm flap, button placket, belt tied, sealed utility pocket flaps. Dramatic side light. Renard Outerwear. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, hanging rear. Technical trench back in ${toEn(colorName)} waxed fabric. Back vent construction, rear belt attachment point, taped back seams, technical buckle cuffs from behind. Dramatic side light. Renard Outerwear. 8K.`,
      },
      {
        name: 'Blouson aviateur',
        category: 'veste_blouson',
        heroPrompt: (colorName, _color) => `FRONT VIEW, worn torso. Aviator bomber jacket in ${toEn(colorName)} technical nylon on male model shoulders to hips. Ribbed knit collar front, zip closed, oversized chest cargo pocket, MA-1 silhouette front. Natural editorial light. Renard Outerwear. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, worn torso rear. Bomber jacket rear in ${toEn(colorName)} technical nylon. Back panel construction, ribbed waistband rear, back seam and shoulder detail. Natural editorial light rear. Renard Outerwear. 8K.`,
      },
    ],
    colors: [
      { name: 'Noir technique', code: '#0D0D0D' },
      { name: 'Olive terrain', code: '#5A6340' },
      { name: 'Marine profond', code: '#0C1A2E' },
    ],
  },

  // ─── 6. CAMILLE PETIT — Romantique botanical prints ─────────────────────────
  {
    id: 'camille_petit',
    name: 'Camille Petit',
    brand: 'Studio Camille',
    portraitPrompt: `Portrait of Camille Petit, French female fashion designer and botanical illustrator. Sun-dappled atelier with botanical illustration boards, pressed flowers in frames, brushes and paint. Wears flowing silk dress in her own hand-illustrated botanical print. Romantic, warm, artistic. Natural light editorial, 8K.`,
    bannerPrompt: `Brand banner for Studio Camille. Flowing botanical-print silk draped over vintage Thonet chair, pressed dried botanicals arranged around it, open illustrated sketchbook showing print in progress. Warm afternoon light, romantic creative atelier. No text, wide horizontal, 8K.`,
    collections: [
      {
        name: 'Herbier',
        coverPrompt: `Collection "Herbier" by Studio Camille. Botanical-print silk garments in sage, ivory, moss tones with pressed fern specimens and botanical illustration pages on linen. Warm diffused natural light, ethereal artisan quality. No text, 8K.`,
      },
      {
        name: 'Valse',
        coverPrompt: `Collection "Valse" by Studio Camille. Deep jewel-tone garments - burgundy velvet, midnight silk, emerald voile - on dark marble with scattered rose petals and dried eucalyptus. Romantic theatrical editorial. No text, 8K.`,
      },
      {
        name: 'Plein Air',
        coverPrompt: `Collection "Plein Air" by Studio Camille. Liberty-cotton floral printed garments in warm rose and ivory on wooden garden table with fresh wildflowers. Playful, pastoral, everyday romantic mood. No text, 8K.`,
      },
    ],
    products: [
      {
        name: 'Robe midi botanique',
        category: 'robe',
        heroPrompt: (colorName, _color) => `FRONT VIEW, worn model. Botanical-print midi dress in ${toEn(colorName)} silk blend, female model collarbone to knee. Hand-illustrated botanical all-over print front, A-line silhouette, puff sleeves, self-fabric ribbon waist tied. Natural light. Studio Camille. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, worn model rear. Botanical dress back in ${toEn(colorName)} silk blend. Rear neckline closure, puff sleeve rear construction, A-line skirt back, botanical print rear view. Natural light. Studio Camille. 8K.`,
      },
      {
        name: 'Blouse romantique',
        category: 'tshirt',
        heroPrompt: (colorName, _color) => `FRONT VIEW, hanging on clear hanger. Romantic ruffle blouse in ${toEn(colorName)} silk georgette at window. Tiered cascade ruffles front, puffed sleeves, Victorian-inspired collar front. Backlit natural light showing transparency and movement. Studio Camille. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, hanging rear on hanger. Ruffle blouse back in ${toEn(colorName)} silk georgette. Rear button closure row, back collar attachment, puff sleeve rear, back ruffle cascade. Romantic natural backlight. Studio Camille. 8K.`,
      },
      {
        name: 'Jupe évasée imprimée',
        category: 'robe',
        heroPrompt: (colorName, _color) => `FRONT VIEW, overhead flat lay. Circular flared printed skirt in ${toEn(colorName)} with botanical print, full circular sweep at midi length from above. Hand-illustrated floral front, delicate waistband, small self-bow. Natural overhead light. Studio Camille. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, overhead flat lay rear. Printed skirt back in ${toEn(colorName)} from above: rear waistband, back seam, full circular back hem sweep, botanical print rear view. Natural overhead light. Studio Camille. 8K.`,
      },
      {
        name: 'Robe velours maxi',
        category: 'robe',
        heroPrompt: (colorName, _color) => `FRONT VIEW, worn model. Maxi velvet dress in ${toEn(colorName)} crushed silk-velvet, female model shoulders to ankles, 3/4 front angle. Empire waist satin ribbon, romantic bishop sleeves front, floor-length skirt front. Single directional raking light. Studio Camille. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, worn model rear. Velvet maxi dress rear in ${toEn(colorName)}. Back bodice construction, bishop sleeve rear gathered cuff, long rear skirt velvet pile crush texture. Directional raking light showing pile. Studio Camille. 8K.`,
      },
      {
        name: 'Robe portefeuille',
        category: 'robe',
        heroPrompt: (colorName, _color) => `FRONT VIEW, ghost mannequin. Floral wrap dress in ${toEn(colorName)} liberty-print cotton, front silhouette. Wrap overlap front with botanical print, self-tie belt, flutter sleeves front, midi flare. Natural light. Studio Camille. 8K.`,
        detailPrompt: (colorName, _color) => `BACK VIEW, ghost mannequin rear. Wrap dress rear in ${toEn(colorName)} liberty cotton. Back waist tie knot rear, flutter sleeve rear, back midi hem, botanical print rear full view. Natural light. Studio Camille. 8K.`,
      },
    ],
    colors: [
      { name: 'Rose poudré', code: '#E8C4BC' },
      { name: 'Ivoire', code: '#F8F4E8' },
      { name: 'Bordeaux profond', code: '#6B1E2E' },
    ],
  },
];

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
