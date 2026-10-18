import type { ParsedTheme } from "../core/types.js";
import { exportCSS } from "./css.js";

function buildTailwindColors(prefix = ""): Record<string, unknown> {
  const v = (name: string) => `var(--${prefix}${name})`;
  return {
    background: v("background"),
    foreground: v("on-background"),
    primary: {
      DEFAULT: v("primary"),
      foreground: v("on-primary"),
      container: v("primary-container"),
      "on-container": v("on-primary-container"),
      inverse: v("primary-inverse"),
    },
    secondary: {
      DEFAULT: v("secondary"),
      foreground: v("on-secondary"),
      container: v("secondary-container"),
      "on-container": v("on-secondary-container"),
    },
    tertiary: {
      DEFAULT: v("tertiary"),
      foreground: v("on-tertiary"),
      container: v("tertiary-container"),
      "on-container": v("on-tertiary-container"),
    },
    error: {
      DEFAULT: v("error"),
      foreground: v("on-error"),
      container: v("error-container"),
      "on-container": v("on-error-container"),
    },
    border: {
      DEFAULT: v("outline"),
      variant: v("outline-variant"),
    },
    surface: {
      DEFAULT: v("surface"),
      dim: v("surface-dim"),
      bright: v("surface-bright"),
      foreground: v("on-surface"),
      variant: v("surface-variant"),
      "variant-foreground": v("on-surface-variant"),
      inverse: v("surface-inverse"),
      "inverse-foreground": v("on-surface-inverse"),
    },
    "surface-container": {
      foreground: v("on-surface-container"),
      highest: v("surface-container-highest"),
      high: v("surface-container-high"),
      DEFAULT: v("surface-container"),
      low: v("surface-container-low"),
      lowest: v("surface-container-lowest"),
    },
    scrim: v("scrim"),
    shadow: v("shadow"),
  };
}

export function exportTailwind(theme: ParsedTheme): string {
  const cssVars = exportCSS(theme, "hex");
  const config = {
    theme: {
      extend: {
        colors: buildTailwindColors(),
      },
    },
  };

  let output = "";
  output += "/* === CSS Variables === */\n";
  output += cssVars;
  output += "\n\n";
  output += "/* === Tailwind Config (add to tailwind.config.js) === */\n";
  output += `/** @type {import('tailwindcss').Config} */\n`;
  output += `module.exports = ${JSON.stringify(config, null, 2)}\n`;
  return output;
}
