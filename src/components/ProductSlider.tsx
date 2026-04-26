import { useRef, useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { formatGBP } from "@/lib/currency";
import productCardCartIcon from "@/assets/24 x 24.svg";
import { getProductById, getProductDefaultVariation } from "@/lib/api/product";

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

interface Product {
  id?: string | number;
  productId?: string;
  variationId?: string | number;
  variationLabel?: string;
  name: string;
  price: number;
  pricePrefix?: string;
  originalPrice?: number | null;
  minimumOrderQuantity?: number | null;
  rating: number;
  image?: string;
}

const getProductPath = (product: Product) =>
  `/product/${encodeURIComponent(
    String(product.productId || product.id || toSlug(product.name)),
  )}`;

interface ProductSliderProps {
  title: string;
  subtitle: string;
  products: Product[];
  id?: string;
}

const ProductSlider = ({
  title,
  subtitle,
  products,
  id,
}: ProductSliderProps) => {
  const { addItem, isUpdating } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [quickAddProductId, setQuickAddProductId] = useState<string | number | null>(
    null,
  );

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
  }, [products.length]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id={id} className="py-16">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-2">{title}</h2>
        <p className="text-muted-foreground text-center mb-10">{subtitle}</p>
        <div className="relative group">
          {/* Left Arrow */}
          <Button
            variant="outline"
            size="icon"
            className={`absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur shadow-lg border-border/50 transition-opacity ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Right Arrow */}
          <Button
            variant="outline"
            size="icon"
            className={`absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur shadow-lg border-border/50 transition-opacity ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          >
            {products.map((p, i) => {
              const canQuickAdd =
                (p.id !== undefined && p.variationId !== undefined) ||
                p.id !== undefined;

              return (
                <div
                  key={p.id || i}
                  className="snap-start shrink-0 w-[260px] bg-card rounded-xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                >
                  <Link to={getProductPath(p)}>
                    <div className="h-52 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full "
                        />
                      ) : (
                        <span className="text-xs font-semibold text-primary/60">
                          CBD
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-4 space-y-2">
                    <Link to={getProductPath(p)}>
                      <h3 className="font-semibold text-sm truncate hover:text-primary transition-colors">
                        {p.name}
                      </h3>
                    </Link>
                    {p.variationLabel ? (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.variationLabel}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          className={`h-3.5 w-3.5 ${j < p.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({p.rating}.0)
                      </span>
                    </div>
                    {typeof p.minimumOrderQuantity === "number" &&
                    p.minimumOrderQuantity > 1 ? (
                      <p className="text-[11px] font-medium text-primary">
                        MOQ: {p.minimumOrderQuantity}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold">
                          {p.pricePrefix ? `${p.pricePrefix} ${formatGBP(p.price)}` : formatGBP(p.price)}
                        </span>
                        {typeof p.originalPrice === "number" &&
                        p.originalPrice > p.price ? (
                          <span className="text-[11px] text-muted-foreground line-through">
                            {formatGBP(p.originalPrice)}
                          </span>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full gap-1.5 text-xs"
                        onClick={() => {
                          const addFromResolvedProduct = async () => {
                            if (p.id !== undefined && p.variationId !== undefined) {
                              addItem(p.id, p.variationId);
                              return;
                            }

                            if (p.id === undefined) {
                              return;
                            }

                            setQuickAddProductId(p.id);

                            try {
                              const detailedProduct = await getProductById(p.id);
                              const resolvedVariation =
                                getProductDefaultVariation(detailedProduct);

                              if (!resolvedVariation) {
                                throw new Error(
                                  "This product has no purchasable variants.",
                                );
                              }

                              addItem(detailedProduct.id, resolvedVariation.variation_id);
                            } catch (error) {
                              console.error(error);
                            } finally {
                              setQuickAddProductId(null);
                            }
                          };

                          void addFromResolvedProduct();
                        }}
                        disabled={!canQuickAdd || isUpdating}
                      >
                        {/* <ShoppingCart className="h-3.5 w-3.5" /> Add */}
                        <img
                          src={productCardCartIcon}
                          alt=""
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                        />
                        <span>{quickAddProductId === p.id ? "Adding..." : "Add"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductSlider;
