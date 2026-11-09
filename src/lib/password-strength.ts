/**
 * Password strength heuristic — pure, dependency-free, and safe to import from
 * client components (unlike `@/lib/auth`, which is server-only).
 */
export function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  let score = 0;
  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Excellent"] as const;
  return { score: clamped, label: labels[clamped] ?? "Weak" };
}
