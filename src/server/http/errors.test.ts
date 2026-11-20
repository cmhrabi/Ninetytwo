import { describe, expect, it, vi } from "vitest";
import { HttpError, notFound, toErrorResponse } from "./errors";

describe("toErrorResponse", () => {
  it("maps an HttpError to its status and ApiError body", async () => {
    const res = toErrorResponse(new HttpError(413, "too_large", "File is over 4 MB"));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: { code: "too_large", message: "File is over 4 MB" } });
  });

  it("builds a 404 with notFound()", async () => {
    const res = toErrorResponse(notFound("Criterion H9"));
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("not_found");
  });

  it("hides unknown errors behind a 500 internal", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = toErrorResponse(new Error("secret stack detail"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("internal");
    expect(JSON.stringify(body)).not.toContain("secret");
    spy.mockRestore();
  });
});
