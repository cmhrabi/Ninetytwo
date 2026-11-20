import { toErrorResponse } from "@/server/http/errors";
import { loadRubric } from "@/server/services/rubricStore";

export async function GET() {
  try {
    return Response.json(await loadRubric());
  } catch (err) {
    return toErrorResponse(err);
  }
}
