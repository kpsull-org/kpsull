'use client';

import { Suspense, lazy } from 'react';
import type { SectionTypeValue } from '@/modules/pages/domain/value-objects/section-type.vo';

// Lazy load non-critical sections
const HeroSection = lazy(() =>
  import('./sections/hero-section').then((m) => ({ default: m.HeroSection }))
);
const AboutSection = lazy(() =>
  import('./sections/about-section').then((m) => ({ default: m.AboutSection }))
);
const ProductsGridSection = lazy(() =>
  import('./sections/products-grid-section').then((m) => ({
    default: m.ProductsGridSection,
  }))
);
const ContactSection = lazy(() =>
  import('./sections/contact-section').then((m) => ({
    default: m.ContactSection,
  }))
);
const CustomSection = lazy(() =>
  import('./sections/custom-section').then((m) => ({
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
    <div className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mx-auto mb-8" />
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
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
      {sortedSections.map((section, index) => (
        <Suspense key={section.id} fallback={<SectionSkeleton />}>
          {renderSection(section, page.slug, index === 0)}
        </Suspense>
      ))}
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
    case 'HERO':
      return <HeroSection title={section.title} content={content} />;

    case 'ABOUT':
      return <AboutSection title={section.title} content={content} />;

    case 'PRODUCTS_GRID':
    case 'PRODUCTS_FEATURED':
      return (
        <ProductsGridSection
          title={section.title}
          content={content}
          creatorSlug={creatorSlug}
        />
      );

    case 'CONTACT':
      return <ContactSection title={section.title} content={content} />;

    case 'CUSTOM':
    case 'BENTO_GRID':
    case 'TESTIMONIALS':
    default:
      return <CustomSection title={section.title} content={content} />;
  }
}
