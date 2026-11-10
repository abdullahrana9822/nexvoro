import type { Metadata } from "next";
import { TrackOrderClient } from "@/components/store/track-order-client";

export const metadata: Metadata = {
  title: "Track your order",
  description:
    "Track any NEXVORO order by order number or tracking code and see live progress from placement to delivery.",
  alternates: { canonical: "/track" },
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-black tracking-tight text-fg sm:text-3xl">
          Track your order
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Enter your order number (for example NX-2026-10041) or the tracking code we emailed
          you.
        </p>
        <div className="mt-6">
          <TrackOrderClient initialReference={order ?? ""} />
        </div>
      </div>
    </div>
  );
}
