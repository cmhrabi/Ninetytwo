import { z } from "zod";

/** What the scan model returns: evidence locations only, never scores. */
export const ScanSchema = z.object({
  criteria: z.array(
    z.object({
      criterion: z.string(),
      hits: z.array(z.object({ paragraphId: z.string(), label: z.string() })), // label ≤ 8 words
      redFlags: z.array(z.object({ id: z.string(), quote: z.string(), paragraphId: z.string() })),
    }),
  ),
});

export type ScanReply = z.infer<typeof ScanSchema>;
