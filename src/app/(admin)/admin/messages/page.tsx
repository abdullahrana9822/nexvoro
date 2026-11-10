import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { MessageActions } from "@/components/admin/message-actions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(100);

  const unread = rows.filter((row) => !row.isRead).length;

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Messages</h1>
      <p className="mt-1 text-xs text-fg-muted">
        {rows.length} contact submissions · {unread} unread
      </p>

      <ul className="mt-5 space-y-2">
        {rows.length === 0 ? (
          <li className="panel p-8 text-center text-xs text-fg-subtle">
            No messages yet.
          </li>
        ) : (
          rows.map((message) => (
            <li
              key={message.id}
              className={`panel p-4 ${message.isRead ? "" : "border-brand/40"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-fg">
                    {message.subject ?? "No subject"}
                    {message.isRead ? null : (
                      <span className="ml-2 rounded-full bg-brand px-1.5 py-0.5 text-[8px] font-black uppercase text-brand-fg">
                        new
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[10px] text-fg-subtle">
                    {message.name} · {message.email} ·{" "}
                    {formatDateTime(message.createdAt)}
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-[11px] leading-relaxed text-fg-muted">
                    {message.message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <MessageActions messageId={message.id} isRead={message.isRead} />
                  <a
                    href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(
                      message.subject ?? "Your message to NEXVORO",
                    )}`}
                    className="text-[10px] font-semibold text-brand hover:underline"
                  >
                    Reply by email
                  </a>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
