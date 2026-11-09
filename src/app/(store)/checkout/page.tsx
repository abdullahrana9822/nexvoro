import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, shippingPlans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { env, hasEnv } from "@/lib/env";
import { CheckoutForm } from "@/components/store/checkout-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout with cash on delivery, card or bank transfer.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  const [plans, savedAddresses] = await Promise.all([
    db
      .select()
      .from(shippingPlans)
      .where(eq(shippingPlans.isActive, true))
      .orderBy(shippingPlans.position),
    user
      ? db
          .select()
          .from(addresses)
          .where(eq(addresses.userId, user.id))
          .orderBy(desc(addresses.isDefault))
      : Promise.resolve([]),
  ]);

  const onlinePaymentsEnabled = hasEnv("PAYMENT_GATEWAY_PROVIDER", "PAYMENT_GATEWAY_SECRET");

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-black tracking-tight text-fg sm:text-3xl">Checkout</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Complete your details below. {env.isProduction ? "All traffic is encrypted." : ""}
      </p>
      <div className="mt-6">
        <CheckoutForm
          plans={plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            freeOver: plan.freeOver,
            minDays: plan.minDays,
            maxDays: plan.maxDays,
          }))}
          savedAddresses={savedAddresses.map((address) => ({
            id: address.id,
            label: address.label,
            isDefault: address.isDefault,
            fullName: address.fullName,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          }))}
          user={
            user
              ? {
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  phone: user.phone,
                }
              : null
          }
          onlinePaymentsEnabled={onlinePaymentsEnabled}
        />
      </div>
    </div>
  );
}
