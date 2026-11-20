import { describe, expect, it } from "vitest";
import { HttpError } from "../http/errors";
import { getCriterion, loadRubric } from "./rubricStore";

describe("rubricStore", () => {
  it("loads and validates the rubric", async () => {
    const rubric = await loadRubric();
    expect(rubric.criteria).toHaveLength(3);
  });

  it("returns the same rubric object on later calls", async () => {
    expect(await loadRubric()).toBe(await loadRubric());
  });

  it("finds a criterion by id", async () => {
    expect((await getCriterion("H5")).scoring.type).toBe("average");
  });

  it("throws a 404 HttpError for an unknown criterion", async () => {
    const err = await getCriterion("H9").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(404);
  });
});
