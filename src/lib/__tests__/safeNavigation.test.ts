import { describe, expect, it } from "vitest";
import { safeHttpsUrl, safeInternalPath } from "../safeNavigation";

describe("safe navigation", () => {
  it("allows local paths and rejects external or protocol-relative redirects", () => {
    expect(safeInternalPath("/dashboard?tab=1")).toBe("/dashboard?tab=1");
    expect(safeInternalPath("//evil.example/path")).toBe("/dashboard");
    expect(safeInternalPath("https://evil.example/path")).toBe("/dashboard");
    expect(safeInternalPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("allows only https external links", () => {
    expect(safeHttpsUrl("https://example.com/room")).toBe("https://example.com/room");
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("http://example.com")).toBeNull();
  });
});
