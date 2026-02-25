import { Suspense } from "react";
import {
  HeroSection,
  HeroTransition,
  HowItWorks,
  CategorySlider,
  FeaturedOffers,
  ReassuranceStrip,
  TopCreators,
  AboutTeaser,
  CreatorCta,
  NewsletterSection,
  FAQSection,
} from "@/components/home";

export const dynamic = 'force-dynamic';

function CategorySliderSkeleton() {
  return (
    <section className="bg-[#F2F2F2] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex justify-center md:mb-10">
          <div className="h-9 w-64 animate-pulse bg-gray-300 md:h-10 md:w-72 lg:h-11" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
          {['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6'].map((id) => (
            <div key={id} className="aspect-[2/1] animate-pulse bg-gray-200" />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedOffersSkeleton() {
  return (
    <section className="bg-[#F2F2F2] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 h-6 w-40 animate-pulse bg-gray-300" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8'].map((id) => (
            <div key={id} className="overflow-hidden bg-white">
              <div className="aspect-square animate-pulse bg-gray-200" />
              <div className="space-y-1 px-3 py-2">
                <div className="h-3 w-3/4 animate-pulse bg-gray-200" />
                <div className="h-4 w-12 animate-pulse bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TopCreatorsSkeleton() {
  return (
    <section className="bg-[#F2F2F2] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 h-6 w-48 animate-pulse bg-gray-300" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {['cr-1', 'cr-2', 'cr-3', 'cr-4'].map((id) => (
            <div key={id} className="overflow-hidden bg-white">
              <div className="aspect-square animate-pulse bg-gray-200" />
              <div className="p-4">
                <div className="h-4 w-20 animate-pulse bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      {/* 1 — Hero avec CTAs */}
      <HeroSection />

      {/* 2 — Bandeau tartan + baseline (texte réduit) */}
      <HeroTransition />

      {/* 3 — Comment ça marche */}
      <HowItWorks />

      {/* 4 — Styles / catégories */}
      <Suspense fallback={<CategorySliderSkeleton />}>
        <CategorySlider />
      </Suspense>

      {/* 5 — Offres du moment */}
      <Suspense fallback={<FeaturedOffersSkeleton />}>
        <FeaturedOffers />
      </Suspense>

      {/* 6 — Bandeau réassurance */}
      <ReassuranceStrip />

      {/* 7 — Top créateurs du mois + voir tous */}
      <Suspense fallback={<TopCreatorsSkeleton />}>
        <TopCreators />
      </Suspense>

      {/* 8 — Qui sommes-nous mini-section */}
      <AboutTeaser />

      {/* 9 — CTA Devenir créateur */}
      <CreatorCta />

      {/* 10 — Newsletter */}
      <NewsletterSection />

      {/* 11 — FAQ */}
      <FAQSection />
    </>
  );
}
