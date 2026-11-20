import type { Metadata } from "next";
import { AssessSetup } from "@/components/assess/AssessSetup";
import { getRubric } from "@/lib/content";

export const metadata: Metadata = { title: "Assess · NinetyTwo" };

export default function AssessPage() {
  const criteria = getRubric().criteria.map(({ id, title, shortTitle, tier, weight }) => ({
    id,
    title,
    shortTitle,
    tier,
    weight,
  }));
  return <AssessSetup criteria={criteria} />;
}
