import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { MapPin } from "lucide-react";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { AddressBook } from "@/components/store/address-book";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Addresses",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, user.id))
    .orderBy(addresses.createdAt);

  return (
    <div>
      <h1 className="flex items-center gap-2 text-lg font-bold text-fg">
        <MapPin className="size-4 text-brand" aria-hidden /> Addresses
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        Saved addresses speed up checkout. They are visible only to you.
      </p>
      <div className="mt-4">
        <AddressBook
          initial={rows.map((row) => ({
            id: row.id,
            label: row.label,
            fullName: row.fullName,
            phone: row.phone,
            line1: row.line1,
            line2: row.line2,
            city: row.city,
            state: row.state,
            postalCode: row.postalCode,
            country: row.country,
            isDefault: row.isDefault,
          }))}
        />
      </div>
    </div>
  );
}
