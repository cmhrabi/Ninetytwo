import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, isAbort, realApi } from "./api";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("api client", () => {
  it("parses a success body", async () => {
    const samples = [{ id: "weak", title: "T", summary: "S" }];
    const fetchMock = vi.fn(async () => json(samples));
    vi.stubGlobal("fetch", fetchMock);
    await expect(realApi.listSamples()).resolves.toEqual(samples);
    expect(fetchMock).toHaveBeenCalledWith("/api/samples", undefined);
  });

  it("turns an ApiError body into ApiClientError with status and code", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ error: { code: "no_text", message: "No text" } }, 422)));
    const err = await realApi.extract(new File(["x"], "a.txt")).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err).toMatchObject({ status: 422, code: "no_text", message: "No text" });
  });

  it("maps a non-JSON 413 to too_large", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Payload Too Large", { status: 413 })));
    await expect(realApi.extract(new File(["x"], "a.txt"))).rejects.toMatchObject({ code: "too_large" });
  });

  it("maps a network failure to internal", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    await expect(realApi.getSample("weak")).rejects.toMatchObject({ status: 0, code: "internal" });
  });

  it("marks a network failure as network", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    await expect(realApi.scan([])).rejects.toMatchObject({ code: "internal", network: true });
  });

  it("passes a signal to judge and posts the body", async () => {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) => json({ criterion: "H1" }));
    vi.stubGlobal("fetch", fetchMock);
    await realApi.judge("H1", { paragraphs: [] }, new AbortController().signal);
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/judge/H1");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(init?.body))).toEqual({ paragraphs: [] });
  });

  it("rethrows a deliberate abort so callers can ignore it", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_path: string, init?: RequestInit) =>
          new Promise((_resolve, reject) =>
            init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))),
          ),
      ),
    );
    const pending = realApi.judge("H1", { paragraphs: [] }, controller.signal).catch((e: unknown) => e);
    controller.abort();
    const err = await pending;
    expect(isAbort(err)).toBe(true);
    expect(err).not.toBeInstanceOf(ApiClientError);
  });

  it("maps a timeout to a network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new DOMException("Timed out", "TimeoutError"))));
    await expect(realApi.judge("H1", { paragraphs: [] })).rejects.toMatchObject({
      network: true,
      message: "Request timed out",
    });
  });
});
