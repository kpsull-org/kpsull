import Image from "next/image";
import { cn } from "@/lib/utils";

interface SectionSeparatorProps {
  className?: string;
}

export function SectionSeparator({ className }: SectionSeparatorProps = {}) {
  return (
    <div className={cn("bg-[#F2F2F2] px-6 md:px-12 lg:px-20", className)}>
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
