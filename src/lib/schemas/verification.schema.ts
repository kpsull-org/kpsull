import { z } from 'zod';

export const otpSchema = z.string().regex(/^\d{6}$/, 'Le code doit contenir 6 chiffres');

export const sendVerificationCodeSchema = z.object({
  email: z.string().email('Adresse email invalide').transform((e) => e.toLowerCase().trim()),
  type: z.enum(['email-verification', 'password-reset']).default('email-verification'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Adresse email invalide').transform((e) => e.toLowerCase().trim()),
  code: otpSchema,
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email('Adresse email invalide').transform((e) => e.toLowerCase().trim()),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide').transform((e) => e.toLowerCase().trim()),
  code: otpSchema,
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
});
