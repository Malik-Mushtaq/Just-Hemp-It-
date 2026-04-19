import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { formatGBP } from "@/lib/currency";

const CartSidebar = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    isLoading,
    isUpdating,
    errorMessage,
    isOpen,
    setIsOpen,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-background shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Your Cart</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <ShoppingBag className="h-12 w-12 animate-pulse" />
              <p className="text-sm">Loading your cart...</p>
            </div>
          ) : null}

          {!isLoading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <ShoppingBag className="h-12 w-12" />
              <p className="text-sm">Your cart is empty</p>
            </div>
          )}

          {items.map((item) => (
            <div
              key={
                item.cart_item_id || `${item.product_id}-${item.variation_id}`
              }
              className="flex gap-3 bg-card rounded-xl border p-3"
            >
              {/* Thumbnail */}
              <div className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.product_name}
                    className="h-full w-full rounded-lg"
                  />
                ) : (
                  <span>🌿</span>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-sm font-semibold truncate">
                  {item.product_name}
                </h4>
                {item.variation_name ? (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.variation_name}
                  </p>
                ) : null}
                <p className="text-sm font-bold">
                  {formatGBP(item.price * item.quantity)}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, item.variation_id, -1)
                      }
                      className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted transition-colors"
                      disabled={isUpdating || item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-medium w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, item.variation_id, 1)
                      }
                      className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted transition-colors"
                      disabled={
                        isUpdating ||
                        (typeof item.available_stock === "number" &&
                          item.available_stock > 0 &&
                          item.quantity >= item.available_stock)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      removeItem(item.product_id, item.variation_id)
                    }
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    disabled={isUpdating}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-bold text-base">{formatGBP(subtotal)}</span>
          </div>
          {subtotal < 50 && (
            <p className="text-xs text-muted-foreground">
              Add{" "}
              <span className="font-semibold text-primary">
                {formatGBP(50 - subtotal)}
              </span>{" "}
              more for free shipping!
            </p>
          )}
          {subtotal >= 50 && (
            <p className="text-xs text-primary font-medium">
              🎉 You qualify for free shipping!
            </p>
          )}
          <Button className="w-full rounded-full" size="lg" asChild>
            <Link to="/cart" onClick={() => setIsOpen(false)}>
              Checkout
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-full"
            size="lg"
            asChild
          >
            <Link to="/products" onClick={() => setIsOpen(false)}>
              View All Products
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
