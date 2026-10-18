import type { ParsedTheme } from "../core/types.js";

export function exportJSON(theme: ParsedTheme): string {
  return JSON.stringify(theme, null, 2);
}
