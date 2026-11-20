import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, realApi } from "./api";

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
});
