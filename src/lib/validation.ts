import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(5, "Email is too short")
  .max(255, "Email is too long")
  .email("Enter a valid email address")
  .transform((v) => v.toLowerCase());

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name").max(80),
  lastName: z.string().trim().max(80).optional().default(""),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[0-9+\-() ]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  password: passwordSchema,
  marketingOptIn: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(128),
  redirectTo: z.string().max(300).optional(),
});

export const addressSchema = z.object({
  label: z.string().trim().max(60).optional().default("Home"),
  fullName: z.string().trim().min(2, "Full name is required").max(160),
  phone: z
    .string()
    .trim()
    .min(7, "Phone is required")
    .max(40)
    .regex(/^[0-9+\-() ]+$/, "Invalid phone number"),
  line1: z.string().trim().min(4, "Street address is required").max(255),
  line2: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(120),
  state: z.string().trim().min(2, "State/province is required").max(120),
  postalCode: z
    .string()
    .trim()
    .min(3, "Postal code is required")
    .max(24)
    .regex(/^[A-Za-z0-9\- ]+$/, "Invalid postal code"),
  country: z.string().trim().min(2).max(80).default("Pakistan"),
  isDefault: z.boolean().optional().default(false),
});

export const checkoutSchema = z.object({
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .min(7, "Phone is required")
    .max(40)
    .regex(/^[0-9+\-() ]+$/, "Invalid phone number"),
  fullName: z.string().trim().min(2, "Full name is required").max(160),
  line1: z.string().trim().min(4, "Street address is required").max(255),
  line2: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(120),
  state: z.string().trim().min(2, "State/province is required").max(120),
  postalCode: z
    .string()
    .trim()
    .min(3, "Postal code is required")
    .max(24)
    .regex(/^[A-Za-z0-9\- ]+$/, "Invalid postal code"),
  country: z.string().trim().min(2).max(80).default("Pakistan"),
  paymentMethod: z.enum(["COD", "CARD", "WALLET", "BANK_TRANSFER"]).default("COD"),
  shippingPlanId: z.string().uuid().optional().or(z.literal("")),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  saveAddress: z.boolean().optional().default(false),
});

export const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  authorName: z.string().trim().min(2).max(120).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(160),
  email: emailSchema,
  subject: z.string().trim().min(3, "Add a subject").max(200),
  message: z.string().trim().min(10, "Tell us a little more").max(4000),
});

export const newsletterSchema = z.object({
  email: emailSchema,
});

export const cartAddSchema = z.object({
  productId: z.string().uuid("Invalid product"),
  variantId: z.string().uuid().optional().nullable(),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

export const cartUpdateSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(10),
});

export const productQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  brand: z.string().trim().max(120).optional(),
  min: z.coerce.number().nonnegative().optional(),
  max: z.coerce.number().nonnegative().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  sort: z
    .enum(["newest", "price-asc", "price-desc", "top-rated", "best-selling"])
    .optional(),
  deals: z
    .union([z.literal("true"), z.literal("false")])
    .optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  inStock: z.union([z.literal("true"), z.literal("false")]).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddressInput = z.infer<typeof addressSchema>;

/** Flattens a ZodError into a field -> message map for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32, "This reset link is invalid").max(200),
  password: passwordSchema,
});
