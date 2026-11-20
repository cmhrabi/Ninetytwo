import { describe, expect, it } from "vitest";
import rubricJson from "../../../rubric/rubric.json";
import { RubricSchema } from "@/shared";
import { DOCUMENT_AS_DATA } from "./policyText";
import { buildJudgePrompt } from "./prompt";

const rubric = RubricSchema.parse(rubricJson);
const paragraphs = [
  { id: "p1", text: "We are an equal opportunity employer." },
  { id: "p2", text: "We offer mentoring." },
];

describe("buildJudgePrompt", () => {
  for (const criterion of rubric.criteria) {
    it(`${criterion.id}: has the data sentence, every check id and the paragraphs`, () => {
      const { system, user } = buildJudgePrompt(criterion, paragraphs);
      expect(system).toContain(DOCUMENT_AS_DATA);
      expect(system).toContain(criterion.title);
      expect(system).toContain(criterion.appliesWhen);
      for (const k of criterion.checks) expect(system).toContain(`- ${k.id}`);
      for (const f of criterion.redFlags) expect(system).toContain(`- ${f.id}: ${f.label}`);
      expect(user).toContain("[p1] We are an equal opportunity employer.");
      expect(user).toContain("[p2] We offer mentoring.");
    });
  }

  it("shows graded level text", () => {
    const h5 = rubric.criteria.find((c) => c.scoring.type === "average")!;
    const { system } = buildJudgePrompt(h5, paragraphs);
    expect(system).toContain(`level 2: ${h5.checks[0].levels!["2"]}`);
  });

  it("lists the scan candidates as likely passages", () => {
    const h1 = rubric.criteria[0];
    const { user } = buildJudgePrompt(h1, paragraphs, {
      criterion: "H1",
      candidates: [{ paragraphId: "p1", source: "ai", label: "Equal opportunity statement" }],
      redFlags: [],
    });
    expect(user).toContain("read the whole policy anyway");
    expect(user).toContain("- p1: Equal opportunity statement");
  });
});
