import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Analytics module tests — verifies event shape, no-op behaviour when key
 * is missing, and that fetch is called with the correct endpoint/body.
 *
 * We test the pure behaviour by mocking global fetch and import.meta.env.
 */

// Mock fetch globally before module import
const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
vi.stubGlobal("fetch", fetchMock);

// Provide a crypto.randomUUID stub (not available in jsdom)
vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-1234",
});

// Stub localStorage
const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

describe("analytics — no-op when VITE_POSTHOG_KEY is unset", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockClear();
    // Ensure env key is unset
    vi.stubEnv("VITE_POSTHOG_KEY", "");
  });

  it("capture() does not call fetch when key is missing", async () => {
    const { capture } = await import("../analytics");
    capture({ event: "pwa_installed" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("identify() does not call fetch when key is missing", async () => {
    const { identify } = await import("../analytics");
    identify("user_123", { email: "test@example.com" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("analytics — fires events when VITE_POSTHOG_KEY is set", () => {
  const KEY = "phc_testkey";

  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockClear();
    vi.stubEnv("VITE_POSTHOG_KEY", KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("capture() calls fetch once", async () => {
    const { capture } = await import("../analytics");
    capture({ event: "pwa_installed" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("capture() posts to the /capture/ endpoint", async () => {
    const { capture } = await import("../analytics");
    capture({ event: "pwa_installed" });
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/capture\/$/);
  });

  it("capture() includes api_key in body", async () => {
    const { capture } = await import("../analytics");
    capture({ event: "pwa_installed" });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.api_key).toBe(KEY);
  });

  it("capture() includes event name in body", async () => {
    const { capture } = await import("../analytics");
    capture({ event: "pwa_installed" });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.event).toBe("pwa_installed");
  });

  it("capture() includes custom properties", async () => {
    const { capture } = await import("../analytics");
    capture({ event: "game_played", gameId: "flashcard", score: 8, totalRounds: 10, xpEarned: 40 });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.properties.gameId).toBe("flashcard");
    expect(body.properties.score).toBe(8);
    expect(body.properties.xpEarned).toBe(40);
  });

  it("capture() includes distinct_id", async () => {
    const { capture } = await import("../analytics");
    capture({ event: "pwa_installed" });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(typeof body.distinct_id).toBe("string");
    expect(body.distinct_id.length).toBeGreaterThan(0);
  });

  it("capture() includes a timestamp", async () => {
    const { capture } = await import("../analytics");
    capture({ event: "pwa_installed" });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("uses keepalive so events survive page unload", async () => {
    const { capture } = await import("../analytics");
    capture({ event: "pwa_installed" });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init as any).keepalive).toBe(true);
  });

  it("trackPageView() sends page_viewed event with path", async () => {
    const { trackPageView } = await import("../analytics");
    trackPageView("/dashboard", "Dashboard");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.event).toBe("page_viewed");
    expect(body.properties.path).toBe("/dashboard");
    expect(body.properties.title).toBe("Dashboard");
  });
});
