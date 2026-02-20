'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';
import { Money } from '@/modules/products/domain/value-objects/money.vo';
import { CreateProductUseCase } from '@/modules/products/application/use-cases/products/create-product.use-case';
import { DeleteProductUseCase } from '@/modules/products/application/use-cases/products/delete-product.use-case';
import { PublishProductUseCase } from '@/modules/products/application/use-cases/products/publish-product.use-case';
import { UnpublishProductUseCase } from '@/modules/products/application/use-cases/products/unpublish-product.use-case';
import { CreateVariantUseCase } from '@/modules/products/application/use-cases/variants/create-variant.use-case';
import { UpdateVariantUseCase } from '@/modules/products/application/use-cases/variants/update-variant.use-case';
import { DeleteVariantUseCase } from '@/modules/products/application/use-cases/variants/delete-variant.use-case';
import { UploadProductImageUseCase } from '@/modules/products/application/use-cases/images/upload-product-image.use-case';
import { DeleteProductImageUseCase } from '@/modules/products/application/use-cases/images/delete-product-image.use-case';
import { ReorderProductImagesUseCase } from '@/modules/products/application/use-cases/images/reorder-product-images.use-case';
import { PrismaProductRepository } from '@/modules/products/infrastructure/repositories/prisma-product.repository';
import { PrismaVariantRepository } from '@/modules/products/infrastructure/repositories/prisma-variant.repository';
import { PrismaProductImageRepository } from '@/modules/products/infrastructure/repositories/prisma-product-image.repository';
import { PrismaSkuRepository } from '@/modules/products/infrastructure/repositories/prisma-sku.repository';
import { NoopSubscriptionService } from '@/modules/products/infrastructure/services/noop-subscription.service';
import { CloudinaryImageUploadService } from '@/modules/products/infrastructure/services/cloudinary-image-upload.service';
import { UpsertSkuUseCase } from '@/modules/products/application/use-cases/skus/upsert-sku.use-case';
import type { SkuOutput } from '@/modules/products/application/use-cases/skus/list-skus.use-case';

export type { SkuOutput };

const productRepository = new PrismaProductRepository(prisma);
const variantRepository = new PrismaVariantRepository(prisma);
const productImageRepository = new PrismaProductImageRepository(prisma);
const skuRepository = new PrismaSkuRepository(prisma);
const subscriptionService = new NoopSubscriptionService();
const imageUploadService = new CloudinaryImageUploadService();

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

const createProductSchema = z.object({
  name: z.string().min(1, 'Le nom du produit est requis'),
  description: z.string().optional(),
  price: z.number().positive('Le prix doit etre positif'),
  projectId: z.string().optional(),
});

const sizeEntrySchema = z.object({
  size: z.string().min(1),
  weight: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  length: z.number().positive().optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1, 'Le nom du produit est requis').optional(),
  description: z.string().optional(),
  price: z.number().positive('Le prix doit etre positif').optional(),
  projectId: z.string().nullable().optional(),
  styleId: z.string().nullable().optional(),
  sizes: z.array(sizeEntrySchema).optional(),
  category: z.string().optional(),
  gender: z.string().optional(),
  materials: z.string().optional(),
  fit: z.string().optional(),
  season: z.string().optional(),
  madeIn: z.string().optional(),
  careInstructions: z.string().optional(),
  certifications: z.string().optional(),
  weight: z.number().int().optional(),
});

const createVariantSchema = z.object({
  productId: z.string().min(1, "L'ID du produit est requis"),
  name: z.string().min(1, 'Le nom de la variante est requis'),
  priceOverride: z.number().positive('Le prix doit etre positif').optional(),
  stock: z.number().int().min(0, 'Le stock ne peut pas etre negatif'),
  color: z.string().optional(),
  colorCode: z.string().optional(),
});

const updateVariantSchema = z.object({
  name: z.string().min(1, 'Le nom de la variante est requis').optional(),
  priceOverride: z.number().positive('Le prix doit etre positif').optional(),
  removePriceOverride: z.boolean().optional(),
  stock: z.number().int().min(0, 'Le stock ne peut pas etre negatif').optional(),
  color: z.string().optional(),
  colorCode: z.string().optional(),
  removeColor: z.boolean().optional(),
});

// ─── Auth helper ───────────────────────────────────────────────────

async function requireCreatorAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { session: null as never, error: "Vous n'etes pas autorise a effectuer cette action" as const };
  }
  return { session, error: null };
}

// ─── Product Actions ───────────────────────────────────────────────

export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  projectId?: string;
}): Promise<ActionResult> {
  const { session, error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const validationResult = createProductSchema.safeParse(data);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError?.message ?? 'Donnees invalides' };
  }

  const createProductUseCase = new CreateProductUseCase(productRepository);
  const result = await createProductUseCase.execute({
    creatorId: session.user.id,
    name: validationResult.data.name,
    description: validationResult.data.description,
    price: validationResult.data.price,
    projectId: validationResult.data.projectId,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/dashboard/products');

  return { success: true, id: result.value.id };
}

export async function updateProduct(
  productId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    projectId?: string | null;
    styleId?: string | null;
    sizes?: Array<{ size: string; weight?: number; width?: number; height?: number; length?: number }>;
    category?: string | null;
    gender?: string | null;
    materials?: string | null;
    fit?: string | null;
    season?: string | null;
    madeIn?: string | null;
    careInstructions?: string | null;
    certifications?: string | null;
    weight?: number | null;
  }
): Promise<ActionResult> {
  const { session, error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const validationResult = updateProductSchema.safeParse(data);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError?.message ?? 'Donnees invalides' };
  }

  const { name, description, price, projectId, styleId, sizes, category, gender, materials, fit, season, madeIn, careInstructions, certifications, weight } = validationResult.data;

  // Verify ownership
  const existing = await prisma.product.findUnique({ where: { id: productId }, select: { creatorId: true } });
  if (!existing || existing.creatorId !== session.user.id) {
    return { success: false, error: "Vous n'etes pas autorise a modifier ce produit" };
  }

  // Validate business rules inline (mirrors use case / entity logic)
  if (name !== undefined) {
    if (!name.trim()) {
      return { success: false, error: 'Le nom du produit est requis' };
    }
    if (name.length > 200) {
      return { success: false, error: 'Le nom ne peut pas dépasser 200 caractères' };
    }
  }

  if (price !== undefined) {
    const moneyResult = Money.create(price);
    if (moneyResult.isFailure) {
      return { success: false, error: moneyResult.error! };
    }
  }

  // Single atomic update combining core and extra fields
  await prisma.product.update({
    where: { id: productId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Math.round(price * 100) }),
      ...(projectId !== undefined && { projectId }),
      ...(styleId !== undefined && { styleId }),
      ...(sizes !== undefined && { sizes }),
      ...(category !== undefined && { category }),
      ...(gender !== undefined && { gender }),
      ...(materials !== undefined && { materials }),
      ...(fit !== undefined && { fit }),
      ...(season !== undefined && { season }),
      ...(madeIn !== undefined && { madeIn }),
      ...(careInstructions !== undefined && { careInstructions }),
      ...(certifications !== undefined && { certifications }),
      ...(weight !== undefined && { weight }),
      updatedAt: new Date(),
    },
  });

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}`);

  return { success: true };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const { session, error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const deleteProductUseCase = new DeleteProductUseCase(
    productRepository,
    productImageRepository,
    variantRepository,
    imageUploadService
  );
  const result = await deleteProductUseCase.execute({
    productId,
    creatorId: session.user.id,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/dashboard/products');

  return { success: true };
}

export async function publishProduct(productId: string): Promise<ActionResult> {
  const { session, error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const publishProductUseCase = new PublishProductUseCase(productRepository, subscriptionService);
  const result = await publishProductUseCase.execute({
    productId,
    creatorId: session.user.id,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}`);

  return { success: true };
}

export async function unpublishProduct(productId: string): Promise<ActionResult> {
  const { session, error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const unpublishProductUseCase = new UnpublishProductUseCase(productRepository, subscriptionService);
  const result = await unpublishProductUseCase.execute({
    productId,
    creatorId: session.user.id,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}`);

  return { success: true };
}

export async function archiveProduct(productId: string): Promise<ActionResult> {
  const { session, error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.creatorId !== session.user.id) {
    return { success: false, error: 'Produit introuvable' };
  }

  await prisma.product.update({
    where: { id: productId },
    data: { status: 'ARCHIVED' },
  });

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}`);

  return { success: true };
}

// ─── SKU Actions ───────────────────────────────────────────────────

export async function upsertSku(data: {
  productId: string;
  variantId?: string;
  size?: string;
  stock: number;
}): Promise<ActionResult & { sku?: SkuOutput }> {
  const { error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const upsertSkuUseCase = new UpsertSkuUseCase(skuRepository, productRepository);
  const result = await upsertSkuUseCase.execute(data);

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath(`/dashboard/products/${data.productId}`);

  return { success: true, sku: result.value };
}

// ─── Variant Actions ───────────────────────────────────────────────

export async function createVariant(data: {
  productId: string;
  name: string;
  priceOverride?: number;
  stock: number;
  color?: string;
  colorCode?: string;
}): Promise<ActionResult> {
  const { error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const validationResult = createVariantSchema.safeParse(data);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError?.message ?? 'Donnees invalides' };
  }

  const createVariantUseCase = new CreateVariantUseCase(variantRepository, productRepository);
  const result = await createVariantUseCase.execute(validationResult.data);

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath(`/dashboard/products/${data.productId}`);

  return { success: true, id: result.value.id };
}

export async function updateVariant(
  variantId: string,
  productId: string,
  data: {
    name?: string;
    priceOverride?: number;
    removePriceOverride?: boolean;
    stock?: number;
    color?: string;
    colorCode?: string;
    removeColor?: boolean;
  }
): Promise<ActionResult> {
  const { error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const validationResult = updateVariantSchema.safeParse(data);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError?.message ?? 'Donnees invalides' };
  }

  const updateVariantUseCase = new UpdateVariantUseCase(variantRepository);
  const result = await updateVariantUseCase.execute({
    id: variantId,
    ...validationResult.data,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath(`/dashboard/products/${productId}`);

  return { success: true };
}

export async function deleteVariant(variantId: string, productId: string): Promise<ActionResult> {
  const { error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const deleteVariantUseCase = new DeleteVariantUseCase(variantRepository, imageUploadService);
  const result = await deleteVariantUseCase.execute({ id: variantId });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath(`/dashboard/products/${productId}`);

  return { success: true };
}

// ─── Image Actions ─────────────────────────────────────────────────

export async function uploadProductImage(
  productId: string,
  formData: FormData
): Promise<ActionResult & { url?: string }> {
  const { error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, error: 'Aucun fichier selectionne' };
  }

  const alt = (formData.get('alt') as string) ?? '';
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadUseCase = new UploadProductImageUseCase(
    imageUploadService,
    productImageRepository,
    productRepository
  );
  const result = await uploadUseCase.execute({
    productId,
    file: buffer,
    filename: file.name,
    alt,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath(`/dashboard/products/${productId}`);

  return { success: true, id: result.value.id, url: result.value.url };
}

export async function deleteProductImage(
  imageId: string,
  productId: string
): Promise<ActionResult> {
  const { error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const deleteImageUseCase = new DeleteProductImageUseCase(
    imageUploadService,
    productImageRepository
  );
  const result = await deleteImageUseCase.execute({ imageId });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath(`/dashboard/products/${productId}`);

  return { success: true };
}

export async function reorderProductImages(
  productId: string,
  imageIds: string[]
): Promise<ActionResult> {
  const { error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const reorderUseCase = new ReorderProductImagesUseCase(productImageRepository);
  const result = await reorderUseCase.execute({ productId, imageIds });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath(`/dashboard/products/${productId}`);

  return { success: true };
}

// ─── Variant Image Actions ──────────────────────────────────────────

type VariantImagesResult =
  | { success: true; currentImages: string[] }
  | { success: false; error: string };

async function getVariantCurrentImages(
  variantId: string,
  productId: string,
  userId: string
): Promise<VariantImagesResult> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { images: true, productId: true, product: { select: { creatorId: true } } },
  });

  if (!variant) {
    return { success: false, error: 'Variante introuvable' };
  }
  if (variant.productId !== productId) {
    return { success: false, error: 'Variante introuvable' };
  }
  if (variant.product.creatorId !== userId) {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

  const currentImages = Array.isArray(variant.images) ? (variant.images as string[]) : [];
  return { success: true, currentImages };
}

export async function addVariantImage(
  variantId: string,
  productId: string,
  formData: FormData
): Promise<ActionResult & { url?: string }> {
  const { session, error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const file = formData.get('file') as File | null;
  if (!file) return { success: false, error: 'Fichier manquant' };

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadResult = await imageUploadService.upload(buffer, file.name);
  if (uploadResult.isFailure) return { success: false, error: uploadResult.error! };

  const url = uploadResult.value;

  const variantResult = await getVariantCurrentImages(variantId, productId, session.user.id);
  if (!variantResult.success) return { success: false, error: variantResult.error };

  await prisma.productVariant.update({
    where: { id: variantId },
    data: { images: [...variantResult.currentImages, url] },
  });

  revalidatePath(`/dashboard/products/${productId}`);
  return { success: true, url };
}

export async function removeVariantImage(
  variantId: string,
  productId: string,
  imageUrl: string
): Promise<ActionResult> {
  const { session, error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const variantResult = await getVariantCurrentImages(variantId, productId, session.user.id);
  if (!variantResult.success) return { success: false, error: variantResult.error };

  await imageUploadService.delete(imageUrl);

  await prisma.productVariant.update({
    where: { id: variantId },
    data: { images: variantResult.currentImages.filter((u) => u !== imageUrl) },
  });

  revalidatePath(`/dashboard/products/${productId}`);
  return { success: true };
}
