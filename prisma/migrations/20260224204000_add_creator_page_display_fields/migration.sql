-- AlterTable: add display/customization columns to creator_pages
-- These columns were added to schema.prisma but the migration was never generated.
ALTER TABLE "creator_pages"
ADD COLUMN     "bannerImage" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "titleFont" TEXT,
ADD COLUMN     "titleColor" TEXT,
ADD COLUMN     "bannerPosition" TEXT,
ADD COLUMN     "socialLinks" JSONB;
