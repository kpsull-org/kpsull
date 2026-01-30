'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SetAccountTypeUseCase } from '@/modules/auth/application/use-cases';
import { PrismaUserRepository } from '@/modules/auth/infrastructure/repositories/prisma-user.repository';

const userRepository = new PrismaUserRepository();
const setAccountTypeUseCase = new SetAccountTypeUseCase(userRepository);

export type AccountType = 'CLIENT' | 'CREATOR';

export interface SetAccountTypeResult {
  success: boolean;
  error?: string;
}

export async function setAccountType(
  type: AccountType
): Promise<SetAccountTypeResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const result = await setAccountTypeUseCase.execute({
    userId: session.user.id,
    wantsToBeCreator: type === 'CREATOR',
  });

  if (result.isFailure) {
    return { success: false, error: result.error! };
  }

  // Redirect based on choice
  if (type === 'CREATOR') {
    redirect('/onboarding/creator');
  } else {
    redirect('/');
  }
}
