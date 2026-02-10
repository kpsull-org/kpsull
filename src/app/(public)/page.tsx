import {
  HeroSection,
  HeroTransition,
  CategorySlider,
  FeaturedOffers,
  TopCreators,
  FAQSection,
} from "@/components/home";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HeroTransition />
      <CategorySlider />
      <FeaturedOffers />
      <TopCreators />
      <FAQSection />
    </>
  );
}
