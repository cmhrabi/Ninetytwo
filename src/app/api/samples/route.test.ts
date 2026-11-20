import { describe, expect, it } from "vitest";
import type { Sample } from "@/shared";
import { GET } from "./route";

describe("GET /api/samples", () => {
  it("lists the three samples", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Sample[];
    expect(body).toHaveLength(3);
    for (const s of body) {
      expect(s.title).toBeTruthy();
      expect(s.summary).toBeTruthy();
    }
  });
});
