import type { ParsedScheme, ParsedTheme } from "../core/types.js";

function schemeToObject(scheme: ParsedScheme): Record<string, string> {
  return {
    primary: scheme.primary.color,
    onPrimary: scheme.primary.onColor,
    primaryContainer: scheme.primary.colorContainer,
    onPrimaryContainer: scheme.primary.onColorContainer,
    secondary: scheme.secondary.color,
    onSecondary: scheme.secondary.onColor,
    secondaryContainer: scheme.secondary.colorContainer,
    onSecondaryContainer: scheme.secondary.onColorContainer,
    tertiary: scheme.tertiary.color,
    onTertiary: scheme.tertiary.onColor,
    tertiaryContainer: scheme.tertiary.colorContainer,
    onTertiaryContainer: scheme.tertiary.onColorContainer,
    error: scheme.error.color,
    onError: scheme.error.onColor,
    errorContainer: scheme.error.colorContainer,
    onErrorContainer: scheme.error.onColorContainer,
    background: scheme.background.color,
    onBackground: scheme.background.onColor,
    surface: scheme.surface.color,
    onSurface: scheme.surface.onColor,
    surfaceDim: scheme.surface.dim,
    surfaceBright: scheme.surface.bright,
    surfaceContainerLowest: scheme.surface.colorContainerLowest,
    surfaceContainerLow: scheme.surface.colorContainerLow,
    surfaceContainer: scheme.surface.colorContainer,
    surfaceContainerHigh: scheme.surface.colorContainerHigh,
    surfaceContainerHighest: scheme.surface.colorContainerHighest,
    onSurfaceContainer: scheme.surface.onColorContainer,
    surfaceVariant: scheme.surfaceVariant,
    onSurfaceVariant: scheme.onSurfaceVariant,
    outline: scheme.outline,
    outlineVariant: scheme.outlineVariant,
    shadow: scheme.shadow,
    scrim: scheme.scrim,
    inverseSurface: scheme.inverse.surface,
    inverseOnSurface: scheme.inverse.onSurface,
    inversePrimary: scheme.inverse.primary,
  };
}

function objectToTS(obj: Record<string, string>, indent: string): string {
  const entries = Object.entries(obj)
    .map(([key, val]) => `${indent}  ${key}: '${val}',`)
    .join("\n");
  return `{\n${entries}\n${indent}}`;
}

export function exportReactNative(theme: ParsedTheme): string {
  const light = schemeToObject(theme.schemes.light);
  const dark = schemeToObject(theme.schemes.dark);

  let code = "";
  code += `/**\n * Material Design 3 Theme - Generated from ${theme.themeColor}\n */\n\n`;
  code += `export const lightColors = ${objectToTS(light, "")} as const;\n\n`;
  code += `export const darkColors = ${objectToTS(dark, "")} as const;\n\n`;
  code += `export type MaterialColors = typeof lightColors;\n\n`;
  code += `export const theme = {\n`;
  code += `  light: lightColors,\n`;
  code += `  dark: darkColors,\n`;
  code += `} as const;\n`;
  return code;
}
