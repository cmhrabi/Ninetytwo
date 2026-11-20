import { z } from "zod";
import { stripPii } from "../core/pii";
import { badRequest } from "./errors";

const EvidenceSchema = z.object({ quote: z.string(), paragraphId: z.string(), verified: z.boolean() });

export const ParagraphsSchema = z
  .array(z.object({ id: z.string().regex(/^p\d+$/), text: z.string().max(5000) }))
  .min(1)
  .max(2000)
  // Hard rule 4: strip emails and phones before anything reaches the AI, whoever sent the text.
  .transform((ps) => ps.map((p) => ({ id: p.id, text: stripPii(p.text) })));

export const ScanResultSchema = z.object({
  aiScanned: z.boolean(),
  criteria: z.array(
    z.object({
      criterion: z.string(),
      candidates: z.array(
        z.object({ paragraphId: z.string(), source: z.enum(["keyword", "ai"]), label: z.string() }),
      ),
      redFlags: z.array(z.object({ id: z.string(), label: z.string(), evidence: z.array(EvidenceSchema) })),
    }),
  ),
});

export const ScanRequestSchema = z.object({ paragraphs: ParagraphsSchema });
export const JudgeRequestSchema = z.object({ paragraphs: ParagraphsSchema, scan: ScanResultSchema.optional() });

/** Parses a JSON body with zod; anything invalid is a 400 bad_request. */
export async function parseJson<T extends z.ZodType>(request: Request, schema: T): Promise<z.output<T>> {
  const raw = await request.json().catch(() => {
    throw badRequest("Expected a JSON body");
  });
  const result = schema.safeParse(raw);
  if (!result.success) throw badRequest(z.prettifyError(result.error));
  return result.data;
}
