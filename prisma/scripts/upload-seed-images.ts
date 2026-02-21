/**
 * Script de génération d'images seed avec upload Cloudinary
 *
 * Usage:
 *   bun prisma/scripts/upload-seed-images.ts
 *
 * Prérequis: GOOGLE_AI_API_KEY (Gemini Imagen 3 Fast)
 *   - Rate limit: 1 req/6.5s → ~33 min pour 300 images
 *
 * Résultat: prisma/seed-assets/product-images.json
 * Format: { products: { [productId]: { main, variants } }, collections: { [collectionId]: url }, categories: { [key]: url[] } }
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
  products: Record<string, ProductImageEntry>;
  collections: Record<string, string>;
  categories: Record<string, string[]>;
}

interface ImageSpec {
  productId: string;
  variantId: string | null;
  label: string;
  prompt: string;
}

interface CollectionSpec {
  collectionId: string;
  label: string;
  prompt: string;
}

// ─── Catalogue produits ───────────────────────────────────────────────────────

const IMAGE_SPECS: ImageSpec[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // JOSE — KPSULL Streetwear urbain, coton bio, oversize, Paris, béton, brut
  // ══════════════════════════════════════════════════════════════════════════

  // ── T-Shirt Basique Premium ────────────────────────────────────────────────
  { productId: 'prod_new_tshirt_basique', variantId: null,                    label: 'tshirt-main-1',         prompt: 'editorial flat lay, premium organic cotton crew neck t-shirt on polished concrete slab, KPSULL streetwear brand, overhead studio lighting, Parisian urban aesthetic, ultra sharp fabric weave texture, minimalist streetwear product photography' },
  { productId: 'prod_new_tshirt_basique', variantId: null,                    label: 'tshirt-main-2',         prompt: 'ghost mannequin wearing premium organic cotton t-shirt, KPSULL streetwear basics, pure white studio, crisp crew neckline detail, soft shoulder shadow, urban streetwear e-commerce, invisible mannequin technique' },
  { productId: 'prod_new_tshirt_basique', variantId: null,                    label: 'tshirt-main-3',         prompt: 'model wearing relaxed organic cotton t-shirt tucked into wide cargo pants, Paris urban streetwear editorial, white studio with concrete texture floor, no face visible, waist-up shot, KPSULL brand' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_blanc',  label: 'tshirt-blanc-1',        prompt: 'ghost mannequin wearing off-white premium organic cotton t-shirt, KPSULL urban basics, white studio, minimal shadow, sharp fabric detail, streetwear e-commerce' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_blanc',  label: 'tshirt-blanc-2',        prompt: 'flat lay detail, crisp off-white cotton t-shirt collar and sleeve, smooth jersey texture on raw concrete, KPSULL streetwear, overhead macro product shot' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_noir',   label: 'tshirt-noir-1',         prompt: 'ghost mannequin wearing deep black organic cotton t-shirt, bold graphic silhouette, KPSULL streetwear, white studio with stark contrast, urban essentials' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_noir',   label: 'tshirt-noir-2',         prompt: 'flat lay, midnight black premium t-shirt perfectly spread on concrete floor, KPSULL urban collection, sharp overhead shot' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_marine', label: 'tshirt-marine-1',       prompt: 'ghost mannequin wearing deep navy blue organic cotton crew neck t-shirt, KPSULL streetwear, white studio, maritime-urban aesthetic, French streetwear brand' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_marine', label: 'tshirt-marine-2',       prompt: 'editorial flat lay, navy blue cotton t-shirt on pale concrete, KPSULL collection, top-down studio' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_rouge',  label: 'tshirt-rouge-1',        prompt: 'ghost mannequin wearing bold cherry red organic cotton t-shirt, KPSULL streetwear statement color, minimal white studio, vivid pop color' },
  { productId: 'prod_new_tshirt_basique', variantId: 'var_new_tshirt_rouge',  label: 'tshirt-rouge-2',        prompt: 'lifestyle, model wearing red t-shirt with dark cargo pants, Paris urban editorial, no face, waist up, KPSULL brand photography' },

  // ── Hoodie Premium Oversize ────────────────────────────────────────────────
  { productId: 'prod_new_hoodie_premium', variantId: null,                     label: 'hoodie-main-1',         prompt: 'editorial flat lay, oversized organic French terry hoodie with kangaroo pocket on raw concrete floor, KPSULL streetwear 2026, top-down minimalist studio light, premium fabric texture sharp, bold silhouette' },
  { productId: 'prod_new_hoodie_premium', variantId: null,                     label: 'hoodie-main-2',         prompt: 'ghost mannequin wearing oversized premium hoodie with drawstring and kangaroo pocket, KPSULL streetwear brand, white studio, soft drop shadow, urban oversize silhouette visible, invisible mannequin' },
  { productId: 'prod_new_hoodie_premium', variantId: null,                     label: 'hoodie-main-3',         prompt: 'model in oversized hoodie with hands in front pocket, Paris urban street editorial, hands in kangaroo pocket, concrete urban background soft blur, waist-up, no face, KPSULL brand' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_noir',    label: 'hoodie-noir-1',         prompt: 'ghost mannequin wearing oversized midnight black French terry hoodie, KPSULL streetwear, bold black silhouette, white studio with soft shadow' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_noir',    label: 'hoodie-noir-2',         prompt: 'flat lay, black hoodie spread on raw concrete, KPSULL urban brand, sharp overhead' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_blanc',   label: 'hoodie-blanc-1',        prompt: 'ghost mannequin wearing oversized pure white premium hoodie, KPSULL streetwear basics, white-on-white minimal studio, subtle shadow detail' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_blanc',   label: 'hoodie-blanc-2',        prompt: 'editorial flat lay, white hoodie on light marble, clean minimalist KPSULL product shot' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_ecru',    label: 'hoodie-ecru-1',         prompt: 'ghost mannequin wearing oversized ecru off-white hoodie, KPSULL collection, warm studio, natural cotton texture visible, French terry visible' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_ecru',    label: 'hoodie-ecru-2',         prompt: 'flat lay, ecru hoodie on pale linen surface, KPSULL streetwear, warm minimalist product shot' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_kaki',    label: 'hoodie-kaki-1',         prompt: 'ghost mannequin wearing oversized forest khaki green hoodie, KPSULL urban collection, military-street aesthetic, white studio' },
  { productId: 'prod_new_hoodie_premium', variantId: 'var_new_hoodie_kaki',    label: 'hoodie-kaki-2',         prompt: 'lifestyle model wearing khaki oversized hoodie, Paris street editorial, urban background blur, no face, waist up, KPSULL' },

  // ══════════════════════════════════════════════════════════════════════════
  // LUCAS — Design Studio, streetwear graphique, typography, street art bordelais
  // ══════════════════════════════════════════════════════════════════════════

  // ── Jogger Technique Performance ──────────────────────────────────────────
  { productId: 'prod_new_jogger_tech',   variantId: null,                      label: 'jogger-main-1',         prompt: 'editorial flat lay, technical stretch performance jogger pants with elastic waistband on polished concrete, Lucas Design Studio streetwear, top-down sharp studio light, technical fabric sheen detail' },
  { productId: 'prod_new_jogger_tech',   variantId: null,                      label: 'jogger-main-2',         prompt: 'ghost mannequin wearing technical jogger pants with side zip pockets, Lucas Design Studio, white studio background, tapered ankle cuff visible, athletic streetwear silhouette' },
  { productId: 'prod_new_jogger_tech',   variantId: null,                      label: 'jogger-main-3',         prompt: 'model wearing technical performance jogger from waist down, Bordeaux streetwear editorial, white studio floor, athletic standing pose, Lucas Design Studio' },
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_noir',     label: 'jogger-noir-1',         prompt: 'ghost mannequin wearing midnight black technical performance jogger, Lucas Design Studio, sharp contrast white studio, technical fabric details visible' },
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_noir',     label: 'jogger-noir-2',         prompt: 'flat lay, black stretch jogger on concrete, Lucas Design streetwear, overhead technical product shot' },
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_grey',     label: 'jogger-grey-1',         prompt: 'ghost mannequin wearing heather grey technical performance jogger, Lucas Design, white studio, marl fabric texture visible, athletic streetwear' },
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_grey',     label: 'jogger-grey-2',         prompt: 'flat lay, grey technical jogger on polished concrete, Lucas Design Studio, clean overhead shot' },
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_marine',   label: 'jogger-marine-1',       prompt: 'ghost mannequin wearing deep navy technical jogger with zip pockets, Lucas Design Studio, white studio, navy athletic streetwear, French brand' },
  { productId: 'prod_new_jogger_tech',   variantId: 'var_new_jogger_marine',   label: 'jogger-marine-2',       prompt: 'lifestyle, model in navy technical jogger with white sneakers, urban editorial, Bordeaux street style, no face, Lucas Design' },

  // ── Veste Coach Windbreaker ────────────────────────────────────────────────
  { productId: 'prod_new_veste_coach',   variantId: null,                      label: 'coach-main-1',          prompt: 'editorial flat lay, lightweight windbreaker coach jacket with YKK full zip on polished concrete, Lucas Design Studio streetwear, overhead studio, technical ripstop nylon texture sharp' },
  { productId: 'prod_new_veste_coach',   variantId: null,                      label: 'coach-main-2',          prompt: 'ghost mannequin wearing oversize coach windbreaker jacket with chest pocket, Lucas Design Studio, white studio, technical nylon sheen and zip detail, streetwear oversize silhouette' },
  { productId: 'prod_new_veste_coach',   variantId: null,                      label: 'coach-main-3',          prompt: 'model wearing windbreaker coach jacket open over graphic tee, Bordeaux street editorial, no face, three-quarter length, Lucas Design Studio urban photography' },
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_noir',      label: 'coach-noir-1',          prompt: 'ghost mannequin wearing black lightweight windbreaker coach jacket, Lucas Design Studio streetwear, minimal white studio, technical nylon sheen visible' },
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_noir',      label: 'coach-noir-2',          prompt: 'flat lay, black ripstop windbreaker on concrete, Lucas Design, overhead sharp product' },
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_vert',      label: 'coach-vert-1',          prompt: 'ghost mannequin wearing forest green windbreaker coach jacket, Lucas Design Studio, white studio, military-urban color, technical nylon texture' },
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_vert',      label: 'coach-vert-2',          prompt: 'lifestyle, model in forest green windbreaker with jogger, Bordeaux urban editorial, no face, Lucas Design' },
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_navy',      label: 'coach-navy-1',          prompt: 'ghost mannequin wearing navy blue full-zip windbreaker, Lucas Design Studio streetwear, white studio, classic nautical-urban color, French street style' },
  { productId: 'prod_new_veste_coach',   variantId: 'var_new_coach_navy',      label: 'coach-navy-2',          prompt: 'flat lay, navy windbreaker spread on polished concrete, Lucas Design Studio, clean overhead product photography' },

  // ── Longline Tee Graphique ─────────────────────────────────────────────────
  { productId: 'prod_new_longline_tee',  variantId: null,                      label: 'longline-main-1',       prompt: 'editorial flat lay, longline extended hem graphic t-shirt with exclusive back print on raw concrete, Lucas Design Studio streetwear, overhead dark studio light, heavy cotton 220g texture visible, artistic composition' },
  { productId: 'prod_new_longline_tee',  variantId: null,                      label: 'longline-main-2',       prompt: 'ghost mannequin wearing longline cotton t-shirt with extended curved hem reaching mid-thigh, Lucas Design Studio, white studio, graphic print detail visible, bold urban silhouette, invisible mannequin' },
  { productId: 'prod_new_longline_tee',  variantId: null,                      label: 'longline-main-3',       prompt: 'model wearing longline graphic tee, Bordeaux street editorial, waist-up with hint of print, urban wall background soft blur, no face, Lucas Design Studio' },
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_noir',   label: 'longline-noir-1',       prompt: 'ghost mannequin wearing midnight black longline cotton t-shirt, Lucas Design Studio, white studio, long drop hem silhouette, graphic streetwear' },
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_noir',   label: 'longline-noir-2',       prompt: 'flat lay, black longline tee on concrete, dramatic overhead, Lucas Design graphic product photography' },
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_blanc',  label: 'longline-blanc-1',      prompt: 'ghost mannequin wearing off-white longline cotton t-shirt with bold graphic print, Lucas Design Studio, white studio, curved extended hem detail' },
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_blanc',  label: 'longline-blanc-2',      prompt: 'lifestyle, model in white longline tee with print visible, Bordeaux urban editorial, no face, Lucas Design' },
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_gris',   label: 'longline-gris-1',       prompt: 'ghost mannequin wearing heather grey longline extended hem t-shirt, Lucas Design Studio streetwear, white studio, cotton marl texture' },
  { productId: 'prod_new_longline_tee',  variantId: 'var_new_longline_gris',   label: 'longline-gris-2',       prompt: 'flat lay, grey longline tee on concrete, Lucas Design, overhead product photography' },

  // ── Sweat Zip Technique ────────────────────────────────────────────────────
  { productId: 'prod_new_sweat_zip',     variantId: null,                      label: 'sweatzip-main-1',       prompt: 'editorial flat lay, full-zip French terry sweatshirt with YKK double-zip puller on oak wood surface, Lucas Design Studio, overhead studio light, premium cotton texture, ribbed hem and cuffs' },
  { productId: 'prod_new_sweat_zip',     variantId: null,                      label: 'sweatzip-main-2',       prompt: 'ghost mannequin wearing full-zip sweatshirt partially open showing interior, Lucas Design Studio, white studio, double zip puller and rib collar visible, streetwear casual silhouette' },
  { productId: 'prod_new_sweat_zip',     variantId: null,                      label: 'sweatzip-main-3',       prompt: 'model in half-zip sweatshirt over graphic tee, Bordeaux streetwear editorial, waist-up white studio, no face, Lucas Design Studio casual urban' },
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_noir',   label: 'sweatzip-noir-1',       prompt: 'ghost mannequin wearing black full-zip premium sweatshirt, Lucas Design Studio, white studio, YKK metal zipper detail sharp, urban streetwear' },
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_noir',   label: 'sweatzip-noir-2',       prompt: 'flat lay, black zip sweat on concrete, Lucas Design, sharp overhead product' },
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_gris',   label: 'sweatzip-gris-1',       prompt: 'ghost mannequin wearing heather grey full-zip sweatshirt, Lucas Design Studio, white studio, marl French terry texture, casual streetwear' },
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_gris',   label: 'sweatzip-gris-2',       prompt: 'flat lay, grey zip sweat spread on oak wood, Lucas Design, overhead warm studio' },
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_navy',   label: 'sweatzip-navy-1',       prompt: 'ghost mannequin wearing navy blue full-zip French terry sweatshirt, Lucas Design Studio, white studio, French streetwear aesthetic, zip hardware detail' },
  { productId: 'prod_new_sweat_zip',     variantId: 'var_new_sweatzip_navy',   label: 'sweatzip-navy-2',       prompt: 'lifestyle, model in navy zip sweat open, Bordeaux street editorial, no face, Lucas Design Studio' },

  // ══════════════════════════════════════════════════════════════════════════
  // CLAIRE — Mode vintage, pièces chinées, romantique bohème, Lyon
  // ══════════════════════════════════════════════════════════════════════════

  // ── Crop Top Athleisure Côtelé ─────────────────────────────────────────────
  { productId: 'prod_new_croptop',       variantId: null,                      label: 'croptop-main-1',        prompt: 'editorial flat lay, ribbed cotton stretch crop top on white linen surface, Claire Vintage collection, soft natural window light, ribbed texture detail, feminine basics photography' },
  { productId: 'prod_new_croptop',       variantId: null,                      label: 'croptop-main-2',        prompt: 'ghost mannequin wearing fitted ribbed crop top with adjustable straps, Claire Vintage basics, white studio, soft feminine silhouette, rib knit texture visible' },
  { productId: 'prod_new_croptop',       variantId: null,                      label: 'croptop-main-3',        prompt: 'model wearing ribbed crop top with vintage high-waist jeans, bohemian lifestyle photography, white studio, no face, waist-up, Claire Vintage aesthetic' },
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_blanc',   label: 'croptop-blanc-1',       prompt: 'ghost mannequin wearing crisp white ribbed stretch crop top, Claire Vintage basics, minimal white studio, soft feminine silhouette' },
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_blanc',   label: 'croptop-blanc-2',       prompt: 'flat lay, white ribbed crop top on pale linen, Claire Vintage, soft overhead natural light' },
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_noir',    label: 'croptop-noir-1',        prompt: 'ghost mannequin wearing sleek black ribbed crop top with adjustable straps, Claire Vintage, white studio, elegant feminine silhouette' },
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_noir',    label: 'croptop-noir-2',        prompt: 'flat lay, black ribbed crop top on ivory linen, Claire Vintage, soft studio light' },
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_rose',    label: 'croptop-rose-1',        prompt: 'ghost mannequin wearing dusty rose ribbed crop top, Claire Vintage feminine basics, warm studio, pastel feminine aesthetic, rib texture' },
  { productId: 'prod_new_croptop',       variantId: 'var_new_croptop_rose',    label: 'croptop-rose-2',        prompt: 'lifestyle, model in rose crop top with vintage skirt, soft pastel studio, bohemian feminine, no face, Claire Vintage' },

  // ── Pull Col Roulé Essentiel ───────────────────────────────────────────────
  { productId: 'prod_new_pull_colroule', variantId: null,                      label: 'pull-main-1',           prompt: 'editorial flat lay, fine merino wool turtleneck sweater carefully arranged on vintage oak surface, Claire Vintage autumn collection, soft warm window light, fine knit texture ultra sharp, rolled collar detail' },
  { productId: 'prod_new_pull_colroule', variantId: null,                      label: 'pull-main-2',           prompt: 'ghost mannequin wearing fine merino turtleneck sweater, Claire Vintage, warm white studio, rolled collar and ribbed cuffs visible, feminine silhouette, luxury knitwear product shot' },
  { productId: 'prod_new_pull_colroule', variantId: null,                      label: 'pull-main-3',           prompt: 'model wearing fine turtleneck sweater with vintage wide-leg trousers, Lyon winter editorial, soft studio, no face, chest up, Claire Vintage romantic aesthetic' },
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_creme',      label: 'pull-creme-1',          prompt: 'ghost mannequin wearing cream ecru fine merino turtleneck, Claire Vintage collection, warm studio, ivory wool texture, feminine winter essentials' },
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_creme',      label: 'pull-creme-2',          prompt: 'flat lay, cream wool turtleneck on aged wood, Claire Vintage, warm natural light detail' },
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_noir',       label: 'pull-noir-1',           prompt: 'ghost mannequin wearing midnight black fine wool turtleneck, Claire Vintage classic, white studio, elegant timeless feminine silhouette' },
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_noir',       label: 'pull-noir-2',           prompt: 'flat lay, black turtleneck sweater on linen surface, Claire Vintage, soft overhead light, knitwear texture' },
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_camel',      label: 'pull-camel-1',          prompt: 'ghost mannequin wearing warm camel brown fine merino turtleneck, Claire Vintage autumn, studio warm light, earth tone knitwear, French vintage feminine' },
  { productId: 'prod_new_pull_colroule', variantId: 'var_new_pull_camel',      label: 'pull-camel-2',          prompt: 'lifestyle, model in camel turtleneck with vintage trousers, Lyon autumn editorial, no face, chest up, Claire Vintage' },

  // ── Débardeur Oversize Coton ───────────────────────────────────────────────
  { productId: 'prod_new_debardeur',     variantId: null,                      label: 'debardeur-main-1',      prompt: 'editorial flat lay, oversized organic cotton tank top on white linen surface, Claire Vintage essentials, soft natural overhead light, jersey fabric drape detail' },
  { productId: 'prod_new_debardeur',     variantId: null,                      label: 'debardeur-main-2',      prompt: 'model wearing oversized cotton tank top tucked in high-waist vintage skirt, Lyon fashion editorial, white studio, no face, waist-up, Claire Vintage summer essentials' },
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_blanc', label: 'debardeur-blanc-1',     prompt: 'ghost mannequin wearing off-white oversized organic cotton tank top, Claire Vintage basics, minimal white studio, soft drape and wide strap detail' },
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_blanc', label: 'debardeur-blanc-2',     prompt: 'flat lay, white cotton tank top on pale linen, Claire Vintage, airy summer product shot' },
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_noir',  label: 'debardeur-noir-1',      prompt: 'ghost mannequin wearing black oversized cotton tank top with wide straps, Claire Vintage, white studio, elegant casual silhouette' },
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_noir',  label: 'debardeur-noir-2',      prompt: 'flat lay, black cotton debardeur on ivory linen, Claire Vintage, soft studio light' },
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_gris',  label: 'debardeur-gris-1',      prompt: 'ghost mannequin wearing heather grey oversized cotton tank top, Claire Vintage basics, white studio, marl jersey texture visible' },
  { productId: 'prod_new_debardeur',     variantId: 'var_new_debardeur_gris',  label: 'debardeur-gris-2',      prompt: 'lifestyle, model in grey tank top with vintage wide skirt, Lyon editorial, no face, Claire Vintage' },

  // ══════════════════════════════════════════════════════════════════════════
  // MARC — Accessories vintage, cuir patiné, horlogerie, Marseille
  // ══════════════════════════════════════════════════════════════════════════

  // ── Short Sport Premium 7" ─────────────────────────────────────────────────
  { productId: 'prod_new_short_sport',   variantId: null,                      label: 'short-main-1',          prompt: 'editorial flat lay, lightweight technical sport shorts on white marble surface, Marc Accessories sport collection, overhead studio light, recycled polyester mesh weave visible, athletic product photography' },
  { productId: 'prod_new_short_sport',   variantId: null,                      label: 'short-main-2',          prompt: 'ghost mannequin wearing technical sport shorts with inner mesh lining, Marc Accessories, white studio, athletic silhouette, waist elastic detail' },
  { productId: 'prod_new_short_sport',   variantId: null,                      label: 'short-main-3',          prompt: 'model wearing sport shorts for running, Marseille urban athletic editorial, from waist down, white studio, active pose, Marc Accessories' },
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_noir',      label: 'short-noir-1',          prompt: 'ghost mannequin wearing black lightweight sport shorts, Marc Accessories, white studio, technical fabric sheen, athletic minimalist' },
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_noir',      label: 'short-noir-2',          prompt: 'flat lay, black technical sport shorts on marble, Marc Accessories, sharp overhead product' },
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_grey',      label: 'short-grey-1',          prompt: 'ghost mannequin wearing heather grey technical sport shorts, Marc Accessories athletic, white studio, marl performance fabric visible' },
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_grey',      label: 'short-grey-2',          prompt: 'flat lay, grey sport shorts on white marble, Marc Accessories, clean overhead studio' },
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_bleu',      label: 'short-bleu-1',          prompt: 'ghost mannequin wearing cobalt blue technical sport shorts, Marc Accessories, bold sports color, white studio, active athletic photography' },
  { productId: 'prod_new_short_sport',   variantId: 'var_new_short_bleu',      label: 'short-bleu-2',          prompt: 'lifestyle, model in blue shorts with white trainers, Marseille athletic editorial, waist-down, no face, Marc Accessories' },

  // ── Legging Sport Taille Haute ─────────────────────────────────────────────
  { productId: 'prod_new_legging_sport', variantId: null,                      label: 'legging-main-1',        prompt: 'editorial flat lay, high-waist compression performance leggings on white marble surface, Marc Accessories activewear, overhead studio, technical recycled fabric texture visible' },
  { productId: 'prod_new_legging_sport', variantId: null,                      label: 'legging-main-2',        prompt: 'ghost mannequin wearing high-waist compression sport leggings, Marc Accessories, white studio, wide waistband and flatlock seam details, full-length silhouette' },
  { productId: 'prod_new_legging_sport', variantId: null,                      label: 'legging-main-3',        prompt: 'model wearing high-waist compression leggings, athletic pose, Marseille fitness editorial, waist-down, white studio, Marc Accessories women sportswear' },
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_noir',    label: 'legging-noir-1',        prompt: 'ghost mannequin wearing midnight black high-waist compression leggings, Marc Accessories, white studio, sharp contrast, flatlock seam and waistband detail' },
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_noir',    label: 'legging-noir-2',        prompt: 'flat lay, black compression leggings on marble, Marc Accessories, overhead product shot' },
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_marine',  label: 'legging-marine-1',      prompt: 'ghost mannequin wearing navy blue high-waist performance leggings, Marc Accessories activewear, white studio, technical fabric sheen' },
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_marine',  label: 'legging-marine-2',      prompt: 'flat lay, navy compression leggings on white marble, Marc Accessories, clean overhead' },
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_rose',    label: 'legging-rose-1',        prompt: 'ghost mannequin wearing dusty rose high-waist compression leggings, Marc Accessories feminine activewear, white studio, soft pink sports aesthetic' },
  { productId: 'prod_new_legging_sport', variantId: 'var_new_legging_rose',    label: 'legging-rose-2',        prompt: 'lifestyle, model in rose leggings in yoga pose, soft studio light, no face, Marc Accessories women' },

  // ══════════════════════════════════════════════════════════════════════════
  // JOSE — Produits originaux avec variantes
  // ══════════════════════════════════════════════════════════════════════════

  { productId: 'prod_jose_hoodie_noir',     variantId: null,                       label: 'jose-hoodie-main-1',    prompt: 'editorial flat lay, oversized organic bio cotton hoodie on raw concrete slab, KPSULL brand, top-down industrial studio light, 350g French terry texture ultra sharp' },
  { productId: 'prod_jose_hoodie_noir',     variantId: null,                       label: 'jose-hoodie-main-2',    prompt: 'ghost mannequin wearing KPSULL oversized hoodie, pure white studio, bold silhouette with kangaroo pocket, drawstring detail, urban streetwear' },
  { productId: 'prod_jose_hoodie_noir',     variantId: 'var_jose_hoodie_blk',      label: 'jose-hoodie-blk-1',     prompt: 'ghost mannequin wearing deep black KPSULL oversized hoodie, white studio, bold dark silhouette, premium cotton French terry visible' },
  { productId: 'prod_jose_hoodie_noir',     variantId: 'var_jose_hoodie_grey',     label: 'jose-hoodie-grey-1',    prompt: 'ghost mannequin wearing heather grey chiné KPSULL oversized hoodie, white studio, medium grey color, premium French terry, soft shoulder shadow' },

  { productId: 'prod_jose_tshirt_graphic',  variantId: null,                       label: 'jose-tsgraph-main-1',   prompt: 'editorial flat lay, organic cotton graphic t-shirt with Antidote bold print, KPSULL streetwear brand, raw concrete, overhead dark studio light, print visible, heavy cotton texture' },
  { productId: 'prod_jose_tshirt_graphic',  variantId: null,                       label: 'jose-tsgraph-main-2',   prompt: 'ghost mannequin wearing KPSULL Antidote graphic tee, print visible on back, white studio, bold streetwear statement piece' },
  { productId: 'prod_jose_tshirt_graphic',  variantId: 'var_jose_ts_white',        label: 'jose-ts-white-1',       prompt: 'ghost mannequin wearing white KPSULL Antidote graphic t-shirt, white studio, bold black print contrast, organic cotton, Parisian streetwear' },
  { productId: 'prod_jose_tshirt_graphic',  variantId: 'var_jose_ts_black',        label: 'jose-ts-black-1',       prompt: 'ghost mannequin wearing black KPSULL Antidote tee with white print, white studio, bold graphic t-shirt, urban streetwear' },
  { productId: 'prod_jose_tshirt_graphic',  variantId: 'var_jose_ts_grey',         label: 'jose-ts-grey-1',        prompt: 'ghost mannequin wearing grey chiné KPSULL Antidote graphic t-shirt, white studio, subtle print visible, French organic cotton, streetwear brand' },

  { productId: 'prod_jose_bomber',          variantId: null,                       label: 'jose-bomber-main-1',    prompt: 'editorial flat lay, quilted satin-lined bomber jacket with YKK zip on marble surface, KPSULL streetwear, top-down studio light, matelassé stitching detail' },
  { productId: 'prod_jose_bomber',          variantId: null,                       label: 'jose-bomber-main-2',    prompt: 'ghost mannequin wearing KPSULL quilted bomber jacket, white studio, satin-sheen lining visible at cuffs, bold urban outerwear silhouette' },
  { productId: 'prod_jose_bomber',          variantId: 'var_jose_bomber_black',    label: 'jose-bomber-blk-1',     prompt: 'ghost mannequin wearing sleek black quilted bomber, KPSULL streetwear, white studio, satin-look polyester sheen, minimal shadow' },
  { productId: 'prod_jose_bomber',          variantId: 'var_jose_bomber_khaki',    label: 'jose-bomber-kaki-1',    prompt: 'ghost mannequin wearing khaki military-green quilted bomber, KPSULL streetwear, white studio, military-urban aesthetic, matelassé stitching' },

  { productId: 'prod_jose_sweat',           variantId: null,                       label: 'jose-sweat-main-1',     prompt: 'editorial flat lay, classic organic cotton sweat col rond on raw concrete, KPSULL basics, overhead studio, 320g French terry visible' },
  { productId: 'prod_jose_sweat',           variantId: null,                       label: 'jose-sweat-main-2',     prompt: 'ghost mannequin wearing KPSULL organic cotton crewneck sweatshirt, white studio, clean collar and cuff ribbing, streetwear essentials' },
  { productId: 'prod_jose_sweat',           variantId: 'var_jose_sweat_grey',      label: 'jose-sweat-grey-1',     prompt: 'ghost mannequin wearing grey chiné KPSULL crewneck sweat, white studio, heather grey cotton, organic French terry texture' },
  { productId: 'prod_jose_sweat',           variantId: 'var_jose_sweat_black',     label: 'jose-sweat-blk-1',      prompt: 'ghost mannequin wearing midnight black KPSULL crewneck sweat, white studio, bold dark color, premium French terry' },
  { productId: 'prod_jose_sweat',           variantId: 'var_jose_sweat_white',     label: 'jose-sweat-wht-1',      prompt: 'ghost mannequin wearing off-white KPSULL crewneck sweat, white studio, ivory cotton, clean minimal look, premium organic' },

  { productId: 'prod_jose_bonnet',          variantId: null,                       label: 'jose-bonnet-main-1',    prompt: 'editorial product shot, hand-knitted merino wool beanie on raw concrete, KPSULL accessories, overhead studio, fine merino knit stitch detail' },
  { productId: 'prod_jose_bonnet',          variantId: 'var_jose_bonnet_grey',     label: 'jose-bonnet-grey-1',    prompt: 'ghost mannequin wearing heather grey merino wool beanie, KPSULL accessories, white studio, fine knit stitch, soft winter accessory' },
  { productId: 'prod_jose_bonnet',          variantId: 'var_jose_bonnet_black',    label: 'jose-bonnet-blk-1',     prompt: 'ghost mannequin wearing midnight black merino beanie, KPSULL accessories, white studio, sleek urban winter cap' },
  { productId: 'prod_jose_bonnet',          variantId: 'var_jose_bonnet_navy',     label: 'jose-bonnet-navy-1',    prompt: 'ghost mannequin wearing deep navy merino wool beanie, KPSULL accessories, white studio, French streetwear accessory' },

  { productId: 'prod_jose_casquette',       variantId: null,                       label: 'jose-casq-main-1',      prompt: 'editorial product shot, 5-panel embroidered KPSULL cap on concrete surface, overhead studio light, embroidery and metal buckle detail' },
  { productId: 'prod_jose_casquette',       variantId: 'var_jose_cap_black',       label: 'jose-cap-blk-1',        prompt: 'ghost mannequin wearing black KPSULL embroidered 5-panel cap, white studio, logo embroidery visible, metal closure' },
  { productId: 'prod_jose_casquette',       variantId: 'var_jose_cap_white',       label: 'jose-cap-wht-1',        prompt: 'ghost mannequin wearing white KPSULL embroidered cap, white studio, clean white cap with logo embroidery, minimal urban' },

  // ══════════════════════════════════════════════════════════════════════════
  // LUCAS — Produits originaux avec variantes
  // ══════════════════════════════════════════════════════════════════════════

  { productId: 'prod_lucas_hoodie_art',     variantId: null,                       label: 'lucas-hoodie-main-1',   prompt: 'editorial flat lay, oversized organic cotton hoodie with all-over street art print on polished concrete, Lucas Design Studio, overhead dramatic studio light, graphic print detail visible' },
  { productId: 'prod_lucas_hoodie_art',     variantId: null,                       label: 'lucas-hoodie-main-2',   prompt: 'ghost mannequin wearing Lucas Design Studio Urban Canvas hoodie, white studio, all-over street art graphic print, bold artistic statement piece, Bordeaux streetwear' },
  { productId: 'prod_lucas_hoodie_art',     variantId: 'var_lucas_hoodie_black',   label: 'lucas-hoodie-blk-1',    prompt: 'ghost mannequin wearing black Lucas Design Urban Canvas all-over print hoodie, white studio, dramatic dark base with graphic art print' },
  { productId: 'prod_lucas_hoodie_art',     variantId: 'var_lucas_hoodie_white',   label: 'lucas-hoodie-wht-1',    prompt: 'ghost mannequin wearing white Lucas Design Urban Canvas hoodie with dark graphic print, white studio, maximum print contrast, street art aesthetic' },

  { productId: 'prod_lucas_tshirt_typo',    variantId: null,                       label: 'lucas-tstypo-main-1',   prompt: 'editorial flat lay, organic cotton t-shirt with exclusive bold typography print on concrete, Lucas Design Studio, overhead studio, 180g cotton, bold lettering visible' },
  { productId: 'prod_lucas_tshirt_typo',    variantId: null,                       label: 'lucas-tstypo-main-2',   prompt: 'ghost mannequin wearing Lucas Design exclusive typography t-shirt, white studio, bold typographic print prominent, artistic streetwear statement' },
  { productId: 'prod_lucas_tshirt_typo',    variantId: 'var_lucas_ts_white',       label: 'lucas-ts-wht-1',        prompt: 'ghost mannequin wearing white organic t-shirt with bold black typography, Lucas Design Studio, white studio, maximum type contrast' },
  { productId: 'prod_lucas_tshirt_typo',    variantId: 'var_lucas_ts_black',       label: 'lucas-ts-blk-1',        prompt: 'ghost mannequin wearing black Lucas Design typo t-shirt with white lettering, white studio, bold graphic streetwear' },
  { productId: 'prod_lucas_tshirt_typo',    variantId: 'var_lucas_ts_ecru',        label: 'lucas-ts-ecru-1',       prompt: 'ghost mannequin wearing ecru organic cotton typo t-shirt, Lucas Design Studio, warm studio, warm ecru with dark print, artistic streetwear' },

  { productId: 'prod_lucas_short_mesh',     variantId: null,                       label: 'lucas-short-main-1',    prompt: 'editorial flat lay, recycled polyester basketball mesh short with lateral printed bands on concrete, Lucas Design Studio, overhead sharp studio, mesh fabric weave visible' },
  { productId: 'prod_lucas_short_mesh',     variantId: null,                       label: 'lucas-short-main-2',    prompt: 'ghost mannequin wearing Lucas Design basketball mesh short, white studio, lateral stripe detail and mesh construction visible, urban athletic streetwear' },
  { productId: 'prod_lucas_short_mesh',     variantId: 'var_lucas_short_black',    label: 'lucas-short-blk-1',     prompt: 'ghost mannequin wearing black mesh basketball short, Lucas Design Studio, white studio, technical mesh fabric, urban athletic' },
  { productId: 'prod_lucas_short_mesh',     variantId: 'var_lucas_short_navy',     label: 'lucas-short-navy-1',    prompt: 'ghost mannequin wearing navy basketball mesh short with lateral stripes, Lucas Design Studio, white studio, French urban athletic' },

  { productId: 'prod_lucas_veste_jean',     variantId: null,                       label: 'lucas-jean-main-1',     prompt: 'editorial flat lay, vintage denim jacket with custom hand-stitched patches and embroidery on wood surface, Lucas Design Studio, warm studio light, artisan detail visible' },
  { productId: 'prod_lucas_veste_jean',     variantId: null,                       label: 'lucas-jean-main-2',     prompt: 'ghost mannequin wearing heavily customized vintage denim jacket with patches and hand embroidery, Lucas Design Studio, white studio, artisan one-of-a-kind streetwear piece' },
  { productId: 'prod_lucas_veste_jean',     variantId: 'var_lucas_jean_blue',      label: 'lucas-jean-blue-1',     prompt: 'ghost mannequin wearing blue denim customized jacket with patches, Lucas Design Studio, white studio, classic indigo denim with artistic embellishments' },
  { productId: 'prod_lucas_veste_jean',     variantId: 'var_lucas_jean_black',     label: 'lucas-jean-blk-1',      prompt: 'ghost mannequin wearing black denim customized jacket with patches and embroidery, Lucas Design Studio, dark base denim, artisan streetwear' },

  // ══════════════════════════════════════════════════════════════════════════
  // CLAIRE — Produits originaux avec variantes
  // ══════════════════════════════════════════════════════════════════════════

  { productId: 'prod_claire_robe_70s',      variantId: null,                       label: 'claire-robe-main-1',    prompt: 'editorial flat lay, vintage 1970s bohemian floral midi dress on aged wooden floor, Claire Vintage, soft natural window light, fluid viscose fabric drape, romantic vintage aesthetic' },
  { productId: 'prod_claire_robe_70s',      variantId: null,                       label: 'claire-robe-main-2',    prompt: 'ghost mannequin wearing vintage 1970s bohemian floral midi dress with macramé belt, Claire Vintage curated, white studio, flowing fluid fabric, romantic silhouette' },
  { productId: 'prod_claire_robe_70s',      variantId: 'var_claire_robe_floral',   label: 'claire-robe-floral-1',  prompt: 'ghost mannequin wearing bold floral print 1970s bohemian midi dress, Claire Vintage, white studio, romantic flowing vintage silhouette' },
  { productId: 'prod_claire_robe_70s',      variantId: 'var_claire_robe_bleu',     label: 'claire-robe-bleu-1',    prompt: 'ghost mannequin wearing blue 1970s bohemian midi dress, Claire Vintage, white studio, fluid blue vintage silhouette, French vintage romantic' },

  { productId: 'prod_claire_blazer_xl',     variantId: null,                       label: 'claire-blazer-main-1',  prompt: 'editorial flat lay, oversized 1990s prince-de-galles plaid blazer with structured shoulders on aged oak surface, Claire Vintage, warm studio light, wool blend fabric texture visible' },
  { productId: 'prod_claire_blazer_xl',     variantId: null,                       label: 'claire-blazer-main-2',  prompt: 'ghost mannequin wearing oversized 90s power blazer with padded shoulders, Claire Vintage, white studio, classic vintage power dressing silhouette' },
  { productId: 'prod_claire_blazer_xl',     variantId: 'var_claire_blazer_pdg',    label: 'claire-blazer-pdg-1',   prompt: 'ghost mannequin wearing oversized prince-de-galles plaid 90s blazer, Claire Vintage, white studio, vintage power silhouette, classic check pattern' },
  { productId: 'prod_claire_blazer_xl',     variantId: 'var_claire_blazer_noir',   label: 'claire-blazer-noir-1',  prompt: 'ghost mannequin wearing oversized black 90s vintage blazer, Claire Vintage, white studio, bold dark vintage power dressing' },

  { productId: 'prod_claire_pull_mohair',   variantId: null,                       label: 'claire-mohair-main-1',  prompt: 'editorial flat lay, luxurious mohair Italian knit oversized sweater on ivory linen, Claire Vintage autumn, soft window light, fluffy mohair texture detail, pastel palette' },
  { productId: 'prod_claire_pull_mohair',   variantId: null,                       label: 'claire-mohair-main-2',  prompt: 'ghost mannequin wearing oversized fluffy Italian mohair sweater, Claire Vintage, warm studio, luxurious mohair halo texture visible, romantic feminine silhouette' },
  { productId: 'prod_claire_pull_mohair',   variantId: 'var_claire_pull_rose',     label: 'claire-mohair-rose-1',  prompt: 'ghost mannequin wearing pink powder rose mohair sweater, Claire Vintage, warm studio, pink fluffy mohair halo, feminine romantic vintage' },
  { productId: 'prod_claire_pull_mohair',   variantId: 'var_claire_pull_blanc',    label: 'claire-mohair-wht-1',   prompt: 'ghost mannequin wearing off-white creamy mohair oversized sweater, Claire Vintage, warm studio, ivory mohair luxury, vintage feminine' },
  { productId: 'prod_claire_pull_mohair',   variantId: 'var_claire_pull_bleu',     label: 'claire-mohair-bleu-1',  prompt: 'ghost mannequin wearing sky blue mohair oversized sweater, Claire Vintage, warm studio, pastel blue fluffy mohair, delicate feminine vintage' },

  // ══════════════════════════════════════════════════════════════════════════
  // 4 NOUVEAUX PRODUITS AVEC VARIANTES
  // ══════════════════════════════════════════════════════════════════════════

  // ── Pantalon Jogging Velours — Jose Essentiels ────────────────────────────
  { productId: 'prod_new_pantalon_velours', variantId: null,                       label: 'velours-main-1',        prompt: 'editorial flat lay, velvet velour jogger pants with side seam on raw concrete, KPSULL streetwear luxury basics, overhead studio, velvet pile texture ultra sharp, plush surface' },
  { productId: 'prod_new_pantalon_velours', variantId: null,                       label: 'velours-main-2',        prompt: 'ghost mannequin wearing velour velvet jogger pants with elastic waist, KPSULL streetwear, white studio, luxurious velvet sheen silhouette' },
  { productId: 'prod_new_pantalon_velours', variantId: 'var_new_velours_noir',     label: 'velours-noir-1',        prompt: 'ghost mannequin wearing midnight black velvet velour jogger pants, KPSULL streetwear, white studio, rich dark velvet sheen, urban luxury basics' },
  { productId: 'prod_new_pantalon_velours', variantId: 'var_new_velours_noir',     label: 'velours-noir-2',        prompt: 'flat lay, black velvet jogger on concrete, KPSULL, sharp velvet pile texture overhead' },
  { productId: 'prod_new_pantalon_velours', variantId: 'var_new_velours_bordeaux', label: 'velours-bordeaux-1',    prompt: 'ghost mannequin wearing deep burgundy bordeaux velvet velour jogger, KPSULL streetwear, white studio, rich dark red velvet, urban luxury color' },
  { productId: 'prod_new_pantalon_velours', variantId: 'var_new_velours_bordeaux', label: 'velours-bordeaux-2',    prompt: 'lifestyle, model in bordeaux velvet jogger with white tee, Paris urban editorial, waist-down, no face, KPSULL' },

  // ── Mug Artisanal Collection — Sophie Terre ───────────────────────────────
  { productId: 'prod_new_mug_artisanal',   variantId: null,                       label: 'mug-main-1',            prompt: 'handcrafted artisan stoneware mug on aged oak wood, Sophie Céramique studio, warm natural morning light, earthy glaze texture visible, artisan pottery product shot, wabi-sabi aesthetic' },
  { productId: 'prod_new_mug_artisanal',   variantId: null,                       label: 'mug-main-2',            prompt: 'artisan ceramic mug with visible throwing lines and hand-finished rim, Sophie Céramique, white studio with linen background, ceramic craft photography, Vallauris pottery studio' },
  { productId: 'prod_new_mug_artisanal',   variantId: 'var_new_mug_gris',         label: 'mug-gris-1',            prompt: 'Sophie Céramique handcrafted stoneware mug, grey pearl celadon glaze, artisan studio photography, natural oak surface, warm light, handmade ceramic details' },
  { productId: 'prod_new_mug_artisanal',   variantId: 'var_new_mug_gris',         label: 'mug-gris-2',            prompt: 'artisan grey glazed mug with coffee steam, cozy studio lifestyle, oak surface, Sophie Céramique, warm morning light' },
  { productId: 'prod_new_mug_artisanal',   variantId: 'var_new_mug_bleu',         label: 'mug-bleu-1',            prompt: 'Sophie Céramique handcrafted mug, slate blue artisan glaze, natural studio light on linen, wabi-sabi ceramic aesthetic, Vallauris pottery' },
  { productId: 'prod_new_mug_artisanal',   variantId: 'var_new_mug_bleu',         label: 'mug-bleu-2',            prompt: 'blue glazed stoneware mug, hand-thrown ceramic with textured surface, Sophie Céramique, artisan tableware photography' },
  { productId: 'prod_new_mug_artisanal',   variantId: 'var_new_mug_sable',        label: 'mug-sable-1',           prompt: 'Sophie Céramique handcrafted mug, warm sandy beige glaze, artisan studio, natural warm light, earthy ceramic aesthetic, handmade pottery' },
  { productId: 'prod_new_mug_artisanal',   variantId: 'var_new_mug_sable',        label: 'mug-sable-2',           prompt: 'sand-glazed artisan mug with honey tones, Sophie Céramique, natural linen styling, warm studio morning light' },

  // ── Pochette Cuir Vintage — Marc Maroquinerie ─────────────────────────────
  { productId: 'prod_new_pochette_cuir',   variantId: null,                       label: 'pochette-main-1',       prompt: 'editorial product shot, vintage leather zip pochette on aged cognac leather surface, Marc Accessories, dramatic studio light, vegetable-tanned leather grain detail' },
  { productId: 'prod_new_pochette_cuir',   variantId: null,                       label: 'pochette-main-2',       prompt: 'artisan leather zip pochette showing stitching and hardware detail, Marc Accessories vintage craft, white studio, aged brass zipper, leather craftsmanship' },
  { productId: 'prod_new_pochette_cuir',   variantId: 'var_new_pochette_naturel', label: 'pochette-naturel-1',    prompt: 'vintage vegetable-tanned natural leather pochette, Marc Accessories, aged oak wood surface, warm studio, natural grain and patina visible' },
  { productId: 'prod_new_pochette_cuir',   variantId: 'var_new_pochette_noir',    label: 'pochette-noir-1',       prompt: 'sleek black patinated leather zip pochette, Marc Accessories vintage, white studio, classic dark leather craft' },
  { productId: 'prod_new_pochette_cuir',   variantId: 'var_new_pochette_cognac',  label: 'pochette-cognac-1',     prompt: 'warm cognac vintage leather pochette, Marc Accessories, aged wood surface, rich amber patina, artisan craft photography' },

  // ── Bomber Graphique Capsule — Lucas Capsule ──────────────────────────────
  { productId: 'prod_new_bomber_capsule',  variantId: null,                       label: 'bomber-caps-main-1',    prompt: 'editorial flat lay, artist-print bomber jacket with painted collar on concrete, Lucas Design Studio capsule collection, overhead dramatic light, graphic artistic exterior visible' },
  { productId: 'prod_new_bomber_capsule',  variantId: null,                       label: 'bomber-caps-main-2',    prompt: 'ghost mannequin wearing oversized bomber jacket with bold graphic collar prints, Lucas Design Studio capsule collection, white studio, artistic statement outerwear' },
  { productId: 'prod_new_bomber_capsule',  variantId: null,                       label: 'bomber-caps-main-3',    prompt: 'model wearing Lucas Design Studio graphic bomber jacket, Bordeaux street art editorial, no face, urban background, capsule limited collection' },
  { productId: 'prod_new_bomber_capsule',  variantId: 'var_new_bomber_noir_caps', label: 'bomber-caps-noir-1',    prompt: 'ghost mannequin wearing black bomber with artistic graphic collar, Lucas Design Capsule, white studio, bold dark base with art print accents' },
  { productId: 'prod_new_bomber_capsule',  variantId: 'var_new_bomber_noir_caps', label: 'bomber-caps-noir-2',    prompt: 'flat lay, black graphic bomber on concrete, Lucas Design Capsule, overhead artistic product' },
  { productId: 'prod_new_bomber_capsule',  variantId: 'var_new_bomber_ecru_caps', label: 'bomber-caps-ecru-1',    prompt: 'ghost mannequin wearing ecru off-white graphic bomber jacket, Lucas Design Capsule collection, white studio, warm base with bold print collar' },
  { productId: 'prod_new_bomber_capsule',  variantId: 'var_new_bomber_ecru_caps', label: 'bomber-caps-ecru-2',    prompt: 'lifestyle, model in ecru graphic bomber, Bordeaux urban editorial, no face, Lucas Design Capsule' },
  { productId: 'prod_new_bomber_capsule',  variantId: 'var_new_bomber_kaki_caps', label: 'bomber-caps-kaki-1',    prompt: 'ghost mannequin wearing khaki green artist-print bomber, Lucas Design Capsule, white studio, military-graphic aesthetic, statement capsule piece' },
  { productId: 'prod_new_bomber_capsule',  variantId: 'var_new_bomber_kaki_caps', label: 'bomber-caps-kaki-2',    prompt: 'flat lay, kaki graphic bomber on polished concrete, Lucas Design Capsule, dramatic overhead shot' },

  // ══════════════════════════════════════════════════════════════════════════
  // JOSE — Produits originaux sans specs (ajout)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Pantalon Cargo Kaki ────────────────────────────────────────────────────
  { productId: 'prod_jose_pantalon_cargo', variantId: null, label: 'jose-cargo-main-1', prompt: 'editorial flat lay, oversized khaki cargo pants with large side pockets and reinforced knees on raw concrete slab, KPSULL Paris streetwear, overhead industrial studio light, heavy cotton twill texture ultra sharp, urban workwear aesthetic' },
  { productId: 'prod_jose_pantalon_cargo', variantId: null, label: 'jose-cargo-main-2', prompt: 'ghost mannequin wearing baggy khaki cargo pants with multiple utility pockets, KPSULL Paris streetwear, white studio, wide-leg silhouette, military-urban workwear, drawstring ankle cuff detail visible, invisible mannequin technique' },

  // ── Tote Bag Canvas KPSULL ────────────────────────────────────────────────
  { productId: 'prod_jose_tote', variantId: null, label: 'jose-tote-main-1', prompt: 'editorial product shot, heavy canvas tote bag with KPSULL embroidered logo on raw concrete surface, overhead studio light, thick natural cotton canvas grain detail, structured French streetwear accessory' },
  { productId: 'prod_jose_tote', variantId: null, label: 'jose-tote-main-2', prompt: 'lifestyle, canvas tote bag hanging on concrete wall hook, KPSULL Paris brand, natural light, unbleached cotton canvas texture, interior visible showing depth, urban accessories photography' },

  // ══════════════════════════════════════════════════════════════════════════
  // SOPHIE — Produits originaux sans specs (ajout)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Bol Raku Terre & Feu ──────────────────────────────────────────────────
  { productId: 'prod_sophie_bol_raku', variantId: null, label: 'sophie-bol-raku-1', prompt: 'handcrafted raku stoneware bowl with copper and metallic iridescent glaze on aged oak wood surface, Sophie Céramique Vallauris studio, soft warm natural window light, artisan raku pottery, wabi-sabi ceramic aesthetic, unique firing marks visible' },
  { productId: 'prod_sophie_bol_raku', variantId: null, label: 'sophie-bol-raku-2', prompt: 'close-up detail of raku ceramic bowl showing copper metallic glaze texture and crackle finish, Sophie Céramique, warm studio light on linen background, handmade pottery craft photography, unique artisan piece' },

  // ── Vase Bleu Cobalt ─────────────────────────────────────────────────────
  { productId: 'prod_sophie_vase_bleu', variantId: null, label: 'sophie-vase-bleu-1', prompt: 'tall handcrafted porcelain vase with deep cobalt blue glaze on white linen surface, Sophie Céramique, soft natural side light, smooth porcelain throwing lines visible, wabi-sabi artisan pottery, Vallauris ceramic studio atmosphere' },
  { productId: 'prod_sophie_vase_bleu', variantId: null, label: 'sophie-vase-bleu-2', prompt: 'porcelain vase cobalt blue glaze with dried botanicals arrangement, Sophie Céramique lifestyle photography, warm natural morning light, oak table surface, artisan ceramic tableware, French pottery studio' },

  // ── Duo de Tasses Espresso ────────────────────────────────────────────────
  { productId: 'prod_sophie_tasse_duo', variantId: null, label: 'sophie-tasse-duo-1', prompt: 'pair of handcrafted white stoneware espresso cups on aged oak saucer, Sophie Céramique, warm morning studio light, fine stoneware throwing lines, artisan coffee set, wabi-sabi ceramic aesthetic, Vallauris pottery' },
  { productId: 'prod_sophie_tasse_duo', variantId: null, label: 'sophie-tasse-duo-2', prompt: 'close-up two artisan stoneware espresso cups arranged on linen cloth, Sophie Céramique, soft natural light, handmade ceramic pair, visible throwing marks and glaze drips, artisan pottery product photography' },

  // ── Assiette Plate Wabi-Sabi ──────────────────────────────────────────────
  { productId: 'prod_sophie_assiette', variantId: null, label: 'sophie-assiette-1', prompt: 'handmade chamotte stoneware flat plate with irregular organic rim on aged oak wood, Sophie Céramique Vallauris, soft natural window light overhead, wabi-sabi ceramic aesthetics, coarse stoneware texture, artisan tableware product photography' },
  { productId: 'prod_sophie_assiette', variantId: null, label: 'sophie-assiette-2', prompt: 'artisan wabi-sabi stoneware dinner plate with matte glaze, styled with linen napkin on oak dining table, Sophie Céramique, warm morning light, handmade imperfect rim detail, French artisan ceramics' },

  // ── Bougeoir Sculpté ──────────────────────────────────────────────────────
  { productId: 'prod_sophie_bougeoir', variantId: null, label: 'sophie-bougeoir-1', prompt: 'sculptural matte black stoneware candle holder with textured hand-carved surface on raw concrete, Sophie Céramique, dramatic sidelight, artisan ceramic object, wabi-sabi dark clay aesthetic, unique fired stoneware piece' },
  { productId: 'prod_sophie_bougeoir', variantId: null, label: 'sophie-bougeoir-2', prompt: 'matte black ceramic candle holder with lit taper candle casting warm shadow, Sophie Céramique lifestyle photography, warm amber studio light, sculptural handmade object, linen background, artisan home decor' },

  // ══════════════════════════════════════════════════════════════════════════
  // LUCAS — Produits originaux sans specs (ajout)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Sac Banane Réflectif 3M ───────────────────────────────────────────────
  { productId: 'prod_lucas_sac_banane', variantId: null, label: 'lucas-banane-1', prompt: 'editorial flat lay, technical 3M reflective crossbody hip bag on polished concrete, Lucas Design Studio streetwear, overhead dramatic studio light with flash to show silver reflective panels, ripstop nylon stitching detail, urban utility accessory' },
  { productId: 'prod_lucas_sac_banane', variantId: null, label: 'lucas-banane-2', prompt: 'ghost mannequin with 3M reflective waist bag worn across chest, Lucas Design Studio, white studio, reflective panel sheen visible, YKK zip and clip hardware detail, urban streetwear accessory Bordeaux style' },

  // ══════════════════════════════════════════════════════════════════════════
  // CLAIRE — Produits originaux sans specs (ajout)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Jupe Plissée Écossaise ────────────────────────────────────────────────
  { productId: 'prod_claire_jupe_plissee', variantId: null, label: 'claire-jupe-plissee-1', prompt: 'editorial flat lay, vintage Scottish tartan plaid pleated midi skirt carefully arranged on aged wooden floor, Claire Vintage Lyon, soft natural window light, classic tartan check pattern visible, wool blend fabric drape, romantic bohemian vintage aesthetic' },
  { productId: 'prod_claire_jupe_plissee', variantId: null, label: 'claire-jupe-plissee-2', prompt: 'ghost mannequin wearing vintage tartan plaid pleated midi skirt, Claire Vintage curated pieces, white studio, flowing pleats and classic Scottish check pattern, romantic feminine vintage silhouette, Lyon vintage boutique aesthetic' },

  // ══════════════════════════════════════════════════════════════════════════
  // MARC — Produits originaux sans specs (ajout)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Montre Automatique Restaurée ──────────────────────────────────────────
  { productId: 'prod_marc_montre_auto', variantId: null, label: 'marc-montre-auto-1', prompt: 'editorial macro product shot, restored 1960s vintage automatic watch on aged cognac leather surface, Marc Accessories Marseille, dramatic side studio light, vintage dial patina and steel case detail sharp, horology collector photography' },
  { productId: 'prod_marc_montre_auto', variantId: null, label: 'marc-montre-auto-2', prompt: 'close-up vintage automatic watch movement through display caseback, Marc Accessories, magnified mechanical gear detail, warm amber studio light on aged leather strap, vintage horological craft photography, 1960s timepiece' },

  // ── Ceinture Cuir Patiné ──────────────────────────────────────────────────
  { productId: 'prod_marc_ceinture_cuir', variantId: null, label: 'marc-ceinture-cuir-1', prompt: 'editorial flat lay, patinated vegetable-tanned leather belt with aged brass buckle coiled on aged oak wood surface, Marc Accessories, warm dramatic sidelight, full-grain leather surface texture and patina detail ultra sharp, artisan leather craft' },
  { productId: 'prod_marc_ceinture_cuir', variantId: null, label: 'marc-ceinture-cuir-2', prompt: 'close-up detail of artisan leather belt buckle in aged brass with leather grain visible, Marc Accessories Marseille, warm studio light, vegetable-tanned leather patina, vintage accessories craft photography' },

  // ── Lunettes Rétro Écaille ────────────────────────────────────────────────
  { productId: 'prod_marc_lunettes_retro', variantId: null, label: 'marc-lunettes-retro-1', prompt: 'editorial product shot, retro tortoiseshell acetate sunglasses with polarized lenses on aged marble surface, Marc Accessories Marseille, warm sidelight, vintage 1960s frame shape detail sharp, ecaille acetate texture visible, classic vintage eyewear photography' },
  { productId: 'prod_marc_lunettes_retro', variantId: null, label: 'marc-lunettes-retro-2', prompt: 'lifestyle flat lay, vintage tortoiseshell sunglasses with folded leather case on aged cognac leather surface, Marc Accessories, warm studio light, polarized lens reflection, retro eyewear accessories photography' },
];

// ─── Catalogue collections ────────────────────────────────────────────────────

const COLLECTION_SPECS: CollectionSpec[] = [
  // ── Jose (3 collections) ──────────────────────────────────────────────────
  {
    collectionId: 'proj_jose_streetwear',
    label: 'proj-jose-streetwear',
    prompt: 'cinematic atmospheric street photography, empty Parisian concrete underpass at dusk, deep shadows and single neon light, moody urban streetwear atmosphere, film grain, no people, evocative brand moodboard image for urban streetwear collection 2026',
  },
  {
    collectionId: 'proj_jose_accessoires',
    label: 'proj-jose-accessoires',
    prompt: 'editorial still life, collection of handmade accessories - wool beanie, embroidered cap, canvas tote bag arranged on raw concrete surface, KPSULL brand aesthetic, overhead warm studio light, minimalist flat lay collection mood',
  },
  {
    collectionId: 'proj_jose_essentiels',
    label: 'proj-jose-essentiels',
    prompt: 'editorial flat lay moodboard, collection of essential organic cotton garments - t-shirt, hoodie, sweat neatly folded on warm concrete, KPSULL essentials, soft natural overhead light, clean urban basics lifestyle',
  },

  // ── Lucas (3 collections) ─────────────────────────────────────────────────
  {
    collectionId: 'proj_lucas_design',
    label: 'proj-lucas-design',
    prompt: 'moody editorial, graffiti-covered urban wall in Bordeaux with dramatic side lighting, rich street art textures and colors, no text legible, cinematic atmosphere for graphic streetwear collection moodboard',
  },
  {
    collectionId: 'proj_lucas_capsule',
    label: 'proj-lucas-capsule',
    prompt: 'editorial flat lay, black and white typographic art elements - printed papers, design sketches, bold letters, arranged on concrete, Lucas Design Studio brand moodboard, high-contrast graphic design atmosphere',
  },
  {
    collectionId: 'proj_lucas_limited',
    label: 'proj-lucas-limited',
    prompt: 'atmospheric studio shot, single spotlight on dramatic dark background, three limited edition garments hanging with artistic typography printed tags, Lucas Design limited collection atmosphere, cinematic product moodboard',
  },

  // ── Sophie (3 collections) ────────────────────────────────────────────────
  {
    collectionId: 'proj_sophie_ceramique',
    label: 'proj-sophie-ceramique',
    prompt: 'artisan ceramics studio atmosphere, collection of handcrafted stoneware pieces arranged on linen-covered oak table, warm natural morning light through studio window, earthy clay and glaze textures, Sophie Céramique brand moodboard, wabi-sabi pottery atmosphere',
  },
  {
    collectionId: 'proj_sophie_terre',
    label: 'proj-sophie-terre',
    prompt: 'atmospheric close-up of potter\'s hands shaping clay on spinning wheel, warm amber studio light, terracotta and earth tones, raw clay texture, Sophie Céramique artisan craft atmosphere, collection moodboard evoking earth and fire',
  },
  {
    collectionId: 'proj_sophie_quotidien',
    label: 'proj-sophie-quotidien',
    prompt: 'editorial lifestyle table setting, handcrafted ceramic mugs, bowls and carafe arranged on vintage oak dining table with morning coffee and fresh flowers, Sophie Céramique everyday objects collection, warm natural light atmosphere',
  },

  // ── Claire (3 collections) ────────────────────────────────────────────────
  {
    collectionId: 'proj_claire_vintage',
    label: 'proj-claire-vintage',
    prompt: 'atmospheric vintage market scene, curated rail of beautiful vintage garments in soft morning light, rich textures of vintage fabrics - velvet, wool, lace, golden Paris flea market aesthetic, Claire Vintage brand moodboard, no faces',
  },
  {
    collectionId: 'proj_claire_annees80',
    label: 'proj-claire-annees80',
    prompt: 'editorial flat lay moodboard, collection of 1980s fashion elements - bold shoulder pads, bright colors, geometric patterns arranged on vintage surface, Claire Vintage 80s collection atmosphere, warm nostalgic light',
  },
  {
    collectionId: 'proj_claire_rares',
    label: 'proj-claire-rares',
    prompt: 'atmospheric close-up, single rare vintage garment on padded hanger in soft spotlight, deep shadow background, precious couture feeling, Claire Vintage rare pieces collection moodboard, dramatic museum-like atmosphere',
  },

  // ── Marc (3 collections) ──────────────────────────────────────────────────
  {
    collectionId: 'proj_marc_accessories',
    label: 'proj-marc-accessories',
    prompt: 'editorial still life, collection of restored vintage accessories - leather belt, sunglasses, watch arranged on aged cognac leather surface, Marc Accessories brand moodboard, dramatic sidelight, patinated vintage craft atmosphere',
  },
  {
    collectionId: 'proj_marc_montres',
    label: 'proj-marc-montres',
    prompt: 'atmospheric macro photography, vintage 1960s mechanical watch movement close-up on aged leather, Marc Accessories horological collection, dramatic sidelight revealing gear mechanism and patina, watch collector moodboard',
  },
  {
    collectionId: 'proj_marc_maroquinerie',
    label: 'proj-marc-maroquinerie',
    prompt: 'editorial still life, fine vintage leather goods collection - pochette, belt and wallet in cognac and dark brown leather, Marc Accessories maroquinerie collection moodboard, aged oak surface with dramatic warm sidelight',
  },
];

// ─── Catalogue catégories (seed-new-creators) ─────────────────────────────────

interface CategorySpec {
  categoryKey: string;
  label: string;
  prompt: string;
}

const CATEGORY_SPECS: CategorySpec[] = [

  // ── bijou ─────────────────────────────────────────────────────────────────
  { categoryKey: 'bijou', label: 'cat-bijou-1', prompt: 'delicate gold-plated fine jewelry ring with natural gemstone on white marble surface, French artisan jeweller, soft diffused studio light, macro product photography, clean white background, e-commerce product shot' },
  { categoryKey: 'bijou', label: 'cat-bijou-2', prompt: 'sterling silver 925 artisan necklace with natural stone pendant arranged on white linen cloth, French handmade jewelry, warm natural light, minimal e-commerce product photography' },
  { categoryKey: 'bijou', label: 'cat-bijou-3', prompt: 'pair of handcrafted gold-plated drop earrings on small white ceramic tray, French artisan bijouterie, soft side studio light, clean neutral background, fine jewelry product photography' },
  { categoryKey: 'bijou', label: 'cat-bijou-4', prompt: 'close-up macro of artisan bracelet with gold chain links and natural stone charm, French fine jewelry, white studio, clean background, e-commerce detail shot, precious craftsmanship' },
  { categoryKey: 'bijou', label: 'cat-bijou-5', prompt: 'flat lay collection of French artisan jewelry pieces - ring, necklace, earrings on white marble, soft overhead studio light, minimalist luxury jewelry product photography' },
  { categoryKey: 'bijou', label: 'cat-bijou-6', prompt: 'elegant gold vermeil bangle bracelet on white satin fabric, French handmade jewelry, clean white background, dramatic sidelight, luxury accessories product photography' },

  // ── maroquinerie ──────────────────────────────────────────────────────────
  { categoryKey: 'maroquinerie', label: 'cat-maroquinerie-1', prompt: 'handcrafted full-grain cognac leather tote bag on white studio background, French artisan leather goods, soft natural light, vegetable-tanned leather grain texture sharp, clean e-commerce product shot' },
  { categoryKey: 'maroquinerie', label: 'cat-maroquinerie-2', prompt: 'artisan vegetable-tanned leather wallet showing stitching detail, French leather craft, aged oak wood surface, warm sidelight, premium leather accessories product photography' },
  { categoryKey: 'maroquinerie', label: 'cat-maroquinerie-3', prompt: 'structured French artisan leather handbag with brass hardware on white marble surface, overhead studio light, full-grain nappa leather surface texture, luxury leather goods photography' },
  { categoryKey: 'maroquinerie', label: 'cat-maroquinerie-4', prompt: 'close-up artisan saddle stitch stitching on vegetable-tanned leather edge, French maroquinerie craft, warm studio light, leather grain and thread detail, premium craftsmanship photography' },
  { categoryKey: 'maroquinerie', label: 'cat-maroquinerie-5', prompt: 'leather card holder slim wallet in natural tan on white background, French artisan leather, clean minimal studio, premium grain leather texture, e-commerce product shot' },
  { categoryKey: 'maroquinerie', label: 'cat-maroquinerie-6', prompt: 'elegant dark brown grained leather crossbody bag with gold chain, French artisan leather goods, white studio, soft overhead light, structured bag silhouette, luxury accessories photography' },

  // ── loungewear ────────────────────────────────────────────────────────────
  { categoryKey: 'loungewear', label: 'cat-loungewear-1', prompt: 'soft organic cotton loungewear set - matching jogger and cropped sweatshirt on white linen surface, French artisan brand, natural overhead light, ribbed jersey texture, cozy basics product photography' },
  { categoryKey: 'loungewear', label: 'cat-loungewear-2', prompt: 'ghost mannequin wearing premium modal lounge wide-leg pants with elastic waistband, French comfort brand, white studio, soft fabric drape, minimal e-commerce product shot' },
  { categoryKey: 'loungewear', label: 'cat-loungewear-3', prompt: 'flat lay folded bamboo jersey loungewear set in soft neutral color on white background, OEKO-TEX certified comfort wear, soft diffused studio light, fabric texture detail, clean product photography' },
  { categoryKey: 'loungewear', label: 'cat-loungewear-4', prompt: 'ghost mannequin wearing oversized cozy hoodie with kangaroo pocket in warm grey, French loungewear brand, white studio, plush French terry fabric texture, relaxed silhouette' },
  { categoryKey: 'loungewear', label: 'cat-loungewear-5', prompt: 'editorial flat lay, premium organic cotton loungewear separates neatly arranged on pale concrete, French comfort brand, soft overhead natural light, minimal aesthetic, cozy basics' },
  { categoryKey: 'loungewear', label: 'cat-loungewear-6', prompt: 'ribbed cotton lounge shorts and camisole set on white marble, French artisan brand, soft natural window light, delicate jersey rib texture, feminine loungewear e-commerce photography' },

  // ── sneakers ──────────────────────────────────────────────────────────────
  { categoryKey: 'sneakers', label: 'cat-sneakers-1', prompt: 'artisan premium leather low-top sneaker on white marble surface, French handcrafted footwear Lyon atelier, soft studio sidelight, vegetable-tanned leather upper detail, clean e-commerce product shot' },
  { categoryKey: 'sneakers', label: 'cat-sneakers-2', prompt: 'hand-stitched canvas sneaker with vulcanized rubber sole on raw concrete, French artisan shoemaker, overhead studio light, canvas texture and rubber sole detail sharp, premium footwear photography' },
  { categoryKey: 'sneakers', label: 'cat-sneakers-3', prompt: 'suede leather sneaker heel and sole detail close-up, French artisan footwear, warm studio sidelight, premium suede nap texture ultra sharp, craftsmanship details visible, luxury sneaker photography' },
  { categoryKey: 'sneakers', label: 'cat-sneakers-4', prompt: 'pair of white premium leather artisan sneakers arranged on white background, French footwear brand, clean soft diffused studio light, minimalist e-commerce product photography, crisp leather upper' },
  { categoryKey: 'sneakers', label: 'cat-sneakers-5', prompt: 'flat lay artisan sneaker with leather laces neatly arranged on pale stone, French handcrafted footwear, overhead warm studio light, full-grain leather detail, premium sneaker product shot' },
  { categoryKey: 'sneakers', label: 'cat-sneakers-6', prompt: 'profile side view of premium canvas high-top sneaker with rubber toe cap on white background, French atelier footwear, clean studio light, stitching and canvas texture visible, artisan sneaker photography' },

  // ── papeterie ─────────────────────────────────────────────────────────────
  { categoryKey: 'papeterie', label: 'cat-papeterie-1', prompt: 'handcrafted leather-bound journal with recycled paper pages on white marble surface, French artisan stationery, soft natural window light, FSC paper texture and binding detail, premium stationery photography' },
  { categoryKey: 'papeterie', label: 'cat-papeterie-2', prompt: 'set of artisan watercolor paper notecards with floral illustration in French style, flat lay on linen surface, warm natural light, recycled paper texture visible, handmade stationery product photography' },
  { categoryKey: 'papeterie', label: 'cat-papeterie-3', prompt: 'premium recycled cardstock greeting cards with hand-lettered typography on white background, French artisan papeterie, overhead soft studio light, FSC certified paper texture detail, minimal stationery photography' },
  { categoryKey: 'papeterie', label: 'cat-papeterie-4', prompt: 'artisan illustrated art print on Hahnemühle watercolor paper leaning against white wall, French illustrator studio, soft natural light, fine paper texture and illustration visible, art print product shot' },
  { categoryKey: 'papeterie', label: 'cat-papeterie-5', prompt: 'flat lay collection of French artisan stationery - notebook, cards, envelopes on white linen, warm overhead studio light, recycled paper and natural kraft materials, minimal stationery photography' },
  { categoryKey: 'papeterie', label: 'cat-papeterie-6', prompt: 'close-up texture detail of handmade cotton paper with botanical inclusions, French artisan papeterie, soft sidelight, premium paper craft photography, organic fiber texture visible' },

  // ── parfum ────────────────────────────────────────────────────────────────
  { categoryKey: 'parfum', label: 'cat-parfum-1', prompt: 'elegant artisan perfume bottle with glass stopper on white marble surface, French Grasse perfumery, soft diffused studio light, clear glass and amber liquid visible, luxury fragrance product photography' },
  { categoryKey: 'parfum', label: 'cat-parfum-2', prompt: 'soy wax artisan candle with natural essential oils in frosted glass jar on linen cloth, French fragrance brand, warm natural light, handmade label detail, natural home fragrance photography' },
  { categoryKey: 'parfum', label: 'cat-parfum-3', prompt: 'collection of natural essential oil roller bottles and botanical ingredients on white background, French natural perfumery Grasse, overhead studio light, minimalist luxury fragrance product shot' },
  { categoryKey: 'parfum', label: 'cat-parfum-4', prompt: 'close-up of artisan perfume bottle with pressed flower decoration on aged wood surface, French natural fragrance, warm amber studio sidelight, botanical and glass details, premium perfumery photography' },
  { categoryKey: 'parfum', label: 'cat-parfum-5', prompt: 'flat lay, French artisan fragrance set - eau de parfum bottle, dried botanicals, linen packaging on white marble, soft overhead light, luxury natural fragrance product photography' },
  { categoryKey: 'parfum', label: 'cat-parfum-6', prompt: 'artisan reed diffuser with natural rattan sticks in amber glass bottle on white marble, French fragrance maison, clean soft studio light, home fragrance luxury product photography' },

  // ── broderie ──────────────────────────────────────────────────────────────
  { categoryKey: 'broderie', label: 'cat-broderie-1', prompt: 'framed hand embroidery hoop with botanical floral design on linen fabric, French artisan broderie, soft natural window light, DMC thread color detail visible, handmade textile craft photography' },
  { categoryKey: 'broderie', label: 'cat-broderie-2', prompt: 'close-up macro of hand embroidered satin stitch flowers on white linen, French artisan needlework, warm sidelight, fine thread texture and stitch detail ultra sharp, craft photography' },
  { categoryKey: 'broderie', label: 'cat-broderie-3', prompt: 'embroidered linen tea towel with French botanical motif on aged oak surface, French artisan broderie, warm natural light, linen weave and embroidery thread visible, artisan textile product photography' },
  { categoryKey: 'broderie', label: 'cat-broderie-4', prompt: 'artisan embroidered cotton tote bag with hand-stitched floral design on white background, French needlework craft, soft overhead studio light, DMC cotton thread colors, handmade textile accessory' },
  { categoryKey: 'broderie', label: 'cat-broderie-5', prompt: 'collection of hand embroidery thread skeins and linen fabric with work in progress, French artisan broderie, warm natural light, colorful threads and linen weave texture, craft product photography' },
  { categoryKey: 'broderie', label: 'cat-broderie-6', prompt: 'embroidered cushion cover with traditional French motif on white linen, artisan broderie product, soft natural window light, detailed needlework texture visible, home textile photography' },

  // ── horlogerie ────────────────────────────────────────────────────────────
  { categoryKey: 'horlogerie', label: 'cat-horlogerie-1', prompt: 'artisan mechanical watch with stainless steel case and leather strap on white marble, French watchmaking craft, soft dramatic sidelight, dial and hands detail sharp, luxury timepiece product photography' },
  { categoryKey: 'horlogerie', label: 'cat-horlogerie-2', prompt: 'vintage-inspired automatic watch with brass case on aged leather surface, French horlogerie atelier, warm studio sidelight, vintage dial patina and crown detail, watch collector photography' },
  { categoryKey: 'horlogerie', label: 'cat-horlogerie-3', prompt: 'close-up macro of watch dial with applied indices and hand-finished movement detail, French artisan watchmaking, dramatic sidelight, intricate mechanical detail ultra sharp, horology photography' },
  { categoryKey: 'horlogerie', label: 'cat-horlogerie-4', prompt: 'artisan watch with brown leather strap and gold-plated case on white background, French watchmaker, clean soft studio light, e-commerce product shot, premium timepiece photography' },
  { categoryKey: 'horlogerie', label: 'cat-horlogerie-5', prompt: 'flat lay, vintage mechanical pocket watch with chain on aged velvet surface, French horlogerie, warm amber studio sidelight, patinated metal case and enamel dial detail, luxury antique watch photography' },
  { categoryKey: 'horlogerie', label: 'cat-horlogerie-6', prompt: 'wrist shot detail, artisan leather strap watch with minimalist dial, French watchmaking, soft natural light, clean wrist lifestyle photography, premium timepiece on neutral background' },

  // ── cosmetique ────────────────────────────────────────────────────────────
  { categoryKey: 'cosmetique', label: 'cat-cosmetique-1', prompt: 'organic certified cosmetic cream jar with botanical ingredients on white marble, French natural beauty brand Cosmos Organic, soft diffused studio light, glass jar and label detail, clean beauty product photography' },
  { categoryKey: 'cosmetique', label: 'cat-cosmetique-2', prompt: 'collection of French organic skincare products - serum, moisturizer, toner on white background, Cosmos Organic certified, overhead soft studio light, minimal clean beauty photography' },
  { categoryKey: 'cosmetique', label: 'cat-cosmetique-3', prompt: 'artisan natural face serum in dropper bottle with botanical plant ingredients on linen cloth, French organic cosmetics, warm natural light, glass dropper and ingredient detail, clean beauty product shot' },
  { categoryKey: 'cosmetique', label: 'cat-cosmetique-4', prompt: 'close-up texture of organic cream on white marble with dried botanical petals, French natural beauty, soft diffused overhead light, clean minimal luxury skincare photography' },
  { categoryKey: 'cosmetique', label: 'cat-cosmetique-5', prompt: 'flat lay, French artisan organic beauty routine set - cleanser, serum, moisturizer with botanicals on white marble, soft natural light, Cosmos Organic, minimal clean beauty photography' },
  { categoryKey: 'cosmetique', label: 'cat-cosmetique-6', prompt: 'vegan natural lip balm and face oil in amber glass bottles on white studio background, French organic cosmetics, soft sidelight, clean beauty e-commerce product photography' },

  // ── art ───────────────────────────────────────────────────────────────────
  { categoryKey: 'art', label: 'cat-art-1', prompt: 'signed limited edition art print on Hahnemühle fine art paper against white wall, French contemporary artist, soft natural gallery light, giclée print detail visible, art print product photography' },
  { categoryKey: 'art', label: 'cat-art-2', prompt: 'hand-pulled screen print in six colors on white art paper, French artist studio, warm studio sidelight, visible ink texture and screen print layers, limited edition print photography' },
  { categoryKey: 'art', label: 'cat-art-3', prompt: 'framed giclée art print with white mat in natural wood frame on white wall, French contemporary art, soft gallery lighting, luxury art print product shot, collector quality photography' },
  { categoryKey: 'art', label: 'cat-art-4', prompt: 'rolled limited edition print with certificate of authenticity on white linen, French artist, warm studio light, fine art paper texture visible, limited print e-commerce product photography' },
  { categoryKey: 'art', label: 'cat-art-5', prompt: 'flat lay, French artist print collection with signature and edition number on white marble, soft overhead studio light, fine art paper quality, limited edition art photography' },
  { categoryKey: 'art', label: 'cat-art-6', prompt: 'close-up of silver gelatin darkroom photographic print, French photographer, warm amber darkroom light, analogue photography grain texture, artistic print detail, collector photography' },

  // ── deco ──────────────────────────────────────────────────────────────────
  { categoryKey: 'deco', label: 'cat-deco-1', prompt: 'handcrafted ceramic vase with natural linen texture on white marble surface, French artisan home decor, soft diffused natural light, glazed stoneware detail, minimalist interior decoration photography' },
  { categoryKey: 'deco', label: 'cat-deco-2', prompt: 'artisan blown glass decorative object with air bubbles on oak surface, French glassblowing studio, warm natural sidelight, glass texture and transparency, handmade home decor product photography' },
  { categoryKey: 'deco', label: 'cat-deco-3', prompt: 'handwoven natural linen cushion cover with subtle texture on white background, French artisan home textile, soft overhead studio light, linen weave detail ultra sharp, clean home decor e-commerce photography' },
  { categoryKey: 'deco', label: 'cat-deco-4', prompt: 'solid oak wood candle holder with beeswax taper on white marble, French artisan wood craft, warm natural sidelight, wood grain and finish detail, minimal home decor product photography' },
  { categoryKey: 'deco', label: 'cat-deco-5', prompt: 'flat lay collection of French artisan home decor objects - ceramic, linen, glass on white surface, soft overhead natural light, minimalist interior styling photography' },
  { categoryKey: 'deco', label: 'cat-deco-6', prompt: 'recycled cotton macramé wall hanging with fringe on white wall, French artisan textile decor, soft natural light, handmade knotting texture detail, boho home decor product photography' },

  // ── sport ─────────────────────────────────────────────────────────────────
  { categoryKey: 'sport', label: 'cat-sport-1', prompt: 'technical recycled polyester athletic t-shirt on white background, French OEKO-TEX certified sportswear, soft studio light, DryFit fabric texture visible, clean e-commerce sports product photography' },
  { categoryKey: 'sport', label: 'cat-sport-2', prompt: 'ghost mannequin wearing high-waist compression sport leggings, French activewear brand, white studio, technical recycled fabric detail and flatlock seam visible, athletic sportswear photography' },
  { categoryKey: 'sport', label: 'cat-sport-3', prompt: 'flat lay, French technical sportswear set - leggings, sports bra, shorts on white marble, overhead studio light, recycled polyester fabric texture, OEKO-TEX certified athletic product photography' },
  { categoryKey: 'sport', label: 'cat-sport-4', prompt: 'lightweight technical running shorts with mesh lining on white background, French activewear, soft studio light, technical nylon anti-UV fabric detail, clean sport e-commerce product shot' },
  { categoryKey: 'sport', label: 'cat-sport-5', prompt: 'ghost mannequin wearing technical sport jacket with zip pockets, French activewear OEKO-TEX, white studio, lightweight technical fabric, athletic silhouette, sportswear product photography' },
  { categoryKey: 'sport', label: 'cat-sport-6', prompt: 'close-up recycled polyester performance fabric texture with moisture-wicking detail, French sportswear, macro studio shot, technical DryFit material surface, athletic fabric product photography' },

  // ── enfants ───────────────────────────────────────────────────────────────
  { categoryKey: 'enfants', label: 'cat-enfants-1', prompt: 'organic cotton GOTS certified baby romper on white linen surface, French artisan children clothing Portugal, soft natural overhead light, fine organic cotton knit texture, clean children e-commerce photography' },
  { categoryKey: 'enfants', label: 'cat-enfants-2', prompt: 'ghost mannequin with kids organic cotton hoodie in natural color, French childrenswear GOTS bio, white studio, soft French terry texture visible, children basics product photography' },
  { categoryKey: 'enfants', label: 'cat-enfants-3', prompt: 'flat lay children organic clothing set - top and pants in natural cotton on white background, GOTS certified French childrenswear, overhead soft light, fine knit texture, clean baby product photography' },
  { categoryKey: 'enfants', label: 'cat-enfants-4', prompt: 'soft recycled fleece children sweater with kangaroo pocket on white studio background, French kids brand GOTS bio, clean soft diffused light, warm fleece texture detail, children clothing e-commerce' },
  { categoryKey: 'enfants', label: 'cat-enfants-5', prompt: 'velvet cotton toddler dungarees with snap buttons on white linen surface, French artisan children clothing, warm natural light, soft velvet cotton texture visible, artisan children product photography' },
  { categoryKey: 'enfants', label: 'cat-enfants-6', prompt: 'close-up organic cotton baby onesie with hand-embroidered detail on white background, French artisan children clothing, soft overhead light, GOTS bio label visible, premium baby product photography' },

  // ── gastro ────────────────────────────────────────────────────────────────
  { categoryKey: 'gastro', label: 'cat-gastro-1', prompt: 'artisan French preserves jar with handwritten label on marble surface, French artisan food producer, warm natural side light, glass jar and product label detail, premium artisan gastronomy photography' },
  { categoryKey: 'gastro', label: 'cat-gastro-2', prompt: 'selection of French artisan charcuterie and terrine in ceramic pot on aged oak board, French food artisan, warm natural light, rustic food styling, premium artisan gastronomy product photography' },
  { categoryKey: 'gastro', label: 'cat-gastro-3', prompt: 'handcrafted artisan honey jar with honeycomb and wooden dipper on white marble, French apiculture, warm golden studio light, amber honey transparency, premium French artisan food photography' },
  { categoryKey: 'gastro', label: 'cat-gastro-4', prompt: 'French artisan olive oil bottle with handmade label on white marble, premium French food producer, soft natural light, clear glass and golden oil visible, clean gastronomy product photography' },
  { categoryKey: 'gastro', label: 'cat-gastro-5', prompt: 'flat lay, French artisan pantry selection - preserves, condiments, specialties on white linen with herbs, warm natural overhead light, premium artisan gastronomy product photography' },
  { categoryKey: 'gastro', label: 'cat-gastro-6', prompt: 'close-up artisan French biscuits and confiseries in kraft paper packaging on white marble, handmade label detail, warm natural light, premium French artisan confectionery photography' },

  // ── oriental ─────────────────────────────────────────────────────────────
  { categoryKey: 'oriental', label: 'cat-oriental-1', prompt: 'hand-embroidered satin abaya with golden thread detail on white studio background, French-Moroccan artisan clothing, soft diffused studio light, embroidery texture and fabric drape visible, oriental fashion product photography' },
  { categoryKey: 'oriental', label: 'cat-oriental-2', prompt: 'ghost mannequin wearing flowing mousseline hijab in soft ivory color, French-Moroccan modest fashion, white studio, delicate fabric drape and pin style, modest wear e-commerce photography' },
  { categoryKey: 'oriental', label: 'cat-oriental-3', prompt: 'editorial flat lay, luxurious brocade fabric abaya with handmade embroidery detail on white marble, French artisan oriental fashion, soft overhead light, rich fabric texture visible, oriental fashion product shot' },
  { categoryKey: 'oriental', label: 'cat-oriental-4', prompt: 'close-up macro of hand-embroidered golden thread on dark satin oriental garment, French-Moroccan artisan craft, warm dramatic sidelight, embroidery thread and fabric texture detail ultra sharp' },
  { categoryKey: 'oriental', label: 'cat-oriental-5', prompt: 'ghost mannequin wearing printed silk oriental kaftan with intricate pattern, French-Moroccan fashion, white studio, flowing silk drape and pattern visible, modest luxury fashion photography' },
  { categoryKey: 'oriental', label: 'cat-oriental-6', prompt: 'artisan Moroccan leather clutch bag with geometric embossed pattern on white background, French-Moroccan accessory, soft studio light, leather embossing detail, oriental artisan accessory photography' },
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

// ─── Aggregation des résultats ────────────────────────────────────────────────

function buildOutput(
  productResults: Map<string, string>,
  collectionResults: Map<string, string>,
  categoryResults: Map<string, string>
): SeedImagesOutput {
  const products: Record<string, ProductImageEntry> = {};

  for (const spec of IMAGE_SPECS) {
    const { productId, variantId, label } = spec;
    const url = productResults.get(label);
    if (!url) continue;

    if (!products[productId]) {
      products[productId] = { main: [], variants: {} };
    }

    const entry = products[productId];
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

  const collections: Record<string, string> = {};
  for (const spec of COLLECTION_SPECS) {
    const url = collectionResults.get(spec.label);
    if (url) {
      collections[spec.collectionId] = url;
    }
  }

  const categories: Record<string, string[]> = {};
  for (const spec of CATEGORY_SPECS) {
    const url = categoryResults.get(spec.label);
    if (url) {
      if (!categories[spec.categoryKey]) categories[spec.categoryKey] = [];
      categories[spec.categoryKey]!.push(url);
    }
  }

  return { products, collections, categories };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;

  if (!googleApiKey) {
    console.error('❌ GOOGLE_AI_API_KEY is required. Please set it in .env.local');
    process.exit(1);
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Missing Cloudinary environment variables. Please check .env.local');
    process.exit(1);
  }

  const totalImages = IMAGE_SPECS.length + COLLECTION_SPECS.length + CATEGORY_SPECS.length;
  const estimatedMin = Math.ceil((totalImages * 6.5) / 60);

  console.log(`\n🖼  Seed Image Upload Script`);
  console.log(`   Mode: Gemini (Imagen 3 Fast)`);
  console.log(`   Total product specs: ${IMAGE_SPECS.length}`);
  console.log(`   Total collection specs: ${COLLECTION_SPECS.length}`);
  console.log(`   Total category specs: ${CATEGORY_SPECS.length}`);
  console.log(`   Total images: ${totalImages}`);
  console.log(`   Estimated time: ~${estimatedMin} min (6.5s/image rate limit)`);
  console.log(`   Output: prisma/seed-assets/product-images.json\n`);

  const productResults = new Map<string, string>();
  const collectionResults = new Map<string, string>();
  const categoryResults = new Map<string, string>();
  let successCount = 0;
  let errorCount = 0;
  let globalIndex = 0;

  // Process product images
  for (let i = 0; i < IMAGE_SPECS.length; i++, globalIndex++) {
    const spec = IMAGE_SPECS[i];
    if (!spec) continue;

    const progress = `[${String(globalIndex + 1).padStart(3, '0')}/${totalImages}]`;
    process.stdout.write(`${progress} Uploading ${spec.label}...`);

    try {
      const base64 = await generateWithGemini(spec.prompt, googleApiKey);
      const url = await uploadToCloudinary(base64, spec.label);
      productResults.set(spec.label, url);
      successCount++;
      console.log(` ✓`);
    } catch (err) {
      errorCount++;
      const message = err instanceof Error ? err.message : String(err);
      console.log(` ✗ ${message}`);
    }

    if (globalIndex < totalImages - 1) {
      await new Promise((resolve) => setTimeout(resolve, 6500));
    }
  }

  // Process collection images
  for (let i = 0; i < COLLECTION_SPECS.length; i++, globalIndex++) {
    const spec = COLLECTION_SPECS[i];
    if (!spec) continue;

    const progress = `[${String(globalIndex + 1).padStart(3, '0')}/${totalImages}]`;
    process.stdout.write(`${progress} Uploading ${spec.label} (collection)...`);

    try {
      const base64 = await generateWithGemini(spec.prompt, googleApiKey);
      const url = await uploadToCloudinary(base64, spec.label);
      collectionResults.set(spec.label, url);
      successCount++;
      console.log(` ✓`);
    } catch (err) {
      errorCount++;
      const message = err instanceof Error ? err.message : String(err);
      console.log(` ✗ ${message}`);
    }

    if (globalIndex < totalImages - 1) {
      await new Promise((resolve) => setTimeout(resolve, 6500));
    }
  }

  // Process category images
  for (let i = 0; i < CATEGORY_SPECS.length; i++, globalIndex++) {
    const spec = CATEGORY_SPECS[i];
    if (!spec) continue;

    const progress = `[${String(globalIndex + 1).padStart(3, '0')}/${totalImages}]`;
    process.stdout.write(`${progress} Uploading ${spec.label} (category)...`);

    try {
      const base64 = await generateWithGemini(spec.prompt, googleApiKey);
      const url = await uploadToCloudinary(base64, spec.label);
      categoryResults.set(spec.label, url);
      successCount++;
      console.log(` ✓`);
    } catch (err) {
      errorCount++;
      const message = err instanceof Error ? err.message : String(err);
      console.log(` ✗ ${message}`);
    }

    if (globalIndex < totalImages - 1) {
      await new Promise((resolve) => setTimeout(resolve, 6500));
    }
  }

  console.log(`\n📊 Upload summary: ${successCount} success, ${errorCount} errors`);

  if (productResults.size === 0 && collectionResults.size === 0 && categoryResults.size === 0) {
    console.error('❌ No images were uploaded successfully. Aborting.');
    process.exit(1);
  }

  const output = buildOutput(productResults, collectionResults, categoryResults);
  const outputPath = path.resolve('./prisma/seed-assets/product-images.json');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ Saved to ${outputPath}`);
  console.log(`   Products covered: ${Object.keys(output.products).length}`);
  for (const [productId, entry] of Object.entries(output.products)) {
    const variantCount = Object.keys(entry.variants).length;
    console.log(`   - ${productId}: ${entry.main.length} main images, ${variantCount} variant(s)`);
  }
  console.log(`   Collections covered: ${Object.keys(output.collections).length}`);
  for (const [collectionId] of Object.entries(output.collections)) {
    console.log(`   - ${collectionId}: 1 cover image`);
  }
  console.log(`   Categories covered: ${Object.keys(output.categories).length}`);
  console.log('');
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('❌ Script failed:', message);
  process.exit(1);
});
