import { afterEach, describe, expect, it, vi } from "vitest";

// connection() needs a live Next request; outside Next it is a no-op for this test.
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

const { GET } = await import("./route");

afterEach(() => vi.unstubAllEnvs());

describe("GET /api/health", () => {
  it("reports the models and that the key is loaded, never the key itself", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-very-secret");
    vi.stubEnv("JUDGE_MODEL", "");
    vi.stubEnv("SCAN_MODEL", "");
    const res = await GET();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain("sk-or-very-secret");
    expect(JSON.parse(text)).toEqual({
      ok: true,
      judgeModel: "anthropic/claude-sonnet-5.5",
      scanModel: "anthropic/claude-haiku-5.5",
      keyLoaded: true,
    });
  });

  it("reports keyLoaded false when the key is empty", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "  ");
    const body = await (await GET()).json();
    expect(body.keyLoaded).toBe(false);
  });

  it("uses model overrides from the environment", async () => {
    vi.stubEnv("JUDGE_MODEL", "anthropic/claude-opus-5.5");
    const body = await (await GET()).json();
    expect(body.judgeModel).toBe("anthropic/claude-opus-5.5");
  });
});
