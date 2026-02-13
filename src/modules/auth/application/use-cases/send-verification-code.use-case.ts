import { Result } from '@/shared/domain';
import { OTP } from '../../domain/value-objects/otp.vo';
import type { IVerificationTokenRepository } from '../ports/verification-token.repository.interface';
import type { IEmailService } from '@/modules/notifications/application/ports/email.service.interface';

interface SendVerificationCodeInput {
  email: string;
  type: 'email-verification' | 'password-reset';
}

interface SendVerificationCodeOutput {
  expiresAt: Date;
}

export class SendVerificationCodeUseCase {
  constructor(
    private readonly verificationTokenRepository: IVerificationTokenRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(input: SendVerificationCodeInput): Promise<Result<SendVerificationCodeOutput>> {
    const otp = OTP.generate();
    const identifier = `${input.type}:${input.email.toLowerCase().trim()}`;

    await this.verificationTokenRepository.create(identifier, otp.code, otp.expiresAt);

    const subject =
      input.type === 'email-verification'
        ? 'Votre code de vérification - Kpsull'
        : 'Réinitialisation de votre mot de passe - Kpsull';

    const html =
      input.type === 'email-verification'
        ? this.buildVerificationHtml(otp.code)
        : this.buildPasswordResetHtml(otp.code);

    const text =
      input.type === 'email-verification'
        ? `Votre code de vérification Kpsull : ${otp.code}. Ce code expire dans 10 minutes.`
        : `Votre code de réinitialisation Kpsull : ${otp.code}. Ce code expire dans 10 minutes.`;

    const emailResult = await this.emailService.send({
      to: input.email,
      subject,
      html,
      text,
      tags: [{ name: 'type', value: input.type }],
    });

    if (emailResult.isFailure) {
      return Result.fail<SendVerificationCodeOutput>(emailResult.error!);
    }

    return Result.ok<SendVerificationCodeOutput>({ expiresAt: otp.expiresAt });
  }

  private buildVerificationHtml(code: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;padding:40px 20px;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
  <div style="text-align:center;margin-bottom:32px;"><h1 style="font-size:24px;font-weight:700;color:#111827;margin:0;">Kpsull</h1></div>
  <h2 style="font-size:20px;color:#111827;margin-bottom:16px;">Vérifiez votre adresse email</h2>
  <p style="color:#6b7280;line-height:1.6;margin-bottom:24px;">Pour sécuriser votre compte, entrez le code ci-dessous. Il expire dans <strong>10 minutes</strong>.</p>
  <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
    <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;">${code}</span>
  </div>
  <p style="color:#9ca3af;font-size:14px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="color:#9ca3af;font-size:12px;text-align:center;">&copy; ${new Date().getFullYear()} Kpsull. Tous droits réservés.</p>
</div></body></html>`;
  }

  private buildPasswordResetHtml(code: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;padding:40px 20px;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
  <div style="text-align:center;margin-bottom:32px;"><h1 style="font-size:24px;font-weight:700;color:#111827;margin:0;">Kpsull</h1></div>
  <h2 style="font-size:20px;color:#111827;margin-bottom:16px;">Réinitialisation du mot de passe</h2>
  <p style="color:#6b7280;line-height:1.6;margin-bottom:24px;">Vous avez demandé à réinitialiser votre mot de passe. Ce code expire dans <strong>10 minutes</strong>.</p>
  <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
    <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;">${code}</span>
  </div>
  <p style="color:#9ca3af;font-size:14px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="color:#9ca3af;font-size:12px;text-align:center;">&copy; ${new Date().getFullYear()} Kpsull. Tous droits réservés.</p>
</div></body></html>`;
  }
}
