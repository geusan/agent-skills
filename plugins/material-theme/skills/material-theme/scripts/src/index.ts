#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generateTheme, generateThemeSchema } from "./tools/generate-theme.js";
import { exportTheme, exportThemeSchema } from "./tools/export-theme.js";
import { convertColor, convertColorSchema } from "./tools/convert-color.js";
import { detectFramework, detectFrameworkSchema } from "./tools/detect-framework.js";

const server = new McpServer({
  name: "material-theme",
  version: "1.0.0",
});

// Tool 1: generate_theme
server.tool(
  "generate_theme",
  "Generate a complete Material Design 3 theme from a single hex color. Returns light and dark color schemes with 50+ design tokens including primary, secondary, tertiary, error, surface, and background colors. Supports harmony modes (analogous, triadic) and optional separate dark-mode primary color.",
  {
    color: z.string().describe("Hex color string (e.g. #6750A4)"),
    harmony_mode: z.enum(["default", "analogous", "triadic"]).default("default")
      .describe("Color harmony mode: default (Material default), analogous (30°/60° hue shift), triadic (120°/240° hue shift)"),
    dark_color: z.string().optional()
      .describe("Optional separate hex color for dark mode primary (advanced mode)"),
  },
  async (params) => {
    try {
      const input = generateThemeSchema.parse(params);
      const theme = generateTheme(input);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(theme, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }
);

// Tool 2: export_theme
server.tool(
  "export_theme",
  "Generate platform-specific theme code from a hex color. Supports CSS (hex/hsl/oklch), Tailwind CSS, shadcn/ui, React Native, SwiftUI, Kotlin Compose, Flutter, and JSON. Returns ready-to-use code with file path suggestions and integration instructions.",
  {
    color: z.string().describe("Hex color string (e.g. #6750A4)"),
    format: z.enum([
      "css", "css-hsl", "css-oklch", "tailwind", "shadcn",
      "react-native", "swift", "kotlin-compose", "flutter", "json",
    ]).describe("Output format/platform"),
    harmony_mode: z.enum(["default", "analogous", "triadic"]).default("default")
      .describe("Color harmony mode"),
    dark_color: z.string().optional()
      .describe("Optional separate hex color for dark mode primary"),
  },
  async (params) => {
    try {
      const input = exportThemeSchema.parse(params);
      const result = exportTheme(input);
      const output = [
        `📁 Suggested file: ${result.file_path_suggestion}`,
        "",
        "```",
        result.code,
        "```",
        "",
        `📋 Instructions:`,
        result.instructions,
      ].join("\n");

      return {
        content: [{
          type: "text" as const,
          text: output,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }
);

// Tool 3: convert_color
server.tool(
  "convert_color",
  "Convert a hex color to multiple color spaces (RGB, HSL, OKLCH, HCT, CMYK) and generate color harmonies (complementary, analogous, triadic). Useful for color exploration and design decisions.",
  {
    color: z.string().describe("Hex color string (e.g. #6750A4)"),
  },
  async (params) => {
    try {
      const input = convertColorSchema.parse(params);
      const result = convertColor(input);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }
);

// Tool 4: detect_framework
server.tool(
  "detect_framework",
  "Detect the framework/platform of a project by analyzing its files (package.json, pubspec.yaml, build.gradle, etc.). Returns the detected framework, recommended theme export format, and target file path.",
  {
    project_path: z.string().describe("Absolute path to the project root directory"),
  },
  async (params) => {
    try {
      const input = detectFrameworkSchema.parse(params);
      const result = detectFramework(input);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
