import type { ParsedScheme, ParsedTheme } from "../core/types.js";

function hexToFlutterColor(hex: string): string {
  const clean = hex.replace("#", "").toUpperCase();
  return `Color(0xFF${clean})`;
}

function schemeToFlutter(scheme: ParsedScheme, brightness: "light" | "dark"): string {
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
    ["surface", scheme.surface.color],
    ["onSurface", scheme.surface.onColor],
    ["surfaceContainerHighest", scheme.surface.colorContainerHighest],
    ["surfaceContainerHigh", scheme.surface.colorContainerHigh],
    ["surfaceContainerLow", scheme.surface.colorContainerLow],
    ["surfaceContainerLowest", scheme.surface.colorContainerLowest],
    ["surfaceVariant", scheme.surfaceVariant],
    ["onSurfaceVariant", scheme.onSurfaceVariant],
    ["outline", scheme.outline],
    ["outlineVariant", scheme.outlineVariant],
    ["shadow", scheme.shadow],
    ["scrim", scheme.scrim],
    ["inverseSurface", scheme.inverse.surface],
    ["onInverseSurface", scheme.inverse.onSurface],
    ["inversePrimary", scheme.inverse.primary],
  ];

  const factory = brightness === "light" ? "ColorScheme.light" : "ColorScheme.dark";
  const params = entries
    .map(([name, hex]) => `      ${name}: ${hexToFlutterColor(hex)},`)
    .join("\n");

  return `  static const ${brightness}Scheme = ${factory}(\n${params}\n  );`;
}

export function exportFlutter(theme: ParsedTheme): string {
  let code = "";
  code += `// Material Design 3 Theme - Generated from ${theme.themeColor}\n\n`;
  code += `import 'package:flutter/material.dart';\n\n`;
  code += `class AppTheme {\n`;
  code += schemeToFlutter(theme.schemes.light, "light");
  code += "\n\n";
  code += schemeToFlutter(theme.schemes.dark, "dark");
  code += "\n\n";
  code += `  static ThemeData lightTheme = ThemeData(\n`;
  code += `    useMaterial3: true,\n`;
  code += `    colorScheme: lightScheme,\n`;
  code += `  );\n\n`;
  code += `  static ThemeData darkTheme = ThemeData(\n`;
  code += `    useMaterial3: true,\n`;
  code += `    colorScheme: darkScheme,\n`;
  code += `  );\n`;
  code += `}\n`;
  return code;
}
