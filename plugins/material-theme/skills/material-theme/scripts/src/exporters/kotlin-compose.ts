import type { ParsedScheme, ParsedTheme } from "../core/types.js";

function hexToKotlinColor(hex: string): string {
  const clean = hex.replace("#", "").toUpperCase();
  return `Color(0xFF${clean})`;
}

function schemeToKotlin(scheme: ParsedScheme, functionName: string): string {
  const entries: [string, string][] = [
    ["primary", scheme.primary.color],
    ["onPrimary", scheme.primary.onColor],
    ["primaryContainer", scheme.primary.colorContainer],
    ["onPrimaryContainer", scheme.primary.onColorContainer],
    ["secondary", scheme.secondary.color],
    ["onSecondary", scheme.secondary.onColor],
    ["secondaryContainer", scheme.secondary.colorContainer],
    ["onSecondaryContainer", scheme.secondary.onColorContainer],
    ["tertiary", scheme.tertiary.color],
    ["onTertiary", scheme.tertiary.onColor],
    ["tertiaryContainer", scheme.tertiary.colorContainer],
    ["onTertiaryContainer", scheme.tertiary.onColorContainer],
    ["error", scheme.error.color],
    ["onError", scheme.error.onColor],
    ["errorContainer", scheme.error.colorContainer],
    ["onErrorContainer", scheme.error.onColorContainer],
    ["background", scheme.background.color],
    ["onBackground", scheme.background.onColor],
    ["surface", scheme.surface.color],
    ["onSurface", scheme.surface.onColor],
    ["surfaceVariant", scheme.surfaceVariant],
    ["onSurfaceVariant", scheme.onSurfaceVariant],
    ["outline", scheme.outline],
    ["outlineVariant", scheme.outlineVariant],
    ["scrim", scheme.scrim],
    ["inverseSurface", scheme.inverse.surface],
    ["inverseOnSurface", scheme.inverse.onSurface],
    ["inversePrimary", scheme.inverse.primary],
  ];

  const params = entries
    .map(([name, hex]) => `    ${name} = ${hexToKotlinColor(hex)},`)
    .join("\n");

  return `val ${functionName === "light" ? "LightColorScheme" : "DarkColorScheme"} = ${functionName}ColorScheme(\n${params}\n)`;
}

export function exportKotlinCompose(theme: ParsedTheme): string {
  let code = "";
  code += `// Material Design 3 Theme - Generated from ${theme.themeColor}\n\n`;
  code += `package com.example.ui.theme\n\n`;
  code += `import androidx.compose.material3.darkColorScheme\n`;
  code += `import androidx.compose.material3.lightColorScheme\n`;
  code += `import androidx.compose.ui.graphics.Color\n\n`;
  code += schemeToKotlin(theme.schemes.light, "light");
  code += "\n\n";
  code += schemeToKotlin(theme.schemes.dark, "dark");
  code += "\n";
  return code;
}
