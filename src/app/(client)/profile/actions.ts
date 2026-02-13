'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { UpdateProfileUseCase } from '@/modules/auth/application/use-cases';
import { PrismaUserRepository } from '@/modules/auth/infrastructure/repositories/prisma-user.repository';
import { z } from 'zod';

const userRepository = new PrismaUserRepository();
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);

/** Normalise un numéro français : 06... -> +336..., garde les +XX intacts */
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\s+/g, '').replace(/-/g, '');
  if (!digits) return null;
  // French local format 0X XX XX XX XX -> +33
  if (/^0[1-9]\d{8}$/.test(digits)) {
    return '+33' + digits.slice(1);
  }
  // Already international
  if (/^\+\d{7,15}$/.test(digits)) {
    return digits;
  }
  return digits;
}

// Validation schema
const updateProfileSchema = z.object({
  name: z.string().max(100, 'Le nom ne peut pas dépasser 100 caractères').nullable(),
  image: z.string().url('URL invalide').nullable().or(z.literal('')),
  phone: z.string().max(20, 'Le telephone ne peut pas depasser 20 caracteres').nullable().optional(),
  address: z.string().max(200, "L'adresse ne peut pas depasser 200 caracteres").nullable().optional(),
  city: z.string().max(100, 'La ville ne peut pas depasser 100 caracteres').nullable().optional(),
  postalCode: z.string().max(10, 'Le code postal ne peut pas depasser 10 caracteres').nullable().optional(),
  country: z.string().max(100, 'Le pays ne peut pas depasser 100 caracteres').nullable().optional(),
});

export interface UpdateProfileInput {
  name: string | null;
  image: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
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

  const { name, image, phone, address, city, postalCode, country } = validationResult.data;

  // Execute use case
  const result = await updateProfileUseCase.execute({
    userId: session.user.id,
    name: name || null,
    image: image || null,
    phone: normalizePhone(phone),
    address: address || null,
    city: city || null,
    postalCode: postalCode || null,
    country: country || null,
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  // Revalidate the profile page
  revalidatePath('/profile');

  return { success: true };
}
