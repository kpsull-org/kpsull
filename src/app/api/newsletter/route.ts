import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { Resend } from "resend";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM =
  process.env.RESEND_FROM_ADDRESS ?? "Kpsull <noreply@kpsull.com>";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const { email } = parsed.data;

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  if (!existing) {
    await prisma.newsletterSubscriber.create({ data: { email } });

    await resend.emails
      .send({
        from: FROM,
        to: email,
        subject: "Bienvenue dans la communauté KPSULL",
        html: `
        <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #fff;">
          <h1 style="font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; color: #000;">
            Bienvenue chez KPSULL
          </h1>
          <p style="font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 24px;">
            Vous êtes maintenant inscrit(e) à notre newsletter.<br>
            Vous serez parmi les premiers informés de nos nouvelles collections, créateurs et actualités.
          </p>
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: #999;">
            L'antidote à l'uniforme.
          </p>
          <hr style="border: none; border-top: 2px solid #000; margin: 32px 0;" />
          <p style="font-size: 11px; color: #aaa;">
            KPSULL — Pour vous désinscrire, répondez à cet email avec "DÉSINSCRIPTION".
          </p>
        </div>
      `,
      })
      .catch(() => {
        // Silencieux si Resend non configuré en dev
      });
  }

  return NextResponse.json({ success: true });
}
