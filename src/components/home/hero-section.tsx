import Image from "next/image";
import { Logo } from "@/components/brand/logo";

export function HeroSection() {
  return (
    <section className="relative -mt-[98px] h-screen w-full overflow-hidden">
      {/* Background image -- NO tartan overlay on image */}
      <Image
        src="/images/hero-skater.png"
        alt="Mode urbaine"
        fill
        className="object-cover object-top"
        priority
      />

      {/* Dark green overlay only (Figma: rgba(2,20,8,0.76)) */}
      <div className="absolute inset-0 bg-[rgba(2,20,8,0.76)]" />

      {/* Content: K logo + title at bottom-left */}
      <div className="relative flex h-full flex-col items-start justify-end px-6 pb-12 md:px-12 md:pb-16 lg:pb-20 lg:pl-[83px]">
        {/* Logo K in yellow/accent (Figma: 281x282px) */}
        <Logo
          size="xl"
          className="mb-6 h-[100px] w-[100px] text-accent md:mb-8 md:h-[140px] md:w-[140px] lg:h-[160px] lg:w-[160px] xl:h-[180px] xl:w-[180px] 2xl:h-[220px] 2xl:w-[220px]"
        />

        {/* Title (Figma: Montserrat 600, 96px, color #D6C8BD) */}
        <h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-semibold leading-none tracking-tight text-[#D6C8BD] md:text-4xl lg:text-[40px] xl:text-[48px] 2xl:text-[64px]">
          L&apos;ANTIDOTE A L&apos;UNIFORME.
        </h1>
      </div>
    </section>
  );
}
