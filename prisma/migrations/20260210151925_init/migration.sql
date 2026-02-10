-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'CREATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('ESSENTIEL', 'STUDIO', 'ATELIER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'PAUSED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'VALIDATION_PENDING', 'COMPLETED', 'DISPUTE_OPENED', 'RETURN_SHIPPED', 'RETURN_RECEIVED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('HERO', 'ABOUT', 'BENTO_GRID', 'PRODUCTS_FEATURED', 'PRODUCTS_GRID', 'TESTIMONIALS', 'CONTACT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FlagReason" AS ENUM ('INAPPROPRIATE_CONTENT', 'COUNTERFEIT', 'PROHIBITED_ITEM', 'MISLEADING_DESCRIPTION', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('APPROVE', 'HIDE', 'DELETE');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('PROFESSIONAL_INFO', 'SIRET_VERIFICATION', 'STRIPE_CONNECT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'SHIPPED_BACK', 'RECEIVED', 'REFUNDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('CHANGED_MIND', 'DEFECTIVE', 'NOT_AS_DESCRIBED', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('NOT_RECEIVED', 'DAMAGED', 'WRONG_ITEM', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "hashedPassword" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "accountTypeChosen" BOOLEAN NOT NULL DEFAULT false,
    "wantsToBeCreator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "creator_onboardings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" "OnboardingStep" NOT NULL DEFAULT 'PROFESSIONAL_INFO',
    "professionalInfoCompleted" BOOLEAN NOT NULL DEFAULT false,
    "siretVerified" BOOLEAN NOT NULL DEFAULT false,
    "stripeOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "brandName" TEXT,
    "siret" TEXT,
    "professionalAddress" TEXT,
    "stripeAccountId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_onboardings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'ESSENTIEL',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingInterval" TEXT NOT NULL DEFAULT 'year',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "productsUsed" INTEGER NOT NULL DEFAULT 0,
    "pinnedProductsUsed" INTEGER NOT NULL DEFAULT 0,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "isTrialing" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT,
    "gracePeriodStart" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_pages" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT,
    "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" INTEGER NOT NULL,
    "shippingStreet" TEXT NOT NULL,
    "shippingCity" TEXT NOT NULL,
    "shippingPostalCode" TEXT NOT NULL,
    "shippingCountry" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeRefundId" TEXT,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "cancellationReason" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "productName" TEXT NOT NULL,
    "variantInfo" TEXT,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "image" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "priceOverride" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_requests" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "reason" "ReturnReason" NOT NULL,
    "additionalNotes" TEXT,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "rejectionReason" TEXT,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "deliveredAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "type" "DisputeType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flagged_content" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentTitle" TEXT NOT NULL,
    "contentDescription" TEXT,
    "contentImageUrl" TEXT,
    "creatorId" TEXT NOT NULL,
    "flaggedBy" TEXT NOT NULL,
    "flagReason" "FlagReason" NOT NULL,
    "flagDetails" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderatorId" TEXT,
    "moderatorNote" TEXT,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderatedAt" TIMESTAMP(3),

    CONSTRAINT "flagged_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" TEXT NOT NULL,
    "flaggedContentId" TEXT NOT NULL,
    "action" "ModerationActionType" NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_suspensions" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "suspendedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "suspendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reactivatedAt" TIMESTAMP(3),
    "reactivatedBy" TEXT,
    "reactivationReason" TEXT,

    CONSTRAINT "creator_suspensions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "creator_onboardings_userId_key" ON "creator_onboardings"("userId");

-- CreateIndex
CREATE INDEX "creator_onboardings_userId_idx" ON "creator_onboardings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_creatorId_key" ON "subscriptions"("creatorId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_creatorId_idx" ON "subscriptions"("creatorId");

-- CreateIndex
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "creator_pages_creatorId_key" ON "creator_pages"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "creator_pages_slug_key" ON "creator_pages"("slug");

-- CreateIndex
CREATE INDEX "creator_pages_slug_idx" ON "creator_pages"("slug");

-- CreateIndex
CREATE INDEX "creator_pages_status_idx" ON "creator_pages"("status");

-- CreateIndex
CREATE INDEX "page_sections_pageId_idx" ON "page_sections"("pageId");

-- CreateIndex
CREATE INDEX "page_sections_position_idx" ON "page_sections"("position");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_creatorId_idx" ON "orders"("creatorId");

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE INDEX "projects_creatorId_idx" ON "projects"("creatorId");

-- CreateIndex
CREATE INDEX "products_creatorId_idx" ON "products"("creatorId");

-- CreateIndex
CREATE INDEX "products_projectId_idx" ON "products"("projectId");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_sku_key" ON "product_variants"("productId", "sku");

-- CreateIndex
CREATE INDEX "product_images_productId_idx" ON "product_images"("productId");

-- CreateIndex
CREATE INDEX "product_images_position_idx" ON "product_images"("position");

-- CreateIndex
CREATE INDEX "return_requests_orderId_idx" ON "return_requests"("orderId");

-- CreateIndex
CREATE INDEX "return_requests_customerId_idx" ON "return_requests"("customerId");

-- CreateIndex
CREATE INDEX "return_requests_creatorId_idx" ON "return_requests"("creatorId");

-- CreateIndex
CREATE INDEX "return_requests_status_idx" ON "return_requests"("status");

-- CreateIndex
CREATE INDEX "disputes_orderId_idx" ON "disputes"("orderId");

-- CreateIndex
CREATE INDEX "disputes_customerId_idx" ON "disputes"("customerId");

-- CreateIndex
CREATE INDEX "disputes_creatorId_idx" ON "disputes"("creatorId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "flagged_content_status_idx" ON "flagged_content"("status");

-- CreateIndex
CREATE INDEX "flagged_content_creatorId_idx" ON "flagged_content"("creatorId");

-- CreateIndex
CREATE INDEX "flagged_content_contentType_idx" ON "flagged_content"("contentType");

-- CreateIndex
CREATE INDEX "moderation_actions_flaggedContentId_idx" ON "moderation_actions"("flaggedContentId");

-- CreateIndex
CREATE INDEX "moderation_actions_moderatorId_idx" ON "moderation_actions"("moderatorId");

-- CreateIndex
CREATE INDEX "creator_suspensions_creatorId_idx" ON "creator_suspensions"("creatorId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "creator_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_flaggedBy_fkey" FOREIGN KEY ("flaggedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_flaggedContentId_fkey" FOREIGN KEY ("flaggedContentId") REFERENCES "flagged_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_suspensions" ADD CONSTRAINT "creator_suspensions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_suspensions" ADD CONSTRAINT "creator_suspensions_suspendedBy_fkey" FOREIGN KEY ("suspendedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_suspensions" ADD CONSTRAINT "creator_suspensions_reactivatedBy_fkey" FOREIGN KEY ("reactivatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
