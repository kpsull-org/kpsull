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
  // main-1: flat lay
  { productId: 'prod_new_tshirt_basique', variantId: null,                    label: 'tshirt-main-1',         unsplashId: '1521572163474-6864f9cf17ab', prompt: 'editorial flat lay fashion photography, premium crew neck cotton t-shirt off-white, perfectly laid on light marble surface, soft natural light from above, e-commerce marketplace product shot, ultra sharp fabric texture details, boutique fashion photography' },
  // main-2: ghost mannequin front
  { productId: 'prod_new_tshirt_basique', variantId: null,                    label: 'tshirt-main-2',         unsplashId: '1503341338985-95661e5a8f6e', prompt: 'ghost mannequin product photography, premium cotton crew neck t-shirt with clean hem and side seams, invisible mannequin technique, pure white studio background with soft shadow, professional e-commerce apparel shot, 4K quality, creator brand product photo' },
  // main-3: model lifestyle (NEW)
  { productId: 'prod_new_tshirt_basique', variantId: null,                    label: 'tshirt-main-3',         unsplashId: '1503341338985-95661e5a8f6e', prompt: 'professional fashion model wearing fitted premium cotton t-shirt, clean white studio background, chest up editorial fashion shot, sharp focus on fabric texture and silhouette, no face visible, e-commerce marketplace photo, boutique brand photography' },
  // variants
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_blanc',  label: 'tshirt-blanc-1',        unsplashId: '1581655353564-df123364d42e', prompt: 'ghost mannequin wearing crisp off-white premium cotton t-shirt, perfect silhouette, studio lighting with soft shadow, marketplace fashion photography, fine cotton fabric weave visible, photorealistic e-commerce product photo' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_blanc',  label: 'tshirt-blanc-2',        unsplashId: '1618354691438-25bc04584c23', prompt: 'editorial flat lay, crisp white premium t-shirt perfectly folded on light oak wood surface, top-down studio lighting, Shopify fashion e-commerce product shot, sharp detail, minimal styling' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_noir',   label: 'tshirt-noir-1',         unsplashId: '1576566588028-4147f3842f27', prompt: 'ghost mannequin wearing sleek midnight black premium cotton t-shirt, pure white studio background, e-commerce product photo, sharp contrast, fine fabric weave visible, invisible mannequin technique, creator brand product' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_marine', label: 'tshirt-marine-1',       unsplashId: '1529374255-1e9231d7a1a4', prompt: 'ghost mannequin wearing deep navy blue premium cotton crew neck t-shirt, white studio background, professional e-commerce apparel photo, fabric texture sharp, soft shoulder shadow, marketplace fashion photography' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_rouge',  label: 'tshirt-rouge-1',        unsplashId: '1542291026-7eec264c27ff', prompt: 'urban streetwear editorial, model wearing vibrant cherry red premium t-shirt, candid lifestyle shot, soft bokeh background, natural daylight, Instagram fashion aesthetic, no face visible, chest up shot, boutique brand photography' },

  // ── Hoodie Premium Oversize ────────────────────────────────────────────────
  // main-1: flat lay
  { productId: 'prod_new_hoodie_premium', variantId: null,                     label: 'hoodie-main-1',         unsplashId: '1556821840-3a63f15732ce', prompt: 'editorial flat lay fashion photography, oversized French terry hoodie with kangaroo pocket and drawstring, arranged artfully on light oak wood surface, top-down studio lighting, fashion e-commerce marketplace, ultra sharp fabric detail, boutique streetwear product shot' },
  // main-2: ghost mannequin
  { productId: 'prod_new_hoodie_premium', variantId: null,                     label: 'hoodie-main-2',         unsplashId: '1578587018452-892bacefd3f2', prompt: 'ghost mannequin product photography, oversized premium French terry hoodie with kangaroo pocket, invisible mannequin technique showing full silhouette, clean white studio background with soft drop shadow, professional e-commerce apparel shot, rib cuff details visible, 4K quality' },
  // main-3: model lifestyle (NEW)
  { productId: 'prod_new_hoodie_premium', variantId: null,                     label: 'hoodie-main-3',         unsplashId: '1578587018452-892bacefd3f2', prompt: 'professional fashion model wearing oversized cream hoodie with hands in kangaroo pocket, white studio background, street style editorial photography, no face visible, waist up shot, soft lighting, e-commerce marketplace photo, creator brand streetwear' },
  // variants
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_noir',    label: 'hoodie-noir-1',         unsplashId: '1509347528160-9a9e33742cdb', prompt: 'ghost mannequin wearing oversized midnight black French terry hoodie with drawstring, pure white background, sharp fashion product photography, visible rib cuff and kangaroo pocket details, e-commerce marketplace photo, creator brand product' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_blanc',   label: 'hoodie-blanc-1',        unsplashId: '1572635196237-14b3f281503f', prompt: 'ghost mannequin wearing oversized pure white premium hoodie with drawstring, minimal white studio background, e-commerce marketplace apparel photo, French terry fabric texture visible, soft shadow, photorealistic product shot' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_ecru',    label: 'hoodie-ecru-1',         unsplashId: '1509631179647-0177331693ae', prompt: 'ghost mannequin wearing oversized off-white ecru cream hoodie, studio lighting, professional e-commerce product photography, premium cotton French terry texture clearly visible, clean white background, boutique fashion brand' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_kaki',    label: 'hoodie-kaki-1',         unsplashId: '1591047139829-d91aecb6caea', prompt: 'urban lifestyle editorial, model wearing oversized forest khaki green hoodie, candid street photography, soft bokeh urban background, natural daylight, Instagram streetwear aesthetic, no face visible, waist up, creator brand product shot' },

  // ── Jogger Technique ──────────────────────────────────────────────────────
  // main-1: flat lay
  { productId: 'prod_new_jogger_tech',   variantId: null,                      label: 'jogger-main-1',         unsplashId: '1571945153237-4929e783af4a', prompt: 'editorial flat lay fashion photography, technical performance jogger pants with elastic waistband and tapered ankle, perfectly laid on light concrete surface, top-down soft studio lighting, e-commerce marketplace sportswear product shot, ultra sharp fabric detail' },
  // main-2: ghost mannequin
  { productId: 'prod_new_jogger_tech',   variantId: null,                      label: 'jogger-main-2',         unsplashId: '1562183241-b937e95585b6', prompt: 'ghost mannequin product photography, technical jogger pants with side pockets and tapered cuff, invisible mannequin technique, clean white studio background, professional e-commerce athleisure shot, elastic waistband and ankle detail visible, 4K quality, creator brand product' },
  // main-3: model lifestyle (NEW)
  { productId: 'prod_new_jogger_tech',   variantId: null,                      label: 'jogger-main-3',         unsplashId: '1562183241-b937e95585b6', prompt: 'professional model wearing technical jogger pants, white studio background, full length shot from waist down, sharp focus on fabric and silhouette, athletic pose, e-commerce marketplace photo, sportswear brand photography' },
  // variants
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_noir',     label: 'jogger-noir-1',         unsplashId: '1624378439575-d8705ad7ae80', prompt: 'ghost mannequin wearing sleek midnight black technical jogger pants with tapered leg and side pockets, pure white studio background, e-commerce marketplace photo, performance fabric texture visible, soft shadow, photorealistic product shot' },
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_grey',     label: 'jogger-grey-1',         unsplashId: '1517841905240-472988babdf9', prompt: 'ghost mannequin wearing heather grey marl technical jogger pants, invisible mannequin technique, white studio background, professional e-commerce sportswear product photo, ribbed cuff and waistband detail visible, creator brand athleisure' },
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_marine',   label: 'jogger-marine-1',       unsplashId: '1553143820-6bb68bc34679', prompt: 'ghost mannequin wearing deep navy blue technical jogger pants with elastic ankle cuff, clean white studio background, marketplace fashion photography, performance fabric weave visible, sharp professional product shot, boutique sportswear brand' },

  // ── Veste Coach ───────────────────────────────────────────────────────────
  // main-1: flat lay
  { productId: 'prod_new_veste_coach',   variantId: null,                      label: 'coach-main-1',          unsplashId: '1551698618-1dfe5d97d256', prompt: 'editorial flat lay fashion photography, lightweight coach jacket with snap buttons and side pockets, arranged flat on light marble surface, top-down natural studio lighting, e-commerce marketplace product shot, nylon shell fabric texture visible, streetwear boutique photography' },
  // main-2: ghost mannequin
  { productId: 'prod_new_veste_coach',   variantId: null,                      label: 'coach-main-2',          unsplashId: '1582142306909-195724d33ffc', prompt: 'ghost mannequin product photography, lightweight coach jacket with full zip and side pockets, invisible mannequin technique front view, clean white studio background with soft shadow, professional e-commerce outerwear shot, snap collar detail visible, 4K quality' },
  // main-3: model lifestyle (NEW)
  { productId: 'prod_new_veste_coach',   variantId: null,                      label: 'coach-main-3',          unsplashId: '1582142306909-195724d33ffc', prompt: 'urban lifestyle editorial, model wearing coach jacket in relaxed streetwear style, candid outdoor urban setting, soft bokeh background, natural daylight, Instagram fashion aesthetic, no face visible, three-quarter length shot, creator brand product photography' },
  // variants
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_noir',      label: 'coach-noir-1',          unsplashId: '1507003211169-0a1dd7228f2d', prompt: 'ghost mannequin wearing sleek midnight black lightweight coach jacket with snap buttons, pure white studio background, e-commerce marketplace product photo, nylon fabric sheen visible, sharp shadows, photorealistic creator brand shot' },
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_vert',      label: 'coach-vert-1',          unsplashId: '1590739225338-0e6f5d1da7c1', prompt: 'ghost mannequin wearing forest khaki green coach jacket with side pockets, invisible mannequin technique, clean white studio background, professional e-commerce outerwear photo, nylon texture visible, boutique streetwear brand product shot' },
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_navy',      label: 'coach-navy-1',          unsplashId: '1548036328-c9fa89d128fa', prompt: 'ghost mannequin wearing deep navy blue coach jacket with full zip, white studio background, e-commerce marketplace apparel photography, fabric detail and snap collar visible, soft drop shadow, creator brand streetwear product shot' },

  // ── Crop Top Athleisure ───────────────────────────────────────────────────
  // main-1: flat lay
  { productId: 'prod_new_croptop',       variantId: null,                      label: 'croptop-main-1',        unsplashId: '1485968579580-b6d095142e6e', prompt: 'editorial flat lay fashion photography, ribbed seamless athletic crop top, perfectly laid on light concrete surface, soft natural light from above, e-commerce marketplace women activewear product shot, ribbed fabric texture ultra sharp, boutique athleisure photography' },
  // main-2: ghost mannequin
  { productId: 'prod_new_croptop',       variantId: null,                      label: 'croptop-main-2',        unsplashId: '1490481651871-ab68de25d43d', prompt: 'ghost mannequin product photography, ribbed seamless athletic crop top with cropped hem, invisible mannequin technique, clean white studio background with soft shadow, professional e-commerce women sportswear shot, fabric stretch detail visible, 4K quality, creator brand product' },
  // main-3: model lifestyle (NEW)
  { productId: 'prod_new_croptop',       variantId: null,                      label: 'croptop-main-3',        unsplashId: '1490481651871-ab68de25d43d', prompt: 'professional fitness model wearing ribbed athletic crop top, white studio background, chest up editorial fashion shot, sharp focus on fabric texture and silhouette, no face visible, e-commerce marketplace photo, women athleisure brand photography' },
  // variants
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_blanc',   label: 'croptop-blanc-1',       unsplashId: '1494438639946-1ebd1d20bf85', prompt: 'ghost mannequin wearing crisp white ribbed seamless crop top, invisible mannequin technique, pure white studio background with subtle shadow, marketplace fashion photography, fine rib fabric texture visible, photorealistic women activewear product shot' },
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_noir',    label: 'croptop-noir-1',        unsplashId: '1568252542512-9fe8fe9c87bb', prompt: 'ghost mannequin wearing sleek midnight black ribbed athletic crop top, clean white studio background, e-commerce women sportswear product photo, sharp contrast, ribbed fabric texture clearly visible, boutique athleisure brand product shot' },
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_rose',    label: 'croptop-rose-1',        unsplashId: '1549465220-1a629bd08dbd', prompt: 'lifestyle editorial, fitness model wearing dusty rose pink ribbed crop top, candid studio shot, soft pastel background, Instagram women fashion aesthetic, no face visible, waist up, creator brand activewear product photography' },

  // ── Short Sport Premium ────────────────────────────────────────────────────
  // main-1: flat lay
  { productId: 'prod_new_short_sport',   variantId: null,                      label: 'short-main-1',          unsplashId: '1491487686374-9f4082ac1fc0', prompt: 'editorial flat lay fashion photography, premium athletic shorts with elastic waistband and side pockets, perfectly laid on light marble surface, soft natural light from above, e-commerce marketplace sportswear product shot, performance fabric texture ultra sharp, boutique activewear photography' },
  // main-2: ghost mannequin
  { productId: 'prod_new_short_sport',   variantId: null,                      label: 'short-main-2',          unsplashId: '1515886657613-9f3515b0c78f', prompt: 'ghost mannequin product photography, premium athletic shorts with elastic drawstring waist and back pocket, invisible mannequin technique, clean white studio background with soft shadow, professional e-commerce sportswear shot, inner liner and hem details visible, 4K quality' },
  // main-3: model lifestyle (NEW)
  { productId: 'prod_new_short_sport',   variantId: null,                      label: 'short-main-3',          unsplashId: '1515886657613-9f3515b0c78f', prompt: 'professional fitness model wearing athletic shorts, white studio background, full body shot from waist down, sharp focus on fabric and cut, standing athletic pose, e-commerce marketplace sportswear product photo, creator brand photography' },
  // variants
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_noir',      label: 'short-noir-1',          unsplashId: '1499400955083-4b29b88f5f28', prompt: 'ghost mannequin wearing sleek midnight black premium athletic shorts with side pockets, pure white studio background, e-commerce product photo, performance fabric texture visible, elastic waistband detail sharp, creator brand sportswear shot' },
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_grey',      label: 'short-grey-1',          unsplashId: '1539710094960-3c18b5a6e5e3', prompt: 'ghost mannequin wearing heather grey marl premium athletic shorts, invisible mannequin technique, clean white studio background, marketplace fashion photography, marl fabric texture clearly visible, soft shadow, boutique sportswear product shot' },
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_bleu',      label: 'short-bleu-1',          unsplashId: '1490481651871-ab68de25d43d', prompt: 'ghost mannequin wearing cobalt blue premium athletic shorts with elastic waistband, white studio background, professional e-commerce sportswear photo, performance fabric sheen visible, sharp clean product shot, creator brand activewear photography' },

  // ── Pull Col Roulé ────────────────────────────────────────────────────────
  // main-1: flat lay
  { productId: 'prod_new_pull_colroule', variantId: null,                      label: 'pull-main-1',           unsplashId: '1434389677669-e08b4cac3105', prompt: 'editorial flat lay fashion photography, premium ribbed merino turtleneck sweater, carefully folded showing rolled collar, arranged on light oak wood surface, soft natural light from above, e-commerce marketplace knitwear product shot, fine rib knit texture ultra sharp, boutique fashion photography' },
  // main-2: ghost mannequin
  { productId: 'prod_new_pull_colroule', variantId: null,                      label: 'pull-main-2',           unsplashId: '1458530308642-23cf011179e0', prompt: 'ghost mannequin product photography, premium ribbed merino turtleneck pullover with distinctive rolled collar, invisible mannequin technique, clean white studio background with soft shadow, professional e-commerce knitwear shot, fine rib knit and sleeve detail visible, 4K quality, creator brand' },
  // main-3: model lifestyle (NEW)
  { productId: 'prod_new_pull_colroule', variantId: null,                      label: 'pull-main-3',           unsplashId: '1458530308642-23cf011179e0', prompt: 'professional fashion model wearing premium ribbed turtleneck sweater, white studio background, chest up editorial fashion shot, sharp focus on knit texture and silhouette, no face visible, e-commerce marketplace knitwear product photo, boutique fashion brand photography' },
  // variants
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_creme',      label: 'pull-creme-1',          unsplashId: '1551488831-00ddcf7b4aad', prompt: 'ghost mannequin wearing off-white cream premium ribbed turtleneck sweater, invisible mannequin technique, white studio background with warm soft lighting, marketplace fashion photography, fine merino knit texture clearly visible, boutique knitwear brand product shot' },
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_noir',       label: 'pull-noir-1',           unsplashId: '1503342217505-b0a15ec3261c', prompt: 'ghost mannequin wearing sleek midnight black premium ribbed turtleneck sweater, pure white studio background, e-commerce marketplace knitwear photo, sharp contrast, fine rib knit texture clearly visible, soft drop shadow, creator brand product shot' },
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_camel',      label: 'pull-camel-1',          unsplashId: '1512327428351-61cf032f5a32', prompt: 'lifestyle editorial, model wearing warm camel brown premium ribbed turtleneck sweater, soft autumn light studio setting, Instagram fashion aesthetic, no face visible, chest up, creator brand knitwear photography, boutique fashion product shot' },

  // ── Débardeur Oversize ────────────────────────────────────────────────────
  // main-1: flat lay
  { productId: 'prod_new_debardeur',     variantId: null,                      label: 'debardeur-main-1',      unsplashId: '1503341338985-95661e5a8f6e', prompt: 'editorial flat lay fashion photography, oversized cotton tank top with wide armhole and dropped shoulder, perfectly laid on light marble surface, soft natural light from above, e-commerce marketplace streetwear product shot, jersey fabric texture ultra sharp, boutique urban fashion photography' },
  // main-3: model lifestyle (NEW)
  { productId: 'prod_new_debardeur',     variantId: null,                      label: 'debardeur-main-2',      unsplashId: '1503341338985-95661e5a8f6e', prompt: 'professional fashion model wearing oversized cotton tank top, white studio background, chest up editorial shot, sharp focus on fabric drape and silhouette, no face visible, e-commerce marketplace product photo, urban streetwear brand photography' },
  // variants
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_blanc', label: 'debardeur-blanc-1',     unsplashId: '1521572163474-6864f9cf17ab', prompt: 'ghost mannequin wearing crisp off-white oversized cotton tank top with wide armhole, invisible mannequin technique, pure white studio background, marketplace fashion photography, jersey knit texture visible, soft shadow, e-commerce creator brand product shot' },
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_noir',  label: 'debardeur-noir-1',      unsplashId: '1576566588028-4147f3842f27', prompt: 'ghost mannequin wearing sleek midnight black oversized cotton tank top with dropped shoulder, clean white studio background, e-commerce streetwear product photo, sharp contrast, jersey fabric texture clearly visible, creator brand urban fashion shot' },
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_gris',  label: 'debardeur-gris-1',      unsplashId: '1559136555-9303baea8eae', prompt: 'ghost mannequin wearing heather grey oversized cotton tank top, invisible mannequin technique, white studio background, professional e-commerce product photo, soft marl texture visible, subtle shoulder shadow, boutique streetwear brand photography' },

  // ── Longline Tee ──────────────────────────────────────────────────────────
  // main-1: flat lay
  { productId: 'prod_new_longline_tee',  variantId: null,                      label: 'longline-main-1',       unsplashId: '1583744946564-b52ac1c389c8', prompt: 'editorial flat lay fashion photography, longline extended hem cotton t-shirt with curved hemline, perfectly laid on light concrete surface, soft natural light from above, e-commerce marketplace streetwear product shot, ultra sharp fabric detail, boutique urban fashion photography' },
  // main-2: ghost mannequin
  { productId: 'prod_new_longline_tee',  variantId: null,                      label: 'longline-main-2',       unsplashId: '1588850561407-ed78c282e89b', prompt: 'ghost mannequin product photography, longline extended hem cotton t-shirt showing full silhouette with curved drop hem, invisible mannequin technique, clean white studio background with soft shadow, professional e-commerce streetwear shot, fabric drape and hem detail visible, 4K quality' },
  // main-3: model lifestyle (NEW)
  { productId: 'prod_new_longline_tee',  variantId: null,                      label: 'longline-main-3',       unsplashId: '1588850561407-ed78c282e89b', prompt: 'professional model wearing longline cotton t-shirt with extended curved hem, white studio background, full length shot from waist up, sharp focus on fabric drape and silhouette, no face visible, e-commerce marketplace product photo, urban streetwear brand photography' },
  // variants
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_noir',   label: 'longline-noir-1',       unsplashId: '1618354691438-25bc04584c23', prompt: 'ghost mannequin wearing midnight black longline extended hem t-shirt, pure white studio background, e-commerce marketplace product photo, sharp contrast, cotton jersey fabric texture visible, creator brand streetwear shot, photorealistic' },
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_blanc',  label: 'longline-blanc-1',      unsplashId: '1581655353564-df123364d42e', prompt: 'ghost mannequin wearing off-white longline cotton t-shirt with curved hem, invisible mannequin technique, clean white studio background, marketplace fashion photography, fine jersey texture visible, soft shadow, boutique urban brand product shot' },
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_gris',   label: 'longline-gris-1',       unsplashId: '1529374255-1e9231d7a1a4', prompt: 'ghost mannequin wearing heather grey longline extended hem t-shirt, white studio background, professional e-commerce streetwear product photo, marl cotton texture clearly visible, soft shadow, creator brand urban fashion photography' },

  // ── Legging Sport ─────────────────────────────────────────────────────────
  // main-1: flat lay
  { productId: 'prod_new_legging_sport', variantId: null,                      label: 'legging-main-1',        unsplashId: '1594950819028-74734b5e59c0', prompt: 'editorial flat lay fashion photography, high-waist seamless performance leggings with mesh panel inserts, perfectly laid on light marble surface, soft natural light from above, e-commerce marketplace women activewear product shot, compression fabric texture ultra sharp, boutique athleisure photography' },
  // main-2: ghost mannequin
  { productId: 'prod_new_legging_sport', variantId: null,                      label: 'legging-main-2',        unsplashId: '1506629082955-511b1aa562c8', prompt: 'ghost mannequin product photography, high-waist seamless performance leggings showing full length silhouette with wide waistband, invisible mannequin technique, clean white studio background with soft shadow, professional e-commerce women sportswear shot, compression fabric and seam detail visible, 4K quality' },
  // main-3: model lifestyle (NEW)
  { productId: 'prod_new_legging_sport', variantId: null,                      label: 'legging-main-3',        unsplashId: '1506629082955-511b1aa562c8', prompt: 'professional fitness model wearing high-waist performance leggings, white studio background, full body shot from waist down, sharp focus on fabric compression and fit, athletic standing pose, e-commerce marketplace women activewear product photo, creator brand photography' },
  // variants
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_noir',    label: 'legging-noir-1',        unsplashId: '1576551488405-560c52818de7', prompt: 'ghost mannequin wearing midnight black high-waist seamless performance leggings, pure white studio background, e-commerce marketplace photo, sharp contrast, compression fabric texture and wide waistband detail visible, creator brand women activewear shot' },
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_marine',  label: 'legging-marine-1',      unsplashId: '1595950653106-6c9ebd614d3a', prompt: 'ghost mannequin wearing deep navy blue high-waist seamless leggings, invisible mannequin technique, clean white studio background, professional e-commerce women sportswear photo, performance fabric sheen visible, soft shadow, boutique athleisure brand product shot' },
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_rose',    label: 'legging-rose-1',        unsplashId: '1494436261687-24a14bc27e69', prompt: 'lifestyle editorial, fitness model wearing dusty rose pink high-waist seamless leggings, soft pastel studio setting, Instagram women fashion aesthetic, full body from waist down, no face visible, creator brand activewear photography, boutique e-commerce product shot' },

  // ── Sweat Zip ─────────────────────────────────────────────────────────────
  // main-1: flat lay
  { productId: 'prod_new_sweat_zip',     variantId: null,                      label: 'sweatzip-main-1',       unsplashId: '1610386648444-4af6fbec5fa5', prompt: 'editorial flat lay fashion photography, full-zip premium sweatshirt with ribbed hem and metal zipper hardware, arranged flat on light oak wood surface, top-down studio lighting, e-commerce marketplace casual sportswear product shot, French terry fabric texture ultra sharp, boutique brand photography' },
  // main-2: ghost mannequin
  { productId: 'prod_new_sweat_zip',     variantId: null,                      label: 'sweatzip-main-2',       unsplashId: '1611312449408-fcedd27dff05', prompt: 'ghost mannequin product photography, full-zip premium French terry sweatshirt partially zipped showing metal zipper and chest, invisible mannequin technique, clean white studio background with soft shadow, professional e-commerce casual wear shot, rib cuff and hem detail visible, 4K quality' },
  // main-3: model lifestyle (NEW)
  { productId: 'prod_new_sweat_zip',     variantId: null,                      label: 'sweatzip-main-3',       unsplashId: '1611312449408-fcedd27dff05', prompt: 'professional model wearing full-zip premium sweatshirt casually open over t-shirt, white studio background, waist up editorial fashion shot, sharp focus on fabric texture and zipper detail, no face visible, e-commerce marketplace product photo, casual streetwear brand photography' },
  // variants
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_noir',   label: 'sweatzip-noir-1',       unsplashId: '1612336469928-4a0eb8fef58a', prompt: 'ghost mannequin wearing midnight black full-zip premium French terry sweatshirt, pure white studio background, e-commerce marketplace product photo, metal zipper hardware and rib cuff details sharp, fabric texture visible, creator brand streetwear shot' },
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_gris',   label: 'sweatzip-gris-1',       unsplashId: '1614786269826-b2e01cd7f4f4', prompt: 'ghost mannequin wearing heather grey full-zip premium sweatshirt, invisible mannequin technique, clean white studio background, professional e-commerce casual wear photo, marl French terry texture clearly visible, soft shadow, boutique brand product shot' },
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_navy',   label: 'sweatzip-navy-1',       unsplashId: '1615240148892-d77ae77e1474', prompt: 'ghost mannequin wearing deep navy blue full-zip premium sweatshirt, white studio background, marketplace fashion photography, French terry fabric and ribbed trim detail visible, metal zipper hardware sharp, creator brand casual streetwear product shot' },
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

    // Rate limiting: 6500ms delay to respect Imagen 3 Fast rate limit of 10 req/min
    if (i < IMAGE_SPECS.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 6500));
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
