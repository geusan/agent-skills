import type { ParsedScheme, ParsedTheme } from "../core/types.js";
import { hexToHsl } from "../core/color-utils.js";

function translatePalettesAsCSS(theme: ParsedTheme): string {
  const styleArr = [
    `--neutral: ${hexToHsl(theme.palettes.neutral)};`,
    `--neutral-variant: ${hexToHsl(theme.palettes.neutralVariant)};`,
  ];
  return styleArr.map((v) => `\t\t${v}`).join("\n");
}

function translateShadcnSchemeAsCSS(scheme: ParsedScheme): string {
  const p = hexToHsl;
  const styleArr = [
    `--background: ${p(scheme.background.color)};`,
    `--foreground: ${p(scheme.background.onColor)};`,
    `--muted: ${p(scheme.surfaceVariant)};`,
    `--muted-foreground: ${p(scheme.onSurfaceVariant)};`,
    `--card: ${p(scheme.surface.color)};`,
    `--card-foreground: ${p(scheme.surface.onColor)};`,
    `--popover: ${p(scheme.surface.color)};`,
    `--popover-foreground: ${p(scheme.surface.onColor)};`,
    `--border: ${p(scheme.outline)};`,
    `--input: ${p(scheme.surface.color)};`,
    `--primary: ${p(scheme.primary.color)};`,
    `--primary-foreground: ${p(scheme.primary.onColor)};`,
    `--secondary: ${p(scheme.secondary.color)};`,
    `--secondary-foreground: ${p(scheme.secondary.onColor)};`,
    `--accent: ${p(scheme.tertiary.color)};`,
    `--accent-foreground: ${p(scheme.tertiary.onColor)};`,
    `--destructive: ${p(scheme.inverse.surface)};`,
    `--destructive-foreground: ${p(scheme.inverse.onSurface)};`,
    `--ring: ${p(scheme.outlineVariant)};`,
    `--radius: 0.5rem;`,
    `--sidebar-background: ${p(scheme.primary.colorContainer)};`,
    `--sidebar-foreground: ${p(scheme.primary.onColorContainer)};`,
    `--sidebar-primary: ${p(scheme.primary.color)};`,
    `--sidebar-primary-foreground: ${p(scheme.primary.onColor)};`,
    `--sidebar-accent: ${p(scheme.tertiary.color)};`,
    `--sidebar-accent-foreground: ${p(scheme.tertiary.onColor)};`,
    `--sidebar-border: ${p(scheme.outline)};`,
    `--sidebar-ring: ${p(scheme.outlineVariant)};`,
    `--chart-1: ${p(scheme.primary.color)};`,
    `--chart-2: ${p(scheme.secondary.color)};`,
    `--chart-3: ${p(scheme.tertiary.color)};`,
    `--chart-4: ${p(scheme.primary.colorContainer)};`,
    `--chart-5: ${p(scheme.secondary.colorContainer)};`,
  ];
  return styleArr.map((v) => `\t\t${v}`).join("\n");
}

export function exportShadcn(theme: ParsedTheme): string {
  let style = "";
  style += "@tailwind base;\n";
  style += "@tailwind components;\n";
  style += "@tailwind utilities;\n\n";

  style += "@layer base {\n";
  style += "\t:root {\n";
  style += translatePalettesAsCSS(theme);
  style += "\n";
  style += translateShadcnSchemeAsCSS(theme.schemes.light);
  style += "\n";
  style += "\t}\n\n";

  style += "\t.dark {\n";
  style += translateShadcnSchemeAsCSS(theme.schemes.dark);
  style += "\n";
  style += "\t}\n";
  style += "}\n";
  return style;
}
