import { norm } from "./quoteCheck";

/** norm() plus accent folding ("Métis" → "metis"), for keyword matching. Pure. */
export function fold(s: string): string {
  return norm(s.normalize("NFD").replace(/[̀-ͯ]/g, ""));
}
