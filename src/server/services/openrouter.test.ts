import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { HttpError } from "../http/errors";
import { OPENROUTER_URL, completeJson, toResponseSchema } from "./openrouter";

const Schema = z.object({ ok: z.boolean(), items: z.array(z.object({ id: z.string(), level: z.number() })) });

const args = {
  model: "anthropic/claude-sonnet-5.5",
  system: "sys",
  user: "usr",
  schema: Schema,
  schemaName: "test_reply",
  maxTokens: 100,
};

function reply(content: string, status = 200) {
  return new Response(
    JSON.stringify({
      model: "anthropic/claude-sonnet-5.5",
      usage: { prompt_tokens: 10, completion_tokens: 5, cost: 0.0001 },
      choices: [{ message: { content } }],
    }),
    { status },
  );
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test");
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

async function expectHttpError(promise: Promise<unknown>, status: number, code: string) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(HttpError);
  expect((err as HttpError).status).toBe(status);
  expect((err as HttpError).code).toBe(code);
}

describe("completeJson", () => {
  it("sends a strict JSON-schema request with no temperature or tools", async () => {
    fetchMock.mockResolvedValueOnce(reply('{"ok":true,"items":[]}'));
    await completeJson(args);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(OPENROUTER_URL);
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer sk-or-test");
    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe(args.model);
    expect(body.max_tokens).toBe(100);
    expect(body.messages).toEqual([
      { role: "system", content: "sys" },
      { role: "user", content: "usr" },
    ]);
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.name).toBe("test_reply");
    expect(body.provider).toEqual({ require_parameters: true });
    expect(body).not.toHaveProperty("temperature");
    expect(body).not.toHaveProperty("tools");
    expect(body).not.toHaveProperty("tool_choice");
  });

  it("returns parsed data, the served model and usage", async () => {
    fetchMock.mockResolvedValueOnce(reply('{"ok":true,"items":[{"id":"a","level":2}]}'));
    const out = await completeJson(args);
    expect(out.data).toEqual({ ok: true, items: [{ id: "a", level: 2 }] });
    expect(out.model).toBe("anthropic/claude-sonnet-5.5");
    expect(out.usage?.cost).toBe(0.0001);
  });

  it("retries once with the validation error when the reply is not valid JSON", async () => {
    fetchMock.mockResolvedValueOnce(reply("not json")).mockResolvedValueOnce(reply('{"ok":false,"items":[]}'));
    const out = await completeJson(args);
    expect(out.data.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retryBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(retryBody.messages[1].content).toContain("did not match the required JSON schema");
  });

  it("retries once when the JSON does not match the schema", async () => {
    fetchMock.mockResolvedValueOnce(reply('{"ok":"yes"}')).mockResolvedValueOnce(reply('{"ok":true,"items":[]}'));
    await expect(completeJson(args)).resolves.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails with ai_failed after two bad replies", async () => {
    fetchMock.mockResolvedValueOnce(reply("nope")).mockResolvedValueOnce(reply("{}"));
    await expectHttpError(completeJson(args), 502, "ai_failed");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    [401, 502, "ai_failed"],
    [403, 502, "ai_failed"],
    [402, 502, "ai_failed"],
    [429, 429, "rate_limited"],
    [500, 502, "ai_failed"],
    [503, 502, "ai_failed"],
  ])("maps OpenRouter %i to %i %s without retrying", async (upstream, status, code) => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: upstream }));
    await expectHttpError(completeJson(args), status, code);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps a network failure or abort to ai_failed", async () => {
    fetchMock.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));
    await expectHttpError(completeJson(args), 502, "ai_failed");
  });

  it("fails fast without calling fetch when the key is missing", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    await expectHttpError(completeJson(args), 502, "ai_failed");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("toResponseSchema", () => {
  it("closes every object and requires every property", () => {
    const json = toResponseSchema(Schema) as {
      additionalProperties: boolean;
      required: string[];
      properties: { items: { items: { additionalProperties: boolean; required: string[] } } };
      $schema?: string;
    };
    expect(json.additionalProperties).toBe(false);
    expect(json.required).toEqual(["ok", "items"]);
    expect(json.properties.items.items.additionalProperties).toBe(false);
    expect(json.properties.items.items.required).toEqual(["id", "level"]);
    expect(json.$schema).toBeUndefined();
  });
});
