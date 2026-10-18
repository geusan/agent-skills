import { z } from "zod";
import { getTheme } from "../core/theme.js";
import type { HarmonyMode, ParsedTheme } from "../core/types.js";

export const generateThemeSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #6750A4"),
  harmony_mode: z.enum(["default", "analogous", "triadic"]).default("default"),
  dark_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export type GenerateThemeInput = z.infer<typeof generateThemeSchema>;

export function generateTheme(input: GenerateThemeInput): ParsedTheme {
  const theme = getTheme(input.color, undefined, input.harmony_mode as HarmonyMode);

  if (input.dark_color) {
    const darkTheme = getTheme(input.dark_color, undefined, input.harmony_mode as HarmonyMode);
    return {
      ...theme,
      schemes: {
        light: theme.schemes.light,
        dark: darkTheme.schemes.dark,
      },
    };
  }

  return theme;
}
