import { badRequest, toErrorResponse } from "@/server/http/errors";
import { extractDocument } from "@/server/services/extractText";

// The upload is read into memory with formData() and discarded after the response.
export async function POST(request: Request) {
  try {
    const form = await request.formData().catch(() => {
      throw badRequest("Expected a multipart form with a file field");
    });
    const file = form.get("file");
    if (!(file instanceof File)) throw badRequest("Missing file");
    return Response.json(await extractDocument(file));
  } catch (err) {
    return toErrorResponse(err);
  }
}
