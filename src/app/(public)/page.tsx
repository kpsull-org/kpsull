import {
  HeroSection,
  HeroTransition,
  CategorySlider,
  FeaturedOffers,
  TopCreators,
  FAQSection,
  SectionSeparator,
} from "@/components/home";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HeroTransition />
      <CategorySlider />
      <SectionSeparator />
      <FeaturedOffers />
      <SectionSeparator />
      <TopCreators />
      <SectionSeparator />
      <FAQSection />
    </>
  );
}
