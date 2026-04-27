import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Star,
  ShoppingCart,
  Shield,
  FlaskConical,
  Truck,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProductSlider from "@/components/ProductSlider";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useToast } from "@/hooks/use-toast";
import { getPricingAudience } from "@/lib/authAudience";
import { ApiError } from "@/lib/api/client";
import {
  getProductById,
  getProducts,
  getProductDefaultVariation,
  getMinimumOrderQuantity,
  getProductMinimumOrderQuantity,
  getProductPricingSummary,
  getVariationEffectivePrice,
  ProductItem,
} from "@/lib/api/product";
import { addReview, getProductReviews } from "@/lib/api/review";
import { formatGBP } from "@/lib/currency";

const PRODUCT_LOOKUP_LIMIT = 200;
const REVIEWS_PAGE_SIZE = 5;

const ReviewSchema = z.object({
  user_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must be less than 255 characters"),
  rating: z.coerce
    .number({ invalid_type_error: "Please select a rating" })
    .int()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  review_text: z
    .string()
    .trim()
    .max(1000, "Review must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
});

type ReviewFormValues = z.infer<typeof ReviewSchema>;

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const parseAmount = (value: unknown) => parseFloat(String(value ?? 0)) || 0;
const formatRatingValue = (value: number) => parseAmount(value).toFixed(1);

const getVariationStockCount = (stockValue: unknown) =>
  Math.max(0, Math.floor(parseAmount(stockValue)));

const normalizeRating = (value: unknown) => {
  const numeric = Math.round(parseAmount(value));
  return Math.max(0, Math.min(5, numeric));
};

const isActiveProduct = (status: string | boolean | undefined) => {
  if (typeof status === "boolean") {
    return status;
  }

  if (typeof status === "string") {
    return status.toLowerCase() === "active";
  }

  return true;
};

const toTabValue = (label: string) =>
  label.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");

const UUID_LIKE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuidLike = (value: unknown) =>
  typeof value === "string" && UUID_LIKE_PATTERN.test(value);

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem, addItems, isUpdating } = useCart();
  const { isAuthenticated, user } = useAuth();
  const pricingAudience = getPricingAudience(user);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [variationQuantities, setVariationQuantities] = useState<
    Record<string, number>
  >({});
  const [selectedImage, setSelectedImage] = useState(0);
  const [showSticky, setShowSticky] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [selectedVariationId, setSelectedVariationId] = useState<
    string | number | null
  >(null);
  const shouldFetchProductDetail = Boolean(id && UUID_LIKE_PATTERN.test(id));

  const productDetailQuery = useQuery({
    queryKey: ["product-detail", id],
    queryFn: () => getProductById(id!),
    enabled: shouldFetchProductDetail,
    retry: 1,
  });

  const productsQuery = useQuery({
    queryKey: ["products", "detail-lookup", PRODUCT_LOOKUP_LIMIT],
    queryFn: () =>
      getProducts({
        page: 1,
        limit: PRODUCT_LOOKUP_LIMIT,
      }),
    retry: 1,
  });

  const product = useMemo(() => {
    if (productDetailQuery.data) {
      return productDetailQuery.data;
    }

    if (!id) {
      return null;
    }

    const products = productsQuery.data?.products || [];
    const numericId = Number(id);

    if (!Number.isNaN(numericId)) {
      const byNumericId = products.find((item) => item.id === numericId);
      if (byNumericId) {
        return byNumericId;
      }
    }

    return products.find((item) => toSlug(item.product_name) === id) || null;
  }, [id, productDetailQuery.data, productsQuery.data?.products]);

  const relatedProducts = useMemo(() => {
    const products = productsQuery.data?.products || [];

    if (!product) {
      return [];
    }

    const sameCategory = products.filter(
      (item) =>
        item.id !== product.id && item.category_id === product.category_id,
    );
    const fallback = products.filter((item) => item.id !== product.id);

    const ordered = [...sameCategory, ...fallback].filter(
      (item, index, self) => self.findIndex((p) => p.id === item.id) === index,
    );

    return ordered.slice(0, 6);
  }, [product, productsQuery.data?.products]);

  const reviewProductId = useMemo(() => {
    if (isUuidLike(id)) {
      return id;
    }

    if (isUuidLike(product?.product_id)) {
      return product.product_id;
    }

    if (typeof product?.id === "string" && isUuidLike(product.id)) {
      return product.id;
    }

    return null;
  }, [id, product?.id, product?.product_id]);

  useEffect(() => {
    setVariationQuantities({});
    setSelectedImage(0);
    setReviewsPage(1);
    setSelectedVariationId(null);
  }, [product?.id]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const defaultVariation = getProductDefaultVariation(product);

    if (!defaultVariation) {
      return;
    }

    setSelectedVariationId((currentVariationId) => {
      if (
        currentVariationId &&
        product.variations.some(
          (variation) => variation.variation_id === currentVariationId,
        )
      ) {
        return currentVariationId;
      }

      return defaultVariation.variation_id;
    });
  }, [product]);

  const reviewsQuery = useQuery({
    queryKey: [
      "reviews",
      "product",
      reviewProductId,
      reviewsPage,
      REVIEWS_PAGE_SIZE,
    ],
    queryFn: () =>
      getProductReviews(reviewProductId!, {
        page: reviewsPage,
        limit: REVIEWS_PAGE_SIZE,
      }),
    enabled: Boolean(reviewProductId),
    retry: 1,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: {
      user_name: "",
      rating: 5,
      review_text: "",
    },
  });

  useEffect(() => {
    if (user) {
      const fallbackName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

      if (fallbackName) {
        setValue("user_name", fallbackName);
      }
    }
  }, [setValue, user]);

  const addReviewMutation = useMutation({
    mutationFn: addReview,
    onSuccess: (response) => {
      toast({
        title: "Review submitted",
        description: response.message || "Thank you for your feedback.",
      });

      reset({
        user_name: user
          ? [user.first_name, user.last_name].filter(Boolean).join(" ").trim()
          : "",
        rating: 5,
        review_text: "",
      });

      setReviewsPage(1);
      void queryClient.invalidateQueries({
        queryKey: ["reviews", "product", reviewProductId],
      });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description:
          error instanceof ApiError
            ? error.message
            : "Unable to submit your review right now.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const handleScroll = () => setShowSticky(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onSubmitReview = handleSubmit((values) => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to submit a review.",
        variant: "destructive",
      });
      return;
    }

    if (!product) {
      return;
    }

    if (!reviewProductId) {
      toast({
        title: "Product review unavailable",
        description: "We could not determine the review product ID.",
        variant: "destructive",
      });
      return;
    }

    addReviewMutation.mutate({
      product_id: reviewProductId,
      user_name: values.user_name.trim(),
      rating: values.rating,
      review_text: values.review_text?.trim() || undefined,
    });
  });

  if (productDetailQuery.isLoading || (!shouldFetchProductDetail && productsQuery.isLoading)) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <AnnouncementBar />
          <Navbar />
          <main className="py-10">
            <div className="container text-center text-muted-foreground">
              Loading product details...
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  if (productDetailQuery.isError || (!shouldFetchProductDetail && productsQuery.isError)) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <AnnouncementBar />
          <Navbar />
          <main className="py-10">
            <div className="container max-w-3xl">
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive text-sm">
                {productsQuery.error instanceof ApiError
                  ? productsQuery.error.message
                  : productDetailQuery.error instanceof ApiError
                    ? productDetailQuery.error.message
                  : "Unable to load product details right now."}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => productsQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  if (!product) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <AnnouncementBar />
          <Navbar />
          <main className="py-12">
            <div className="container max-w-3xl text-center">
              <h1 className="text-2xl font-bold mb-3">Product not found</h1>
              <p className="text-muted-foreground mb-6">
                The requested product could not be found.
              </p>
              <Button asChild className="rounded-full">
                <Link to="/products">Back to Products</Link>
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  const productVariations = product.variations || [];
  const defaultVariation = getProductDefaultVariation(product);
  const selectedVariation =
    productVariations.find(
      (variation) => variation.variation_id === selectedVariationId,
    ) || defaultVariation;
  const selectedVariationIdValue = selectedVariation?.variation_id ?? null;
  const variationStock = selectedVariation
    ? getVariationStockCount(selectedVariation.stock)
    : null;
  const availableVariationCount = productVariations.filter(
    (variation) => getVariationStockCount(variation.stock) > 0,
  ).length;
  const displayPrice = selectedVariation
    ? getVariationEffectivePrice(selectedVariation, pricingAudience)
    : parseAmount(
        product.discount_price ?? product.price,
      );
  const originalPrice = selectedVariation
    ? parseAmount(selectedVariation.price)
    : parseAmount(product.price);
  const hasDiscount = selectedVariation
    ? selectedVariation.discounted_price !== null &&
      displayPrice < originalPrice
    : product.discount_price !== null &&
      product.discount_price !== undefined &&
      displayPrice < originalPrice;
  const productRating = normalizeRating(product.avg_rating);
  const productMinimumOrderQuantity = getProductMinimumOrderQuantity(product);
  const selectedVariationMinimumOrderQuantity = selectedVariation
    ? getMinimumOrderQuantity(selectedVariation)
    : productMinimumOrderQuantity;
  const inStock =
    isActiveProduct(product.status) &&
    (productVariations.length ? availableVariationCount > 0 : true);

  const selectedVariationLines = productVariations
    .map((variation) => ({
      variation,
      quantity: variationQuantities[variation.variation_id] ?? 0,
    }))
    .filter((entry) => entry.quantity > 0);
  const selectedVariationCount = selectedVariationLines.length;
  const totalSelectedUnits = selectedVariationLines.reduce(
    (sum, entry) => sum + entry.quantity,
    0,
  );
  const canAddToCart = productVariations.length
    ? selectedVariationCount > 0
    : Boolean(selectedVariationIdValue);
  const addToCartLabel = productVariations.length
    ? selectedVariationCount > 0
      ? `Add ${totalSelectedUnits} item${totalSelectedUnits > 1 ? "s" : ""}`
      : "Add Selected Variants"
    : "Add to Cart";

  const updateVariationQuantity = (
    variationId: string | number,
    nextQuantity: number,
    stockLimit: number | null,
  ) => {
    setVariationQuantities((current) => {
      const variationKey = String(variationId);
      const variation = productVariations.find(
        (entry) => String(entry.variation_id) === variationKey,
      );
      const minimumOrderQuantity =
        pricingAudience === "wholesaler" && variation
          ? getMinimumOrderQuantity(variation)
          : 1;
      const currentQuantity = current[variationKey] ?? 0;
      const boundedByStock =
        stockLimit !== null ? Math.min(nextQuantity, stockLimit) : nextQuantity;
      let normalized = Math.max(0, Math.min(999, Math.trunc(boundedByStock)));

      if (
        pricingAudience === "wholesaler" &&
        currentQuantity <= 0 &&
        normalized > 0 &&
        minimumOrderQuantity > 1
      ) {
        normalized = Math.max(normalized, minimumOrderQuantity);
      }

      if (normalized <= 0) {
        if (!(variationKey in current)) {
          return current;
        }

        const { [variationKey]: _, ...rest } = current;
        return rest;
      }

      if (current[variationKey] === normalized) {
        return current;
      }

      return {
        ...current,
        [variationKey]: normalized,
      };
    });
  };

  const handleAddToCart = () => {
    if (!productVariations.length) {
      if (selectedVariationIdValue) {
        addItem(
          product.id,
          selectedVariationIdValue,
          pricingAudience === "wholesaler"
            ? selectedVariationMinimumOrderQuantity
            : 1,
        );
      }
      return;
    }

    if (!selectedVariationLines.length) {
      toast({
        title: "Select quantity",
        description:
          "Use +/- in the variation table to choose one or more variants.",
        variant: "destructive",
      });
      return;
    }

    addItems(
      selectedVariationLines.map((entry) => ({
        productId: product.id,
        variationId: entry.variation.variation_id,
        quantity: entry.quantity,
      })),
    );
  };

  const galleryImages = [
    product.main_img || "",
    ...(product.support_imgs || []),
  ].filter(Boolean);

  const mainImage = galleryImages[selectedImage] || "";
  const reviewItems = reviewsQuery.data?.reviews || [];
  const reviewCount = Math.max(
    0,
    reviewsQuery.data?.total_reviews ?? product.review_count ?? 0,
  );
  const reviewsTotalPages = Math.max(reviewsQuery.data?.total_pages || 1, 1);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <main className="py-6 md:py-8">
          <div className="container px-4 sm:px-6">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4 md:mb-6 overflow-x-auto whitespace-nowrap">
              <Link
                to="/"
                className="hover:text-foreground transition-colors shrink-0"
              >
                Home
              </Link>
              <span>/</span>
              <Link
                to="/products"
                className="hover:text-foreground transition-colors shrink-0"
              >
                Products
              </Link>
              <span>/</span>
              <span className="text-foreground truncate">
                {product.product_name}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
              <div className="space-y-3 sm:space-y-4">
                <div className="aspect-square bg-gradient-to-br from-primary/15 to-accent/15 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden group cursor-zoom-in">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={product.product_name}
                      className="h-full w-full "
                    />
                  ) : (
                    <span className="text-6xl sm:text-8xl group-hover:scale-125 transition-transform duration-500">
                      🌿
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {(galleryImages.length
                    ? galleryImages
                    : ["", "", "", ""]
                  ).map((image, index) => (
                    <button
                      key={`${image || "placeholder"}-${index}`}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center transition-all duration-200 ${
                        selectedImage === index
                          ? "ring-2 ring-primary shadow-md"
                          : "hover:ring-1 hover:ring-border"
                      }`}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={`${product.product_name} ${index + 1}`}
                          className="h-full w-full  rounded-lg sm:rounded-xl"
                        />
                      ) : (
                        <span className="text-lg sm:text-2xl">🌿</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div>
                  <p className="text-xs sm:text-sm text-primary font-medium mb-1">
                    {product.category_name || "Hemp Product"}
                  </p>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    {product.product_name}
                  </h1>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          j < productRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {formatRatingValue(product.avg_rating)} ({reviewCount} review
                    {reviewCount === 1 ? "" : "s"})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {formatGBP(displayPrice)}
                  </p>
                  {hasDiscount ? (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatGBP(originalPrice)}
                    </p>
                  ) : null}
                </div>
                {selectedVariationMinimumOrderQuantity > 1 ? (
                  <p className="text-sm font-medium text-primary">
                    Minimum order quantity: {selectedVariationMinimumOrderQuantity}
                  </p>
                ) : null}

                {productVariations.length ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Choose Variation</p>
                      <p className="text-xs text-muted-foreground">
                        {productVariations.length} option
                        {productVariations.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-card/60">
                      <ScrollArea className="h-[16rem] sm:h-[20rem] w-full">
                        <Table className="min-w-[520px]">
                          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="w-[42%]">
                                Variation
                              </TableHead>
                              <TableHead className="w-[24%]">Price</TableHead>
                              <TableHead className="w-[18%]">Stock</TableHead>
                              <TableHead className="w-[16%] text-right">
                                Qty
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productVariations.map((variation) => {
                              const variationPrice =
                                getVariationEffectivePrice(
                                  variation,
                                  pricingAudience,
                                );
                              const variationOriginalPrice = parseAmount(
                                variation.price,
                              );
                              const variationHasDiscount =
                                pricingAudience === "wholesaler" &&
                                variation.discounted_price !== null &&
                                variationPrice < variationOriginalPrice;
                              const variationStockCount = Math.max(
                                0,
                                Math.floor(parseAmount(variation.stock)),
                              );
                              const variationMinimumOrderQuantity =
                                getMinimumOrderQuantity(variation);
                              const variationInStock = variationStockCount > 0;
                              const selectedQuantity =
                                variationQuantities[variation.variation_id] ??
                                0;
                              const isSelected =
                                selectedVariationIdValue ===
                                variation.variation_id;

                              return (
                                <TableRow
                                  key={variation.variation_id}
                                  data-state={
                                    isSelected ? "selected" : undefined
                                  }
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setSelectedVariationId(
                                      variation.variation_id,
                                    );
                                  }}
                                >
                                  <TableCell className="font-medium">
                                    {variation.variation_name}
                                    {variationMinimumOrderQuantity > 1 ? (
                                      <p className="mt-1 text-[11px] font-medium text-primary">
                                        MOQ: {variationMinimumOrderQuantity}
                                      </p>
                                    ) : null}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {formatGBP(variationPrice)}
                                      </span>
                                      {variationHasDiscount ? (
                                        <span className="text-xs text-muted-foreground line-through">
                                          {formatGBP(variationOriginalPrice)}
                                        </span>
                                      ) : null}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`text-xs font-medium ${
                                        variationInStock
                                          ? "text-primary"
                                          : "text-destructive"
                                      }`}
                                    >
                                      {variationInStock
                                        ? `${variationStockCount} in stock`
                                        : "Out of stock"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        className="h-7 w-7 rounded-full"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          updateVariationQuantity(
                                            variation.variation_id,
                                            selectedQuantity - 1,
                                            variationStockCount,
                                          );
                                        }}
                                        disabled={
                                          isUpdating || selectedQuantity <= 0
                                        }
                                      >
                                        <Minus className="h-3.5 w-3.5" />
                                      </Button>
                                      <span className="min-w-[1.25rem] text-center text-xs font-semibold">
                                        {selectedQuantity}
                                      </span>
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant={
                                          isSelected ? "default" : "outline"
                                        }
                                        className="h-7 w-7 rounded-full"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setSelectedVariationId(
                                            variation.variation_id,
                                          );
                                          updateVariationQuantity(
                                            variation.variation_id,
                                            selectedQuantity + 1,
                                            variationStockCount,
                                          );
                                        }}
                                        disabled={
                                          isUpdating ||
                                          !variationInStock ||
                                          selectedQuantity >=
                                            Math.min(999, variationStockCount)
                                        }
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                      <div className="px-3 py-2 border-t text-xs text-muted-foreground">
                        {selectedVariationCount > 0
                          ? `${selectedVariationCount} variation${selectedVariationCount > 1 ? "s" : ""} selected (${totalSelectedUnits} item${totalSelectedUnits > 1 ? "s" : ""})`
                          : "Use +/- to select multiple variants in one go."}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No product variations available right now.
                  </p>
                )}

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {product.description ||
                    "Premium hemp product crafted with quality ingredients and careful processing."}
                </p>

                <p
                  className={`text-sm font-medium ${
                    inStock ? "text-primary" : "text-destructive"
                  }`}
                >
                  {inStock
                    ? productVariations.length
                      ? selectedVariation
                        ? variationStock !== null
                          ? `${variationStock} in stock for ${selectedVariation.variation_name}`
                          : "In Stock"
                        : `${availableVariationCount} variation${availableVariationCount > 1 ? "s" : ""} available`
                      : "In Stock"
                    : "Out of Stock"}
                </p>

                <div className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    {selectedVariationCount > 0
                      ? `${selectedVariationCount} variation${selectedVariationCount > 1 ? "s" : ""} ready to add (${totalSelectedUnits} item${totalSelectedUnits > 1 ? "s" : ""})`
                      : "Select quantities in the table, then add all variants at once."}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      className="flex-1 rounded-full gap-2 h-11 sm:h-12 text-sm"
                      disabled={!inStock || isUpdating || !canAddToCart}
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {isUpdating ? "Adding..." : addToCartLabel}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full h-11 sm:h-12 text-sm"
                      disabled={!inStock}
                      asChild
                    >
                      <Link to="/cart">Buy Now</Link>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 border-t">
                  {[
                    { icon: Shield, label: "Secure Payment" },
                    { icon: FlaskConical, label: "Lab Tested" },
                    { icon: Truck, label: "Fast Shipping" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground"
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      <span className="text-xs">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-12">
              <Tabs defaultValue="description">
                <TabsList className="bg-transparent border-b rounded-none w-full justify-start gap-0 h-auto p-0 overflow-x-auto">
                  {[
                    "Description",
                    "Lab Results",
                    "Shipping and Returns",
                    "Reviews",
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={toTabValue(tab)}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm whitespace-nowrap shrink-0"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="description" className="pt-4 sm:pt-6">
                  <div className="prose max-w-none text-muted-foreground space-y-3 sm:space-y-4 text-sm sm:text-base">
                    <p>
                      {product.description ||
                        "Premium hemp product crafted with quality ingredients and careful processing."}
                    </p>
                    <p>
                      Every batch undergoes third-party testing for purity and
                      potency before reaching your doorstep.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="lab-results" className="pt-4 sm:pt-6">
                  <div className="bg-card border rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <FlaskConical className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      <h3 className="font-semibold text-base sm:text-lg">
                        Third-Party Lab Tested
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-sm mb-4">
                      This product is verified for potency, pesticides, heavy
                      metals, and contaminants.
                    </p>
                    <Button variant="outline" className="rounded-full text-sm">
                      View Certificate
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent
                  value="shipping-and-returns"
                  className="pt-4 sm:pt-6"
                >
                  <div className="text-muted-foreground space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <p>
                      <strong className="text-foreground">
                        Free Shipping:
                      </strong>{" "}
                      On all orders over {formatGBP(50)}.
                    </p>
                    <p>
                      <strong className="text-foreground">Returns:</strong>{" "}
                      30-day returns on unopened products.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="pt-4 sm:pt-6">
                  <div className="space-y-4 sm:space-y-5">
                    <form
                      onSubmit={onSubmitReview}
                      className="bg-card border rounded-lg sm:rounded-xl p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-sm sm:text-base">
                          Write a Review
                        </h3>
                        {!isAuthenticated ? (
                          <span className="text-xs text-destructive">
                            Login required to submit
                          </span>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Your name"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...register("user_name")}
                          />
                          {errors.user_name ? (
                            <p className="text-xs text-destructive mt-1">
                              {errors.user_name.message}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...register("rating")}
                          >
                            <option value={5}>5 stars</option>
                            <option value={4}>4 stars</option>
                            <option value={3}>3 stars</option>
                            <option value={2}>2 stars</option>
                            <option value={1}>1 star</option>
                          </select>
                          {errors.rating ? (
                            <p className="text-xs text-destructive mt-1">
                              {errors.rating.message}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <Textarea
                          placeholder="Share your experience with this product"
                          className="min-h-[96px]"
                          {...register("review_text")}
                        />
                        {errors.review_text ? (
                          <p className="text-xs text-destructive mt-1">
                            {errors.review_text.message}
                          </p>
                        ) : null}
                      </div>

                      <Button
                        type="submit"
                        disabled={
                          addReviewMutation.isPending || !isAuthenticated
                        }
                        className="rounded-full"
                      >
                        {addReviewMutation.isPending
                          ? "Submitting..."
                          : "Submit Review"}
                      </Button>
                    </form>

                    {reviewsQuery.isError ? (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                        <div className="flex items-center justify-between gap-3">
                          <p>
                            {reviewsQuery.error instanceof ApiError
                              ? reviewsQuery.error.message
                              : "Unable to load reviews right now."}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reviewsQuery.refetch()}
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {reviewsQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Loading reviews...
                      </p>
                    ) : null}

                    {!reviewsQuery.isLoading &&
                    !reviewsQuery.isError &&
                    !reviewProductId ? (
                      <p className="text-sm text-muted-foreground">
                        Reviews are available once this product is opened with
                        its backend UUID.
                      </p>
                    ) : null}

                    {!reviewsQuery.isLoading &&
                    !reviewsQuery.isError &&
                    reviewProductId &&
                    !reviewItems.length ? (
                      <p className="text-sm text-muted-foreground">
                        No reviews yet. Be the first to review this product.
                      </p>
                    ) : null}

                    <div className="space-y-3 sm:space-y-4">
                      {reviewItems.map((review) => (
                        <div
                          key={review.review_id}
                          className="bg-card border rounded-lg sm:rounded-xl p-3 sm:p-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {review.user_name?.[0] || "U"}
                            </div>
                            <span className="font-medium text-xs sm:text-sm">
                              {review.user_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString(
                                "en-US",
                              )}
                            </span>
                            <div className="flex gap-0.5 ml-auto">
                              {[...Array(5)].map((_, starIndex) => (
                                <Star
                                  key={starIndex}
                                  className={`h-3 w-3 ${
                                    starIndex < review.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {review.review_text ||
                              "No written feedback provided."}
                          </p>
                        </div>
                      ))}
                    </div>

                    {reviewsTotalPages > 1 ? (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            reviewsPage === 1 || reviewsQuery.isFetching
                          }
                          onClick={() =>
                            setReviewsPage((prevPage) =>
                              Math.max(1, prevPage - 1),
                            )
                          }
                        >
                          Previous
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Page {reviewsPage} of {reviewsTotalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            reviewsPage >= reviewsTotalPages ||
                            reviewsQuery.isFetching
                          }
                          onClick={() =>
                            setReviewsPage((prevPage) =>
                              Math.min(reviewsTotalPages, prevPage + 1),
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="mt-8 sm:mt-12">
              <ProductSlider
                title="You May Also Like"
                subtitle="Discover more premium hemp products"
                products={relatedProducts.map((item: ProductItem) => {
                  const relatedDefaultVariation =
                    getProductDefaultVariation(item);
                  const relatedPricing = getProductPricingSummary(
                    item,
                    pricingAudience,
                  );

                  return {
                    id: item.id,
                    productId: item.product_id,
                    variationId: relatedDefaultVariation?.variation_id,
                    variationLabel: relatedDefaultVariation?.variation_name,
                    name: item.product_name,
                    price: relatedPricing.currentPrice,
                    originalPrice: relatedPricing.hasDiscount
                      ? relatedPricing.originalPrice
                      : null,
                    minimumOrderQuantity: getProductMinimumOrderQuantity(item),
                    rating: normalizeRating(item.avg_rating),
                    image: item.main_img || "",
                  };
                })}
              />
            </div>
          </div>
        </main>

        <div
          className={`fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t shadow-lg transition-transform duration-300 ${
            showSticky ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="container px-4 sm:px-6 flex items-center justify-between py-2.5 sm:py-3 gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm truncate">
                {product.product_name}
              </p>
              {selectedVariation?.variation_name ? (
                <p className="text-[11px] text-muted-foreground truncate">
                  {selectedVariation.variation_name}
                </p>
              ) : null}
              <p className="text-primary font-bold text-sm sm:text-base">
                {formatGBP(displayPrice)}
              </p>
            </div>
            <Button
              className="rounded-full gap-2 shrink-0 text-xs sm:text-sm h-9 sm:h-10"
              onClick={handleAddToCart}
              disabled={!inStock || isUpdating || !canAddToCart}
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {isUpdating ? "Adding..." : addToCartLabel}
            </Button>
          </div>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default ProductDetail;
