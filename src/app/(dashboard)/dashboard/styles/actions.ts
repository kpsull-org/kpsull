'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma/client';
import { CloudinaryImageUploadService } from '@/modules/products/infrastructure/services/cloudinary-image-upload.service';

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export interface StyleOutput {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isCustom: boolean;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  creatorId: string | null;
}

async function requireCreatorSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return {
      session: null as never,
      error: "Vous n'êtes pas autorisé à effectuer cette action" as const,
    };
  }
  return { session, error: null };
}

export async function requestNewStyle(data: {
  name: string;
  description?: string;
  imageUrl?: string;
}): Promise<ActionResult> {
  const { session, error } = await requireCreatorSession();
  if (error) return { success: false, error };

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    return { success: false, error: 'Le nom du style est requis' };
  }

  const existing = await prisma.style.findUnique({
    where: { name: trimmedName },
    select: { id: true },
  });

  if (existing) {
    return { success: false, error: 'Ce nom est déjà utilisé' };
  }

  const style = await prisma.style.create({
    data: {
      name: trimmedName,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      isCustom: true,
      creatorId: session.user.id,
      status: 'PENDING_APPROVAL',
    },
    select: { id: true },
  });

  revalidatePath('/dashboard/styles');

  return { success: true, id: style.id };
}

export async function uploadStyleImage(formData: FormData): Promise<ActionResult & { url?: string }> {
  const { error } = await requireCreatorSession();
  if (error) return { success: false, error };

  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, error: 'Aucun fichier sélectionné' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const service = new CloudinaryImageUploadService();
  const result = await service.upload(buffer, file.name);

  if (result.isFailure) {
    return { success: false, error: result.error ?? "Erreur lors de l'upload" };
  }

  return { success: true, url: result.value };
}

export async function getCreatorStyles(): Promise<ActionResult & { styles?: StyleOutput[] }> {
  const { session, error } = await requireCreatorSession();
  if (error) return { success: false, error };

  const [systemStyles, creatorStyles] = await Promise.all([
    prisma.style.findMany({
      where: { status: 'APPROVED', isCustom: false },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, imageUrl: true, isCustom: true, status: true, creatorId: true },
    }),
    prisma.style.findMany({
      where: { isCustom: true, creatorId: session.user.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, imageUrl: true, isCustom: true, status: true, creatorId: true },
    }),
  ]);

  const styles: StyleOutput[] = [
    ...systemStyles.map((s) => ({ ...s, status: s.status as StyleOutput['status'] })),
    ...creatorStyles.map((s) => ({ ...s, status: s.status as StyleOutput['status'] })),
  ];

  return { success: true, styles };
}
