/**
 * Script de génération d'images seed avec upload Cloudinary
 *
 * Usage:
 *   bun prisma/scripts/upload-seed-images.ts
 *
 * Modes:
 *   - Mode Gemini  : si GOOGLE_AI_API_KEY est présent → génère des images via Imagen 3 Fast
 *   - Mode Unsplash: fallback → télécharge des images Unsplash préconfigurées
 *
 * Résultat: prisma/seed-assets/product-images.json
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config({ path: '.env.local' });

// ─── Cloudinary setup ────────────────────────────────────────────────────────
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductImageEntry {
  main: string[];
  variants: Record<string, string[]>;
}

interface SeedImagesOutput {
  [productId: string]: ProductImageEntry;
}

interface ImageSpec {
  productId: string;
  variantId: string | null;
  label: string;
  unsplashId: string;
  prompt: string;
}

// ─── Catalogue d'images à générer ────────────────────────────────────────────
// Unsplash IDs curatés par catégorie/couleur.
// Format: https://images.unsplash.com/photo-{id}?w=800&h=800&fit=crop

const IMAGE_SPECS: ImageSpec[] = [
  // ── T-Shirt Basique Premium ────────────────────────────────────────────────
  { productId: 'prod_new_tshirt_basique', variantId: null,                    label: 'tshirt-main-1',         unsplashId: '1521572163474-6864f9cf17ab', prompt: 'premium white t-shirt product photo, clean white background, folded neatly' },
  { productId: 'prod_new_tshirt_basique', variantId: null,                    label: 'tshirt-main-2',         unsplashId: '1503341338985-95661e5a8f6e', prompt: 'premium cotton t-shirt flat lay, white background, minimalist style' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_blanc',  label: 'tshirt-blanc-1',        unsplashId: '1581655353564-df123364d42e', prompt: 'white premium t-shirt on white background, professional product photo' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_blanc',  label: 'tshirt-blanc-2',        unsplashId: '1618354691438-25bc04584c23', prompt: 'white cotton t-shirt hanging on rack, clean studio lighting' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_noir',   label: 'tshirt-noir-1',         unsplashId: '1576566588028-4147f3842f27', prompt: 'black premium t-shirt product photo, white background, front view' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_noir',   label: 'tshirt-noir-2',         unsplashId: '1559136555-9303baea8eae', prompt: 'black cotton t-shirt flat lay, minimalist white background' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_marine', label: 'tshirt-marine-1',       unsplashId: '1529374255-1e9231d7a1a4', prompt: 'navy blue t-shirt product photo, white background, professional' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_rouge',  label: 'tshirt-rouge-1',        unsplashId: '1542291026-7eec264c27ff', prompt: 'red t-shirt product photo, white background, fashion photography' },

  // ── Hoodie Premium Oversize ────────────────────────────────────────────────
  { productId: 'prod_new_hoodie_premium', variantId: null,                     label: 'hoodie-main-1',         unsplashId: '1556821840-3a63f15732ce', prompt: 'oversized hoodie product photo, white background, premium quality' },
  { productId: 'prod_new_hoodie_premium', variantId: null,                     label: 'hoodie-main-2',         unsplashId: '1578587018452-892bacefd3f2', prompt: 'hoodie back view product photo, white background, streetwear style' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_noir',    label: 'hoodie-noir-1',         unsplashId: '1509347528160-9a9e33742cdb', prompt: 'black oversized hoodie product photo, clean white background' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_noir',    label: 'hoodie-noir-2',         unsplashId: '1516478177764-9fe5bd7e9717', prompt: 'black hoodie detail shot, hood and drawstring, white background' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_blanc',   label: 'hoodie-blanc-1',        unsplashId: '1572635196237-14b3f281503f', prompt: 'white oversized hoodie product photo, white background, streetwear' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_ecru',    label: 'hoodie-ecru-1',         unsplashId: '1509631179647-0177331693ae', prompt: 'ecru cream hoodie product photo, white background, premium cotton' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_kaki',    label: 'hoodie-kaki-1',         unsplashId: '1591047139829-d91aecb6caea', prompt: 'khaki olive hoodie product photo, white background, streetwear fashion' },

  // ── Jogger Technique ──────────────────────────────────────────────────────
  { productId: 'prod_new_jogger_tech',   variantId: null,                      label: 'jogger-main-1',         unsplashId: '1571945153237-4929e783af4a', prompt: 'technical jogger pants product photo, white background, sportswear' },
  { productId: 'prod_new_jogger_tech',   variantId: null,                      label: 'jogger-main-2',         unsplashId: '1562183241-b937e95585b6', prompt: 'jogger pants detail shot, elastic waistband, clean background' },
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_noir',     label: 'jogger-noir-1',         unsplashId: '1624378439575-d8705ad7ae80', prompt: 'black technical jogger pants product photo, white background' },
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_grey',     label: 'jogger-grey-1',         unsplashId: '1517841905240-472988babdf9', prompt: 'grey marl jogger pants product photo, white background, sportswear' },
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_marine',   label: 'jogger-marine-1',       unsplashId: '1553143820-6bb68bc34679', prompt: 'navy blue jogger pants product photo, white background, athleisure' },

  // ── Veste Coach ───────────────────────────────────────────────────────────
  { productId: 'prod_new_veste_coach',   variantId: null,                      label: 'coach-main-1',          unsplashId: '1551698618-1dfe5d97d256', prompt: 'coach jacket product photo, white background, streetwear fashion' },
  { productId: 'prod_new_veste_coach',   variantId: null,                      label: 'coach-main-2',          unsplashId: '1582142306909-195724d33ffc', prompt: 'coach jacket back view, white background, product photography' },
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_noir',      label: 'coach-noir-1',          unsplashId: '1507003211169-0a1dd7228f2d', prompt: 'black coach jacket product photo, white background, minimal style' },
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_vert',      label: 'coach-vert-1',          unsplashId: '1590739225338-0e6f5d1da7c1', prompt: 'forest green coach jacket product photo, white background, outdoors' },
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_navy',      label: 'coach-navy-1',          unsplashId: '1548036328-c9fa89d128fa', prompt: 'navy coach jacket product photo, white background, classic style' },

  // ── Crop Top Athleisure ───────────────────────────────────────────────────
  { productId: 'prod_new_croptop',       variantId: null,                      label: 'croptop-main-1',        unsplashId: '1485968579580-b6d095142e6e', prompt: 'crop top product photo, white background, athleisure women fashion' },
  { productId: 'prod_new_croptop',       variantId: null,                      label: 'croptop-main-2',        unsplashId: '1490481651871-ab68de25d43d', prompt: 'athletic crop top detail, ribbed fabric texture, white background' },
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_blanc',   label: 'croptop-blanc-1',       unsplashId: '1494438639946-1ebd1d20bf85', prompt: 'white crop top product photo, white background, women sportswear' },
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_noir',    label: 'croptop-noir-1',        unsplashId: '1568252542512-9fe8fe9c87bb', prompt: 'black crop top product photo, white background, athleisure style' },
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_rose',    label: 'croptop-rose-1',        unsplashId: '1549465220-1a629bd08dbd', prompt: 'pink pastel crop top product photo, white background, women fashion' },

  // ── Short Sport Premium ────────────────────────────────────────────────────
  { productId: 'prod_new_short_sport',   variantId: null,                      label: 'short-main-1',          unsplashId: '1491487686374-9f4082ac1fc0', prompt: 'athletic shorts product photo, white background, sportswear' },
  { productId: 'prod_new_short_sport',   variantId: null,                      label: 'short-main-2',          unsplashId: '1515886657613-9f3515b0c78f', prompt: 'sport shorts flat lay, white background, clean minimal product shot' },
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_noir',      label: 'short-noir-1',          unsplashId: '1499400955083-4b29b88f5f28', prompt: 'black athletic shorts product photo, white background, running' },
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_grey',      label: 'short-grey-1',          unsplashId: '1539710094960-3c18b5a6e5e3', prompt: 'grey marl sport shorts product photo, white background, gym wear' },
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_bleu',      label: 'short-bleu-1',          unsplashId: '1490481651871-ab68de25d43d', prompt: 'blue athletic shorts product photo, white background, sportswear' },

  // ── Pull Col Roulé ────────────────────────────────────────────────────────
  { productId: 'prod_new_pull_colroule', variantId: null,                      label: 'pull-main-1',           unsplashId: '1434389677669-e08b4cac3105', prompt: 'turtleneck sweater product photo, white background, premium knitwear' },
  { productId: 'prod_new_pull_colroule', variantId: null,                      label: 'pull-main-2',           unsplashId: '1458530308642-23cf011179e0', prompt: 'turtleneck pullover detail, ribbed collar close up, white background' },
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_creme',      label: 'pull-creme-1',          unsplashId: '1551488831-00ddcf7b4aad', prompt: 'cream turtleneck sweater product photo, white background, autumn fashion' },
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_noir',       label: 'pull-noir-1',           unsplashId: '1503342217505-b0a15ec3261c', prompt: 'black turtleneck sweater product photo, white background, minimalist' },
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_camel',      label: 'pull-camel-1',          unsplashId: '1512327428351-61cf032f5a32', prompt: 'camel brown turtleneck sweater product photo, white background, classic' },

  // ── Débardeur Oversize ────────────────────────────────────────────────────
  { productId: 'prod_new_debardeur',     variantId: null,                      label: 'debardeur-main-1',      unsplashId: '1503341338985-95661e5a8f6e', prompt: 'oversized tank top product photo, white background, streetwear' },
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_blanc', label: 'debardeur-blanc-1',     unsplashId: '1521572163474-6864f9cf17ab', prompt: 'white oversized tank top product photo, white background, summer' },
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_noir',  label: 'debardeur-noir-1',      unsplashId: '1576566588028-4147f3842f27', prompt: 'black oversized tank top product photo, white background, urban style' },
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_gris',  label: 'debardeur-gris-1',      unsplashId: '1559136555-9303baea8eae', prompt: 'grey oversized tank top product photo, white background, casual' },

  // ── Longline Tee ──────────────────────────────────────────────────────────
  { productId: 'prod_new_longline_tee',  variantId: null,                      label: 'longline-main-1',       unsplashId: '1583744946564-b52ac1c389c8', prompt: 'longline t-shirt product photo, white background, streetwear extended hem' },
  { productId: 'prod_new_longline_tee',  variantId: null,                      label: 'longline-main-2',       unsplashId: '1588850561407-ed78c282e89b', prompt: 'long tee back view product photo, white background, urban fashion' },
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_noir',   label: 'longline-noir-1',       unsplashId: '1618354691438-25bc04584c23', prompt: 'black longline tee product photo, white background, minimalist fashion' },
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_blanc',  label: 'longline-blanc-1',      unsplashId: '1581655353564-df123364d42e', prompt: 'white longline t-shirt product photo, white background, clean style' },
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_gris',   label: 'longline-gris-1',       unsplashId: '1529374255-1e9231d7a1a4', prompt: 'grey longline tee product photo, white background, urban minimalism' },

  // ── Legging Sport ─────────────────────────────────────────────────────────
  { productId: 'prod_new_legging_sport', variantId: null,                      label: 'legging-main-1',        unsplashId: '1594950819028-74734b5e59c0', prompt: 'sport leggings product photo, white background, women activewear' },
  { productId: 'prod_new_legging_sport', variantId: null,                      label: 'legging-main-2',        unsplashId: '1506629082955-511b1aa562c8', prompt: 'yoga leggings flat lay, white background, performance fabric detail' },
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_noir',    label: 'legging-noir-1',        unsplashId: '1576551488405-560c52818de7', prompt: 'black sport leggings product photo, white background, high waist' },
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_marine',  label: 'legging-marine-1',      unsplashId: '1595950653106-6c9ebd614d3a', prompt: 'navy blue leggings product photo, white background, activewear' },
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_rose',    label: 'legging-rose-1',        unsplashId: '1494436261687-24a14bc27e69', prompt: 'pink sport leggings product photo, white background, yoga wear' },

  // ── Sweat Zip ─────────────────────────────────────────────────────────────
  { productId: 'prod_new_sweat_zip',     variantId: null,                      label: 'sweatzip-main-1',       unsplashId: '1610386648444-4af6fbec5fa5', prompt: 'zip-up sweatshirt product photo, white background, casual sportswear' },
  { productId: 'prod_new_sweat_zip',     variantId: null,                      label: 'sweatzip-main-2',       unsplashId: '1611312449408-fcedd27dff05', prompt: 'half-zip sweater detail, zip hardware close up, white background' },
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_noir',   label: 'sweatzip-noir-1',       unsplashId: '1612336469928-4a0eb8fef58a', prompt: 'black zip hoodie product photo, white background, streetwear' },
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_gris',   label: 'sweatzip-gris-1',       unsplashId: '1614786269826-b2e01cd7f4f4', prompt: 'grey zip sweatshirt product photo, white background, casual style' },
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_navy',   label: 'sweatzip-navy-1',       unsplashId: '1615240148892-d77ae77e1474', prompt: 'navy zip sweater product photo, white background, classic casual' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}

async function uploadToCloudinary(base64DataUri: string, label: string): Promise<string> {
  const publicId = `${Date.now()}-${sanitizeName(label)}`;
  const result = await cloudinary.uploader.upload(base64DataUri, {
    folder: 'kpsull/products/seed',
    public_id: publicId,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });
  return result.secure_url;
}

async function fetchUnsplashAsBase64(unsplashId: string): Promise<string> {
  const url = `https://images.unsplash.com/photo-${unsplashId}?w=800&h=800&fit=crop`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unsplash fetch failed for ${unsplashId}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

interface GeminiPrediction {
  bytesBase64Encoded: string;
  mimeType: string;
}

interface GeminiResponse {
  predictions: GeminiPrediction[];
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:predict?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: `professional product photo, white background, ${prompt}` }],
        parameters: { sampleCount: 1 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const prediction = data.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) {
    throw new Error('No image returned from Gemini API');
  }

  return `data:${prediction.mimeType};base64,${prediction.bytesBase64Encoded}`;
}

async function fetchImageAsBase64(spec: ImageSpec, googleApiKey: string | undefined): Promise<string> {
  if (googleApiKey) {
    return await generateWithGemini(spec.prompt, googleApiKey);
  }
  return await fetchUnsplashAsBase64(spec.unsplashId);
}

// ─── Aggregation des résultats ────────────────────────────────────────────────

function buildOutput(results: Map<string, string>): SeedImagesOutput {
  const output: SeedImagesOutput = {};

  for (const spec of IMAGE_SPECS) {
    const { productId, variantId, label } = spec;
    const url = results.get(label);
    if (!url) continue;

    if (!output[productId]) {
      output[productId] = { main: [], variants: {} };
    }

    const entry = output[productId];
    if (!entry) continue;

    if (variantId === null) {
      entry.main.push(url);
    } else {
      if (!entry.variants[variantId]) {
        entry.variants[variantId] = [];
      }
      entry.variants[variantId]?.push(url);
    }
  }

  return output;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  const mode = googleApiKey ? 'Gemini (Imagen 3 Fast)' : 'Unsplash (fallback)';

  console.log(`\n🖼  Seed Image Upload Script`);
  console.log(`   Mode: ${mode}`);
  console.log(`   Total images: ${IMAGE_SPECS.length}`);
  console.log(`   Output: prisma/seed-assets/product-images.json\n`);

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Missing Cloudinary environment variables. Please check .env.local');
    process.exit(1);
  }

  const results = new Map<string, string>();
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < IMAGE_SPECS.length; i++) {
    const spec = IMAGE_SPECS[i];
    if (!spec) continue;

    const progress = `[${String(i + 1).padStart(2, '0')}/${IMAGE_SPECS.length}]`;
    process.stdout.write(`${progress} Uploading ${spec.label}...`);

    try {
      const base64 = await fetchImageAsBase64(spec, googleApiKey);
      const url = await uploadToCloudinary(base64, spec.label);
      results.set(spec.label, url);
      successCount++;
      console.log(` ✓`);
    } catch (err) {
      errorCount++;
      const message = err instanceof Error ? err.message : String(err);
      console.log(` ✗ ${message}`);
    }

    // Rate limiting: small delay between requests
    if (i < IMAGE_SPECS.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log(`\n📊 Upload summary: ${successCount} success, ${errorCount} errors`);

  if (results.size === 0) {
    console.error('❌ No images were uploaded successfully. Aborting.');
    process.exit(1);
  }

  const output = buildOutput(results);
  const outputPath = path.resolve('./prisma/seed-assets/product-images.json');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ Saved to ${outputPath}`);
  console.log(`   Products covered: ${Object.keys(output).length}`);
  for (const [productId, entry] of Object.entries(output)) {
    const variantCount = Object.keys(entry.variants).length;
    console.log(`   - ${productId}: ${entry.main.length} main images, ${variantCount} variant(s)`);
  }
  console.log('');
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('❌ Script failed:', message);
  process.exit(1);
});
