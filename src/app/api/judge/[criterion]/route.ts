import { JudgeRequestSchema, parseJson } from "@/server/http/body";
import { toErrorResponse } from "@/server/http/errors";
import { judgeCriterion } from "@/server/services/judge";
import { getCriterion } from "@/server/services/rubricStore";

export const maxDuration = 60;

export async function POST(request: Request, ctx: { params: Promise<{ criterion: string }> }) {
  try {
    const { criterion } = await ctx.params;
    await getCriterion(criterion); // unknown criterion → 404 before the body is read
    const { paragraphs, scan } = await parseJson(request, JudgeRequestSchema);
    return Response.json(await judgeCriterion(criterion, paragraphs, scan));
  } catch (err) {
    return toErrorResponse(err);
  }
}
