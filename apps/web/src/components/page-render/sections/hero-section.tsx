import Image from 'next/image';

interface HeroContent {
  headline?: string;
  subheadline?: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface HeroSectionProps {
  title: string;
  content: HeroContent;
}

export function HeroSection({ title, content }: HeroSectionProps) {
  const { headline, subheadline, backgroundImage, ctaText, ctaLink } = content;

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt=""
          fill
          className="object-cover"
          priority
        />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          {headline || title}
        </h1>
        {subheadline && (
          <p className="text-lg md:text-xl mb-8 opacity-90">{subheadline}</p>
        )}
        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
