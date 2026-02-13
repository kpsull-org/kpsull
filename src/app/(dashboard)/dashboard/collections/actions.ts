'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';
import { CreateProjectUseCase } from '@/modules/products/application/use-cases/projects/create-project.use-case';
import { UpdateProjectUseCase } from '@/modules/products/application/use-cases/projects/update-project.use-case';
import { DeleteProjectUseCase } from '@/modules/products/application/use-cases/projects/delete-project.use-case';
import { PrismaProjectRepository } from '@/modules/products/infrastructure/repositories/prisma-project.repository';

const projectRepository = new PrismaProjectRepository(prisma);

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Le nom de la collection est requis'),
  description: z.string().optional(),
});

const updateCollectionSchema = z.object({
  name: z.string().min(1, 'Le nom de la collection est requis').optional(),
  description: z.string().optional(),
});

export async function createCollection(data: {
  name: string;
  description?: string;
}): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

  const validationResult = createCollectionSchema.safeParse(data);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError?.message ?? 'Donnees invalides' };
  }

  const createProjectUseCase = new CreateProjectUseCase(projectRepository);
  const result = await createProjectUseCase.execute({
    creatorId: session.user.id,
    name: validationResult.data.name,
    description: validationResult.data.description,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/dashboard/collections');

  return { success: true, id: result.value.id };
}

export async function updateCollection(
  collectionId: string,
  data: { name?: string; description?: string }
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

  const validationResult = updateCollectionSchema.safeParse(data);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError?.message ?? 'Donnees invalides' };
  }

  const updateProjectUseCase = new UpdateProjectUseCase(projectRepository);
  const result = await updateProjectUseCase.execute({
    projectId: collectionId,
    creatorId: session.user.id,
    name: validationResult.data.name,
    description: validationResult.data.description,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/dashboard/collections');
  revalidatePath(`/dashboard/collections/${collectionId}`);

  return { success: true, id: result.value.id };
}

export async function deleteCollection(collectionId: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

  const deleteProjectUseCase = new DeleteProjectUseCase(projectRepository);
  const result = await deleteProjectUseCase.execute({
    projectId: collectionId,
    creatorId: session.user.id,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/dashboard/collections');

  return { success: true };
}

export async function assignProductToCollection(
  productId: string,
  collectionId: string
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

  try {
    await prisma.product.update({
      where: { id: productId, creatorId: session.user.id },
      data: { projectId: collectionId },
    });
  } catch {
    return { success: false, error: 'Produit non trouve ou non autorise' };
  }

  revalidatePath('/dashboard/collections');
  revalidatePath(`/dashboard/collections/${collectionId}`);
  revalidatePath('/dashboard/products');

  return { success: true };
}

export async function removeProductFromCollection(productId: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Vous n'etes pas autorise a effectuer cette action" };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId, creatorId: session.user.id },
      select: { projectId: true },
    });

    const previousCollectionId = product?.projectId;

    await prisma.product.update({
      where: { id: productId, creatorId: session.user.id },
      data: { projectId: null },
    });

    revalidatePath('/dashboard/collections');
    if (previousCollectionId) {
      revalidatePath(`/dashboard/collections/${previousCollectionId}`);
    }
    revalidatePath('/dashboard/products');
  } catch {
    return { success: false, error: 'Produit non trouve ou non autorise' };
  }

  return { success: true };
}
