import { z } from "zod";
import { generateTheme } from "./generate-theme.js";
import { exportCSS } from "../exporters/css.js";
import { exportTailwind } from "../exporters/tailwind.js";
import { exportShadcn } from "../exporters/shadcn.js";
import { exportJSON } from "../exporters/json.js";
import { exportReactNative } from "../exporters/react-native.js";
import { exportSwift } from "../exporters/swift.js";
import { exportKotlinCompose } from "../exporters/kotlin-compose.js";
import { exportFlutter } from "../exporters/flutter.js";
import type { ExportFormat } from "../core/types.js";

export const exportThemeSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #6750A4"),
  format: z.enum([
    "css", "css-hsl", "css-oklch", "tailwind", "shadcn",
    "react-native", "swift", "kotlin-compose", "flutter", "json",
  ]),
  harmony_mode: z.enum(["default", "analogous", "triadic"]).default("default"),
  dark_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export type ExportThemeInput = z.infer<typeof exportThemeSchema>;

interface ExportResult {
  code: string;
  file_path_suggestion: string;
  instructions: string;
}

const formatMeta: Record<ExportFormat, { path: string; instructions: string }> = {
  css: {
    path: "src/styles/material-theme.css",
    instructions: "Import this CSS file in your main entry point. Use CSS variables like var(--primary) in your styles.",
  },
  "css-hsl": {
    path: "src/styles/material-theme.css",
    instructions: "Import this CSS file in your main entry point. Variables use HSL color space for easier manipulation.",
  },
  "css-oklch": {
    path: "src/styles/material-theme.css",
    instructions: "Import this CSS file in your main entry point. Variables use OKLCH color space for perceptual uniformity.",
  },
  tailwind: {
    path: "src/styles/material-theme.css",
    instructions: "1. Add the CSS variables to your global CSS file.\n2. Copy the theme.extend.colors config into your tailwind.config.js.\n3. Use classes like bg-primary, text-on-primary, etc.",
  },
  shadcn: {
    path: "src/app/globals.css",
    instructions: "Replace the :root and .dark sections in your globals.css with this generated theme. The variable names are compatible with shadcn/ui components.",
  },
  "react-native": {
    path: "src/theme/colors.ts",
    instructions: "Import lightColors/darkColors in your theme provider. Use with React Navigation ThemeProvider or a custom context.",
  },
  swift: {
    path: "Theme/MaterialTheme.swift",
    instructions: "Add this file to your Xcode project. Access colors via MaterialTheme.Light.primary or MaterialTheme.Dark.primary. Use with @Environment(\\.colorScheme) for dynamic theming.",
  },
  "kotlin-compose": {
    path: "ui/theme/Color.kt",
    instructions: "Place in your theme package. Use with MaterialTheme(colorScheme = if (isDark) DarkColorScheme else LightColorScheme) in your Theme composable.",
  },
  flutter: {
    path: "lib/theme/app_theme.dart",
    instructions: "Import and use: MaterialApp(theme: AppTheme.lightTheme, darkTheme: AppTheme.darkTheme).",
  },
  json: {
    path: "theme.json",
    instructions: "Raw JSON theme data. Use this for custom integrations or as input to other tools.",
  },
};

export function exportTheme(input: ExportThemeInput): ExportResult {
  const theme = generateTheme({
    color: input.color,
    harmony_mode: input.harmony_mode,
    dark_color: input.dark_color,
  });

  const format = input.format as ExportFormat;
  let code: string;

  switch (format) {
    case "css":
      code = exportCSS(theme, "hex");
      break;
    case "css-hsl":
      code = exportCSS(theme, "hsl");
      break;
    case "css-oklch":
      code = exportCSS(theme, "oklch");
      break;
    case "tailwind":
      code = exportTailwind(theme);
      break;
    case "shadcn":
      code = exportShadcn(theme);
      break;
    case "react-native":
      code = exportReactNative(theme);
      break;
    case "swift":
      code = exportSwift(theme);
      break;
    case "kotlin-compose":
      code = exportKotlinCompose(theme);
      break;
    case "flutter":
      code = exportFlutter(theme);
      break;
    case "json":
      code = exportJSON(theme);
      break;
  }

  const meta = formatMeta[format];
  return {
    code,
    file_path_suggestion: meta.path,
    instructions: meta.instructions,
  };
}
