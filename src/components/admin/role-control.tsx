"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

const ROLES = ["CUSTOMER", "STAFF", "ADMIN", "SUPER_ADMIN"] as const;

const TONES: Record<string, string> = {
  CUSTOMER: "bg-bg-muted text-fg-muted",
  STAFF: "bg-accent-soft text-accent",
  ADMIN: "bg-brand-soft text-brand",
  SUPER_ADMIN: "bg-success/10 text-success",
};

export function RoleControl({
  userId,
  role,
  isActive,
  canManage,
  isSelf,
}: {
  userId: string;
  role: string;
  isActive: boolean;
  canManage: boolean;
  isSelf: boolean;
}) {
  const [value, setValue] = useState(role);
  const [active, setActive] = useState(isActive);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function update(next: { role?: string; isActive?: boolean }) {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...next }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not update the user");
      if (next.role) setValue(next.role);
      if (next.isActive !== undefined) setActive(next.isActive);
      toast({ tone: "success", title: "User updated" });
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Update failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
          TONES[value] ?? "bg-bg-muted text-fg-muted"
        }`}
      >
        {value.replace("_", " ")}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={value}
        disabled={saving || isSelf}
        onChange={(event) => void update({ role: event.target.value })}
        aria-label="User role"
        className="h-7 rounded-lg border border-border bg-bg-elevated px-1.5 text-[10px] font-bold text-fg focus:border-brand focus:outline-none disabled:opacity-50"
      >
        {ROLES.map((item) => (
          <option key={item} value={item}>
            {item.replace("_", " ")}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={saving || isSelf}
        onClick={() => void update({ isActive: !active })}
        title={active ? "Deactivate account" : "Reactivate account"}
        className={`grid size-7 place-items-center rounded-md disabled:opacity-40 ${
          active ? "text-success hover:bg-danger/10 hover:text-danger" : "text-danger"
        }`}
        aria-label={active ? "Deactivate account" : "Reactivate account"}
      >
        <ShieldCheck className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
