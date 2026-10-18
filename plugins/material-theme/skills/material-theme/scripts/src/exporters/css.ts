import type { ParsedScheme, ParsedTheme } from "../core/types.js";
import { hexToHsl, hexToOklch } from "../core/color-utils.js";

function translatePalettesAsCSS(
  theme: ParsedTheme,
  parser?: (hex: string) => string,
  prefix = ""
): string {
  const styleArr = [
    `--${prefix}neutral: ${parser?.(theme.palettes.neutral) ?? theme.palettes.neutral};`,
    `--${prefix}neutral-variant: ${parser?.(theme.palettes.neutralVariant) ?? theme.palettes.neutralVariant};`,
  ];
  return styleArr.map((v) => `\t\t${v}`).join("\n");
}

function translateSchemeAsCSS(
  scheme: ParsedScheme,
  parser: (hex: string) => string,
  prefix = ""
): string {
  const styleArr = [
    `--${prefix}primary: ${parser(scheme.primary.color)};`,
    `--${prefix}on-primary: ${parser(scheme.primary.onColor)};`,
    `--${prefix}primary-container: ${parser(scheme.primary.colorContainer)};`,
    `--${prefix}on-primary-container: ${parser(scheme.primary.onColorContainer)};`,
    `--${prefix}secondary: ${parser(scheme.secondary.color)};`,
    `--${prefix}on-secondary: ${parser(scheme.secondary.onColor)};`,
    `--${prefix}secondary-container: ${parser(scheme.secondary.colorContainer)};`,
    `--${prefix}on-secondary-container: ${parser(scheme.secondary.onColorContainer)};`,
    `--${prefix}tertiary: ${parser(scheme.tertiary.color)};`,
    `--${prefix}on-tertiary: ${parser(scheme.tertiary.onColor)};`,
    `--${prefix}tertiary-container: ${parser(scheme.tertiary.colorContainer)};`,
    `--${prefix}on-tertiary-container: ${parser(scheme.tertiary.onColorContainer)};`,
    `--${prefix}error: ${parser(scheme.error.color)};`,
    `--${prefix}on-error: ${parser(scheme.error.onColor)};`,
    `--${prefix}error-container: ${parser(scheme.error.colorContainer)};`,
    `--${prefix}on-error-container: ${parser(scheme.error.onColorContainer)};`,
    `--${prefix}background: ${parser(scheme.background.color)};`,
    `--${prefix}on-background: ${parser(scheme.background.onColor)};`,
    `--${prefix}surface: ${parser(scheme.surface.color)};`,
    `--${prefix}surface-dim: ${parser(scheme.surface.dim)};`,
    `--${prefix}surface-bright: ${parser(scheme.surface.bright)};`,
    `--${prefix}on-surface: ${parser(scheme.surface.onColor)};`,
    `--${prefix}surface-container-highest: ${parser(scheme.surface.colorContainerHighest)};`,
    `--${prefix}surface-container-high: ${parser(scheme.surface.colorContainerHigh)};`,
    `--${prefix}surface-container: ${parser(scheme.surface.colorContainer)};`,
    `--${prefix}surface-container-low: ${parser(scheme.surface.colorContainerLow)};`,
    `--${prefix}surface-container-lowest: ${parser(scheme.surface.colorContainerLowest)};`,
    `--${prefix}on-surface-container: ${parser(scheme.surface.onColorContainer)};`,
    `--${prefix}surface-variant: ${parser(scheme.surfaceVariant)};`,
    `--${prefix}on-surface-variant: ${parser(scheme.onSurfaceVariant)};`,
    `--${prefix}shadow: ${parser(scheme.shadow)};`,
    `--${prefix}scrim: ${parser(scheme.scrim)};`,
    `--${prefix}outline: ${parser(scheme.outline)};`,
    `--${prefix}outline-variant: ${parser(scheme.outlineVariant)};`,
    `--${prefix}surface-inverse: ${parser(scheme.inverse.surface)};`,
    `--${prefix}on-surface-inverse: ${parser(scheme.inverse.onSurface)};`,
    `--${prefix}primary-inverse: ${parser(scheme.inverse.primary)};`,
  ];
  return styleArr.map((v) => `\t\t${v}`).join("\n");
}

export function exportCSS(theme: ParsedTheme, colorSpace: "hex" | "hsl" | "oklch" = "hex"): string {
  const parser =
    colorSpace === "hsl" ? hexToHsl :
    colorSpace === "oklch" ? hexToOklch :
    (v: string) => v;

  let style = "";
  style += ":root {\n";
  style += translatePalettesAsCSS(theme, parser);
  style += "\n";
  style += translateSchemeAsCSS(theme.schemes.light, parser);
  style += "\n";
  style += "}\n\n";

  style += ".dark {\n";
  style += translateSchemeAsCSS(theme.schemes.dark, parser);
  style += "\n";
  style += "}\n";
  return style;
}
