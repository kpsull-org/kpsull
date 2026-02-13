'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';
import { CreateProductUseCase } from '@/modules/products/application/use-cases/products/create-product.use-case';
import { UpdateProductUseCase } from '@/modules/products/application/use-cases/products/update-product.use-case';
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
import { NoopSubscriptionService } from '@/modules/products/infrastructure/services/noop-subscription.service';
import { NoopImageUploadService } from '@/modules/products/infrastructure/services/noop-image-upload.service';

const productRepository = new PrismaProductRepository(prisma);
const variantRepository = new PrismaVariantRepository(prisma);
const productImageRepository = new PrismaProductImageRepository(prisma);
const subscriptionService = new NoopSubscriptionService();
const imageUploadService = new NoopImageUploadService();

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

const updateProductSchema = z.object({
  name: z.string().min(1, 'Le nom du produit est requis').optional(),
  description: z.string().optional(),
  price: z.number().positive('Le prix doit etre positif').optional(),
  projectId: z.string().nullable().optional(),
});

const createVariantSchema = z.object({
  productId: z.string().min(1, "L'ID du produit est requis"),
  name: z.string().min(1, 'Le nom de la variante est requis'),
  sku: z.string().optional(),
  priceOverride: z.number().positive('Le prix doit etre positif').optional(),
  stock: z.number().int().min(0, 'Le stock ne peut pas etre negatif'),
});

const updateVariantSchema = z.object({
  name: z.string().min(1, 'Le nom de la variante est requis').optional(),
  sku: z.string().optional(),
  removeSku: z.boolean().optional(),
  priceOverride: z.number().positive('Le prix doit etre positif').optional(),
  removePriceOverride: z.boolean().optional(),
  stock: z.number().int().min(0, 'Le stock ne peut pas etre negatif').optional(),
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

  return { success: true, id: result.value!.id };
}

export async function updateProduct(
  productId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    projectId?: string | null;
  }
): Promise<ActionResult> {
  const { session, error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const validationResult = updateProductSchema.safeParse(data);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError?.message ?? 'Donnees invalides' };
  }

  const updateProductUseCase = new UpdateProductUseCase(productRepository);
  const result = await updateProductUseCase.execute({
    productId,
    creatorId: session.user.id,
    ...validationResult.data,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}`);

  return { success: true };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const { session, error } = await requireCreatorAuth();
  if (error) return { success: false, error };

  const deleteProductUseCase = new DeleteProductUseCase(productRepository);
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

// ─── Variant Actions ───────────────────────────────────────────────

export async function createVariant(data: {
  productId: string;
  name: string;
  sku?: string;
  priceOverride?: number;
  stock: number;
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

  return { success: true, id: result.value!.id };
}

export async function updateVariant(
  variantId: string,
  productId: string,
  data: {
    name?: string;
    sku?: string;
    removeSku?: boolean;
    priceOverride?: number;
    removePriceOverride?: boolean;
    stock?: number;
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

  const deleteVariantUseCase = new DeleteVariantUseCase(variantRepository);
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
): Promise<ActionResult> {
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

  return { success: true, id: result.value!.id };
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
