"use client";

import { Suspense, lazy } from "react";
import type { SectionTypeValue } from "@/modules/pages/domain/value-objects/section-type.vo";
import { TartanStripe } from "@/components/brand/tartan-stripe";

// Lazy load non-critical sections
const HeroSection = lazy(() =>
  import("./sections/hero-section").then((m) => ({ default: m.HeroSection }))
);
const AboutSection = lazy(() =>
  import("./sections/about-section").then((m) => ({ default: m.AboutSection }))
);
const ProductsGridSection = lazy(() =>
  import("./sections/products-grid-section").then((m) => ({
    default: m.ProductsGridSection,
  }))
);
const ContactSection = lazy(() =>
  import("./sections/contact-section").then((m) => ({
    default: m.ContactSection,
  }))
);
const CustomSection = lazy(() =>
  import("./sections/custom-section").then((m) => ({
    default: m.CustomSection,
  }))
);

interface Section {
  id: string;
  type: SectionTypeValue;
  title: string;
  content: Record<string, unknown>;
  position: number;
}

interface PageData {
  id: string;
  slug: string;
  title: string;
  description?: string;
  sections: Section[];
}

interface PageRendererProps {
  page: PageData;
}

function SectionSkeleton() {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-8 h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          <div className="h-4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function PageRenderer({ page }: PageRendererProps) {
  const sortedSections = [...page.sections].sort(
    (a, b) => a.position - b.position
  );

  return (
    <main className="min-h-screen">
      {sortedSections.map((section, index) => {
        const isHero = section.type === "HERO";
        return (
          <div key={section.id}>
            <Suspense fallback={<SectionSkeleton />}>
              {renderSection(section, page.slug, index === 0)}
            </Suspense>
            {/* Tartan stripe after hero section */}
            {isHero && index === 0 && (
              <TartanStripe className="relative z-10" />
            )}
          </div>
        );
      })}
    </main>
  );
}

function renderSection(
  section: Section,
  creatorSlug: string,
  _isFirst: boolean
): React.ReactNode {
  const content = section.content as Record<string, unknown>;

  switch (section.type) {
    case "HERO":
      return <HeroSection title={section.title} content={content} />;

    case "ABOUT":
      return <AboutSection title={section.title} content={content} />;

    case "PRODUCTS_GRID":
    case "PRODUCTS_FEATURED":
      return (
        <ProductsGridSection
          title={section.title}
          content={content}
          creatorSlug={creatorSlug}
        />
      );

    case "CONTACT":
      return <ContactSection title={section.title} content={content} />;

    case "CUSTOM":
    case "BENTO_GRID":
    case "TESTIMONIALS":
    default:
      return <CustomSection title={section.title} content={content} />;
  }
}
