import { z } from "zod";
import { getConfig } from "../config";
import { HttpError } from "../http/errors";

// The only place that calls an AI model. See CLAUDE.md "AI calls (OpenRouter)".

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const TIMEOUT_MS = 45_000;

export type Usage = { prompt_tokens?: number; completion_tokens?: number; cost?: number };

export type CompleteJsonArgs<T> = {
  model: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  schemaName: string;
  maxTokens: number;
  signal?: AbortSignal;
};

export type CompleteJsonResult<T> = { data: T; model: string; usage: Usage | undefined };

type ChatResponse = {
  model?: string;
  usage?: Usage;
  choices?: { message?: { content?: string | null } }[];
};

/** JSON Schema for structured outputs: every object closed, every property required. */
export function toResponseSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: "draft-7", io: "output" }) as Record<string, unknown>;
  delete json.$schema;
  return closeObjects(json) as Record<string, unknown>;
}

function closeObjects(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(closeObjects);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) out[k] = closeObjects(v);
  if (out.type === "object" && out.properties && typeof out.properties === "object") {
    out.additionalProperties = false;
    out.required = Object.keys(out.properties);
  }
  return out;
}

function statusError(status: number): HttpError {
  if (status === 401 || status === 403) return new HttpError(502, "ai_failed", "OpenRouter key rejected");
  if (status === 402) return new HttpError(502, "ai_failed", "OpenRouter credit exhausted");
  if (status === 429) return new HttpError(429, "rate_limited", "The AI is busy, please try again in a moment");
  return new HttpError(502, "ai_failed", `OpenRouter error (${status})`);
}

async function callOnce(
  apiKey: string,
  body: Record<string, unknown>,
  signal: AbortSignal | undefined,
): Promise<ChatResponse> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let res: Response;
  try {
    res = await globalThis.fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "NinetyTwo",
      },
      body: JSON.stringify(body),
      signal: combined,
    });
  } catch (err) {
    console.error("OpenRouter request failed:", err);
    const message = timeout.aborted ? "The AI took too long to answer" : "Could not reach OpenRouter";
    throw new HttpError(502, "ai_failed", message);
  }
  if (!res.ok) throw statusError(res.status);
  return (await res.json()) as ChatResponse;
}

/**
 * One structured-output call. Validates the reply with zod and retries once with the
 * validation error if the reply doesn't match. Never sends temperature or tools.
 */
export async function completeJson<T>(args: CompleteJsonArgs<T>): Promise<CompleteJsonResult<T>> {
  const { apiKey } = getConfig();
  if (!apiKey) throw new HttpError(502, "ai_failed", "OPENROUTER_API_KEY is not set");

  const baseBody = {
    model: args.model,
    max_tokens: args.maxTokens,
    response_format: {
      type: "json_schema",
      json_schema: { name: args.schemaName, strict: true, schema: toResponseSchema(args.schema) },
    },
    provider: { require_parameters: true },
  };

  let user = args.user;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const json = await callOnce(
      apiKey,
      { ...baseBody, messages: [{ role: "system", content: args.system }, { role: "user", content: user }] },
      args.signal,
    );
    const content = json.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    let problem: string;
    try {
      parsed = JSON.parse(content);
      const result = args.schema.safeParse(parsed);
      if (result.success) {
        return { data: result.data, model: json.model ?? args.model, usage: json.usage };
      }
      problem = z.prettifyError(result.error);
    } catch {
      problem = "The reply was not valid JSON.";
    }
    user = `${args.user}\n\nYour previous reply did not match the required JSON schema:\n${problem}\nReply again with JSON that matches the schema exactly.`;
  }
  throw new HttpError(502, "ai_failed", "The AI reply did not match the expected format");
}
