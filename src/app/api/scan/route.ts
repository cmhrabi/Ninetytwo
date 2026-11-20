import { ScanRequestSchema, parseJson } from "@/server/http/body";
import { toErrorResponse } from "@/server/http/errors";
import { scanDocument } from "@/server/services/scan";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { paragraphs } = await parseJson(request, ScanRequestSchema);
    return Response.json(await scanDocument(paragraphs));
  } catch (err) {
    return toErrorResponse(err);
  }
}
