import { useQuery } from "@tanstack/react-query";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import TrustBadges from "@/components/TrustBadges";
import CategoriesGrid from "@/components/CategoriesGrid";
import ProductSlider from "@/components/ProductSlider";
import BlogSection from "@/components/BlogSection";
import Newsletter from "@/components/Newsletter";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import AnimatedSection from "@/components/AnimatedSection";
import { useAuth } from "@/context/AuthContext";
import { getPricingAudience } from "@/lib/authAudience";
import {
  getProducts,
  getProductDefaultVariation,
  getProductMinimumOrderQuantity,
  getProductPricingSummary,
} from "@/lib/api/product";

const PRODUCT_SECTION_LIMIT = 10;

const Index = () => {
  const { user } = useAuth();
  const pricingAudience = getPricingAudience(user);
  const newArrivalsQuery = useQuery({
    queryKey: ["products", "new-arrivals", PRODUCT_SECTION_LIMIT],
    queryFn: () =>
      getProducts({
        page: 1,
        limit: PRODUCT_SECTION_LIMIT,
        new_arrival: true,
      }),
    retry: 1,
  });

  const bestSellersQuery = useQuery({
    queryKey: ["products", "best-sellers", PRODUCT_SECTION_LIMIT],
    queryFn: () =>
      getProducts({
        page: 1,
        limit: PRODUCT_SECTION_LIMIT,
        best_seller: true,
      }),
    retry: 1,
  });

  const mapSliderProducts = (
    products: NonNullable<typeof newArrivalsQuery.data>["products"] | undefined,
  ) =>
    (products || []).map((product) => {
      const defaultVariation = getProductDefaultVariation(product);
      const pricing = getProductPricingSummary(product, pricingAudience);

      return {
        id: product.id,
        variationId: defaultVariation?.variation_id,
        variationLabel: defaultVariation?.variation_name,
        name: product.product_name,
        price: pricing.currentPrice,
        pricePrefix: pricing.hasRange ? "From" : undefined,
        originalPrice: pricing.hasDiscount ? pricing.originalPrice : null,
        minimumOrderQuantity: getProductMinimumOrderQuantity(product),
        rating: Math.max(0, Math.min(5, Math.round(product.avg_rating || 0))),
        image: product.main_img || "",
      };
    });

  const newArrivals = mapSliderProducts(newArrivalsQuery.data?.products);
  const bestSellers = mapSliderProducts(bestSellersQuery.data?.products);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <main>
          <HeroCarousel />
          <AnimatedSection>
            <TrustBadges />
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <CategoriesGrid />
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <ProductSlider
              id="new-arrivals"
              title="New Arrivals"
              subtitle={
                newArrivalsQuery.isLoading
                  ? "Loading the latest drops..."
                  : "Fresh drops you don't want to miss"
              }
              products={newArrivals}
            />
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="bg-beige">
              <ProductSlider
                title="Best Sellers"
                subtitle={
                  bestSellersQuery.isLoading
                    ? "Loading top products..."
                    : "Our most loved products"
                }
                products={bestSellers}
              />
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <BlogSection />
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <Newsletter />
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <FAQ />
          </AnimatedSection>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Index;
