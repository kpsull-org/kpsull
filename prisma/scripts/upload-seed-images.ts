/**
 * Script de génération d'images seed avec upload Cloudinary
 *
 * Usage:
 *   bun prisma/scripts/upload-seed-images.ts
 *
 * Stratégie:
 *   1. Si UNSPLASH_ACCESS_KEY dispo: recherche Unsplash (count images par spec)
 *   2. Fallback: Picsum.photos (gratuit, déterministe, 0 clé requise)
 *   3. Validation Gemini Vision optionnelle (GOOGLE_AI_API_KEY)
 *   4. Upload final vers Cloudinary (toujours requis)
 *
 * Variables d'environnement:
 *   CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET  → REQUIS
 *   UNSPLASH_ACCESS_KEY  → optionnel (meilleures photos)
 *   GOOGLE_AI_API_KEY    → optionnel (validation Gemini Vision si Unsplash activé)
 *
 * Résultat: prisma/seed-assets/product-images.json
 *
 * Structure cible:
 *   3 créateurs × 2 collections × 3 produits = 18 produits
 *   2 images par variante défaut + 1 image par collection
 *   Total: 18*2 + 6 = 42 appels Unsplash (sous la limite 50/heure)
 */

import { config } from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';

config({ path: '.env.local' });

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface VariantImageSpec {
  variantId: string;
  productId: string;
  label: string;
  query: string;
  count: number;
}

interface CollectionImageSpec {
  collectionId: string;
  label: string;
  query: string;
}

interface SeedImagesOutput {
  products: Record<string, {
    variants: Record<string, string[]>;
  }>;
  collections: Record<string, string>;
}

// ─── VARIANT_IMAGE_SPECS — 1 entrée par variante produit ──────────────────────

const VARIANT_IMAGE_SPECS: VariantImageSpec[] = [
  // ══ HUGO TESSIER — Collection "Urban Core" ════════════════════════════════
  { variantId: 'var_hugo_tshirt_default', productId: 'prod_hugo_tshirt', label: 'hugo-tshirt-default', query: 'oversized white tshirt streetwear flat lay minimal', count: 2 },
  { variantId: 'var_hugo_hoodie_default', productId: 'prod_hugo_hoodie', label: 'hugo-hoodie-default', query: 'dark hoodie streetwear model urban fashion', count: 2 },
  { variantId: 'var_hugo_jogger_default', productId: 'prod_hugo_jogger', label: 'hugo-jogger-default', query: 'cargo jogger pants streetwear beige fashion', count: 2 },

  // ══ HUGO TESSIER — Collection "Monochrome" ════════════════════════════════
  { variantId: 'var_hugo_polo_default', productId: 'prod_hugo_polo', label: 'hugo-polo-default', query: 'polo shirt white minimal fashion clean background', count: 2 },
  { variantId: 'var_hugo_sweat_default', productId: 'prod_hugo_sweat', label: 'hugo-sweat-default', query: 'crew neck sweatshirt ecru off white fashion minimal', count: 2 },
  { variantId: 'var_hugo_short_default', productId: 'prod_hugo_short', label: 'hugo-short-default', query: 'technical shorts khaki olive men fashion sport', count: 2 },

  // ══ LEA FONTAINE — Collection "Matière Première" ══════════════════════════
  { variantId: 'var_lea_veste_default', productId: 'prod_lea_veste', label: 'lea-veste-default', query: 'linen jacket artisan fashion minimal natural fabric', count: 2 },
  { variantId: 'var_lea_pantalon_default', productId: 'prod_lea_pantalon', label: 'lea-pantalon-default', query: 'wide leg trousers sand beige women fashion minimal', count: 2 },
  { variantId: 'var_lea_chemise_default', productId: 'prod_lea_chemise', label: 'lea-chemise-default', query: 'oversized linen shirt white women artisan fashion', count: 2 },

  // ══ LEA FONTAINE — Collection "Épure" ════════════════════════════════════
  { variantId: 'var_lea_robe_default', productId: 'prod_lea_robe', label: 'lea-robe-default', query: 'long maxi dress terracotta women minimal fashion editorial', count: 2 },
  { variantId: 'var_lea_top_default', productId: 'prod_lea_top', label: 'lea-top-default', query: 'asymmetric top black women fashion minimal editorial', count: 2 },
  { variantId: 'var_lea_manteau_default', productId: 'prod_lea_manteau', label: 'lea-manteau-default', query: 'short coat camel women fashion minimal elegant', count: 2 },

  // ══ KAIS BENALI — Collection "Trail Ready" ════════════════════════════════
  { variantId: 'var_kais_veste_default', productId: 'prod_kais_veste', label: 'kais-veste-default', query: 'technical outdoor jacket charcoal men sport performance', count: 2 },
  { variantId: 'var_kais_legging_default', productId: 'prod_kais_legging', label: 'kais-legging-default', query: 'running legging tight black men sport athletic', count: 2 },
  { variantId: 'var_kais_debardeur_default', productId: 'prod_kais_debardeur', label: 'kais-debardeur-default', query: 'mesh tank top white men sport athletic training', count: 2 },

  // ══ KAIS BENALI — Collection "Everyday Active" ════════════════════════════
  { variantId: 'var_kais_sweat_default', productId: 'prod_kais_sweat', label: 'kais-sweat-default', query: 'zip up hoodie navy blue men sport athletic fashion', count: 2 },
  { variantId: 'var_kais_short_default', productId: 'prod_kais_short', label: 'kais-short-default', query: 'sport running shorts black men athletic minimal', count: 2 },
  { variantId: 'var_kais_brassiere_default', productId: 'prod_kais_brassiere', label: 'kais-brassiere-default', query: 'sports bra black women athletic minimal training', count: 2 },
];

// ─── COLLECTION_IMAGE_SPECS — 6 collections ───────────────────────────────────

const COLLECTION_IMAGE_SPECS: CollectionImageSpec[] = [
  { collectionId: 'proj_hugo_urban_core', label: 'collection-hugo-urban-core', query: 'urban streetwear collection editorial fashion paris minimal' },
  { collectionId: 'proj_hugo_mono', label: 'collection-hugo-monochrome', query: 'monochrome fashion collection neutral tones minimal editorial' },
  { collectionId: 'proj_lea_matiere', label: 'collection-lea-matiere-premiere', query: 'artisan linen natural fabric fashion collection minimal editorial' },
  { collectionId: 'proj_lea_epure', label: 'collection-lea-epure', query: 'minimalist women fashion editorial clean silhouette' },
  { collectionId: 'proj_kais_trail', label: 'collection-kais-trail-ready', query: 'outdoor trail sport collection technical performance fashion' },
  { collectionId: 'proj_kais_everyday', label: 'collection-kais-everyday-active', query: 'everyday activewear sport collection athletic lifestyle' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPicsumUrl(label: string, width = 800, height = 800): string {
  const seed = label.replaceAll(/[^a-z0-9]/gi, '').toLowerCase();
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

async function searchUnsplash(query: string, count: number): Promise<string[]> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) return [];

  try {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', String(Math.min(count + 2, 10)));
    url.searchParams.set('orientation', 'squarish');

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${apiKey}` },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      results: Array<{ urls: { regular: string } }>;
    };

    return data.results.map((r) => r.urls.regular).slice(0, count + 2);
  } catch {
    return [];
  }
}

async function validateWithGemini(imageUrl: string, query: string, apiKey: string): Promise<boolean> {
  try {
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return false;
    const buffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = imgResponse.headers.get('content-type') ?? 'image/jpeg';

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [
          { text: `Is this image suitable for an e-commerce fashion product listing of: "${query}"? Answer only YES or NO.` },
          { inlineData: { mimeType, data: base64 } },
        ],
      }],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return false;

    const result = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return text.toUpperCase().includes('YES');
  } catch {
    return false;
  }
}

async function uploadToCloudinary(sourceUrl: string, label: string): Promise<string> {
  const folder = 'kpsull-seed';
  const publicId = `${folder}/${label}`;

  try {
    const existing = await cloudinary.api.resource(publicId);
    return existing.secure_url as string;
  } catch {
    // Not found, proceed with upload
  }

  const result = await cloudinary.uploader.upload(sourceUrl, {
    public_id: publicId,
    overwrite: false,
    resource_type: 'image',
  });

  return result.secure_url;
}

async function resolveVariantImages(spec: VariantImageSpec): Promise<string[]> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const geminiKey = process.env.GOOGLE_AI_API_KEY;
  const urls: string[] = [];

  if (unsplashKey) {
    const candidates = await searchUnsplash(spec.query, spec.count);

    for (const url of candidates) {
      if (urls.length >= spec.count) break;

      if (geminiKey) {
        const valid = await validateWithGemini(url, spec.query, geminiKey);
        if (valid) urls.push(url);
      } else {
        urls.push(url);
      }
    }
  }

  let picsumIdx = 0;
  while (urls.length < spec.count) {
    const suffix = picsumIdx === 0 ? '' : `-${picsumIdx}`;
    urls.push(getPicsumUrl(`${spec.label}${suffix}`));
    picsumIdx++;
  }

  return urls;
}

async function resolveCollectionImage(spec: CollectionImageSpec): Promise<string> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const geminiKey = process.env.GOOGLE_AI_API_KEY;

  if (unsplashKey) {
    const candidates = await searchUnsplash(spec.query, 3);

    for (const url of candidates) {
      if (geminiKey) {
        const valid = await validateWithGemini(url, spec.query, geminiKey);
        if (valid) return url;
      } else {
        return url;
      }
    }
  }

  return getPicsumUrl(spec.label, 1200, 600);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
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
    console.log(`Mode: Unsplash${hasGemini ? ' + Gemini Vision' : ''} -> Cloudinary`);
  } else {
    console.log('Mode: Picsum (fallback gratuit) -> Cloudinary');
    console.log('   Astuce: definir UNSPLASH_ACCESS_KEY pour de meilleures photos');
  }

  const totalVariants = VARIANT_IMAGE_SPECS.length;
  const totalCollections = COLLECTION_IMAGE_SPECS.length;
  const estimatedCalls = VARIANT_IMAGE_SPECS.reduce((sum, s) => sum + s.count, 0) + totalCollections;

  console.log(`\n${totalVariants} variantes x images + ${totalCollections} collections`);
  console.log(`Estim ~${estimatedCalls} appels Unsplash (limite: 50/heure)`);
  console.log('Estimation temps: ~30s (picsum) | ~2-5min (Unsplash)\n');

  const output: SeedImagesOutput = { products: {}, collections: {} };
  let processed = 0;
  const total = totalVariants + totalCollections;

  for (const spec of VARIANT_IMAGE_SPECS) {
    processed++;
    process.stdout.write(`[${processed}/${total}] ${spec.label} (${spec.count} img)... `);

    try {
      const sourceUrls = await resolveVariantImages(spec);
      const finalUrls: string[] = [];

      for (let i = 0; i < sourceUrls.length; i++) {
        const sourceUrl = sourceUrls[i];
        if (!sourceUrl) continue;
        const finalUrl = await uploadToCloudinary(sourceUrl, `${spec.label}-${i + 1}`);
        finalUrls.push(finalUrl);
      }

      output.products[spec.productId] ??= { variants: {} };
      output.products[spec.productId]!.variants[spec.variantId] = finalUrls;

      console.log(`OK (${finalUrls.length} images)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`ERREUR: ${message}`);
    }
  }

  for (const spec of COLLECTION_IMAGE_SPECS) {
    processed++;
    process.stdout.write(`[${processed}/${total}] ${spec.label}... `);

    try {
      const sourceUrl = await resolveCollectionImage(spec);
      const finalUrl = await uploadToCloudinary(sourceUrl, spec.label);
      output.collections[spec.collectionId] = finalUrl;
      console.log('OK');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`ERREUR: ${message}`);
    }
  }

  const outputDir = path.resolve('./prisma/seed-assets');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'product-images.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  const productsCount = Object.keys(output.products).length;
  const collectionsCount = Object.keys(output.collections).length;
  const variantsCount = Object.values(output.products).reduce(
    (sum, p) => sum + Object.keys(p.variants).length, 0,
  );

  console.log(`\nTermine! ${productsCount} produits (${variantsCount} variantes) + ${collectionsCount} collections sauvegardes`);
  console.log(`Fichier: ${outputPath}`);
}

try {
  await main();
} catch (err) {
  console.error('Erreur fatale:', err);
  process.exit(1);
}
