"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

export function MessageActions({
  messageId,
  isRead,
}: {
  messageId: string;
  isRead: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function run(method: "PATCH" | "DELETE") {
    setBusy(true);
    try {
      const response = await fetch(
        method === "DELETE" ? `/api/admin/messages?id=${messageId}` : "/api/admin/messages",
        method === "DELETE"
          ? { method }
          : {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: messageId, isRead: !isRead }),
            },
      );
      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? "Action failed");
      }
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Action failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void run("PATCH")}
        className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2 text-[9px] font-bold text-fg-muted transition hover:border-brand hover:text-brand disabled:opacity-50"
      >
        {isRead ? (
          <Mail className="size-3" aria-hidden />
        ) : (
          <MailOpen className="size-3" aria-hidden />
        )}
        {isRead ? "Mark unread" : "Mark read"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (window.confirm("Delete this message permanently?")) void run("DELETE");
        }}
        className="grid size-7 place-items-center rounded-md text-fg-subtle hover:bg-danger/10 hover:text-danger disabled:opacity-50"
        aria-label="Delete message"
      >
        <Trash2 className="size-3" aria-hidden />
      </button>
    </div>
  );
}
