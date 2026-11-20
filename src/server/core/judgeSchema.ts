import { z } from "zod";

const EvidenceList = z.array(z.object({ quote: z.string(), paragraphId: z.string() }));

/** What the judge model returns for any criterion: findings with quotes, never scores. */
export const JudgeSchema = z.object({
  applicable: z.object({ value: z.boolean(), evidence: EvidenceList }),
  checks: z.array(
    z.object({
      id: z.string(),
      met: z.boolean(),
      level: z.union([z.literal(0), z.literal(1), z.literal(2)]),
      evidence: EvidenceList,
    }),
  ),
  redFlags: z.array(z.object({ id: z.string(), evidence: EvidenceList })),
  reasoning: z.string(), // 1–2 sentences describing what was found; never advice
});

export type JudgeReply = z.infer<typeof JudgeSchema>;
