interface ContactContent {
  email?: string;
  phone?: string;
  address?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
  };
}

interface ContactSectionProps {
  title: string;
  content: ContactContent;
}

export function ContactSection({ title, content }: ContactSectionProps) {
  const { email, phone, address, socialLinks } = content;

  return (
    <section className="bg-[#D9D9D9] px-6 py-16 md:px-12 md:py-24 lg:px-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-8 font-[family-name:var(--font-montserrat)] text-xl font-semibold uppercase md:text-2xl lg:text-[40px] lg:leading-[1.22]">
          {title}
        </h2>
        <div className="space-y-4">
          {email && (
            <p>
              <a
                href={`mailto:${email}`}
                className="font-[family-name:var(--font-montserrat)] text-[#00A3FF] transition-opacity hover:opacity-70"
              >
                {email}
              </a>
            </p>
          )}
          {phone && (
            <p>
              <a
                href={`tel:${phone}`}
                className="font-[family-name:var(--font-montserrat)] text-[#00A3FF] transition-opacity hover:opacity-70"
              >
                {phone}
              </a>
            </p>
          )}
          {address && (
            <p className="font-[family-name:var(--font-montserrat)] text-muted-foreground">
              {address}
            </p>
          )}
          {socialLinks && Object.keys(socialLinks).length > 0 && (
            <div className="flex justify-center gap-6 pt-4">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-[family-name:var(--font-archivo)] text-sm uppercase text-muted-foreground transition-colors hover:text-foreground"
                >
                  Instagram
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-[family-name:var(--font-archivo)] text-sm uppercase text-muted-foreground transition-colors hover:text-foreground"
                >
                  Twitter
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-[family-name:var(--font-archivo)] text-sm uppercase text-muted-foreground transition-colors hover:text-foreground"
                >
                  Facebook
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-[family-name:var(--font-archivo)] text-sm uppercase text-muted-foreground transition-colors hover:text-foreground"
                >
                  TikTok
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
