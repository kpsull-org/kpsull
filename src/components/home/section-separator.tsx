import Image from "next/image";

export function SectionSeparator() {
  return (
    <div className="bg-[#F2F2F2] px-6 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="relative h-8 overflow-hidden rounded-sm md:h-10">
          <Image
            src="/images/separator-tartan.png"
            alt=""
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
