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
import { PrismaProductRepository } from '@/modules/products/infrastructure/repositories/prisma-product.repository';
import { NoopSubscriptionService } from '@/modules/products/infrastructure/services/noop-subscription.service';

const productRepository = new PrismaProductRepository(prisma);
const subscriptionService = new NoopSubscriptionService();

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

export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  projectId?: string;
}): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

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
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

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
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

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
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

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
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

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
