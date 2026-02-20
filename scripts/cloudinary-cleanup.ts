/**
 * Cloudinary Cleanup Script
 *
 * Lists all Cloudinary resources under the kpsull/ folder, compares them with
 * URLs stored in the database, and deletes orphaned resources (those in Cloudinary
 * but no longer referenced in the DB).
 *
 * Usage:
 *   bun scripts/cloudinary-cleanup.ts           # dry-run (no deletion)
 *   bun scripts/cloudinary-cleanup.ts --delete  # actually delete orphans
 */

import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from 'dotenv';
import path from 'node:path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const isDryRun = !process.argv.includes('--delete');

// ─── Configure Cloudinary ─────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error('Missing Cloudinary environment variables. Check your .env.local.');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable. Check your .env.local.');
  process.exit(1);
}

// ─── Cloudinary helpers ───────────────────────────────────────────────────────

interface CloudinaryResource {
  secure_url: string;
  public_id: string;
}

interface CloudinaryResponse {
  resources: CloudinaryResource[];
  next_cursor?: string;
}

/**
 * Lists all Cloudinary resources under a given prefix, handling pagination.
 */
async function listAllResources(prefix: string): Promise<CloudinaryResource[]> {
  const results: CloudinaryResource[] = [];
  let nextCursor: string | undefined;

  do {
    const response = (await cloudinary.api.resources({
      type: 'upload',
      prefix,
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    })) as CloudinaryResponse;

    results.push(...response.resources);
    nextCursor = response.next_cursor;
  } while (nextCursor);

  return results;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

/**
 * Collects all image URLs currently referenced in the database.
 */
async function collectDbUrls(prisma: PrismaClient): Promise<Set<string>> {
  const urls = new Set<string>();

  // ProductImage.url
  const productImages = await prisma.productImage.findMany({
    select: { url: true },
  });
  for (const img of productImages) {
    urls.add(img.url);
  }

  // ProductVariant.images (JSON array of URLs)
  const variants = await prisma.productVariant.findMany({
    select: { images: true },
  });
  for (const variant of variants) {
    if (Array.isArray(variant.images)) {
      for (const url of variant.images as string[]) {
        urls.add(url);
      }
    }
  }

  // Project.coverImage
  const projects = await prisma.project.findMany({
    select: { coverImage: true },
  });
  for (const project of projects) {
    if (project.coverImage) {
      urls.add(project.coverImage);
    }
  }

  return urls;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\nCloudinary Cleanup Script`);
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (no deletion)' : 'DELETE MODE'}`);
  console.log('─'.repeat(50));

  const connectionString = process.env.DATABASE_URL!;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Collect all Cloudinary resources
    console.log('\nFetching Cloudinary resources...');
    const [productsResources, collectionsResources] = await Promise.all([
      listAllResources('kpsull/products'),
      listAllResources('kpsull/collections'),
    ]);

    const allCloudinaryResources = [...productsResources, ...collectionsResources];
    console.log(`  Found ${allCloudinaryResources.length} resources in Cloudinary`);

    // 2. Collect all DB URLs
    console.log('\nFetching database URLs...');
    const dbUrls = await collectDbUrls(prisma);
    console.log(`  Found ${dbUrls.size} image URLs in database`);

    // 3. Identify orphans
    const orphans = allCloudinaryResources.filter(
      (resource) => !dbUrls.has(resource.secure_url)
    );

    console.log(`\nOrphaned resources: ${orphans.length}`);

    if (orphans.length === 0) {
      console.log('  No orphans found. Cloudinary is clean.');
      return;
    }

    // 4. Report orphans
    console.log('\nOrphaned resources:');
    for (const orphan of orphans) {
      console.log(`  - ${orphan.public_id}`);
      console.log(`    ${orphan.secure_url}`);
    }

    // 5. Delete orphans (or skip in dry-run)
    if (isDryRun) {
      console.log(`\nDRY-RUN: Would delete ${orphans.length} resource(s). Run with --delete to actually delete.`);
    } else {
      console.log(`\nDeleting ${orphans.length} orphaned resource(s)...`);
      let deleted = 0;
      let failed = 0;

      for (const orphan of orphans) {
        try {
          await cloudinary.uploader.destroy(orphan.public_id);
          console.log(`  Deleted: ${orphan.public_id}`);
          deleted++;
        } catch (err) {
          console.error(`  Failed to delete ${orphan.public_id}: ${err}`);
          failed++;
        }
      }

      console.log('\n─'.repeat(50));
      console.log(`Cleanup complete: ${deleted} deleted, ${failed} failed.`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
