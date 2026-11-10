import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ user: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.user }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { requirePageUser } from "@/lib/page-auth";

describe("account page authorization", () => {
  beforeEach(() => vi.resetAllMocks());
  it("redirects guests instead of throwing an API AuthorizationError during render", async () => {
    mocks.user.mockResolvedValue(null);
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
    await expect(requirePageUser()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/login?next=/account");
  });
  it("returns the authenticated user without a redirect", async () => {
    const user = { id: "customer-id", role: "CUSTOMER" };
    mocks.user.mockResolvedValue(user);
    await expect(requirePageUser()).resolves.toEqual(user);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
