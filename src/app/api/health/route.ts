import { connection } from "next/server";
import type { Health } from "@/shared";
import { getConfig } from "@/server/config";
import { toErrorResponse } from "@/server/http/errors";

export async function GET() {
  // Run per request (not prerendered at build) so keyLoaded is live. Keep it outside the
  // try/catch: Next signals prerendering through this promise and it must not be caught.
  await connection();
  try {
    const { apiKey, judgeModel, scanModel } = getConfig();
    const body: Health = { ok: true, judgeModel, scanModel, keyLoaded: Boolean(apiKey) };
    return Response.json(body);
  } catch (err) {
    return toErrorResponse(err);
  }
}
