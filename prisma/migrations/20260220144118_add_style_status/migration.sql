/*
  Warnings:

  - You are about to drop the column `sku` on the `product_variants` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StyleStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "product_variants_productId_sku_key";

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "sku",
ADD COLUMN     "color" TEXT,
ADD COLUMN     "colorCode" TEXT,
ADD COLUMN     "images" JSONB DEFAULT '[]';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "careInstructions" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "certifications" TEXT,
ADD COLUMN     "fit" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "madeIn" TEXT,
ADD COLUMN     "materials" TEXT,
ADD COLUMN     "season" TEXT,
ADD COLUMN     "sizes" JSONB,
ADD COLUMN     "styleId" TEXT,
ADD COLUMN     "weight" INTEGER;

-- CreateTable
CREATE TABLE "styles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT,
    "status" "StyleStatus" NOT NULL DEFAULT 'APPROVED',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_skus" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "size" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_skus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "styles_name_key" ON "styles"("name");

-- CreateIndex
CREATE INDEX "styles_creatorId_idx" ON "styles"("creatorId");

-- CreateIndex
CREATE INDEX "styles_status_idx" ON "styles"("status");

-- CreateIndex
CREATE INDEX "product_skus_productId_idx" ON "product_skus"("productId");

-- CreateIndex
CREATE INDEX "product_skus_variantId_idx" ON "product_skus"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_skus_productId_variantId_size_key" ON "product_skus"("productId", "variantId", "size");

-- CreateIndex
CREATE INDEX "products_styleId_idx" ON "products"("styleId");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
