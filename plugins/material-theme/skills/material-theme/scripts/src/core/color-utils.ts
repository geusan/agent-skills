import { argbFromHex, Hct } from "@material/material-color-utilities";
import Color from "color";
import ColorIO from "colorjs.io";

export function hexToOklch(hex: string): string {
  const color = ColorIO.parse(hex);
  const c = new ColorIO(color);
  const lch = c.to("oklch");
  return lch.toString({ precision: 4 }).slice(6, -1);
}

export function hexToHsl(hex: string): string {
  return Color(hex).hsl().string().slice(4, -1).replace(/[,]/g, "");
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = Color(hex);
  return { r: Math.round(c.red()), g: Math.round(c.green()), b: Math.round(c.blue()) };
}

export function hexToHslValues(hex: string): { h: number; s: number; l: number } {
  const c = Color(hex).hsl();
  return { h: Math.round(c.hue()), s: Math.round(c.saturationl()), l: Math.round(c.lightness()) };
}

export function hexToCmyk(hex: string): { c: number; m: number; y: number; k: number } {
  const c = Color(hex).cmyk();
  return {
    c: Math.round(c.cyan()),
    m: Math.round(c.magenta()),
    y: Math.round(c.yellow()),
    k: Math.round(c.black()),
  };
}

export function hexToHct(hex: string): { hue: number; chroma: number; tone: number } {
  const argb = argbFromHex(hex);
  const hct = Hct.fromInt(argb);
  return {
    hue: Math.round(hct.hue * 100) / 100,
    chroma: Math.round(hct.chroma * 100) / 100,
    tone: Math.round(hct.tone * 100) / 100,
  };
}

export function parseHct(hct: Hct): string {
  return `#${hct.toInt().toString(16).slice(2)}`;
}

export function argbToHex(argb: number): string {
  const hex = argb.toString(16);
  return `#${hex.slice(2)}`;
}
