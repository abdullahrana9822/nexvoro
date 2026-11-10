import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  cartItems,
  carts,
  coupons,
  products,
  productVariants,
  shippingPlans,
} from "@/db/schema";
import { computeTotals, type CartTotals, type CouponLike } from "@/lib/pricing";
import { MAX_CART_QUANTITY } from "@/lib/constants";
import { toNumber } from "@/lib/utils";

export const CART_COOKIE = "nexvoro_cart";
const CART_TTL_DAYS = 30;

export type CartLine = {
  itemId: string;
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  imageUrl: string | null;
  sku: string;
  unitPrice: string;
  quantity: number;
  stock: number;
  variantName: string | null;
  lineTotal: string;
};

export type CartView = {
  id: string | null;
  lines: CartLine[];
  couponCode: string | null;
  couponMessage: string | null;
  totals: CartTotals;
  currency: string;
};

export class CartError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "CartError";
  }
}

async function readCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

async function writeCartToken(token: string) {
  const store = await cookies();
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_TTL_DAYS * 86_400,
  });
}

/** Reads (or lazily creates) the current cart row. */
export async function getOrCreateCart(userId?: string | null) {
  const token = await readCartToken();

  if (token) {
    const existing = await db
      .select()
      .from(carts)
      .where(eq(carts.token, token))
      .limit(1);
    const cart = existing[0];
    if (cart) {
      if (userId && cart.userId !== userId) {
        await db.update(carts).set({ userId }).where(eq(carts.id, cart.id));
        return { ...cart, userId };
      }
      return cart;
    }
  }

  const newToken = randomBytes(24).toString("hex");
  const inserted = await db
    .insert(carts)
    .values({ token: newToken, userId: userId ?? null })
    .returning();
  await writeCartToken(newToken);
  const cart = inserted[0];
  if (!cart) throw new CartError("Could not create a cart");
  return cart;
}

async function findCoupon(code: string | null | undefined) {
  if (!code) return null;
  const rows = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.trim().toUpperCase()))
    .limit(1);
  const coupon = rows[0];
  if (!coupon || !coupon.isActive) return null;
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return null;
  if (coupon.expiresAt && coupon.expiresAt < now) return null;
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return null;
  return coupon;
}

export async function getDefaultShippingPlan() {
  const rows = await db
    .select()
    .from(shippingPlans)
    .where(and(eq(shippingPlans.isActive, true), eq(shippingPlans.isDefault, true)))
    .limit(1);
  if (rows[0]) return rows[0];
  const fallback = await db
    .select()
    .from(shippingPlans)
    .where(eq(shippingPlans.isActive, true))
    .limit(1);
  return fallback[0] ?? null;
}

/** Builds a fully server-verified cart view (prices always from the DB). */
export async function getCartView(options: {
  userId?: string | null;
  shippingPlanId?: string | null;
  createIfMissing?: boolean;
} = {}): Promise<CartView> {
  const token = await readCartToken();
  let cart = null;

  if (token) {
    const rows = await db.select().from(carts).where(eq(carts.token, token)).limit(1);
    cart = rows[0] ?? null;
  }
  if (!cart && options.createIfMissing) {
    cart = await getOrCreateCart(options.userId);
  }
  if (!cart) {
    return {
      id: null,
      lines: [],
      couponCode: null,
      couponMessage: null,
      totals: computeTotals({ lines: [] }),
      currency: "PKR",
    };
  }

  const rows = await db
    .select({
      itemId: cartItems.id,
      quantity: cartItems.quantity,
      variantId: cartItems.variantId,
      productId: products.id,
      slug: products.slug,
      name: products.name,
      images: products.images,
      sku: products.sku,
      price: products.price,
      stock: products.stock,
      status: products.status,
      variantName: productVariants.name,
      variantPriceDelta: productVariants.priceDelta,
      variantStock: productVariants.stock,
      variantActive: productVariants.isActive,
      variantImage: productVariants.imageUrl,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .leftJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .where(eq(cartItems.cartId, cart.id))
    .orderBy(cartItems.createdAt);

  const lines: CartLine[] = rows.map((row) => {
    const base = toNumber(row.price);
    const delta = toNumber(row.variantPriceDelta);
    const unitPrice = base + delta;
    const availableStock =
      row.variantId !== null ? (row.variantStock ?? 0) : row.stock;
    return {
      itemId: row.itemId,
      productId: row.productId,
      variantId: row.variantId,
      slug: row.slug,
      name: row.name,
      imageUrl: row.variantImage ?? row.images[0] ?? null,
      sku: row.sku,
      unitPrice: unitPrice.toFixed(2),
      quantity: row.quantity,
      stock: availableStock,
      variantName: row.variantName,
      lineTotal: (unitPrice * row.quantity).toFixed(2),
    };
  });

  const coupon = await findCoupon(cart.couponCode);
  const couponLike: CouponLike | null = coupon
    ? {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minSubtotal: coupon.minSubtotal,
        maxDiscount: coupon.maxDiscount,
      }
    : null;

  let plan = null;
  if (options.shippingPlanId) {
    const planRows = await db
      .select()
      .from(shippingPlans)
      .where(
        and(eq(shippingPlans.id, options.shippingPlanId), eq(shippingPlans.isActive, true)),
      )
      .limit(1);
    plan = planRows[0] ?? null;
  }
  if (!plan) plan = await getDefaultShippingPlan();

  const totals = computeTotals({
    lines: lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    coupon: couponLike,
    plan,
  });

  return {
    id: cart.id,
    lines,
    couponCode: cart.couponCode,
    couponMessage: cart.couponCode && !coupon ? "Coupon is no longer valid." : null,
    totals,
    currency: "PKR",
  };
}

export async function addToCart(input: {
  productId: string;
  variantId?: string | null;
  quantity: number;
  userId?: string | null;
}) {
  const cart = await getOrCreateCart(input.userId);

  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);
  const product = productRows[0];
  if (!product) throw new CartError("Product not found");
  if (product.status !== "ACTIVE") throw new CartError("This product is unavailable");

  let available = product.stock;
  if (input.variantId) {
    const variantRows = await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.id, input.variantId),
          eq(productVariants.productId, product.id),
          eq(productVariants.isActive, true),
        ),
      )
      .limit(1);
    const variant = variantRows[0];
    if (!variant) throw new CartError("Selected variant is unavailable");
    available = variant.stock;
  }

  if (available < 1) throw new CartError("This item is out of stock");

  const existing = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, input.productId),
        input.variantId
          ? eq(cartItems.variantId, input.variantId)
          : sql`${cartItems.variantId} is null`,
      ),
    )
    .limit(1);

  const requested = Math.min(input.quantity, MAX_CART_QUANTITY, available);
  const current = existing[0];

  if (current) {
    const nextQuantity = Math.min(current.quantity + requested, MAX_CART_QUANTITY, available);
    await db
      .update(cartItems)
      .set({ quantity: nextQuantity })
      .where(eq(cartItems.id, current.id));
  } else {
    await db.insert(cartItems).values({
      cartId: cart.id,
      productId: input.productId,
      variantId: input.variantId ?? null,
      quantity: requested,
    });
  }

  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));
}

export async function updateCartItem(input: {
  itemId: string;
  quantity: number;
  userId?: string | null;
}) {
  const cart = await getOrCreateCart(input.userId);
  const rows = await db
    .select({
      itemId: cartItems.id,
      stock: products.stock,
      variantStock: productVariants.stock,
      variantId: cartItems.variantId,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .leftJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .where(and(eq(cartItems.id, input.itemId), eq(cartItems.cartId, cart.id)))
    .limit(1);

  const item = rows[0];
  if (!item) throw new CartError("Cart item not found");

  if (input.quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, item.itemId));
    return;
  }

  const available = item.variantId ? (item.variantStock ?? 0) : item.stock;
  const quantity = Math.min(input.quantity, MAX_CART_QUANTITY, Math.max(1, available));
  if (available < 1) throw new CartError("This item is out of stock");

  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, item.itemId));
}

export async function removeCartItem(itemId: string, userId?: string | null) {
  const cart = await getOrCreateCart(userId);
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
}

export async function applyCoupon(code: string, userId?: string | null) {
  const cart = await getOrCreateCart(userId);
  const normalized = code.trim().toUpperCase();
  const coupon = await findCoupon(normalized);
  if (!coupon) throw new CartError("That coupon code is not valid");
  await db.update(carts).set({ couponCode: coupon.code }).where(eq(carts.id, cart.id));
  return coupon.code;
}

export async function removeCoupon(userId?: string | null) {
  const cart = await getOrCreateCart(userId);
  await db.update(carts).set({ couponCode: null }).where(eq(carts.id, cart.id));
}

export async function clearCart(cartId: string) {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await db.update(carts).set({ couponCode: null }).where(eq(carts.id, cartId));
}

/** Merges the guest cart into the user's cart after sign-in. */
export async function mergeGuestCart(userId: string) {
  const token = await readCartToken();
  if (!token) return;

  const guestRows = await db.select().from(carts).where(eq(carts.token, token)).limit(1);
  const guestCart = guestRows[0];
  if (!guestCart) return;

  if (guestCart.userId === userId) return;

  const userCarts = await db
    .select()
    .from(carts)
    .where(and(eq(carts.userId, userId), sql`${carts.id} <> ${guestCart.id}`))
    .limit(1);
  const userCart = userCarts[0];

  if (!userCart) {
    await db.update(carts).set({ userId }).where(eq(carts.id, guestCart.id));
    return;
  }

  const guestItems = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, guestCart.id));

  for (const item of guestItems) {
    const existing = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, userCart.id),
          eq(cartItems.productId, item.productId),
          item.variantId
            ? eq(cartItems.variantId, item.variantId)
            : sql`${cartItems.variantId} is null`,
        ),
      )
      .limit(1);
    if (existing[0]) {
      await db
        .update(cartItems)
        .set({
          quantity: Math.min(
            MAX_CART_QUANTITY,
            existing[0].quantity + item.quantity,
          ),
        })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({
        cartId: userCart.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      });
    }
  }

  await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
  await db.delete(carts).where(eq(carts.id, guestCart.id));
  await writeCartToken(userCart.token);
}

/** Number of units in the cart, used by the header badge. */
export async function getCartCount(): Promise<number> {
  const token = await readCartToken();
  if (!token) return 0;
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${cartItems.quantity}), 0)::int` })
    .from(cartItems)
    .innerJoin(carts, eq(carts.id, cartItems.cartId))
    .where(eq(carts.token, token));
  return rows[0]?.total ?? 0;
}

export async function removeItemsByIds(itemIds: string[]) {
  if (itemIds.length === 0) return;
  await db.delete(cartItems).where(inArray(cartItems.id, itemIds));
}
