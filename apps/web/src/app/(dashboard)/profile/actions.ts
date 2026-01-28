'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { UpdateProfileUseCase } from '@/modules/auth/application/use-cases';
import { PrismaUserRepository } from '@/modules/auth/infrastructure/repositories/prisma-user.repository';
import { z } from 'zod';

const userRepository = new PrismaUserRepository();
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);

// Validation schema
const updateProfileSchema = z.object({
  name: z.string().max(100, 'Le nom ne peut pas dépasser 100 caractères').nullable(),
  image: z.string().url('URL invalide').nullable().or(z.literal('')),
});

export interface UpdateProfileInput {
  name: string | null;
  image: string | null;
}

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Validate input
  const validationResult = updateProfileSchema.safeParse(input);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError?.message ?? 'Données invalides' };
  }

  const { name, image } = validationResult.data;

  // Execute use case
  const result = await updateProfileUseCase.execute({
    userId: session.user.id,
    name: name || null,
    image: image || null,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  // Revalidate the profile page
  revalidatePath('/profile');

  return { success: true };
}
