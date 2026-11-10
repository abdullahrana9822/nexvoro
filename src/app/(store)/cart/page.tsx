import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = {
  title: "Shopping cart",
  description: "Review the items in your NEXVORO cart before checkout.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-black tracking-tight text-fg sm:text-3xl">Your cart</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Quantities and prices are validated again when you place the order.
      </p>
      <div className="mt-6">
        <CartView />
      </div>
    </div>
  );
}
