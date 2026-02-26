import Image from "next/image";

export function HeroTransition() {
  return (
    <>
      {/* P7 : preload tartan-pattern.png — découvert trop tard via CSS backgroundImage */}
      <link rel="preload" as="image" href="https://res.cloudinary.com/damucxy2t/image/upload/f_auto,q_auto/kpsull/static/tartan-pattern" />
      <section className="relative w-full overflow-hidden">
      {/* Tartan pattern as BACKGROUND of this band */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(https://res.cloudinary.com/damucxy2t/image/upload/f_auto,q_auto/kpsull/static/tartan-pattern)",
          backgroundRepeat: "repeat",
          backgroundSize: "auto 100%",
        }}
      />

      {/* Brown overlay (Figma: rgba(34,10,10,0.25)) */}
      <div className="absolute inset-0 bg-[rgba(34,10,10,0.25)]" />

      {/* Green overlay (Figma: rgba(2,20,8,0.76)) */}
      <div className="absolute inset-0 bg-[rgba(2,20,8,0.76)]" />

      {/* Content -- Figma: h:246px zone, text Archivo Bold 40px #EFD050 */}
      <div className="relative flex min-h-[100px] items-center justify-between px-6 py-6 md:min-h-[120px] md:px-12 md:py-8 lg:min-h-[140px] lg:pl-[83px] lg:pr-20 lg:py-10">
        {/* Subtitle text */}
        <p className="kp-scroll-reveal max-w-4xl font-[family-name:var(--font-archivo)] text-xs font-bold leading-snug text-[#EFD050] sm:text-sm md:text-base lg:text-base xl:text-lg xl:leading-[1.4] 2xl:text-xl">
          Une plateforme reliant createurs de mode locaux et passionnes,
          <br className="hidden lg:block" />
          {" "}offrant des pieces uniques et artisanales, accessibles a vous,
          chaque jour.
        </p>

        {/* Cleaning icons */}
        <div className="kp-scroll-reveal-delay-1 ml-6 hidden shrink-0 items-center sm:flex md:ml-8">
          <Image
            src="kpsull/static/cleaning-icons"
            alt="Certifications de lavage"
            width={175}
            height={62}
            className="h-auto w-[80px] md:w-[100px] lg:w-[120px] xl:w-[140px]"
          />
        </div>
      </div>
      </section>
    </>
  );
}
