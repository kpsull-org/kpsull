import Image from "next/image";
import { TartanStripe } from "@/components/brand/tartan-stripe";

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
    <section className="relative -mt-[98px] h-screen w-full overflow-hidden">
      {/* Background image */}
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt=""
          fill
          className="object-cover"
          priority
        />
      )}

      {/* Dark overlay matching landing hero */}
      <div className="absolute inset-0 bg-[rgba(2,20,8,0.76)]" />

      {/* Content: creator name bottom-left (Figma: x:82 y:712) */}
      <div className="relative flex h-full flex-col items-start justify-end pb-24 pl-6 md:pb-32 md:pl-12 lg:pb-[200px] lg:pl-[82px]">
        <h1 className="font-[family-name:var(--font-jacquard-12)] text-5xl leading-none text-white md:text-[100px] lg:text-[160px]">
          {headline || title}
        </h1>

        {subheadline && (
          <p className="mt-4 max-w-xl font-[family-name:var(--font-montserrat)] text-lg text-white/90 md:text-xl">
            {subheadline}
          </p>
        )}

        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            className="mt-8 inline-block rounded-[45px] bg-[#D6C8BD] px-8 py-4 font-[family-name:var(--font-montserrat)] text-base font-bold uppercase text-black transition-opacity hover:opacity-90"
          >
            {ctaText}
          </a>
        )}
      </div>

      {/* Tartan stripe at the bottom */}
      <TartanStripe className="absolute bottom-0 left-0 right-0 h-6" />
    </section>
  );
}
