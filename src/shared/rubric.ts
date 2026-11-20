import { z } from "zod";

// The rubric is data (rubric/rubric.json): adding a criterion needs no code.

const Levels = z.object({ "0": z.string(), "1": z.string(), "2": z.string() });
const LinkSchema = z.object({ title: z.string().min(1), url: z.url() });

const CheckSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  graded: z.boolean(),
  levels: Levels.optional(),
});

const RedFlagDefSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  phrases: z.array(z.string().min(1)),
});

const RuleSchema = z.object({
  score: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  allOf: z.array(z.string()).optional(),
  anyOf: z.array(z.string()).optional(),
});

const ScoringSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("rules"), rules: z.array(RuleSchema).min(1) }),
  z.object({ type: z.literal("average"), capAt1Unless: z.string().optional() }),
]);

const CriterionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    tier: z.enum(["baseline", "conditional", "leading"]),
    weight: z.number().positive(),
    appliesWhen: z.string().min(1), // "always" or the condition text
    warnOnZero: z.boolean(),
    checks: z.array(CheckSchema).min(1),
    scoring: ScoringSchema,
    levels: Levels,
    phrases: z.array(z.string().min(1)),
    redFlags: z.array(RedFlagDefSchema),
    addressedLooksLike: z.string(),
    whyItMatters: z.string(),
    sources: z.array(LinkSchema),
    resources: z.array(LinkSchema),
  })
  .superRefine((c, ctx) => {
    const ids = new Set(c.checks.map((k) => k.id));
    const unknown = (id: string) =>
      ctx.addIssue({ code: "custom", message: `${c.id}: unknown check id "${id}"` });
    if (c.scoring.type === "rules") {
      for (const rule of c.scoring.rules) {
        for (const id of [...(rule.allOf ?? []), ...(rule.anyOf ?? [])]) {
          if (!ids.has(id)) unknown(id);
        }
      }
    } else {
      if (c.scoring.capAt1Unless && !ids.has(c.scoring.capAt1Unless)) unknown(c.scoring.capAt1Unless);
      if (c.checks.some((k) => !k.graded)) {
        ctx.addIssue({ code: "custom", message: `${c.id}: "average" scoring needs graded checks only` });
      }
    }
    for (const k of c.checks) {
      if (k.graded && !k.levels) {
        ctx.addIssue({ code: "custom", message: `${c.id}.${k.id}: graded checks need levels` });
      }
    }
  });

const BandSchema = z.object({ min: z.number(), max: z.number(), label: z.string().min(1) });

export const RubricSchema = z
  .object({
    version: z.string().min(1),
    bands: z.array(BandSchema).min(1),
    criteria: z.array(CriterionSchema).min(1),
    comingNext: z.array(z.object({ id: z.string(), title: z.string() })),
  })
  .superRefine((r, ctx) => {
    const bands = [...r.bands].sort((a, b) => a.min - b.min);
    let expected = 0;
    for (const b of bands) {
      if (b.min !== expected || b.max < b.min) {
        ctx.addIssue({ code: "custom", message: `bands must cover 0–100 without gaps (at ${b.label})` });
        return;
      }
      expected = b.max + 1;
    }
    if (expected !== 101) ctx.addIssue({ code: "custom", message: "bands must end at 100" });
    const ids = r.criteria.map((c) => c.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "duplicate criterion id" });
  });

export type Rubric = z.infer<typeof RubricSchema>;
export type Criterion = Rubric["criteria"][number];
export type Check = Criterion["checks"][number];
export type RedFlagDef = Criterion["redFlags"][number];
export type Scoring = Criterion["scoring"];
export type Band = Rubric["bands"][number];
export type Link = Criterion["sources"][number];
