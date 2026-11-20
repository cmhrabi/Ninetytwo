import { toErrorResponse } from "@/server/http/errors";
import { listSamples } from "@/server/services/samples";

export async function GET() {
  try {
    return Response.json(await listSamples());
  } catch (err) {
    return toErrorResponse(err);
  }
}
