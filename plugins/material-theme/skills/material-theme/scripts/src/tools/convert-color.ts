import { z } from "zod";
import { argbFromHex, Hct, TonalPalette } from "@material/material-color-utilities";
import {
  hexToHsl,
  hexToOklch,
  hexToRgb,
  hexToHslValues,
  hexToCmyk,
  hexToHct,
  argbToHex,
} from "../core/color-utils.js";

export const convertColorSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #6750A4"),
});

export type ConvertColorInput = z.infer<typeof convertColorSchema>;

interface ColorConversion {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  hsl_string: string;
  oklch: string;
  hct: { hue: number; chroma: number; tone: number };
  cmyk: { c: number; m: number; y: number; k: number };
  complementary: string;
  analogous: [string, string];
  triadic: [string, string];
}

export function convertColor(input: ConvertColorInput): ColorConversion {
  const hex = input.color;
  const argb = argbFromHex(hex);
  const hct = Hct.fromInt(argb);

  const complementaryHue = (hct.hue + 180) % 360;
  const complementaryPalette = TonalPalette.fromHueAndChroma(complementaryHue, hct.chroma);
  const complementary = argbToHex(complementaryPalette.tone(Math.round(hct.tone)));

  const analogous1Hue = (hct.hue + 30) % 360;
  const analogous2Hue = (hct.hue + 330) % 360;
  const analogous1 = TonalPalette.fromHueAndChroma(analogous1Hue, hct.chroma);
  const analogous2 = TonalPalette.fromHueAndChroma(analogous2Hue, hct.chroma);

  const triadic1Hue = (hct.hue + 120) % 360;
  const triadic2Hue = (hct.hue + 240) % 360;
  const triadic1 = TonalPalette.fromHueAndChroma(triadic1Hue, hct.chroma);
  const triadic2 = TonalPalette.fromHueAndChroma(triadic2Hue, hct.chroma);

  const tone = Math.round(hct.tone);

  return {
    hex,
    rgb: hexToRgb(hex),
    hsl: hexToHslValues(hex),
    hsl_string: hexToHsl(hex),
    oklch: hexToOklch(hex),
    hct: hexToHct(hex),
    cmyk: hexToCmyk(hex),
    complementary,
    analogous: [
      argbToHex(analogous1.tone(tone)),
      argbToHex(analogous2.tone(tone)),
    ],
    triadic: [
      argbToHex(triadic1.tone(tone)),
      argbToHex(triadic2.tone(tone)),
    ],
  };
}
