/**
 * Prisma Seed Complet — Kpsull Marketplace
 *
 * Crée :
 *   - 1 admin
 *   - 20 créateurs avec niches fashion distinctes
 *   - 5 collections × 10 produits × 3-6 variantes × tailles = ~1000 produits
 *   - 300 clients avec profils français réalistes
 *   - 1200+ commandes distribuées sur les 6 derniers mois
 *   - Export JSON DB-ready → prisma/seed-assets/production-export.json
 *   - Specs génération images → prisma/seed-assets/generation-specs.json
 *
 * Usage:
 *   bun prisma/seed-complete.ts
 *
 * Tous les comptes : password123
 */

import {
  PrismaClient,
  Role,
  Plan,
  SubscriptionStatus,
  ProductStatus,
  OrderStatus,
  SectionType,
  OnboardingStep,
  PageStatus,
  StyleStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import creatorsJson from './data/creators-complete.json';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/kpsull-db';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}


function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColorDef {
  name: string;
  code: string;
}

interface ProductTypeDef {
  baseName: string;
  category: string;
  priceRange: [number, number];
  gender: string;
  materials: string;
  fit: string;
  season: string;
  careInstructions: string;
  weight: number;
  madeIn: string;
}

interface NicheTemplateDef {
  productTypes: ProductTypeDef[];
  colorPalette: ColorDef[];
  sizeSet: string[];
  colorCount: [number, number];
}

interface CollectionNameDef {
  name: string;
  desc: string;
}

interface CreatorDef {
  id: string;
  email: string;
  name: string;
  brandName: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  plan: Plan;
  siret: string;
  stripeAccountId: string;
  brandStyle: string;
  niche: string;
  collections: CollectionNameDef[];
}

interface CreatorJsonDef extends Omit<CreatorDef, 'plan'> {
  plan: string;
}

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

// ─── Palettes de couleurs ──────────────────────────────────────────────────────

const PALETTES: Record<string, ColorDef[]> = {
  urban: [
    { name: 'Noir', code: '#1a1a1a' },
    { name: 'Blanc', code: '#f8f8f8' },
    { name: 'Gris anthracite', code: '#2d2d2d' },
    { name: 'Kaki', code: '#5c5c3d' },
    { name: 'Beige stone', code: '#c8b89a' },
    { name: 'Bleu indigo', code: '#1f3a6e' },
  ],
  naturel: [
    { name: 'Écru', code: '#f5f0e8' },
    { name: 'Argile', code: '#b5895a' },
    { name: 'Terracotta', code: '#c4623a' },
    { name: 'Kaki doux', code: '#8a8a6a' },
    { name: 'Ardoise', code: '#4a5568' },
    { name: 'Ivoire', code: '#f0ead6' },
  ],
  sport: [
    { name: 'Noir', code: '#111111' },
    { name: 'Blanc', code: '#ffffff' },
    { name: 'Gris', code: '#9e9e9e' },
    { name: 'Bleu électrique', code: '#0066cc' },
    { name: 'Rouge sport', code: '#d32f2f' },
    { name: 'Jaune néon', code: '#f9d71c' },
  ],
  luxe: [
    { name: 'Ivoire', code: '#faf7f2' },
    { name: 'Champagne', code: '#f7e7ce' },
    { name: 'Bordeaux', code: '#722f37' },
    { name: 'Marine', code: '#1a2744' },
    { name: 'Taupe', code: '#8d7b68' },
    { name: 'Noir profond', code: '#0d0d0d' },
  ],
  bijoux: [
    { name: 'Or doré', code: '#c5a028' },
    { name: 'Argent', code: '#a8a8a8' },
    { name: 'Rose gold', code: '#c27a6e' },
    { name: 'Noir oxydé', code: '#1a1a1a' },
    { name: 'Blanc nacré', code: '#f5f0e8' },
  ],
  denim: [
    { name: 'Indigo raw', code: '#2d4b8a' },
    { name: 'Bleu délavé', code: '#6688aa' },
    { name: 'Noir délavé', code: '#3d3d3d' },
    { name: 'Blanc cassé', code: '#f2ede8' },
    { name: 'Beige workwear', code: '#c8b89a' },
  ],
  knitwear: [
    { name: 'Crème', code: '#f5f0e8' },
    { name: 'Caramel', code: '#b5895a' },
    { name: 'Kaki olive', code: '#6b6b4a' },
    { name: 'Gris chiné', code: '#8c8c8c' },
    { name: 'Bordeaux', code: '#722f37' },
    { name: 'Bleu canard', code: '#007077' },
  ],
  culturel: [
    { name: 'Ocre', code: '#c19a49' },
    { name: 'Indigo profond', code: '#1e2b6e' },
    { name: 'Rouge vermillon', code: '#c23b22' },
    { name: 'Vert forêt', code: '#2d5a27' },
    { name: 'Or chaud', code: '#d4a017' },
    { name: 'Terracotta', code: '#b5541c' },
  ],
  romantique: [
    { name: 'Blanc', code: '#fafafa' },
    { name: 'Rose poudré', code: '#f2c4c4' },
    { name: 'Vert menthe', code: '#b2d8d8' },
    { name: 'Lilas', code: '#c9b3d9' },
    { name: 'Bordeaux', code: '#722f37' },
    { name: 'Pêche', code: '#ffcba4' },
  ],
  minimaliste: [
    { name: 'Blanc cassé', code: '#f7f4ef' },
    { name: 'Sable', code: '#c8b89a' },
    { name: 'Gris perle', code: '#d4d4d4' },
    { name: 'Encre', code: '#1a1a2e' },
    { name: 'Céladon', code: '#ace1af' },
    { name: 'Prune', code: '#7b2d8b' },
  ],
  vintage: [
    { name: 'Denim vintage', code: '#4a6741' },
    { name: 'Rouge cerise', code: '#8b1c2c' },
    { name: 'Crème vintage', code: '#f5f0d8' },
    { name: 'Camel', code: '#c19a6b' },
    { name: 'Vert avocado', code: '#7a8c59' },
    { name: 'Brun tabac', code: '#6b4423' },
  ],
  lingerie: [
    { name: 'Ivoire', code: '#faf7f2' },
    { name: 'Blush', code: '#f4b8b8' },
    { name: 'Noir', code: '#1a1a1a' },
    { name: 'Rose', code: '#f8a0b4' },
    { name: 'Bordeaux', code: '#722f37' },
    { name: 'Lavande', code: '#c4b8d4' },
  ],
};

// ─── Tailles ──────────────────────────────────────────────────────────────────

const SIZES: Record<string, string[]> = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  pants: ['34', '36', '38', '40', '42', '44'],
  shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  unique: ['TU'],
  jewel: ['Unique'],
};

// ─── Niches Fashion ────────────────────────────────────────────────────────────

const NICHES: Record<string, NicheTemplateDef> = {
  streetwear_masc: {
    colorPalette: PALETTES['urban']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 5],
    productTypes: [
      { baseName: 'T-Shirt Oversized', category: 'tshirt', priceRange: [4500, 5500], gender: 'Homme', materials: '100% Coton bio 220g/m²', fit: 'Oversized', season: 'Toutes saisons', careInstructions: 'Lavage 30°, pas de sèche-linge', weight: 220, madeIn: 'Portugal' },
      { baseName: 'Hoodie Drop Shoulder', category: 'hoodie', priceRange: [8500, 9500], gender: 'Homme', materials: '80% Coton, 20% Polyester recyclé', fit: 'Relaxed', season: 'Automne-Hiver', careInstructions: 'Lavage 30°, retourner avant lavage', weight: 400, madeIn: 'Portugal' },
      { baseName: 'Jogger Technique', category: 'pantalon', priceRange: [7500, 8500], gender: 'Homme', materials: '100% Coton brossé 300g/m²', fit: 'Relaxed tapered', season: 'Automne-Hiver', careInstructions: 'Lavage 30°', weight: 320, madeIn: 'Portugal' },
      { baseName: 'Polo Côtelé', category: 'tshirt', priceRange: [5500, 6500], gender: 'Homme', materials: '100% Coton piqué 220g/m²', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Lavage 40°', weight: 200, madeIn: 'Portugal' },
      { baseName: 'Sweat Col Rond', category: 'hoodie', priceRange: [7500, 8800], gender: 'Homme', materials: '80% Coton, 20% Polyester 350g/m²', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Lavage 30°, retourner avant lavage', weight: 350, madeIn: 'Portugal' },
      { baseName: 'Short Cargo', category: 'pantalon', priceRange: [6500, 7500], gender: 'Homme', materials: '100% Coton sergé', fit: 'Relaxed', season: 'Printemps-Été', careInstructions: 'Lavage 40°', weight: 280, madeIn: 'Portugal' },
      { baseName: 'Veste Coach Nylon', category: 'veste_blouson', priceRange: [12500, 14500], gender: 'Homme', materials: '100% Nylon ripstop', fit: 'Regular', season: 'Printemps-Automne', careInstructions: 'Nettoyage à sec', weight: 350, madeIn: 'France' },
      { baseName: 'Pantalon Cargo', category: 'pantalon', priceRange: [9500, 11500], gender: 'Homme', materials: '100% Coton sergé 380g/m²', fit: 'Relaxed', season: 'Toutes saisons', careInstructions: 'Lavage 40°', weight: 420, madeIn: 'Portugal' },
      { baseName: 'Longsleeve Côtelé', category: 'tshirt', priceRange: [4800, 5800], gender: 'Homme', materials: '95% Coton, 5% Élasthanne', fit: 'Slim', season: 'Automne-Hiver', careInstructions: 'Lavage 30°', weight: 180, madeIn: 'Portugal' },
      { baseName: 'Bomber Vintage', category: 'veste_blouson', priceRange: [15500, 18500], gender: 'Homme', materials: '100% Polyester satin doublé', fit: 'Oversized', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 480, madeIn: 'France' },
    ],
  },

  artisanal_lin: {
    colorPalette: PALETTES['naturel']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 5],
    productTypes: [
      { baseName: 'Veste Structurée Lin', category: 'veste_blouson', priceRange: [18500, 22500], gender: 'Femme', materials: '100% Lin lavé', fit: 'Structured', season: 'Printemps-Été', careInstructions: 'Lavage 30° délicat', weight: 380, madeIn: 'France' },
      { baseName: 'Pantalon Large Lin', category: 'pantalon', priceRange: [12500, 15500], gender: 'Femme', materials: '100% Lin lavé', fit: 'Wide leg', season: 'Printemps-Été', careInstructions: 'Lavage 30° délicat', weight: 280, madeIn: 'France' },
      { baseName: 'Chemise Oversize Lin', category: 'tshirt', priceRange: [9500, 12500], gender: 'Femme', materials: '100% Lin biologique', fit: 'Oversized', season: 'Printemps-Été', careInstructions: 'Lavage 30° délicat', weight: 200, madeIn: 'France' },
      { baseName: 'Robe Midi Artisanale', category: 'robe', priceRange: [22500, 28500], gender: 'Femme', materials: '55% Lin, 45% Viscose', fit: 'Relaxed', season: 'Printemps-Été', careInstructions: 'Lavage à la main', weight: 320, madeIn: 'France' },
      { baseName: 'Top Bretelles Côtelé', category: 'tshirt', priceRange: [6500, 8500], gender: 'Femme', materials: '100% Coton bio côtelé', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Lavage 30°', weight: 140, madeIn: 'France' },
      { baseName: 'Manteau Lin Lourd', category: 'manteau', priceRange: [38500, 45500], gender: 'Femme', materials: '65% Lin, 35% Laine', fit: 'Straight', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 580, madeIn: 'France' },
      { baseName: 'Jupe Longue Asymétrique', category: 'robe', priceRange: [10500, 13500], gender: 'Femme', materials: '100% Lin lavé', fit: 'Fluid', season: 'Printemps-Été', careInstructions: 'Lavage 30° délicat', weight: 260, madeIn: 'France' },
      { baseName: 'Combishort Lin', category: 'pantalon', priceRange: [14500, 18500], gender: 'Femme', materials: '100% Lin biologique', fit: 'Relaxed', season: 'Été', careInstructions: 'Lavage 30° délicat', weight: 220, madeIn: 'France' },
      { baseName: 'Blouse Paysanne', category: 'tshirt', priceRange: [8500, 11500], gender: 'Femme', materials: '100% Coton gauze', fit: 'Loose', season: 'Printemps-Été', careInstructions: 'Lavage 30°', weight: 120, madeIn: 'France' },
      { baseName: 'Gilet Long Lin', category: 'veste_blouson', priceRange: [15500, 19500], gender: 'Femme', materials: '100% Lin lavé', fit: 'Straight', season: 'Printemps-Automne', careInstructions: 'Lavage 30° délicat', weight: 280, madeIn: 'France' },
    ],
  },

  sportswear_tech: {
    colorPalette: PALETTES['sport']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 5],
    productTypes: [
      { baseName: 'Veste Technique Trail', category: 'sport', priceRange: [12500, 15500], gender: 'Unisexe', materials: '100% Polyester haute performance', fit: 'Athletic', season: 'Toutes saisons', careInstructions: 'Lavage 30°, pas de sèche-linge', weight: 280, madeIn: 'Portugal' },
      { baseName: 'Legging Compression', category: 'sport', priceRange: [6500, 8500], gender: 'Femme', materials: '78% Polyamide, 22% Élasthanne', fit: 'Compression', season: 'Toutes saisons', careInstructions: 'Lavage 30°', weight: 180, madeIn: 'Portugal' },
      { baseName: 'Débardeur Technique', category: 'sport', priceRange: [4500, 5500], gender: 'Unisexe', materials: '100% Polyester dry-fit', fit: 'Athletic', season: 'Printemps-Été', careInstructions: 'Lavage 40°', weight: 120, madeIn: 'Portugal' },
      { baseName: 'Sweat Zip Athlétique', category: 'sport', priceRange: [9500, 11500], gender: 'Unisexe', materials: '60% Coton, 40% Polyester', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Lavage 30°', weight: 380, madeIn: 'Portugal' },
      { baseName: 'Short Technique', category: 'sport', priceRange: [5500, 7500], gender: 'Homme', materials: '100% Polyester mesh', fit: 'Athletic', season: 'Printemps-Été', careInstructions: 'Lavage 40°', weight: 160, madeIn: 'Portugal' },
      { baseName: 'Brassière Sport', category: 'sport', priceRange: [4500, 6500], gender: 'Femme', materials: '78% Polyamide, 22% Élasthanne', fit: 'Athletic', season: 'Toutes saisons', careInstructions: 'Lavage 30°', weight: 120, madeIn: 'Portugal' },
      { baseName: 'T-Shirt Running', category: 'sport', priceRange: [4500, 5500], gender: 'Unisexe', materials: '100% Polyester Coolmax', fit: 'Athletic', season: 'Printemps-Été', careInstructions: 'Lavage 40°', weight: 140, madeIn: 'Portugal' },
      { baseName: 'Pantalon Technique Fuselé', category: 'sport', priceRange: [8500, 10500], gender: 'Homme', materials: '94% Polyester, 6% Élasthanne', fit: 'Tapered', season: 'Toutes saisons', careInstructions: 'Lavage 30°', weight: 280, madeIn: 'Portugal' },
      { baseName: 'Veste Coupe-Vent', category: 'sport', priceRange: [10500, 12500], gender: 'Unisexe', materials: '100% Nylon déperlant', fit: 'Regular', season: 'Printemps-Automne', careInstructions: 'Lavage 30°, pas de sèche-linge', weight: 220, madeIn: 'Portugal' },
      { baseName: 'Jogging Technique Slim', category: 'sport', priceRange: [7500, 9500], gender: 'Homme', materials: '78% Polyester, 22% Élasthanne', fit: 'Slim', season: 'Automne-Hiver', careInstructions: 'Lavage 30°', weight: 260, madeIn: 'Portugal' },
    ],
  },

  haute_couture_fem: {
    colorPalette: PALETTES['luxe']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 5],
    productTypes: [
      { baseName: 'Robe Soirée Structurée', category: 'robe', priceRange: [28500, 45500], gender: 'Femme', materials: '100% Soie naturelle', fit: 'Fitted', season: 'Toutes saisons', careInstructions: 'Nettoyage à sec uniquement', weight: 280, madeIn: 'France' },
      { baseName: 'Robe Midi Fluide', category: 'robe', priceRange: [18500, 24500], gender: 'Femme', materials: '100% Crêpe de soie', fit: 'Fluid', season: 'Printemps-Été', careInstructions: 'Lavage à la main ou nettoyage à sec', weight: 220, madeIn: 'France' },
      { baseName: 'Robe Portefeuille', category: 'robe', priceRange: [16500, 22500], gender: 'Femme', materials: '100% Viscose crêpe', fit: 'Wrap', season: 'Toutes saisons', careInstructions: 'Lavage 30° délicat', weight: 200, madeIn: 'France' },
      { baseName: 'Blazer Structuré Couture', category: 'veste_blouson', priceRange: [38500, 48500], gender: 'Femme', materials: '100% Laine vierge', fit: 'Structured', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 480, madeIn: 'France' },
      { baseName: 'Pantalon Tailleur', category: 'pantalon', priceRange: [22500, 28500], gender: 'Femme', materials: '100% Laine vierge', fit: 'Straight', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 380, madeIn: 'France' },
      { baseName: 'Top Bustier Satiné', category: 'tshirt', priceRange: [12500, 16500], gender: 'Femme', materials: '100% Satin polyester premium', fit: 'Fitted', season: 'Toutes saisons', careInstructions: 'Lavage à la main', weight: 160, madeIn: 'France' },
      { baseName: 'Jupe Crayon Couture', category: 'robe', priceRange: [18500, 22500], gender: 'Femme', materials: '100% Laine crêpe', fit: 'Fitted', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 280, madeIn: 'France' },
      { baseName: 'Manteau Couture Structuré', category: 'manteau', priceRange: [55500, 75500], gender: 'Femme', materials: '100% Cachemire', fit: 'Straight', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec uniquement', weight: 680, madeIn: 'France' },
      { baseName: 'Robe Cocktail Festive', category: 'robe', priceRange: [22500, 32500], gender: 'Femme', materials: '100% Dentelle de Calais', fit: 'A-line', season: 'Toutes saisons', careInstructions: 'Nettoyage à sec', weight: 240, madeIn: 'France' },
      { baseName: 'Ensemble Veste + Jupe', category: 'veste_blouson', priceRange: [45500, 58500], gender: 'Femme', materials: '100% Tweed laine', fit: 'Structured', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 680, madeIn: 'France' },
    ],
  },

  bijoux_artisanal: {
    colorPalette: PALETTES['bijoux']!,
    sizeSet: SIZES['jewel']!,
    colorCount: [2, 4],
    productTypes: [
      { baseName: 'Collier Artisanal', category: 'bijoux', priceRange: [3500, 8500], gender: 'Femme', materials: 'Laiton doré 24K', fit: 'Unique', season: 'Toutes saisons', careInstructions: 'Conserver dans sa pochette', weight: 20, madeIn: 'France' },
      { baseName: 'Boucles Créoles', category: 'bijoux', priceRange: [2800, 6500], gender: 'Femme', materials: 'Argent 925', fit: 'Unique', season: 'Toutes saisons', careInstructions: 'Conserver dans sa pochette, éviter l\'eau', weight: 10, madeIn: 'France' },
      { baseName: 'Bracelet Fin Chaîne', category: 'bijoux', priceRange: [2500, 5500], gender: 'Femme', materials: 'Laiton doré 18K', fit: 'Unique', season: 'Toutes saisons', careInstructions: 'Conserver dans sa pochette', weight: 8, madeIn: 'France' },
      { baseName: 'Bague Chevalière', category: 'bijoux', priceRange: [4500, 9500], gender: 'Unisexe', materials: 'Argent 925 recyclé', fit: 'Unique', season: 'Toutes saisons', careInstructions: 'Nettoyer avec chiffon doux', weight: 12, madeIn: 'France' },
      { baseName: 'Pendentif Organique', category: 'bijoux', priceRange: [3500, 7500], gender: 'Femme', materials: 'Laiton doré, pierre naturelle', fit: 'Unique', season: 'Toutes saisons', careInstructions: 'Éviter le contact avec l\'eau', weight: 15, madeIn: 'France' },
      { baseName: 'Bracelet de Cheville', category: 'bijoux', priceRange: [2200, 4500], gender: 'Femme', materials: 'Laiton doré 18K', fit: 'Unique', season: 'Printemps-Été', careInstructions: 'Conserver dans sa pochette', weight: 8, madeIn: 'France' },
      { baseName: 'Parure 3 Pièces', category: 'bijoux', priceRange: [8500, 15500], gender: 'Femme', materials: 'Laiton doré 24K, cristaux', fit: 'Unique', season: 'Toutes saisons', careInstructions: 'Conserver dans le coffret', weight: 45, madeIn: 'France' },
      { baseName: 'Broche Email', category: 'bijoux', priceRange: [3500, 6500], gender: 'Femme', materials: 'Laiton émaillé fait main', fit: 'Unique', season: 'Toutes saisons', careInstructions: 'Éviter les chocs', weight: 18, madeIn: 'France' },
      { baseName: 'Boucles Longues Pendantes', category: 'bijoux', priceRange: [4500, 8500], gender: 'Femme', materials: 'Argent 925, perles naturelles', fit: 'Unique', season: 'Toutes saisons', careInstructions: 'Conserver dans sa pochette', weight: 12, madeIn: 'France' },
      { baseName: 'Collier Ras-de-cou', category: 'bijoux', priceRange: [4500, 9500], gender: 'Femme', materials: 'Or 9K plaqué', fit: 'Unique', season: 'Toutes saisons', careInstructions: 'Conserver à l\'abri de l\'humidité', weight: 10, madeIn: 'France' },
    ],
  },

  outerwear: {
    colorPalette: PALETTES['luxe']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 5],
    productTypes: [
      { baseName: 'Manteau Laine Double Face', category: 'manteau', priceRange: [38500, 48500], gender: 'Unisexe', materials: '80% Laine, 20% Cachemire', fit: 'Structured', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec uniquement', weight: 780, madeIn: 'France' },
      { baseName: 'Parka Technique Premium', category: 'manteau', priceRange: [28500, 35500], gender: 'Unisexe', materials: '100% Nylon Gore-Tex® déperlant', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Lavage 30°, pas de sèche-linge', weight: 580, madeIn: 'France' },
      { baseName: 'Trench Classique', category: 'manteau', priceRange: [32500, 42500], gender: 'Unisexe', materials: '100% Coton gabardine', fit: 'Regular', season: 'Printemps-Automne', careInstructions: 'Nettoyage à sec', weight: 620, madeIn: 'France' },
      { baseName: 'Duvet Léger Premium', category: 'manteau', priceRange: [22500, 28500], gender: 'Unisexe', materials: '100% Nylon, garnissage duvet 90/10', fit: 'Regular', season: 'Hiver', careInstructions: 'Lavage machine 30°, sèche-linge bas', weight: 420, madeIn: 'France' },
      { baseName: 'Veste Matelassée', category: 'veste_blouson', priceRange: [18500, 22500], gender: 'Unisexe', materials: '100% Coton sergé matelassé', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Lavage 30°', weight: 480, madeIn: 'France' },
      { baseName: 'Blouson Cuir Veau', category: 'veste_blouson', priceRange: [45500, 58500], gender: 'Unisexe', materials: '100% Cuir de veau pleine fleur', fit: 'Regular', season: 'Printemps-Automne', careInstructions: 'Entretien cuir spécialisé', weight: 680, madeIn: 'France' },
      { baseName: 'Manteau Cachemire', category: 'manteau', priceRange: [58500, 72500], gender: 'Femme', materials: '100% Cachemire Mongolie', fit: 'Straight', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec uniquement', weight: 720, madeIn: 'France' },
      { baseName: 'Imperméable Long', category: 'manteau', priceRange: [32500, 38500], gender: 'Unisexe', materials: '100% Nylon déperlant recyclé', fit: 'Oversized', season: 'Printemps-Automne', careInstructions: 'Lavage 30°', weight: 480, madeIn: 'France' },
      { baseName: 'Caban Marine', category: 'manteau', priceRange: [38500, 48500], gender: 'Homme', materials: '80% Laine, 20% Polyester', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 780, madeIn: 'France' },
      { baseName: 'Veste de Chasse Revisitée', category: 'veste_blouson', priceRange: [28500, 35500], gender: 'Unisexe', materials: '65% Coton, 35% Polyester', fit: 'Regular', season: 'Automne-Printemps', careInstructions: 'Lavage 40°', weight: 520, madeIn: 'France' },
    ],
  },

  tailleur_masc: {
    colorPalette: [
      { name: 'Navy', code: '#1a2744' },
      { name: 'Anthracite', code: '#383838' },
      { name: 'Gris clair', code: '#d4d4d4' },
      { name: 'Camel', code: '#c19a6b' },
      { name: 'Bordeaux', code: '#722f37' },
      { name: 'Blanc optique', code: '#fafafa' },
    ],
    sizeSet: SIZES['clothing']!,
    colorCount: [2, 4],
    productTypes: [
      { baseName: 'Blazer Tailleur', category: 'veste_blouson', priceRange: [28500, 38500], gender: 'Homme', materials: '100% Laine vierge Super 110s', fit: 'Structured', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 520, madeIn: 'France' },
      { baseName: 'Pantalon Tailleur Droit', category: 'pantalon', priceRange: [18500, 24500], gender: 'Homme', materials: '100% Laine vierge', fit: 'Straight', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 380, madeIn: 'France' },
      { baseName: 'Chemise Oxford Premium', category: 'tshirt', priceRange: [8500, 11500], gender: 'Homme', materials: '100% Coton oxford 120 fils', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Lavage 40°, repasser humide', weight: 180, madeIn: 'France' },
      { baseName: 'Gilet de Costume', category: 'tshirt', priceRange: [14500, 18500], gender: 'Homme', materials: '100% Laine vierge', fit: 'Fitted', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 280, madeIn: 'France' },
      { baseName: 'Pardessus Structuré', category: 'manteau', priceRange: [52500, 65500], gender: 'Homme', materials: '80% Laine, 20% Cachemire', fit: 'Structured', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec uniquement', weight: 820, madeIn: 'France' },
      { baseName: 'Chemise Lin Été', category: 'tshirt', priceRange: [7500, 9500], gender: 'Homme', materials: '100% Lin biologique', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Lavage 30°', weight: 140, madeIn: 'France' },
      { baseName: 'Pull Col Roulé Fin', category: 'pull_knitwear', priceRange: [12500, 15500], gender: 'Homme', materials: '100% Mérinos Extrafin', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Lavage à la main 30°', weight: 220, madeIn: 'Italie' },
      { baseName: 'Veste Casual Structurée', category: 'veste_blouson', priceRange: [22500, 28500], gender: 'Homme', materials: '65% Laine, 35% Polyester', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Nettoyage à sec', weight: 480, madeIn: 'France' },
      { baseName: 'Pantalon Velours', category: 'pantalon', priceRange: [18500, 22500], gender: 'Homme', materials: '100% Coton velours côtelé', fit: 'Straight', season: 'Automne-Hiver', careInstructions: 'Lavage 30°, retourner avant lavage', weight: 380, madeIn: 'France' },
      { baseName: 'Costume 2 Pièces', category: 'veste_blouson', priceRange: [55500, 72500], gender: 'Homme', materials: '100% Laine Super 120s', fit: 'Structured', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec uniquement', weight: 860, madeIn: 'France' },
    ],
  },

  denim_artisanal: {
    colorPalette: PALETTES['denim']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 5],
    productTypes: [
      { baseName: 'Jean Slim Selvedge', category: 'denim', priceRange: [9500, 12500], gender: 'Unisexe', materials: '100% Denim selvedge 13oz', fit: 'Slim', season: 'Toutes saisons', careInstructions: 'Lavage rare 30°, à l\'envers', weight: 620, madeIn: 'France' },
      { baseName: 'Jean Droit Indigo', category: 'denim', priceRange: [10500, 13500], gender: 'Unisexe', materials: '100% Denim indigo 12oz', fit: 'Straight', season: 'Toutes saisons', careInstructions: 'Lavage rare 30°, à l\'envers', weight: 580, madeIn: 'France' },
      { baseName: 'Jean Large Oversize', category: 'denim', priceRange: [11500, 14500], gender: 'Unisexe', materials: '100% Denim coton 14oz', fit: 'Oversized', season: 'Toutes saisons', careInstructions: 'Lavage rare 30°', weight: 680, madeIn: 'France' },
      { baseName: 'Veste en Jean Type 2', category: 'denim', priceRange: [14500, 18500], gender: 'Unisexe', materials: '100% Denim selvedge 11oz', fit: 'Regular', season: 'Printemps-Automne', careInstructions: 'Lavage rare 30°, à l\'envers', weight: 580, madeIn: 'France' },
      { baseName: 'Short Denim Raw', category: 'denim', priceRange: [6500, 8500], gender: 'Unisexe', materials: '100% Denim coton 12oz', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Lavage rare 30°', weight: 380, madeIn: 'France' },
      { baseName: 'Salopette Denim', category: 'denim', priceRange: [16500, 19500], gender: 'Unisexe', materials: '100% Denim coton 10oz', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Lavage 30°, à l\'envers', weight: 720, madeIn: 'France' },
      { baseName: 'Jean Taille Haute', category: 'denim', priceRange: [9500, 12500], gender: 'Femme', materials: '98% Denim coton, 2% Élasthanne', fit: 'High waist straight', season: 'Toutes saisons', careInstructions: 'Lavage 30°', weight: 540, madeIn: 'France' },
      { baseName: 'Chemise Denim Léger', category: 'denim', priceRange: [8500, 11500], gender: 'Unisexe', materials: '100% Denim coton léger 6oz', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Lavage 30°', weight: 280, madeIn: 'France' },
      { baseName: 'Jean Bootcut Vintage', category: 'denim', priceRange: [10500, 13500], gender: 'Femme', materials: '99% Coton, 1% Élasthanne', fit: 'Bootcut', season: 'Toutes saisons', careInstructions: 'Lavage 30°, à l\'envers', weight: 560, madeIn: 'France' },
      { baseName: 'Pantalon Workwear Denim', category: 'denim', priceRange: [13500, 17500], gender: 'Unisexe', materials: '100% Denim coton sergé 14oz', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Lavage 40°', weight: 720, madeIn: 'France' },
    ],
  },

  knitwear: {
    colorPalette: PALETTES['knitwear']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 6],
    productTypes: [
      { baseName: 'Pull Col Rond Côtelé', category: 'pull_knitwear', priceRange: [12500, 16500], gender: 'Unisexe', materials: '100% Mérinos certifié Woolmark', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Lavage à la main, séchage à plat', weight: 380, madeIn: 'France' },
      { baseName: 'Cardigan Long Ouvert', category: 'pull_knitwear', priceRange: [15500, 19500], gender: 'Femme', materials: '80% Laine, 20% Cachemire', fit: 'Relaxed', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 420, madeIn: 'France' },
      { baseName: 'Pull Col V Fin', category: 'pull_knitwear', priceRange: [10500, 13500], gender: 'Unisexe', materials: '100% Coton peigné organique', fit: 'Regular', season: 'Printemps-Automne', careInstructions: 'Lavage 30° délicat', weight: 280, madeIn: 'France' },
      { baseName: 'Pull Torsadé Irlandais', category: 'pull_knitwear', priceRange: [16500, 21500], gender: 'Unisexe', materials: '100% Laine Aran irlandaise', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Lavage à la main, séchage à plat', weight: 480, madeIn: 'Irlande' },
      { baseName: 'Gilet Boutonné', category: 'pull_knitwear', priceRange: [13500, 17500], gender: 'Unisexe', materials: '100% Mérinos extrafin', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Lavage à la main 30°', weight: 320, madeIn: 'France' },
      { baseName: 'Pull Oversize Doux', category: 'pull_knitwear', priceRange: [14500, 18500], gender: 'Femme', materials: '60% Alpaga, 40% Laine', fit: 'Oversized', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec recommandé', weight: 380, madeIn: 'France' },
      { baseName: 'Top Tricot Côtelé', category: 'pull_knitwear', priceRange: [8500, 11500], gender: 'Femme', materials: '100% Coton côtelé organique', fit: 'Fitted', season: 'Printemps-Été', careInstructions: 'Lavage 30°', weight: 180, madeIn: 'France' },
      { baseName: 'Robe Tricotée Midi', category: 'pull_knitwear', priceRange: [18500, 23500], gender: 'Femme', materials: '100% Mérinos certifié', fit: 'Relaxed', season: 'Automne-Hiver', careInstructions: 'Lavage à la main, séchage à plat', weight: 480, madeIn: 'France' },
      { baseName: 'Écharpe Grand Format', category: 'pull_knitwear', priceRange: [6500, 9500], gender: 'Unisexe', materials: '100% Cachemire Mongolie', fit: 'Unique', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec uniquement', weight: 280, madeIn: 'France' },
      { baseName: 'Bonnet Cachemire', category: 'pull_knitwear', priceRange: [4500, 7500], gender: 'Unisexe', materials: '100% Cachemire Grade A', fit: 'Unique', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 80, madeIn: 'France' },
    ],
  },

  culturel_mode: {
    colorPalette: PALETTES['culturel']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 5],
    productTypes: [
      { baseName: 'Boubou Élaboré', category: 'robe', priceRange: [28500, 38500], gender: 'Homme', materials: '100% Coton wax africain', fit: 'Oversized', season: 'Toutes saisons', careInstructions: 'Lavage à la main 30°', weight: 480, madeIn: 'France' },
      { baseName: 'Chemise Wax Contemporaine', category: 'tshirt', priceRange: [9500, 14500], gender: 'Homme', materials: '100% Tissu wax hollandais', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Lavage 30°, repasser humide', weight: 220, madeIn: 'France' },
      { baseName: 'Robe Wax Structurée', category: 'robe', priceRange: [18500, 25500], gender: 'Femme', materials: '100% Tissu wax africain', fit: 'Structured', season: 'Toutes saisons', careInstructions: 'Lavage 30°', weight: 380, madeIn: 'France' },
      { baseName: 'Ensemble Dashiki Premium', category: 'tshirt', priceRange: [22500, 29500], gender: 'Unisexe', materials: '100% Coton brodé main', fit: 'Relaxed', season: 'Toutes saisons', careInstructions: 'Lavage délicat 30°', weight: 420, madeIn: 'France' },
      { baseName: 'Caftan Soirée Brodé', category: 'robe', priceRange: [35500, 48500], gender: 'Femme', materials: '100% Crêpe satiné brodé main', fit: 'Fluid', season: 'Toutes saisons', careInstructions: 'Nettoyage à sec uniquement', weight: 580, madeIn: 'France' },
      { baseName: 'Agbada 3 Pièces', category: 'veste_blouson', priceRange: [45500, 58500], gender: 'Homme', materials: '100% Satin brodé', fit: 'Ceremonial', season: 'Toutes saisons', careInstructions: 'Nettoyage à sec', weight: 780, madeIn: 'France' },
      { baseName: 'Veste Kente Moderne', category: 'veste_blouson', priceRange: [15500, 22500], gender: 'Unisexe', materials: '100% Tissu kente tissé main', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Nettoyage à sec recommandé', weight: 380, madeIn: 'France' },
      { baseName: 'Jumpsuit Ankara', category: 'robe', priceRange: [18500, 24500], gender: 'Femme', materials: '100% Tissu ankara imprimé', fit: 'Relaxed', season: 'Toutes saisons', careInstructions: 'Lavage 30°', weight: 340, madeIn: 'France' },
      { baseName: 'Short Ankara Élégant', category: 'pantalon', priceRange: [6500, 9500], gender: 'Homme', materials: '100% Tissu ankara', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Lavage 30°', weight: 280, madeIn: 'France' },
      { baseName: 'Cape Cérémonie', category: 'manteau', priceRange: [28500, 38500], gender: 'Unisexe', materials: '100% Velours brodé', fit: 'Draped', season: 'Toutes saisons', careInstructions: 'Nettoyage à sec uniquement', weight: 580, madeIn: 'France' },
    ],
  },

  lingerie_fine: {
    colorPalette: PALETTES['lingerie']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 6],
    productTypes: [
      { baseName: 'Soutien-Gorge Dentelle', category: 'lingerie', priceRange: [4500, 7500], gender: 'Femme', materials: '85% Polyamide, 15% Élasthanne, dentelle Calais', fit: 'Fitted', season: 'Toutes saisons', careInstructions: 'Lavage main ou filet 30°', weight: 80, madeIn: 'France' },
      { baseName: 'Culotte Taille Haute', category: 'lingerie', priceRange: [3500, 5500], gender: 'Femme', materials: '78% Polyamide, 22% Élasthanne', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Lavage main ou filet 30°', weight: 60, madeIn: 'France' },
      { baseName: 'Caraco Satin Glisse', category: 'lingerie', priceRange: [4500, 6500], gender: 'Femme', materials: '100% Satin polyester premium', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Lavage 30° délicat', weight: 100, madeIn: 'France' },
      { baseName: 'Nuisette Courte', category: 'lingerie', priceRange: [6500, 9500], gender: 'Femme', materials: '100% Viscose satinée', fit: 'Fluid', season: 'Toutes saisons', careInstructions: 'Lavage 30° délicat', weight: 120, madeIn: 'France' },
      { baseName: 'Pyjama Classique', category: 'lingerie', priceRange: [8500, 12500], gender: 'Femme', materials: '100% Coton satiné', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Lavage 40°', weight: 280, madeIn: 'France' },
      { baseName: 'Kimono Dépareillé', category: 'lingerie', priceRange: [7500, 10500], gender: 'Femme', materials: '100% Satin polyester', fit: 'Fluid', season: 'Toutes saisons', careInstructions: 'Lavage 30° délicat', weight: 160, madeIn: 'France' },
      { baseName: 'Body Dentelle Chic', category: 'lingerie', priceRange: [7500, 11500], gender: 'Femme', materials: '85% Polyamide, 15% Élasthanne', fit: 'Fitted', season: 'Toutes saisons', careInstructions: 'Lavage main ou filet 30°', weight: 120, madeIn: 'France' },
      { baseName: 'Bustier Balconnet', category: 'lingerie', priceRange: [5500, 8500], gender: 'Femme', materials: '85% Polyamide, 15% Élasthanne', fit: 'Fitted', season: 'Toutes saisons', careInstructions: 'Lavage main 30°', weight: 90, madeIn: 'France' },
      { baseName: 'Set Lingerie Assorti', category: 'lingerie', priceRange: [9500, 14500], gender: 'Femme', materials: '85% Polyamide, 15% Élasthanne', fit: 'Fitted', season: 'Toutes saisons', careInstructions: 'Lavage main ou filet 30°', weight: 150, madeIn: 'France' },
      { baseName: 'Shorty Dentelle', category: 'lingerie', priceRange: [3500, 5500], gender: 'Femme', materials: '80% Polyamide, 20% Élasthanne', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Lavage main ou filet 30°', weight: 60, madeIn: 'France' },
    ],
  },

  romantique_fem: {
    colorPalette: PALETTES['romantique']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 5],
    productTypes: [
      { baseName: 'Robe Fleurie Midi', category: 'robe', priceRange: [7500, 12500], gender: 'Femme', materials: '100% Viscose imprimée', fit: 'A-line', season: 'Printemps-Été', careInstructions: 'Lavage 30° délicat', weight: 280, madeIn: 'France' },
      { baseName: 'Jupe Plissée Longue', category: 'robe', priceRange: [6500, 9500], gender: 'Femme', materials: '100% Polyester satiné', fit: 'Flared', season: 'Printemps-Été', careInstructions: 'Lavage 30° délicat', weight: 260, madeIn: 'France' },
      { baseName: 'Blouse Volants', category: 'tshirt', priceRange: [5500, 8500], gender: 'Femme', materials: '100% Coton popeline', fit: 'Loose', season: 'Printemps-Été', careInstructions: 'Lavage 30°', weight: 140, madeIn: 'France' },
      { baseName: 'Top Dentelle Délicat', category: 'tshirt', priceRange: [4500, 7500], gender: 'Femme', materials: '100% Coton dentelle', fit: 'Fitted', season: 'Printemps-Été', careInstructions: 'Lavage main 30°', weight: 120, madeIn: 'France' },
      { baseName: 'Robe Portefeuille Fleuri', category: 'robe', priceRange: [8500, 13500], gender: 'Femme', materials: '100% Viscose', fit: 'Wrap', season: 'Printemps-Été', careInstructions: 'Lavage 30° délicat', weight: 240, madeIn: 'France' },
      { baseName: 'Cardigan Doux Oversize', category: 'pull_knitwear', priceRange: [7500, 11500], gender: 'Femme', materials: '60% Acrylique, 40% Coton', fit: 'Oversized', season: 'Automne-Printemps', careInstructions: 'Lavage 30° délicat', weight: 280, madeIn: 'France' },
      { baseName: 'Robe Smockée', category: 'robe', priceRange: [7500, 11500], gender: 'Femme', materials: '100% Coton brodé', fit: 'Relaxed', season: 'Printemps-Été', careInstructions: 'Lavage 30°', weight: 220, madeIn: 'France' },
      { baseName: 'Jupe Longue Bohème', category: 'robe', priceRange: [6500, 9500], gender: 'Femme', materials: '100% Viscose imprimée', fit: 'Flared', season: 'Printemps-Été', careInstructions: 'Lavage 30° délicat', weight: 240, madeIn: 'France' },
      { baseName: 'Top Brodé Cropped', category: 'tshirt', priceRange: [4500, 7500], gender: 'Femme', materials: '100% Coton brodé main', fit: 'Cropped', season: 'Printemps-Été', careInstructions: 'Lavage 30°', weight: 120, madeIn: 'France' },
      { baseName: 'Ensemble 2 Pièces Fleuri', category: 'tshirt', priceRange: [12500, 17500], gender: 'Femme', materials: '100% Viscose imprimée', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Lavage 30° délicat', weight: 340, madeIn: 'France' },
    ],
  },

  sneaker_custom: {
    colorPalette: [
      { name: 'Blanc/Noir', code: '#f5f5f5' },
      { name: 'Triple Noir', code: '#1a1a1a' },
      { name: 'Red Lace', code: '#8b1c2c' },
      { name: 'Sunset', code: '#f4a261' },
      { name: 'Forest', code: '#2d5a27' },
      { name: 'Cobalt', code: '#0047ab' },
    ],
    sizeSet: SIZES['shoes']!,
    colorCount: [2, 4],
    productTypes: [
      { baseName: 'Sneaker Low Custom', category: 'sneaker', priceRange: [12500, 18500], gender: 'Unisexe', materials: 'Cuir pleine fleur + semelle EVA custom', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Nettoyer avec chiffon sec', weight: 420, madeIn: 'France' },
      { baseName: 'Sneaker High Custom', category: 'sneaker', priceRange: [14500, 20500], gender: 'Unisexe', materials: 'Canvas renforcé + semelle gum', fit: 'High top', season: 'Toutes saisons', careInstructions: 'Nettoyer avec brosse douce', weight: 480, madeIn: 'France' },
      { baseName: 'Sneaker Running Custom', category: 'sneaker', priceRange: [16500, 22500], gender: 'Unisexe', materials: 'Mesh technique + semelle Boost custom', fit: 'Athletic', season: 'Toutes saisons', careInstructions: 'Lavage manuel 30°', weight: 380, madeIn: 'France' },
      { baseName: 'Slip-On Artisanal', category: 'sneaker', priceRange: [8500, 13500], gender: 'Unisexe', materials: 'Canvas imprimé + semelle caoutchouc', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Lavage manuel 30°', weight: 280, madeIn: 'France' },
      { baseName: 'Boot Cuir Custom', category: 'sneaker', priceRange: [22500, 32500], gender: 'Unisexe', materials: 'Cuir grain + semelle Vibram', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Cirer régulièrement', weight: 680, madeIn: 'France' },
      { baseName: 'Sneaker Mid Brodée', category: 'sneaker', priceRange: [15500, 21500], gender: 'Unisexe', materials: 'Suède + broderie main', fit: 'Mid top', season: 'Toutes saisons', careInstructions: 'Imperméabiliser, brosse suède', weight: 440, madeIn: 'France' },
      { baseName: 'Sneaker Collector Édition Limitée', category: 'sneaker', priceRange: [28500, 38500], gender: 'Unisexe', materials: 'Cuir exotique + peinture acrylique custom', fit: 'Regular', season: 'Toutes saisons', careInstructions: 'Conserver dans la boîte, chiffon sec', weight: 460, madeIn: 'France' },
      { baseName: 'Sandales Custom Été', category: 'sneaker', priceRange: [7500, 11500], gender: 'Unisexe', materials: 'Cuir végétal + semelle liège', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Nettoyage humide, sécher à l\'air', weight: 280, madeIn: 'France' },
      { baseName: 'Mule Artisanale', category: 'sneaker', priceRange: [9500, 14500], gender: 'Unisexe', materials: 'Velours + semelle cuir', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Brosse velours, imperméabilisant', weight: 320, madeIn: 'France' },
      { baseName: 'Espadrille Luxe', category: 'sneaker', priceRange: [8500, 12500], gender: 'Unisexe', materials: 'Jute + cuir souple', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Ne pas mouiller, sécher à l\'air', weight: 240, madeIn: 'Espagne' },
    ],
  },

  minimaliste: {
    colorPalette: PALETTES['minimaliste']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 5],
    productTypes: [
      { baseName: 'T-Shirt Lin Épuré', category: 'tshirt', priceRange: [5500, 7500], gender: 'Unisexe', materials: '55% Lin, 45% Coton bio', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Lavage 30° délicat', weight: 160, madeIn: 'Portugal' },
      { baseName: 'Pantalon Droit Structuré', category: 'pantalon', priceRange: [11500, 15500], gender: 'Unisexe', materials: '100% Laine légère', fit: 'Straight', season: 'Toutes saisons', careInstructions: 'Nettoyage à sec recommandé', weight: 360, madeIn: 'Portugal' },
      { baseName: 'Veste Kimono Contemporaine', category: 'veste_blouson', priceRange: [18500, 24500], gender: 'Unisexe', materials: '100% Coton lourd', fit: 'Kimono', season: 'Toutes saisons', careInstructions: 'Lavage 30° délicat', weight: 420, madeIn: 'Portugal' },
      { baseName: 'Robe Droite Minimaliste', category: 'robe', priceRange: [12500, 16500], gender: 'Femme', materials: '100% Coton japonais', fit: 'Straight', season: 'Toutes saisons', careInstructions: 'Lavage 30°', weight: 280, madeIn: 'Portugal' },
      { baseName: 'Chemise Oversize Épurée', category: 'tshirt', priceRange: [8500, 11500], gender: 'Unisexe', materials: '100% Coton oxford tissé serré', fit: 'Oversized', season: 'Toutes saisons', careInstructions: 'Lavage 40°, repasser', weight: 200, madeIn: 'Portugal' },
      { baseName: 'Jupe Midi Géométrique', category: 'robe', priceRange: [10500, 14500], gender: 'Femme', materials: '100% Laine crêpe', fit: 'A-line', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 320, madeIn: 'Portugal' },
      { baseName: 'Manteau Déstructuré', category: 'manteau', priceRange: [38500, 48500], gender: 'Unisexe', materials: '70% Laine, 30% Lin', fit: 'Oversized', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 680, madeIn: 'Portugal' },
      { baseName: 'Top Sans Coutures', category: 'tshirt', priceRange: [6500, 8500], gender: 'Femme', materials: '60% Modal, 40% Coton', fit: 'Fitted', season: 'Toutes saisons', careInstructions: 'Lavage 30°', weight: 140, madeIn: 'Portugal' },
      { baseName: 'Short Lin Épuré', category: 'pantalon', priceRange: [7500, 9500], gender: 'Unisexe', materials: '100% Lin certifié', fit: 'Regular', season: 'Printemps-Été', careInstructions: 'Lavage 30°', weight: 180, madeIn: 'Portugal' },
      { baseName: 'Blazer Déstructuré Japonais', category: 'veste_blouson', priceRange: [22500, 28500], gender: 'Unisexe', materials: '100% Coton lourd structuré', fit: 'Deconstructed', season: 'Toutes saisons', careInstructions: 'Nettoyage à sec', weight: 520, madeIn: 'Portugal' },
    ],
  },

  vintage_reviste: {
    colorPalette: PALETTES['vintage']!,
    sizeSet: SIZES['clothing']!,
    colorCount: [3, 5],
    productTypes: [
      { baseName: 'Jean Flare 70s', category: 'denim', priceRange: [8500, 12500], gender: 'Femme', materials: '99% Coton, 1% Élasthanne', fit: 'Flare', season: 'Toutes saisons', careInstructions: 'Lavage 30°, à l\'envers', weight: 580, madeIn: 'France' },
      { baseName: 'T-Shirt Crop Vintage', category: 'tshirt', priceRange: [4500, 6500], gender: 'Femme', materials: '100% Coton jersey vintage wash', fit: 'Cropped', season: 'Printemps-Été', careInstructions: 'Lavage 30°, pas de sèche-linge', weight: 160, madeIn: 'Portugal' },
      { baseName: 'Veste Velours Côtelé', category: 'veste_blouson', priceRange: [12500, 16500], gender: 'Unisexe', materials: '100% Coton velours côtelé', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Lavage 30°, retourner avant lavage', weight: 480, madeIn: 'France' },
      { baseName: 'Jupe Plissée Vintage', category: 'robe', priceRange: [6500, 9500], gender: 'Femme', materials: '100% Polyester satiné vintage', fit: 'Pleated', season: 'Toutes saisons', careInstructions: 'Lavage 30° délicat', weight: 280, madeIn: 'France' },
      { baseName: 'Chemise Vintage Oversized', category: 'tshirt', priceRange: [5500, 8500], gender: 'Unisexe', materials: '100% Coton vintage wash', fit: 'Oversized', season: 'Toutes saisons', careInstructions: 'Lavage 40°', weight: 200, madeIn: 'Portugal' },
      { baseName: 'Mini-Robe Revisitée', category: 'robe', priceRange: [7500, 11500], gender: 'Femme', materials: '100% Tricot côtelé', fit: 'Fitted', season: 'Toutes saisons', careInstructions: 'Lavage 30°', weight: 220, madeIn: 'France' },
      { baseName: 'Blazer Double Boutonnage', category: 'veste_blouson', priceRange: [15500, 20500], gender: 'Unisexe', materials: '70% Laine, 30% Polyester vintage', fit: 'Regular', season: 'Automne-Hiver', careInstructions: 'Nettoyage à sec', weight: 580, madeIn: 'France' },
      { baseName: 'Short Taille Haute', category: 'pantalon', priceRange: [5500, 8500], gender: 'Femme', materials: '100% Denim coton vintage', fit: 'High waist', season: 'Printemps-Été', careInstructions: 'Lavage 30°', weight: 280, madeIn: 'France' },
      { baseName: 'Robe Slip Satin', category: 'robe', priceRange: [6500, 9500], gender: 'Femme', materials: '100% Satin polyester', fit: 'Slip', season: 'Toutes saisons', careInstructions: 'Lavage 30° délicat', weight: 180, madeIn: 'France' },
      { baseName: 'Top Crochet Artisanal', category: 'pull_knitwear', priceRange: [5500, 8500], gender: 'Femme', materials: '100% Coton crocheté main', fit: 'Cropped', season: 'Printemps-Été', careInstructions: 'Lavage main 30°, séchage à plat', weight: 120, madeIn: 'France' },
    ],
  },
};

// ─── Définitions des 20 créateurs ──────────────────────────────────────────────

const CREATORS_DATA: CreatorDef[] = (creatorsJson as CreatorJsonDef[]).map(c => ({
  ...c,
  plan: c.plan as Plan,
}));

// ─── Données clients (300 clients) ────────────────────────────────────────────

const PRENOMS_H = ['Antoine', 'Thomas', 'Nicolas', 'Julien', 'Maxime', 'Alexandre', 'Pierre', 'Clément', 'Romain', 'Vincent', 'Mathieu', 'Baptiste', 'Quentin', 'Kevin', 'Florian', 'Alexis', 'Guillaume', 'Sébastien', 'Laurent', 'David', 'Raphaël', 'Hugo', 'Lucas', 'Ethan', 'Théo', 'Martin', 'Louis', 'Paul', 'Felix', 'Nathan'];
const PRENOMS_F = ['Sophie', 'Marie', 'Chloé', 'Julie', 'Laura', 'Emilie', 'Lucie', 'Camille', 'Emma', 'Léa', 'Alice', 'Clara', 'Elise', 'Manon', 'Sarah', 'Jade', 'Inès', 'Amélia', 'Eva', 'Margot', 'Pauline', 'Charlotte', 'Aurélie', 'Morgane', 'Amélie', 'Marine', 'Anaïs', 'Mathilde', 'Zoé', 'Noémie'];
const NOMS_FR = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Lefèvre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez'];
const EMAIL_DOMAINS = ['gmail.com', 'gmail.com', 'gmail.com', 'hotmail.fr', 'yahoo.fr', 'orange.fr', 'free.fr', 'laposte.net'];
const CITIES_FR: Array<{ city: string; postalCode: string }> = [
  { city: 'Paris', postalCode: '75001' }, { city: 'Paris', postalCode: '75008' }, { city: 'Paris', postalCode: '75011' }, { city: 'Paris', postalCode: '75015' }, { city: 'Paris', postalCode: '75018' },
  { city: 'Lyon', postalCode: '69001' }, { city: 'Lyon', postalCode: '69006' }, { city: 'Marseille', postalCode: '13001' }, { city: 'Marseille', postalCode: '13008' },
  { city: 'Toulouse', postalCode: '31000' }, { city: 'Nice', postalCode: '06000' }, { city: 'Nantes', postalCode: '44000' }, { city: 'Strasbourg', postalCode: '67000' },
  { city: 'Montpellier', postalCode: '34000' }, { city: 'Bordeaux', postalCode: '33000' }, { city: 'Lille', postalCode: '59000' }, { city: 'Rennes', postalCode: '35000' },
  { city: 'Reims', postalCode: '51100' }, { city: 'Saint-Étienne', postalCode: '42000' }, { city: 'Toulon', postalCode: '83000' }, { city: 'Grenoble', postalCode: '38000' },
  { city: 'Dijon', postalCode: '21000' }, { city: 'Angers', postalCode: '49000' }, { city: 'Nîmes', postalCode: '30000' }, { city: 'Clermont-Ferrand', postalCode: '63000' },
];
const STREET_TYPES = ['rue', 'avenue', 'boulevard', 'impasse', 'allée', 'place'];
const STREET_NAMES = ['des Fleurs', 'de la Paix', 'Victor Hugo', 'du Général de Gaulle', 'Voltaire', 'Gambetta', 'Jean Moulin', 'de la Liberté', 'République', 'des Arts', 'du Commerce', 'Pasteur', 'Jaurès', 'Saint-Martin', 'de la Gare', 'des Lilas', 'du Marché', 'Bellevue', 'de la Forêt', 'des Roses'];

function generateClients(): Array<{
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}> {
  const clients = [];
  const used = new Set<string>();

  for (let i = 0; i < 300; i++) {
    const isFemale = i % 2 === 0;
    const prenom = isFemale ? PRENOMS_F[i % PRENOMS_F.length]! : PRENOMS_H[i % PRENOMS_H.length]!;
    const nom = NOMS_FR[(i * 7 + 3) % NOMS_FR.length]!;
    const domain = EMAIL_DOMAINS[i % EMAIL_DOMAINS.length]!;
    const prenomClean = slugify(prenom).replace(/-/g, '');
    const nomClean = slugify(nom).replace(/-/g, '');
    let email = `${prenomClean}.${nomClean}@${domain}`;
    if (used.has(email)) email = `${prenomClean}.${nomClean}${i}@${domain}`;
    used.add(email);

    const loc = CITIES_FR[i % CITIES_FR.length]!;
    const streetNum = (i % 200) + 1;
    const streetType = STREET_TYPES[i % STREET_TYPES.length]!;
    const streetName = STREET_NAMES[i % STREET_NAMES.length]!;
    const phone = `+336${String(10000000 + i * 97).slice(0, 8)}`;

    clients.push({
      id: `user_client_${String(i + 1).padStart(3, '0')}`,
      email,
      name: `${prenom} ${nom}`,
      phone,
      address: `${streetNum} ${streetType} ${streetName}`,
      city: loc.city,
      postalCode: loc.postalCode,
    });
  }
  return clients;
}

// ─── Styles système ────────────────────────────────────────────────────────────

const SYSTEM_STYLES = [
  { id: 'style_streetstyle', name: 'Streetstyle', description: 'Mode urbaine, sportswear, sneaker culture' },
  { id: 'style_classic', name: 'Classic', description: 'Élégance classique, intemporel, tailleur' },
  { id: 'style_sportif', name: 'Sportif', description: 'Vêtements de sport et athleisure' },
  { id: 'style_scandi', name: 'Scandi', description: 'Minimalisme scandinave, épuré, fonctionnel' },
  { id: 'style_avantgarde', name: 'Avant-Garde', description: 'Mode expérimentale, déstructurée, artistique' },
  { id: 'style_boheme', name: 'Bohème', description: 'Romantic, fleuri, libre et naturel' },
];

// ─── Fonctions de seed ─────────────────────────────────────────────────────────

async function clearDatabase(): Promise<void> {
  console.log('🗑  Nettoyage base de données...');
  // Ordre FK-first
  await prisma.moderationActionRecord.deleteMany({});
  await prisma.flaggedContent.deleteMany({});
  await prisma.creatorSuspension.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.platformTransaction.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.returnRequest.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productSku.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.pageSection.deleteMany({});
  await prisma.creatorPage.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.style.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.creatorOnboarding.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('   ✓ Base de données nettoyée');
}

async function seedStyles(): Promise<Record<string, string>> {
  const styleMap: Record<string, string> = {};
  for (const s of SYSTEM_STYLES) {
    const style = await prisma.style.create({
      data: { id: s.id, name: s.name, description: s.description, status: StyleStatus.APPROVED },
    });
    styleMap[s.name] = style.id;
  }
  console.log(`   ✓ ${SYSTEM_STYLES.length} styles système`);
  return styleMap;
}

async function seedAdmin(hashedPassword: string) {
  const admin = await prisma.user.create({
    data: {
      id: 'user_admin_kpsull',
      email: 'admin@kpsull.fr',
      name: 'Admin Kpsull',
      role: Role.ADMIN,
      accountTypeChosen: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: '+33600000000',
      address: '1 rue de la Marketplace',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
    },
  });
  return admin;
}

function getCommissionRate(plan: Plan): number {
  if (plan === Plan.ATELIER) return 0.03;
  if (plan === Plan.STUDIO) return 0.04;
  return 0.05;
}

async function seedCreator(
  def: CreatorDef,
  hashedPassword: string,
  generationSpecs: GenerationSpec[],
): Promise<{ userId: string; productIds: string[] }> {
  const niche = NICHES[def.niche];
  if (!niche) throw new Error(`Niche inconnue: ${def.niche}`);

  // 1. User
  const user = await prisma.user.create({
    data: {
      id: `user_${def.id}`,
      email: def.email,
      name: def.name,
      role: Role.CREATOR,
      accountTypeChosen: true,
      wantsToBeCreator: true,
      emailVerified: new Date(),
      hashedPassword,
      phone: def.phone,
      address: def.address,
      city: def.city,
      postalCode: def.postalCode,
      country: 'France',
    },
  });

  // 2. Subscription
  await prisma.subscription.create({
    data: {
      id: `sub_${def.id}`,
      userId: user.id,
      creatorId: user.id,
      plan: def.plan,
      status: SubscriptionStatus.ACTIVE,
      billingInterval: 'year',
      currentPeriodStart: daysAgo(90),
      currentPeriodEnd: daysFromNow(275),
      commissionRate: getCommissionRate(def.plan),
      productsUsed: def.collections.length * niche.productTypes.length,
      stripeSubscriptionId: `sub_demo_${def.id}`,
      stripeCustomerId: `cus_demo_${def.id}`,
      stripePriceId: `price_demo_${def.plan.toLowerCase()}_year`,
    },
  });

  // 3. Onboarding
  await prisma.creatorOnboarding.create({
    data: {
      id: `onb_${def.id}`,
      userId: user.id,
      currentStep: OnboardingStep.COMPLETED,
      professionalInfoCompleted: true,
      siretVerified: true,
      stripeOnboarded: true,
      brandName: def.brandName,
      siret: def.siret,
      professionalAddress: `${def.address}, ${def.postalCode} ${def.city}`,
      stripeAccountId: def.stripeAccountId,
      dashboardTourCompleted: true,
      completedAt: daysAgo(80),
    },
  });

  // 4. Creator page
  const page = await prisma.creatorPage.create({
    data: {
      id: `page_${def.id}`,
      creatorId: user.id,
      slug: def.slug,
      title: def.brandName,
      description: `Découvrez ${def.brandName} — ${def.brandStyle}`,
      tagline: def.brandStyle.split(',')[0]!.trim(),
      status: PageStatus.PUBLISHED,
      publishedAt: daysAgo(60),
    },
  });

  // Sections de page
  await prisma.pageSection.createMany({
    data: [
      {
        id: `section_hero_${def.id}`,
        pageId: page.id,
        type: SectionType.HERO,
        title: def.brandName,
        content: { subtitle: def.brandStyle.split(',')[0], ctaText: 'Découvrir la collection', ctaLink: `/${def.slug}` },
        position: 0,
        isVisible: true,
      },
      {
        id: `section_products_${def.id}`,
        pageId: page.id,
        type: SectionType.PRODUCTS_FEATURED,
        title: 'Nos dernières créations',
        content: { subtitle: 'Sélection exclusive', displayCount: 6 },
        position: 1,
        isVisible: true,
      },
      {
        id: `section_about_${def.id}`,
        pageId: page.id,
        type: SectionType.ABOUT,
        title: `À propos de ${def.brandName}`,
        content: { text: `${def.brandName} est une marque indépendante française. ${def.brandStyle}.` },
        position: 2,
        isVisible: true,
      },
    ],
  });

  // 5. Notifications
  const notifTypes = ['ORDER_NEW', 'ORDER_SHIPPED', 'PAYMENT_RECEIVED', 'REVIEW_NEW', 'STOCK_LOW'];
  await prisma.notificationPreference.createMany({
    data: notifTypes.map((type) => ({
      userId: user.id,
      type,
      email: true,
      inApp: true,
    })),
  });

  // 6. Collections + Produits
  const allProductIds: string[] = [];

  for (let colIdx = 0; colIdx < def.collections.length; colIdx++) {
    const colDef = def.collections[colIdx]!;
    const projectId = `proj_${def.id}_${colIdx}`;

    await prisma.project.create({
      data: {
        id: projectId,
        creatorId: user.id,
        name: colDef.name,
        description: colDef.desc,
      },
    });

    // 10 produits par collection
    for (let prodIdx = 0; prodIdx < niche.productTypes.length; prodIdx++) {
      const tmpl = niche.productTypes[prodIdx]!;
      const productId = `prod_${def.id}_${colIdx}_${prodIdx}`;
      const productName = `${tmpl.baseName} — ${colDef.name}`;

      await prisma.product.create({
        data: {
          id: productId,
          creatorId: user.id,
          projectId,
          name: productName,
          description: `${productName}. ${def.brandStyle}. ${tmpl.materials}.`,
          price: randInt(tmpl.priceRange[0], tmpl.priceRange[1]),
          currency: 'EUR',
          status: ProductStatus.PUBLISHED,
          publishedAt: daysAgo(randInt(5, 90)),
          category: tmpl.category,
          gender: tmpl.gender,
          materials: tmpl.materials,
          fit: tmpl.fit,
          season: tmpl.season,
          madeIn: tmpl.madeIn,
          careInstructions: tmpl.careInstructions,
          weight: tmpl.weight,
        },
      });

      allProductIds.push(productId);

      // Variantes couleurs
      const colorCount = randInt(niche.colorCount[0], niche.colorCount[1]);
      const colors = pickN(niche.colorPalette, colorCount);

      for (let colorIdx = 0; colorIdx < colors.length; colorIdx++) {
        const col = colors[colorIdx]!;
        const variantId = `var_${def.id}_${colIdx}_${prodIdx}_${colorIdx}`;

        await prisma.productVariant.create({
          data: {
            id: variantId,
            productId,
            name: col.name,
            color: col.name,
            colorCode: col.code,
            images: [],
            stock: 0,
          },
        });

        // Spec de génération image
        generationSpecs.push({
          variantId,
          productId,
          productName,
          category: tmpl.category,
          color: col.code,
          colorName: col.name,
          brandName: def.brandName,
          brandStyle: def.brandStyle,
          gender: tmpl.gender,
          projectId,
          imageCount: 2,
        });

        // SKUs par taille
        const skuData = niche.sizeSet.map((size) => ({
          productId,
          variantId,
          size,
          stock: randInt(5, 25),
        }));

        await prisma.productSku.createMany({ data: skuData });
      }
    }
  }

  console.log(`   ✓ ${def.name} — ${def.collections.length} collections, ${allProductIds.length} produits`);
  return { userId: user.id, productIds: allProductIds };
}

async function seedClients(hashedPassword: string): Promise<Array<{ id: string; name: string; email: string; city: string; postalCode: string; address: string }>> {
  const clients = generateClients();
  const clientsData = [];

  for (const c of clients) {
    await prisma.user.create({
      data: {
        id: c.id,
        email: c.email,
        name: c.name,
        role: Role.CLIENT,
        accountTypeChosen: true,
        wantsToBeCreator: false,
        emailVerified: new Date(),
        hashedPassword,
        phone: c.phone,
        address: c.address,
        city: c.city,
        postalCode: c.postalCode,
        country: 'France',
      },
    });

    await prisma.notificationPreference.createMany({
      data: [
        { userId: c.id, type: 'ORDER_SHIPPED', email: true, inApp: true },
        { userId: c.id, type: 'ORDER_DELIVERED', email: true, inApp: true },
        { userId: c.id, type: 'PROMOTIONS', email: false, inApp: true },
      ],
    });

    clientsData.push(c);
  }

  console.log(`   ✓ ${clients.length} clients`);
  return clientsData;
}

const ORDER_STATUS_WEIGHTS: Array<{ status: OrderStatus; weight: number; daysAgoRange: [number, number] }> = [
  { status: OrderStatus.COMPLETED, weight: 40, daysAgoRange: [30, 180] },
  { status: OrderStatus.DELIVERED, weight: 20, daysAgoRange: [15, 45] },
  { status: OrderStatus.SHIPPED, weight: 15, daysAgoRange: [3, 15] },
  { status: OrderStatus.PAID, weight: 10, daysAgoRange: [1, 5] },
  { status: OrderStatus.PENDING, weight: 8, daysAgoRange: [0, 2] },
  { status: OrderStatus.CANCELED, weight: 4, daysAgoRange: [10, 90] },
  { status: OrderStatus.REFUNDED, weight: 2, daysAgoRange: [20, 90] },
  { status: OrderStatus.VALIDATION_PENDING, weight: 1, daysAgoRange: [5, 20] },
];

function pickOrderStatus(): { status: OrderStatus; daysAgoRange: [number, number] } {
  const totalWeight = ORDER_STATUS_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const w of ORDER_STATUS_WEIGHTS) {
    rand -= w.weight;
    if (rand <= 0) return w;
  }
  return ORDER_STATUS_WEIGHTS[0]!;
}

async function seedOrders(
  creators: Array<{ id: string; email: string; name: string; productIds: string[] }>,
  clients: Array<{ id: string; name: string; email: string; city: string; postalCode: string; address: string }>,
): Promise<number> {
  let orderCount = 0;
  let orderSeq = 1;

  // Distribuer 60-80 commandes par créateur
  for (const creator of creators) {
    const numOrders = randInt(60, 80);

    for (let i = 0; i < numOrders; i++) {
      const client = clients[i % clients.length]!;
      const { status, daysAgoRange } = pickOrderStatus();
      const orderDate = daysAgo(randInt(daysAgoRange[0], daysAgoRange[1]));
      const orderNumber = `ORD-2026-${String(orderSeq++).padStart(6, '0')}`;

      // 1-3 produits par commande
      const numItems = randInt(1, 3);
      const productSubset = pickN(creator.productIds, Math.min(numItems, creator.productIds.length));

      let totalAmount = 0;
      const items: Array<{ productId: string; productName: string; variantInfo: string; price: number; quantity: number }> = [];

      for (const productId of productSubset) {
        const parts = productId.split('_');
        const colIdx = parseInt(parts[parts.length - 2]!);
        const prodIdx = parseInt(parts[parts.length - 1]!);
        const creatorDef = CREATORS_DATA.find((c) => `user_${c.id}` === creator.id);
        const niche = creatorDef ? NICHES[creatorDef.niche] : null;
        const tmpl = niche?.productTypes[prodIdx % niche.productTypes.length];
        const colDef = creatorDef?.collections[colIdx % (creatorDef?.collections.length ?? 1)];

        const price = tmpl ? randInt(tmpl.priceRange[0], tmpl.priceRange[1]) : randInt(4500, 15000);
        const qty = randInt(1, 2);
        const palette = niche?.colorPalette ?? PALETTES['urban']!;
        const col = palette[randInt(0, palette.length - 1)]!;

        items.push({
          productId,
          productName: `${tmpl?.baseName ?? 'Produit'} — ${colDef?.name ?? 'Collection'}`,
          variantInfo: col.name,
          price,
          quantity: qty,
        });
        totalAmount += price * qty;
      }

      const order = await prisma.order.create({
        data: {
          id: `order_${creator.id.replace('user_', '')}_${i + 1}`,
          orderNumber,
          creatorId: creator.id,
          customerId: client.id,
          customerName: client.name,
          customerEmail: client.email,
          status,
          totalAmount,
          shippingStreet: client.address,
          shippingCity: client.city,
          shippingPostalCode: client.postalCode,
          shippingCountry: 'France',
          stripePaymentIntentId: `pi_demo_${orderNumber.replace(/-/g, '_').toLowerCase()}`,
          shippedAt: (status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED || status === OrderStatus.COMPLETED) ? new Date(orderDate.getTime() + 2 * 86400000) : null,
          deliveredAt: (status === OrderStatus.DELIVERED || status === OrderStatus.COMPLETED) ? new Date(orderDate.getTime() + 6 * 86400000) : null,
          createdAt: orderDate,
          updatedAt: orderDate,
        },
      });

      await prisma.orderItem.createMany({
        data: items.map((item, idx) => ({
          id: `oi_${order.id}_${idx}`,
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          variantInfo: item.variantInfo,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      orderCount++;
    }

    console.log(`   ✓ ${creator.email} — ${numOrders} commandes`);
  }

  return orderCount;
}

// ─── Export JSON ──────────────────────────────────────────────────────────────

async function exportProductionJson(counts: Record<string, number>): Promise<void> {
  console.log('\n📦 Export JSON production...');

  const [users, subscriptions, creatorOnboardings, creatorPages, pageSections, projects, products, productVariants, productSkus, orders, orderItems, styles, notificationPreferences] = await Promise.all([
    prisma.user.findMany(),
    prisma.subscription.findMany(),
    prisma.creatorOnboarding.findMany(),
    prisma.creatorPage.findMany(),
    prisma.pageSection.findMany(),
    prisma.project.findMany(),
    prisma.product.findMany(),
    prisma.productVariant.findMany(),
    prisma.productSku.findMany(),
    prisma.order.findMany(),
    prisma.orderItem.findMany(),
    prisma.style.findMany(),
    prisma.notificationPreference.findMany(),
  ]);

  const exportData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '2.0',
      counts,
    },
    users: users.map((u) => ({ ...u, hashedPassword: undefined })),
    subscriptions,
    creatorOnboardings,
    creatorPages,
    pageSections,
    projects,
    products,
    productVariants,
    productSkus,
    orders,
    orderItems,
    styles,
    notificationPreferences,
  };

  const seedAssetsDir = path.resolve('./prisma/seed-assets');
  if (!fs.existsSync(seedAssetsDir)) fs.mkdirSync(seedAssetsDir, { recursive: true });

  fs.writeFileSync(
    path.join(seedAssetsDir, 'production-export.json'),
    JSON.stringify(exportData, null, 2),
    'utf-8',
  );

  console.log('   ✓ production-export.json écrit');
}

async function exportGenerationSpecs(specs: GenerationSpec[]): Promise<void> {
  const seedAssetsDir = path.resolve('./prisma/seed-assets');
  if (!fs.existsSync(seedAssetsDir)) fs.mkdirSync(seedAssetsDir, { recursive: true });

  fs.writeFileSync(
    path.join(seedAssetsDir, 'generation-specs.json'),
    JSON.stringify({ variants: specs }, null, 2),
    'utf-8',
  );

  console.log(`   ✓ generation-specs.json — ${specs.length} variantes (${specs.reduce((s, v) => s + v.imageCount, 0)} images à générer)`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   KPSULL — SEED COMPLET v2.0                        ║');
  console.log('║   20 créateurs · 300 clients · 1200+ commandes      ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 0. Nettoyage
  await clearDatabase();

  // 1. Styles système
  console.log('\n🎨 Styles système...');
  await seedStyles();

  // 2. Admin
  console.log('\n👤 Admin...');
  const admin = await seedAdmin(hashedPassword);
  console.log(`   ✓ ${admin.email}`);

  // 3. Créateurs
  console.log('\n🎨 Créateurs (20)...');
  const generationSpecs: GenerationSpec[] = [];
  const creatorsInfo: Array<{ id: string; email: string; name: string; productIds: string[] }> = [];

  for (const creatorDef of CREATORS_DATA) {
    const { userId, productIds } = await seedCreator(creatorDef, hashedPassword, generationSpecs);
    creatorsInfo.push({ id: userId, email: creatorDef.email, name: creatorDef.name, productIds });
  }

  // 4. Clients
  console.log('\n👥 Clients (300)...');
  const clients = await seedClients(hashedPassword);

  // 5. Commandes
  console.log('\n🛍  Commandes (1200+)...');
  const orderCount = await seedOrders(creatorsInfo, clients);
  console.log(`   ✓ ${orderCount} commandes créées`);

  // 6. Compter les variants + SKUs
  const [variantCount, skuCount, productCount] = await Promise.all([
    prisma.productVariant.count(),
    prisma.productSku.count(),
    prisma.product.count(),
  ]);

  const counts = {
    admin: 1,
    creators: CREATORS_DATA.length,
    clients: clients.length,
    products: productCount,
    variants: variantCount,
    skus: skuCount,
    collections: CREATORS_DATA.reduce((s, c) => s + c.collections.length, 0),
    orders: orderCount,
    generationSpecs: generationSpecs.length,
    imagesToGenerate: generationSpecs.reduce((s, v) => s + v.imageCount, 0),
  };

  // 7. Export
  console.log('\n💾 Export des données...');
  await exportProductionJson(counts);
  await exportGenerationSpecs(generationSpecs);

  // 8. Résumé
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   SEED TERMINÉ — RÉSUMÉ                             ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Admin:               admin@kpsull.fr`);
  console.log(`Créateurs:           ${counts.creators}`);
  console.log(`Clients:             ${counts.clients}`);
  console.log(`Collections:         ${counts.collections}`);
  console.log(`Produits:            ${counts.products}`);
  console.log(`Variantes:           ${counts.variants}`);
  console.log(`SKUs:                ${counts.skus}`);
  console.log(`Commandes:           ${counts.orders}`);
  console.log(`Specs génération:    ${counts.generationSpecs} variantes`);
  console.log(`Images à générer:    ${counts.imagesToGenerate} (${Math.ceil(counts.imagesToGenerate / 1450)} jour(s))`);
  console.log('');
  console.log('Mot de passe tous les comptes: password123');
  console.log('');
  console.log('Prochaine étape — générer les images :');
  console.log('  1. Ajouter dans .env.local: GOOGLE_AI_API_KEY=<votre-clé>');
  console.log('     → Obtenir la clé (gratuit): https://aistudio.google.com/app/apikey');
  console.log('  2. Lancer: bun prisma/scripts/generate-images-gemini.ts');
  console.log('     → Le script reprend automatiquement chaque jour');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
