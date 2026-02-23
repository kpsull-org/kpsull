'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma/client';
import { cloudinary } from '@/lib/cloudinary';
import { validateImageFile } from '@/lib/utils/file-validation';
import { slugify } from '@/lib/utils/slugify';
import { PrismaPageRepository } from '@/modules/pages/infrastructure/repositories/prisma-page.repository';
import { UpdatePageSettingsUseCase } from '@/modules/pages/application/use-cases/update-page-settings.use-case';
import { CreatePageUseCase } from '@/modules/pages/application/use-cases/create-page.use-case';
import type { Session } from 'next-auth';

const pageRepository = new PrismaPageRepository();

export interface ActionResult {
  success: boolean;
  error?: string;
}

type PrepareResult =
  | { success: false; error: string }
  | { success: true; session: Session; buffer: Buffer; dataUri: string };

async function prepareImageUpload(formData: FormData): Promise<PrepareResult> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: 'Action non autorisee' };
  }

  const file = formData.get('file') as File | null;
  if (!file) return { success: false, error: 'Aucun fichier fourni' };

  const buffer = Buffer.from(await file.arrayBuffer());
  const validationResult = validateImageFile(buffer, file.name);
  if (validationResult.isFailure) {
    return { success: false, error: validationResult.error! };
  }

  const base64 = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  return { success: true, session, buffer, dataUri };
}

async function getOrCreatePage(userId: string) {
  const pages = await pageRepository.findByCreatorId(userId);
  if (pages.length > 0) return pages[0]!;

  // Auto-create from brandName or user name
  const onboarding = await prisma.creatorOnboarding.findUnique({
    where: { userId },
    select: { brandName: true },
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const rawName = onboarding?.brandName ?? user?.name ?? 'mon-espace';
  let slug = slugify(rawName);

  // Ensure slug uniqueness
  const slugExists = await pageRepository.slugExists(slug);
  if (slugExists) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const createUseCase = new CreatePageUseCase(pageRepository);
  const result = await createUseCase.execute({
    creatorId: userId,
    slug,
    title: onboarding?.brandName ?? user?.name ?? 'Mon espace créateur',
  });

  if (result.isFailure) {
    throw new Error(result.error ?? 'Erreur inconnue');
  }

  const createdPages = await pageRepository.findByCreatorId(userId);
  return createdPages[0]!;
}

export async function updatePageSettings(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return { success: false, error: "Action non autorisee" };
  }

  const page = await getOrCreatePage(session.user.id);

  const title = formData.get('title') as string | null;
  const tagline = formData.get('tagline') as string | null;
  const description = formData.get('description') as string | null;
  const titleFont = formData.get('titleFont') as string | null;
  const titleColor = formData.get('titleColor') as string | null;
  const bannerPosition = formData.get('bannerPosition') as string | null;

  // Parse social links from formData
  const socialLinksRaw = formData.get('socialLinks') as string | null;
  let socialLinks: Record<string, string> | undefined;
  if (socialLinksRaw) {
    try {
      const parsed = JSON.parse(socialLinksRaw) as Record<string, string>;
      socialLinks = Object.fromEntries(
        Object.entries(parsed).filter(([, v]) => v && v.trim() !== '')
      );
    } catch {
      socialLinks = undefined;
    }
  }

  const useCase = new UpdatePageSettingsUseCase(pageRepository);
  const result = await useCase.execute({
    pageId: page.idString,
    creatorId: session.user.id,
    ...(title !== null && { title }),
    ...(tagline !== null && { tagline }),
    ...(description !== null && { description }),
    ...(titleFont !== null && { titleFont }),
    ...(titleColor !== null && { titleColor }),
    ...(bannerPosition !== null && { bannerPosition }),
    ...(socialLinks !== undefined && { socialLinks }),
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  revalidatePath('/dashboard/ma-page');
  revalidatePath('/dashboard');
  revalidatePath(`/${result.value.slug}`);

  return { success: true };
}

export async function uploadBannerImage(
  formData: FormData
): Promise<ActionResult & { url?: string }> {
  const prepared = await prepareImageUpload(formData);
  if (!prepared.success) return prepared;

  const { session, dataUri } = prepared;

  try {
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: `kpsull/banners`,
      public_id: session.user.id,
      overwrite: true,
      quality: 'auto',
      fetch_format: 'auto',
    });

    const page = await getOrCreatePage(session.user.id);

    const useCase = new UpdatePageSettingsUseCase(pageRepository);
    const result = await useCase.execute({
      pageId: page.idString,
      creatorId: session.user.id,
      bannerImage: uploadResult.secure_url,
    });

    if (result.isFailure) {
      return { success: false, error: result.error! };
    }

    revalidatePath('/dashboard/ma-page');
    revalidatePath(`/${page.slug}`);

    return { success: true, url: uploadResult.secure_url };
  } catch {
    return { success: false, error: "Erreur lors de l'upload de la banniere" };
  }
}

export async function uploadAvatarImage(
  formData: FormData
): Promise<ActionResult & { url?: string }> {
  const prepared = await prepareImageUpload(formData);
  if (!prepared.success) return prepared;

  const { session, dataUri } = prepared;

  try {
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: `kpsull/avatars`,
      public_id: session.user.id,
      overwrite: true,
      quality: 'auto',
      fetch_format: 'auto',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: uploadResult.secure_url },
    });

    revalidatePath('/dashboard/ma-page');
    revalidatePath('/dashboard');

    return { success: true, url: uploadResult.secure_url };
  } catch {
    return { success: false, error: "Erreur lors de l'upload de l'avatar" };
  }
}
