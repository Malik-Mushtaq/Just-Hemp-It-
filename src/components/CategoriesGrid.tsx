import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getPricingAudience } from "@/lib/authAudience";
import { getCategories } from "@/lib/api/category";
import {
  getProductById,
  getProducts,
  getProductDefaultVariation,
  getProductMinimumOrderQuantity,
  getProductPricingSummary,
} from "@/lib/api/product";
import { ApiError } from "@/lib/api/client";
import { formatGBP } from "@/lib/currency";
import productCardCartIcon from "@/assets/24 x 24.svg";

const colors = [
  "from-primary/70 to-accent/70",
  "from-accent/70 to-olive/70",
  "from-olive/70 to-primary/70",
  "from-brown/70 to-primary/70",
  "from-primary/60 to-green-light/60",
  "from-green-light/60 to-accent/60",
  "from-accent/60 to-olive/60",
  "from-olive/60 to-brown/60",
];

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const getProductPath = (product: { id: string | number; product_name: string }) =>
  `/product/${encodeURIComponent(String(product.id || toSlug(product.product_name)))}`;

const getCategoryBrowsePath = (categoryName: string) =>
  `/products?category=${encodeURIComponent(categoryName)}`;

const CategoriesGrid = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | number | null
  >(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { addItem, isUpdating } = useCart();
  const pricingAudience = getPricingAudience(user);
  const [quickAddProductId, setQuickAddProductId] = useState<string | number | null>(
    null,
  );
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    retry: 1,
  });

  const categories = categoriesQuery.data?.categories || [];

  useEffect(() => {
    if (!selectedCategoryId && categories.length) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) || null;

  const categoryProductsQuery = useQuery({
    queryKey: ["products", "category-section", selectedCategoryId],
    queryFn: () =>
      getProducts({
        page: 1,
        limit: 16,
        category_id: selectedCategoryId || undefined,
      }),
    enabled: selectedCategoryId !== null,
    retry: 1,
  });

  const products = categoryProductsQuery.data?.products || [];

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    ref?.addEventListener("scroll", checkScroll);
    return () => ref?.removeEventListener("scroll", checkScroll);
  }, [selectedCategoryId, products.length]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 240;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleCategoryClick = (categoryId: string | number) => {
    setSelectedCategoryId((previousCategoryId) =>
      previousCategoryId === categoryId ? null : categoryId,
    );

    setTimeout(() => {
      sliderRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  };

  const categoryProductsErrorMessage =
    categoryProductsQuery.error instanceof ApiError
      ? categoryProductsQuery.error.message
      : "Unable to load products for this category.";

  return (
    <section id="categories" className="py-12">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-2">
          Shop by Category
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Find exactly what you are looking for
        </p>

        {categoriesQuery.isError ? (
          <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                {categoriesQuery.error instanceof ApiError
                  ? categoriesQuery.error.message
                  : "Unable to load categories right now."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => categoriesQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`group relative h-16 md:h-28 rounded-lg md:rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left ${
                selectedCategoryId === category.id
                  ? "ring-2 ring-primary ring-offset-2"
                  : ""
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${colors[index % colors.length]} transition-transform duration-300 group-hover:scale-110`}
              />
              <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/20 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-[10px] md:text-base text-center px-1 md:px-3 drop-shadow-md leading-tight">
                  {category.category_name}
                </span>
              </div>
            </button>
          ))}
        </div>

        {selectedCategory ? (
          <div
            ref={sliderRef}
            className="mt-8 animate-in fade-in slide-in-from-top-4 duration-400"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {selectedCategory.category_name}
                </h3>
                {selectedCategory.subcategories?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory.subcategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        to={getCategoryBrowsePath(subcategory.name)}
                        className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
              <Link
                to={getCategoryBrowsePath(selectedCategory.category_name)}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1 text-xs"
                >
                  See More <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {categoryProductsQuery.isError ? (
              <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p>{categoryProductsErrorMessage}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => categoryProductsQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className={`absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/90 backdrop-blur shadow-lg border-border/50 transition-opacity ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={() => scroll("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={`absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/90 backdrop-blur shadow-lg border-border/50 transition-opacity ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={() => scroll("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide"
              >
                {categoryProductsQuery.isLoading
                  ? Array.from({ length: 4 }, (_, index) => (
                      <div
                        key={`cat-product-loading-${index}`}
                        className="snap-start shrink-0 w-[220px] bg-card rounded-xl border shadow-sm overflow-hidden"
                      >
                        <div className="h-36 bg-muted/50 animate-pulse" />
                        <div className="p-3 space-y-2">
                          <div className="h-3 w-2/3 rounded bg-muted/50 animate-pulse" />
                          <div className="h-3 w-1/2 rounded bg-muted/50 animate-pulse" />
                        </div>
                      </div>
                    ))
                  : products.map((product) => {
                      const rating = Math.max(
                        0,
                        Math.min(5, Math.round(product.avg_rating || 0)),
                      );
                      const defaultVariation =
                        getProductDefaultVariation(product);
                      const minimumOrderQuantity =
                        getProductMinimumOrderQuantity(product);
                      const pricing = getProductPricingSummary(
                        product,
                        pricingAudience,
                      );
                      const canQuickAdd =
                        (defaultVariation &&
                          parseFloat(String(defaultVariation.stock ?? 0)) > 0) ||
                        Boolean(product.id);

                      return (
                        <div
                          key={product.id}
                          className="snap-start shrink-0 w-[220px] bg-card rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        >
                          <Link to={getProductPath(product)}>
                            <div className="h-36 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                              {product.main_img ? (
                                <img
                                  src={product.main_img}
                                  alt={product.product_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-primary/60">
                                  CBD
                                </span>
                              )}
                            </div>
                          </Link>
                          <div className="p-3 space-y-1.5">
                            <Link to={getProductPath(product)}>
                              <h4 className="font-semibold text-xs truncate hover:text-primary transition-colors">
                                {product.product_name}
                              </h4>
                            </Link>
                            {defaultVariation?.variation_name ? (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {defaultVariation.variation_name}
                              </p>
                            ) : null}
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, starIndex) => (
                                <Star
                                  key={starIndex}
                                  className={`h-3 w-3 ${
                                    starIndex < rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            {minimumOrderQuantity > 1 ? (
                              <p className="text-[10px] font-medium text-primary">
                                MOQ: {minimumOrderQuantity}
                              </p>
                            ) : null}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold">
                                {pricing.hasRange
                                  ? `From ${formatGBP(pricing.range.min)}`
                                  : formatGBP(pricing.currentPrice)}
                              </span>
                              {pricing.hasDiscount ? (
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {formatGBP(pricing.originalPrice)}
                                </span>
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full gap-1 text-[10px] h-7 px-2"
                                disabled={isUpdating || !canQuickAdd}
                                onClick={() => {
                                  const addFromResolvedProduct = async () => {
                                    if (defaultVariation) {
                                      addItem(product.id, defaultVariation.variation_id);
                                      return;
                                    }

                                    if (!product.id) {
                                      return;
                                    }

                                    setQuickAddProductId(product.id);

                                    try {
                                      const detailedProduct = await getProductById(product.id);
                                      const resolvedVariation =
                                        getProductDefaultVariation(detailedProduct);

                                      if (!resolvedVariation) {
                                        throw new Error(
                                          "This product has no purchasable variants.",
                                        );
                                      }

                                      addItem(
                                        detailedProduct.id,
                                        resolvedVariation.variation_id,
                                      );
                                    } catch (error) {
                                      console.error(error);
                                    } finally {
                                      setQuickAddProductId(null);
                                    }
                                  };

                                  void addFromResolvedProduct();
                                }}
                              >
                                {/* <ShoppingCart className="h-3 w-3" /> Add */}
                                <img
                                  src={productCardCartIcon}
                                  alt=""
                                  aria-hidden="true"
                                  className="h-3 w-3"
                                />
                                <span>
                                  {quickAddProductId === product.id ? "Adding..." : "Add"}
                                </span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>

              {!categoryProductsQuery.isLoading && !products.length ? (
                <p className="text-sm text-muted-foreground mt-2">
                  No products found in this category.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default CategoriesGrid;
