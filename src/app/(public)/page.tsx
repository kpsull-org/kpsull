import {
  HeroSection,
  HeroTransition,
  CategorySlider,
  FeaturedOffers,
  TopCreators,
  BecomeCreatorCTA,
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
      <BecomeCreatorCTA />
      <FAQSection />
    </>
  );
}
