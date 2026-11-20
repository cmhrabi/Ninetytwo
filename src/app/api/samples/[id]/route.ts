import { toErrorResponse } from "@/server/http/errors";
import { getSample } from "@/server/services/samples";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    return Response.json(await getSample(id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
