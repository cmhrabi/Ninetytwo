import { describe, expect, it } from "vitest";
import { RubricSchema } from "@/shared";
import { GET } from "./route";

describe("GET /api/rubric", () => {
  it("returns the validated rubric", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(RubricSchema.safeParse(body).success).toBe(true);
    expect(body.criteria.map((c: { id: string }) => c.id)).toEqual(["H1", "H3", "H5"]);
  });
});
