import { getCurrentUser } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { getCategoryTree } from "@/lib/catalog";
import { CartProvider } from "@/components/providers/cart-provider";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DeliveryConfirmationGate } from "@/components/store/delivery-confirmation-gate";
import { getPendingConfirmationOrder } from "@/lib/delivery";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const [cart, categories, pendingConfirmation] = await Promise.all([
    getCartView({ userId: user?.id ?? null }),
    getCategoryTree(),
    user ? getPendingConfirmationOrder(user.id) : Promise.resolve(null),
  ]);

  return (
    <CartProvider initialCart={cart}>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader user={user} categories={categories} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
      <CartDrawer />
      {user && pendingConfirmation ? (
        <DeliveryConfirmationGate
          order={{
            id: pendingConfirmation.id,
            orderNumber: pendingConfirmation.orderNumber,
            expectedDeliveryAt: pendingConfirmation.expectedDeliveryAt?.toISOString() ?? null,
          }}
        />
      ) : null}
    </CartProvider>
  );
}
