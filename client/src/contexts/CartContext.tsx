/* Concrete Editorial: estado de carrinho persistido localmente e preparado para submissão e validação no servidor. */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/storeData";

export type CartLine = { product: Product; quantity: number; size: string };

type CartContextValue = {
  lines: CartLine[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, size?: string) => void;
  removeFromCart: (slug: string, size: string) => void;
  updateQuantity: (slug: string, size: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("illusion-cart-lines");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("illusion-cart-lines", JSON.stringify(lines));
    } catch (e) {
      console.warn("Failed to persist cart:", e);
    }
  }, [lines]);

  const addToCart = (product: Product, size = product.sizes[0] || "M") => {
    setLines((current) => {
      const index = current.findIndex((line) => line.product.slug === product.slug && line.size === size);
      if (index === -1) return [...current, { product, size, quantity: 1 }];
      return current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, quantity: line.quantity + 1 } : line
      );
    });
    setCartOpen(true);
  };

  const removeFromCart = (slug: string, size: string) => {
    setLines((current) => current.filter((line) => !(line.product.slug === slug && line.size === size)));
  };

  const updateQuantity = (slug: string, size: string, delta: number) => {
    setLines((current) =>
      current.flatMap((line) => {
        if (line.product.slug !== slug || line.size !== size) return [line];
        const quantity = line.quantity + delta;
        return quantity > 0 ? [{ ...line, quantity }] : [];
      })
    );
  };

  const clearCart = () => {
    setLines([]);
    try {
      localStorage.removeItem("illusion-cart-lines");
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({
      lines,
      cartOpen,
      setCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: lines.reduce(
        (sum, line) => sum + (line.product.promoPrice ?? line.product.price) * line.quantity,
        0
      ),
    }),
    [lines, cartOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
