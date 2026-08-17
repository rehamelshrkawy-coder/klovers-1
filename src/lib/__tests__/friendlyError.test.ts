import { describe, it, expect, vi, beforeEach } from "vitest";
import { friendlyError } from "../friendlyError";

// The real t() looks the key up in the corpus; here we just echo it so the
// test asserts which message was chosen rather than its wording.
const t = (key: string) => key;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("friendlyError", () => {
  it("maps a Postgres unique-violation to something a student can act on", () => {
    // The user used to be shown:
    //   duplicate key value violates unique constraint "trial_bookings_pkey"
    const r = friendlyError(t, { code: "23505", message: 'duplicate key value violates unique constraint "trial_bookings_pkey"' });
    expect(r.message).toBe("errors.duplicate");
    expect(r.offerWhatsApp).toBe(false);
  });

  it("maps a foreign-key violation", () => {
    expect(friendlyError(t, { code: "23503" }).message).toBe("errors.reference");
  });

  it("maps RLS / permission failures", () => {
    const r = friendlyError(t, { code: "42501" });
    expect(r.message).toBe("errors.permission");
    expect(r.offerWhatsApp).toBe(true);
  });

  it("recognises a dropped connection rather than showing 'Failed to fetch'", () => {
    expect(friendlyError(t, new TypeError("Failed to fetch")).message).toBe("errors.offline");
    expect(friendlyError(t, { message: "NetworkError when attempting to fetch resource." }).message).toBe("errors.offline");
  });

  it("recognises rate limiting", () => {
    expect(friendlyError(t, { status: 429 }).message).toBe("errors.rateLimit");
  });

  it("treats a 5xx as our fault and offers a human", () => {
    const r = friendlyError(t, { status: 503 });
    expect(r.message).toBe("errors.server");
    expect(r.offerWhatsApp).toBe(true);
  });

  it("treats 401/403 as a sign-in problem", () => {
    expect(friendlyError(t, { status: 401 }).message).toBe("errors.auth");
    expect(friendlyError(t, { status: 403 }).message).toBe("errors.auth");
  });

  it("falls back to a generic message, never the raw one", () => {
    const r = friendlyError(t, new Error("column profiles.phone does not exist"));
    expect(r.message).toBe("errors.unknown");
    expect(r.message).not.toContain("profiles.phone");
  });

  it("survives null, undefined and non-error values", () => {
    expect(friendlyError(t, null).message).toBe("errors.unknown");
    expect(friendlyError(t, undefined).message).toBe("errors.unknown");
    expect(friendlyError(t, "just a string").message).toBe("errors.unknown");
  });

  it("still logs the real error for debugging", () => {
    const raw = new Error("the real problem");
    friendlyError(t, raw);
    expect(console.error).toHaveBeenCalledWith("[unknown]", raw);
  });
});
