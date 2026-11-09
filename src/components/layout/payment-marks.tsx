/**
 * Text-based payment marks (no third-party logo assets, no tracking pixels).
 */
export function PaymentMarks() {
  const methods = ["COD", "VISA", "Mastercard", "Bank", "Wallet"];
  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Accepted payment methods">
      {methods.map((method) => (
        <li
          key={method}
          className="rounded-md border border-border bg-bg-elevated px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-fg-muted"
        >
          {method}
        </li>
      ))}
    </ul>
  );
}
