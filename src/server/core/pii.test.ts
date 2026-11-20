import { describe, expect, it } from "vitest";
import { stripPii } from "./pii";

describe("stripPii", () => {
  it.each([
    "(416) 555-0199",
    "416-555-0199",
    "+1 416 555 0199",
    "416.555.0199",
    "1-416-555-0199",
    "+1 (416) 555-0199",
  ])("replaces the phone number %s", (phone) => {
    expect(stripPii(`Call ${phone} today.`)).toBe("Call [phone] today.");
  });

  it("replaces emails", () => {
    expect(stripPii("Write to hr.team+jobs@example.co.uk or a@b.ca.")).toBe(
      "Write to [email] or [email].",
    );
  });

  it.each([
    "Adopted in 2024 and reviewed in 2026.",
    "A special program under s. 14 of the Code.",
    "Salary starts at $45,000 per year.",
    "Effective 2026-01-15 and 15/01/2026.",
    "Ontario Human Rights Code, R.S.O. 1990, c. H.19",
    "Call to Action #92 (2015).",
  ])("leaves %s alone", (text) => {
    expect(stripPii(text)).toBe(text);
  });
});
