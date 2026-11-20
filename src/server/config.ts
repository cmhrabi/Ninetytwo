export type Config = {
  apiKey: string | undefined;
  judgeModel: string;
  scanModel: string;
};

export const DEFAULT_JUDGE_MODEL = "anthropic/claude-sonnet-5.5";
export const DEFAULT_SCAN_MODEL = "anthropic/claude-haiku-5.5";

/** Reads env at call time (not import time) so tests and restarts see changes. */
export function getConfig(): Config {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  return {
    apiKey: key ? key : undefined,
    judgeModel: process.env.JUDGE_MODEL?.trim() || DEFAULT_JUDGE_MODEL,
    scanModel: process.env.SCAN_MODEL?.trim() || DEFAULT_SCAN_MODEL,
  };
}
