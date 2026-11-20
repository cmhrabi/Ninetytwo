import { describe, expect, it } from "vitest";
import type { ApiError, DocumentText } from "@/shared";
import { GET } from "./route";

const get = (id: string) =>
  GET(new Request(`http://localhost/api/samples/${id}`), { params: Promise.resolve({ id }) });

describe("GET /api/samples/[id]", () => {
  it("returns a sample as DocumentText", async () => {
    const res = await get("partial");
    expect(res.status).toBe(200);
    const body = (await res.json()) as DocumentText;
    expect(body.fileName).toBe("partial.txt");
    expect(body.paragraphs[0].id).toBe("p1");
    expect(body.paragraphs.length).toBeGreaterThanOrEqual(6);
  });

  it("returns a 404 ApiError for an unknown sample", async () => {
    const res = await get("nope");
    expect(res.status).toBe(404);
    const body = (await res.json()) as ApiError;
    expect(body.error.code).toBe("not_found");
  });
});
