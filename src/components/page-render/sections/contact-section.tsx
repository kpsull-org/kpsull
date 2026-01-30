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
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">{title}</h2>
        <div className="space-y-4">
          {email && (
            <p>
              <a
                href={`mailto:${email}`}
                className="text-primary hover:underline"
              >
                {email}
              </a>
            </p>
          )}
          {phone && (
            <p>
              <a
                href={`tel:${phone}`}
                className="text-primary hover:underline"
              >
                {phone}
              </a>
            </p>
          )}
          {address && (
            <p className="text-muted-foreground">{address}</p>
          )}
          {socialLinks && Object.keys(socialLinks).length > 0 && (
            <div className="flex justify-center gap-4 pt-4">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Instagram
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Twitter
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Facebook
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
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
