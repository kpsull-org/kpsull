/**
 * Reset DB — Vide toutes les tables dans le bon ordre (contraintes FK).
 *
 * Usage:
 *   bun prisma/reset-db.ts
 *
 * ATTENTION : supprime TOUTES les données. À suivre de :
 *   bun prisma/seed-mini.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kpsull-db';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetDb(): Promise<void> {
  console.log('');
  console.log('⚠️  RESET DB — Suppression de toutes les données');
  console.log('');

  // Niveau 1 : dépendent de Order
  const returnRequests = await prisma.returnRequest.deleteMany({});
  console.log(`   ✓ ReturnRequest       : ${returnRequests.count}`);

  const disputes = await prisma.dispute.deleteMany({});
  console.log(`   ✓ Dispute             : ${disputes.count}`);

  const platformTx = await prisma.platformTransaction.deleteMany({});
  console.log(`   ✓ PlatformTransaction : ${platformTx.count}`);

  const invoices = await prisma.invoice.deleteMany({});
  console.log(`   ✓ Invoice             : ${invoices.count}`);

  // Niveau 2 : OrderItems (dépendent de Order et Product)
  const orderItems = await prisma.orderItem.deleteMany({});
  console.log(`   ✓ OrderItem           : ${orderItems.count}`);

  // Niveau 3 : Orders
  const orders = await prisma.order.deleteMany({});
  console.log(`   ✓ Order               : ${orders.count}`);

  // Niveau 4 : ProductSkus → ProductVariants → Products
  const skus = await prisma.productSku.deleteMany({});
  console.log(`   ✓ ProductSku          : ${skus.count}`);

  const variants = await prisma.productVariant.deleteMany({});
  console.log(`   ✓ ProductVariant      : ${variants.count}`);

  const products = await prisma.product.deleteMany({});
  console.log(`   ✓ Product             : ${products.count}`);

  // Niveau 5 : Projects et Styles
  const projects = await prisma.project.deleteMany({});
  console.log(`   ✓ Project             : ${projects.count}`);

  const styles = await prisma.style.deleteMany({});
  console.log(`   ✓ Style               : ${styles.count}`);

  // Niveau 6 : Pages et sections
  const sections = await prisma.pageSection.deleteMany({});
  console.log(`   ✓ PageSection         : ${sections.count}`);

  const pages = await prisma.creatorPage.deleteMany({});
  console.log(`   ✓ CreatorPage         : ${pages.count}`);

  // Niveau 7 : Modération
  const flagged = await prisma.flaggedContent.deleteMany({});
  console.log(`   ✓ FlaggedContent      : ${flagged.count}`);

  const modActions = await prisma.moderationActionRecord.deleteMany({});
  console.log(`   ✓ ModerationAction    : ${modActions.count}`);

  const suspensions = await prisma.creatorSuspension.deleteMany({});
  console.log(`   ✓ CreatorSuspension   : ${suspensions.count}`);

  // Niveau 8 : Données utilisateur
  const carts = await prisma.cart.deleteMany({});
  console.log(`   ✓ Cart                : ${carts.count}`);

  const notifPrefs = await prisma.notificationPreference.deleteMany({});
  console.log(`   ✓ NotificationPref    : ${notifPrefs.count}`);

  const onboardings = await prisma.creatorOnboarding.deleteMany({});
  console.log(`   ✓ CreatorOnboarding   : ${onboardings.count}`);

  const subs = await prisma.subscription.deleteMany({});
  console.log(`   ✓ Subscription        : ${subs.count}`);

  // Niveau 9 : Auth
  const accounts = await prisma.account.deleteMany({});
  console.log(`   ✓ Account             : ${accounts.count}`);

  const sessions = await prisma.session.deleteMany({});
  console.log(`   ✓ Session             : ${sessions.count}`);

  const verifications = await prisma.verificationToken.deleteMany({});
  console.log(`   ✓ VerificationToken   : ${verifications.count}`);

  // Niveau 10 : Users
  const users = await prisma.user.deleteMany({});
  console.log(`   ✓ User                : ${users.count}`);

  console.log('');
  console.log('✅ Base vidée. Lance maintenant :');
  console.log('   bun prisma/seed-mini.ts');
  console.log('');
}

resetDb()
  .catch((err) => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
