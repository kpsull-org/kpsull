import Image from "next/image";

interface AboutContent {
  text?: string;
  image?: string;
  imagePosition?: "left" | "right";
}

interface AboutSectionProps {
  title: string;
  content: AboutContent;
}

export function AboutSection({ title, content }: AboutSectionProps) {
  const { text, image, imagePosition = "right" } = content;

  return (
    <section className="bg-[#D9D9D9] px-6 py-16 md:px-12 md:py-24 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 font-[family-name:var(--font-montserrat)] text-xl font-semibold uppercase md:text-2xl lg:text-[40px] lg:leading-[1.22]">
          {title}
        </h2>
        <div
          className={`flex flex-col ${
            imagePosition === "left" ? "md:flex-row-reverse" : "md:flex-row"
          } items-center gap-8`}
        >
          <div className="flex-1">
            {text && (
              <p className="font-[family-name:var(--font-montserrat)] text-base font-normal leading-relaxed text-foreground md:text-2xl">
                {text}
              </p>
            )}
          </div>
          {image && (
            <div className="flex-1">
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
        <div className="mt-16 h-px bg-black" />
      </div>
    </section>
  );
}
