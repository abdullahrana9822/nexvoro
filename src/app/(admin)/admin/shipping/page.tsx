import { asc } from "drizzle-orm";
import { db } from "@/db";
import { shippingPlans } from "@/db/schema";
import { ShippingPlanEditor } from "@/components/admin/shipping-plan-editor";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const plans = await db
    .select()
    .from(shippingPlans)
    .orderBy(asc(shippingPlans.position));

  const active = plans.filter((plan) => plan.isActive);

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Shipping plans</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Each plan sets both the delivery price and the cadence of the automated order lifecycle
        (how many hours pass between stages).
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-fg">{plan.name}</h2>
                    {plan.isDefault ? (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[9px] font-bold uppercase text-brand">
                        Default
                      </span>
                    ) : null}
                    {!plan.isActive ? (
                      <span className="rounded-full bg-bg-muted px-2 py-0.5 text-[9px] font-bold uppercase text-fg-subtle">
                        Disabled
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[11px] text-fg-muted">{plan.description}</p>
                </div>
                <p className="text-sm font-black text-fg">{formatMoney(plan.price)}</p>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[11px] sm:grid-cols-4">
                <div>
                  <dt className="text-fg-subtle">Delivery window</dt>
                  <dd className="font-semibold text-fg">
                    {plan.minDays}–{plan.maxDays} days
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Free over</dt>
                  <dd className="font-semibold text-fg">
                    {plan.freeOver ? formatMoney(plan.freeOver) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Stage interval</dt>
                  <dd className="font-semibold text-fg">{plan.stageIntervalHours}h</dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Position</dt>
                  <dd className="font-semibold text-fg">{plan.position}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <ShippingPlanEditor plans={active.map((plan) => ({ id: plan.id, name: plan.name }))} />

        <div className="panel p-5 lg:col-start-2">
          <h2 className="text-sm font-bold text-fg">How automation uses these plans</h2>
          <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-fg-muted">
            <li>
              The worker advances every in-flight order one stage per{" "}
              <strong className="text-fg">stage interval</strong>.
            </li>
            <li>
              The final step — <strong className="text-fg">Delivered (100%)</strong> — is never
              automatic. It requires customer confirmation or an admin override.
            </li>
            <li>
              If a customer does not confirm within 3 days of the expected date, admins are
              alerted so the case can be resolved manually.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
