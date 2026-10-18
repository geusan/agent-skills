import type { ParsedScheme, ParsedTheme } from "../core/types.js";

function hexToSwiftColor(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `Color(red: ${(r / 255).toFixed(3)}, green: ${(g / 255).toFixed(3)}, blue: ${(b / 255).toFixed(3)})`;
}

function schemeToSwiftProperties(scheme: ParsedScheme, indent: string): string {
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
    ["surfaceDim", scheme.surface.dim],
    ["surfaceBright", scheme.surface.bright],
    ["surfaceContainerLowest", scheme.surface.colorContainerLowest],
    ["surfaceContainerLow", scheme.surface.colorContainerLow],
    ["surfaceContainer", scheme.surface.colorContainer],
    ["surfaceContainerHigh", scheme.surface.colorContainerHigh],
    ["surfaceContainerHighest", scheme.surface.colorContainerHighest],
    ["surfaceVariant", scheme.surfaceVariant],
    ["onSurfaceVariant", scheme.onSurfaceVariant],
    ["outline", scheme.outline],
    ["outlineVariant", scheme.outlineVariant],
    ["shadow", scheme.shadow],
    ["scrim", scheme.scrim],
    ["inverseSurface", scheme.inverse.surface],
    ["inverseOnSurface", scheme.inverse.onSurface],
    ["inversePrimary", scheme.inverse.primary],
  ];

  return entries
    .map(([name, hex]) => `${indent}static let ${name} = ${hexToSwiftColor(hex)}`)
    .join("\n");
}

export function exportSwift(theme: ParsedTheme): string {
  let code = "";
  code += `// Material Design 3 Theme - Generated from ${theme.themeColor}\n\n`;
  code += `import SwiftUI\n\n`;
  code += `struct MaterialTheme {\n`;
  code += `    struct Light {\n`;
  code += schemeToSwiftProperties(theme.schemes.light, "        ");
  code += `\n    }\n\n`;
  code += `    struct Dark {\n`;
  code += schemeToSwiftProperties(theme.schemes.dark, "        ");
  code += `\n    }\n`;
  code += `}\n\n`;
  code += `// MARK: - Color Scheme Helper\n`;
  code += `extension MaterialTheme {\n`;
  code += `    static func color(_ light: Color, dark: Color) -> Color {\n`;
  code += `        // Use with @Environment(\\.colorScheme) var colorScheme\n`;
  code += `        // MaterialTheme.color(.Light.primary, dark: .Dark.primary)\n`;
  code += `        return light // Replace with dynamic resolution\n`;
  code += `    }\n`;
  code += `}\n`;
  return code;
}
