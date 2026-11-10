"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartView } from "@/lib/cart";
import { useToast } from "@/components/providers/toast-provider";

type CartContextValue = {
  cart: CartView;
  count: number;
  pending: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  refresh: () => Promise<void>;
  addItem: (input: {
    productId: string;
    variantId?: string | null;
    quantity?: number;
  }) => Promise<boolean>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  pendingItemId: string | null;
};

const EMPTY_CART: CartView = {
  id: null,
  lines: [],
  couponCode: null,
  couponMessage: null,
  currency: "PKR",
  totals: {
    itemCount: 0,
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    freeShippingRemaining: 0,
  },
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  initialCart,
}: {
  children: ReactNode;
  initialCart?: CartView | null;
}) {
  const [cart, setCart] = useState<CartView>(initialCart ?? EMPTY_CART);
  const [pending, setPending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const { toast } = useToast();

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      if (!response.ok) return;
      const json = (await response.json()) as { cart?: CartView };
      if (json.cart) setCart(json.cart);
    } catch {
      /* keep the last known cart */
    }
  }, []);

  const post = useCallback(
    async (url: string, body: unknown) => {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await response.json().catch(() => ({}))) as {
        cart?: CartView;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(json.error ?? "Something went wrong");
      }
      if (json.cart) setCart(json.cart);
      return json;
    },
    [],
  );

  const addItem = useCallback(
    async (input: { productId: string; variantId?: string | null; quantity?: number }) => {
      setPending(true);
      try {
        await post("/api/cart/add", {
          productId: input.productId,
          variantId: input.variantId ?? null,
          quantity: input.quantity ?? 1,
        });
        setIsOpen(true);
        return true;
      } catch (error) {
        toast({
          tone: "error",
          title: "Could not add to cart",
          description: error instanceof Error ? error.message : undefined,
        });
        return false;
      } finally {
        setPending(false);
      }
    },
    [post, toast],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      setPendingItemId(itemId);
      try {
        await post("/api/cart/update", { itemId, quantity });
      } catch (error) {
        toast({
          tone: "error",
          title: "Could not update quantity",
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        setPendingItemId(null);
      }
    },
    [post, toast],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      setPendingItemId(itemId);
      try {
        await post("/api/cart/remove", { itemId });
        toast({ tone: "success", title: "Removed from cart" });
      } catch (error) {
        toast({
          tone: "error",
          title: "Could not remove item",
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        setPendingItemId(null);
      }
    },
    [post, toast],
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      try {
        await post("/api/cart/coupon", { code, action: "apply" });
        toast({ tone: "success", title: "Coupon applied" });
      } catch (error) {
        toast({
          tone: "error",
          title: "Coupon not applied",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    },
    [post, toast],
  );

  const removeCoupon = useCallback(async () => {
    try {
      await post("/api/cart/coupon", { action: "remove" });
      toast({ tone: "info", title: "Coupon removed" });
    } catch {
      /* ignore */
    }
  }, [post, toast]);

  // Keep the cart fresh when the customer returns to the tab.
  useEffect(() => {
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      count: cart.totals.itemCount,
      pending,
      isOpen,
      openCart,
      closeCart,
      refresh,
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      removeCoupon,
      pendingItemId,
    }),
    [
      cart,
      pending,
      isOpen,
      openCart,
      closeCart,
      refresh,
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      removeCoupon,
      pendingItemId,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
