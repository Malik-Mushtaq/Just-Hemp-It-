import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Star, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getPricingAudience } from "@/lib/authAudience";
import { ApiError } from "@/lib/api/client";
import { getCategories } from "@/lib/api/category";
import {
  getProducts,
  getProductDefaultVariation,
  getProductMinimumOrderQuantity,
  getProductPricingSummary,
  searchProducts,
} from "@/lib/api/product";
import { formatGBP } from "@/lib/currency";
import productCardCartIcon from "@/assets/24 x 24.svg";

const ITEMS_PER_PAGE = 12;
const MIN_PRICE = 0;
const MAX_PRICE = 1000;

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Best Selling", value: "best" },
];

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const formatPrice = (price: number) => formatGBP(price);

const isActiveProduct = (status: string | boolean | undefined) => {
  if (typeof status === "boolean") {
    return status;
  }

  if (typeof status === "string") {
    return status.toLowerCase() === "active";
  }

  return true;
};

const Products = () => {
  const { user } = useAuth();
  const { addItem, isUpdating } = useCart();
  const pricingAudience = getPricingAudience(user);
  const [searchParams] = useSearchParams();
  const preselectedCategoryName = searchParams.get("category") || "";
  const searchQuery = (searchParams.get("q") || "").trim();
  const isSearchMode = Boolean(searchQuery);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [priceRange, setPriceRange] = useState<number[]>([
    MIN_PRICE,
    MAX_PRICE,
  ]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    retry: 1,
  });

  const categories = categoriesQuery.data?.categories || [];

  useEffect(() => {
    if (!preselectedCategoryName || !categories.length) {
      return;
    }

    const matchedCategory = categories.find(
      (category) =>
        category.category_name.toLowerCase() ===
        preselectedCategoryName.toLowerCase(),
    );

    if (matchedCategory) {
      setSelectedCategoryId(matchedCategory.id);
    }
  }, [categories, preselectedCategoryName]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, priceRange, minRating, sortBy, searchQuery]);

  const productsQuery = useQuery({
    queryKey: [
      "products",
      isSearchMode ? "search" : "listing",
      searchQuery,
      currentPage,
      ITEMS_PER_PAGE,
      selectedCategoryId,
      priceRange[0],
      priceRange[1],
      minRating,
      sortBy,
    ],
    queryFn: () => {
      if (isSearchMode) {
        return searchProducts({
          q: searchQuery,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        });
      }

      return getProducts({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        category_id: selectedCategoryId || undefined,
        price_min: priceRange[0] > MIN_PRICE ? priceRange[0] : undefined,
        price_max: priceRange[1] < MAX_PRICE ? priceRange[1] : undefined,
        rating_min: minRating > 0 ? minRating : undefined,
        sort_price:
          sortBy === "price-asc"
            ? "asc"
            : sortBy === "price-desc"
              ? "desc"
              : undefined,
        best_seller: sortBy === "best" ? true : undefined,
      });
    },
    placeholderData: (previousData) => previousData,
    retry: 1,
  });

  const products = productsQuery.data?.products || [];
  const totalProducts = productsQuery.data?.total_products || 0;
  const totalPages = Math.max(productsQuery.data?.total_pages || 1, 1);

  const productListErrorMessage =
    productsQuery.error instanceof ApiError
      ? productsQuery.error.message
      : "Unable to load products right now.";

  const selectedCategoryName = useMemo(
    () =>
      categories.find((category) => category.id === selectedCategoryId)
        ?.category_name || null,
    [categories, selectedCategoryId],
  );

  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryId((previousCategoryId) =>
      previousCategoryId === categoryId ? null : categoryId,
    );
  };

  const clearFilters = () => {
    setSelectedCategoryId(null);
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setMinRating(0);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategoryId !== null ||
    priceRange[0] !== MIN_PRICE ||
    priceRange[1] !== MAX_PRICE ||
    minRating > 0 ||
    sortBy !== "newest";

  const FiltersContent = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-sm mb-3">Category</h4>
        {categoriesQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading categories...</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selectedCategoryId === category.id}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                {category.category_name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-3">Price Range</h4>
        <Slider
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={10}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-3">Minimum Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setMinRating(minRating === rating ? 0 : rating)}
              className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md w-full transition-colors ${
                minRating === rating
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`h-3 w-3 ${
                    index < rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted"
                  }`}
                />
              ))}
              <span className="ml-1">& Up</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-3">Sort By</h4>
        <div className="space-y-1.5">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`block w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                sortBy === option.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={clearFilters}
        >
          Clear All Filters
        </Button>
      ) : null}
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <main className="py-8">
          <div className="container">
            <h1 className="text-3xl font-bold mb-1">Products</h1>
            <p className="text-muted-foreground mb-2">
              Browse our full range of premium hemp and CBD products
            </p>

            {isSearchMode ? (
              <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing results for
                  <span className="font-medium text-foreground">
                    {` "${searchQuery}"`}
                  </span>
                </span>
                <Button variant="link" className="h-auto p-0 text-sm" asChild>
                  <Link to="/products">Clear search</Link>
                </Button>
              </div>
            ) : (
              <div className="mb-6" />
            )}

            {!isSearchMode ? (
              <div className="lg:hidden mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setMobileFilters(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </div>
            ) : null}

            {!isSearchMode && mobileFilters ? (
              <div
                className="fixed inset-0 z-50 bg-foreground/40 lg:hidden"
                onClick={() => setMobileFilters(false)}
              >
                <div
                  className="absolute left-0 top-0 h-full w-72 bg-background p-5 overflow-y-auto shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Filters</h3>
                    <button onClick={() => setMobileFilters(false)}>
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <FiltersContent />
                </div>
              </div>
            ) : null}

            <div className={`flex ${isSearchMode ? "" : "gap-8"}`}>
              {!isSearchMode ? (
                <aside className="hidden lg:block w-60 shrink-0">
                  <div className="sticky top-20 bg-card border rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold mb-4">Filters</h3>
                    <FiltersContent />
                  </div>
                </aside>
              ) : null}

              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <p className="text-sm text-muted-foreground">
                    {productsQuery.isLoading && !products.length
                      ? "Loading products..."
                      : isSearchMode
                        ? `${totalProducts} results for \"${searchQuery}\"`
                        : `${totalProducts} products${selectedCategoryName ? ` in ${selectedCategoryName}` : ""}`}
                  </p>
                  {productsQuery.isFetching && products.length ? (
                    <span className="text-xs text-muted-foreground">
                      Updating results...
                    </span>
                  ) : null}
                </div>

                {productsQuery.isError ? (
                  <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p>{productListErrorMessage}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => productsQuery.refetch()}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product, index) => {
                    const defaultVariation =
                      getProductDefaultVariation(product);
                    const pricing = getProductPricingSummary(
                      product,
                      pricingAudience,
                    );
                    const productRating = Math.max(
                      0,
                      Math.min(5, Math.round(product.avg_rating || 0)),
                    );
                    const minimumOrderQuantity =
                      getProductMinimumOrderQuantity(product);
                    const isActive = isActiveProduct(product.status);
                    const variationCount = product.variations?.length || 0;
                    const canQuickAdd =
                      isActive &&
                      !!defaultVariation &&
                      parseFloat(String(defaultVariation.stock ?? 0)) > 0;

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className="bg-card rounded-xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                      >
                        <Link to={`/product/${toSlug(product.product_name)}`}>
                          <div className="h-44 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                            {product.main_img ? (
                              <img
                                src={product.main_img}
                                alt={product.product_name}
                                className="h-full w-full "
                              />
                            ) : (
                              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                                🌿
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="p-3 space-y-1.5">
                          <Link to={`/product/${toSlug(product.product_name)}`}>
                            <h3 className="font-semibold text-xs truncate hover:text-primary transition-colors">
                              {product.product_name}
                            </h3>
                          </Link>
                          {variationCount ? (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {defaultVariation?.variation_name ||
                                `${variationCount} variation${variationCount > 1 ? "s" : ""}`}
                            </p>
                          ) : null}
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, starIndex) => (
                              <Star
                                key={starIndex}
                                className={`h-3 w-3 ${
                                  starIndex < productRating
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
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">
                                {pricing.hasRange
                                  ? `From ${formatPrice(pricing.range.min)}`
                                  : formatPrice(pricing.currentPrice)}
                              </span>
                              {pricing.hasDiscount ? (
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {formatPrice(pricing.originalPrice)}
                                </span>
                              ) : pricing.hasRange ? (
                                <span className="text-[10px] text-muted-foreground">
                                  {`Up to ${formatPrice(pricing.range.max)}`}
                                </span>
                              ) : null}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full gap-1 text-[10px] h-7 px-2"
                              disabled={!canQuickAdd || isUpdating}
                              onClick={() => {
                                if (!defaultVariation) {
                                  return;
                                }

                                addItem(
                                  product.id,
                                  defaultVariation.variation_id,
                                );
                              }}
                            >
                              {/* <ShoppingCart className="h-3 w-3" /> Add */}
                              <img
                                src={productCardCartIcon}
                                alt=""
                                aria-hidden="true"
                                className="h-3 w-3"
                              />
                              <span>Add</span>
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {!productsQuery.isLoading && !products.length ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg">
                      {isSearchMode
                        ? "No products found for this search."
                        : "No products match your filters."}
                    </p>
                    {isSearchMode ? (
                      <Button variant="link" asChild>
                        <Link to="/products">Clear search</Link>
                      </Button>
                    ) : hasActiveFilters ? (
                      <Button variant="link" onClick={clearFilters}>
                        Clear all filters
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {totalProducts > 0 && totalPages > 1 ? (
                  <div className="mt-8">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              setCurrentPage((previousPage) =>
                                Math.max(1, previousPage - 1),
                              );
                            }}
                            className={
                              currentPage === 1 || productsQuery.isFetching
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>

                        {Array.from(
                          { length: totalPages },
                          (_, index) => index + 1,
                        ).map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              size="default"
                              isActive={currentPage === pageNumber}
                              onClick={(event) => {
                                event.preventDefault();
                                setCurrentPage(pageNumber);
                              }}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              setCurrentPage((previousPage) =>
                                Math.min(totalPages, previousPage + 1),
                              );
                            }}
                            className={
                              currentPage === totalPages ||
                              productsQuery.isFetching
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Products;
