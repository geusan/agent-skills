import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { ExportFormat } from "../core/types.js";

export const detectFrameworkSchema = z.object({
  project_path: z.string(),
});

export type DetectFrameworkInput = z.infer<typeof detectFrameworkSchema>;

interface DetectResult {
  framework: string;
  recommended_format: ExportFormat;
  target_file: string;
}

function fileExists(base: string, name: string): boolean {
  return existsSync(join(base, name));
}

function readJSON(base: string, name: string): Record<string, unknown> | null {
  try {
    const content = readFileSync(join(base, name), "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function detectFramework(input: DetectFrameworkInput): DetectResult {
  const p = input.project_path;

  // Flutter
  if (fileExists(p, "pubspec.yaml")) {
    return {
      framework: "Flutter",
      recommended_format: "flutter",
      target_file: "lib/theme/app_theme.dart",
    };
  }

  // Swift / SwiftUI
  if (fileExists(p, "Package.swift") || fileExists(p, "Podfile")) {
    return {
      framework: "SwiftUI",
      recommended_format: "swift",
      target_file: "Sources/Theme/MaterialTheme.swift",
    };
  }

  // Kotlin Compose
  if (fileExists(p, "build.gradle.kts") || fileExists(p, "build.gradle")) {
    const gradleFile = fileExists(p, "build.gradle.kts") ? "build.gradle.kts" : "build.gradle";
    try {
      const content = readFileSync(join(p, gradleFile), "utf-8");
      if (content.includes("compose") || content.includes("Compose")) {
        return {
          framework: "Kotlin Compose",
          recommended_format: "kotlin-compose",
          target_file: "app/src/main/java/com/example/ui/theme/Color.kt",
        };
      }
    } catch {}
  }

  const pkg = readJSON(p, "package.json") as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | null;
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies };

  // shadcn/ui (check before generic Next.js/React)
  if (fileExists(p, "components.json")) {
    return {
      framework: "shadcn/ui",
      recommended_format: "shadcn",
      target_file: "src/app/globals.css",
    };
  }

  // Tailwind
  if (
    fileExists(p, "tailwind.config.js") ||
    fileExists(p, "tailwind.config.ts") ||
    fileExists(p, "tailwind.config.mjs") ||
    fileExists(p, "tailwind.config.cjs")
  ) {
    return {
      framework: "Tailwind CSS",
      recommended_format: "tailwind",
      target_file: "src/styles/material-theme.css",
    };
  }

  // React Native
  if (deps["react-native"] || deps["expo"]) {
    return {
      framework: "React Native",
      recommended_format: "react-native",
      target_file: "src/theme/colors.ts",
    };
  }

  // Next.js
  if (deps["next"]) {
    return {
      framework: "Next.js",
      recommended_format: "css",
      target_file: "src/app/globals.css",
    };
  }

  // Angular
  if (deps["@angular/core"]) {
    return {
      framework: "Angular",
      recommended_format: "css",
      target_file: "src/styles.css",
    };
  }

  // Vue
  if (deps["vue"] || deps["nuxt"]) {
    return {
      framework: "Vue",
      recommended_format: "css",
      target_file: "src/assets/theme.css",
    };
  }

  // Svelte
  if (deps["svelte"] || deps["@sveltejs/kit"]) {
    return {
      framework: "Svelte",
      recommended_format: "css",
      target_file: "src/app.css",
    };
  }

  // Generic React
  if (deps["react"]) {
    return {
      framework: "React",
      recommended_format: "css",
      target_file: "src/index.css",
    };
  }

  // Fallback
  return {
    framework: "Unknown",
    recommended_format: "css",
    target_file: "theme.css",
  };
}
