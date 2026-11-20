import type { Metadata } from "next";
import { AssessSetup } from "@/components/assess/AssessSetup";

export const metadata: Metadata = { title: "Assess · NinetyTwo" };

export default function AssessPage() {
  return <AssessSetup />;
}
