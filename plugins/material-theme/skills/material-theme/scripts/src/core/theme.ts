import {
  themeFromSourceColor,
  argbFromHex,
  Hct,
  TonalPalette,
  CustomColor,
  Theme,
  CustomColorGroup,
  Scheme,
} from "@material/material-color-utilities";
import type {
  HarmonyMode,
  ParsedColorGroup,
  ParsedColorGroupItem,
  ParsedPalettes,
  ParsedScheme,
  ParsedTheme,
} from "./types.js";
import { argbToHex, parseHct } from "./color-utils.js";

function translateParsedColorGroup(customColor: CustomColorGroup): ParsedColorGroup {
  return {
    color: argbToHex(customColor.color.value),
    dark: {
      color: argbToHex(customColor.dark.color),
      onColor: argbToHex(customColor.dark.onColor),
      colorContainer: argbToHex(customColor.dark.colorContainer),
      onColorContainer: argbToHex(customColor.dark.onColorContainer),
    },
    light: {
      color: argbToHex(customColor.light.color),
      onColor: argbToHex(customColor.light.onColor),
      colorContainer: argbToHex(customColor.light.colorContainer),
      onColorContainer: argbToHex(customColor.light.onColorContainer),
    },
  };
}

function translatePalettes(palettes: Theme["palettes"]): ParsedPalettes {
  return {
    primary: parseHct(palettes.primary.keyColor),
    secondary: parseHct(palettes.secondary.keyColor),
    tertiary: parseHct(palettes.tertiary.keyColor),
    neutral: parseHct(palettes.neutral.keyColor),
    neutralVariant: parseHct(palettes.neutralVariant.keyColor),
    error: parseHct(palettes.error.keyColor),
  };
}

function changeFromArgb(argb: number, tone: number): number {
  const hct = Hct.fromInt(argb);
  hct.tone = tone;
  return hct.toInt();
}

function blendColors(source: number, overlay: number, alpha: number): number {
  const r = Math.round(
    (1 - alpha) * ((source >> 16) & 0xff) + alpha * ((overlay >> 16) & 0xff)
  );
  const g = Math.round(
    (1 - alpha) * ((source >> 8) & 0xff) + alpha * ((overlay >> 8) & 0xff)
  );
  const b = Math.round(
    (1 - alpha) * (source & 0xff) + alpha * (overlay & 0xff)
  );
  const rgb = parseInt(`ff${((r << 16) | (g << 8) | b).toString(16)}`, 16);
  return rgb;
}

function colorGroupFromPalette(palette: TonalPalette, isDark: boolean): ParsedColorGroupItem {
  if (isDark) {
    return {
      color: argbToHex(palette.tone(80)),
      onColor: argbToHex(palette.tone(20)),
      colorContainer: argbToHex(palette.tone(30)),
      onColorContainer: argbToHex(palette.tone(90)),
    };
  }
  return {
    color: argbToHex(palette.tone(40)),
    onColor: argbToHex(palette.tone(100)),
    colorContainer: argbToHex(palette.tone(90)),
    onColorContainer: argbToHex(palette.tone(10)),
  };
}

function translateScheme(scheme: Scheme, isDark: boolean): ParsedScheme {
  return {
    primary: {
      color: argbToHex(scheme.primary),
      onColor: argbToHex(scheme.onPrimary),
      colorContainer: argbToHex(scheme.primaryContainer),
      onColorContainer: argbToHex(scheme.onPrimaryContainer),
    },
    secondary: {
      color: argbToHex(scheme.secondary),
      onColor: argbToHex(scheme.onSecondary),
      colorContainer: argbToHex(scheme.secondaryContainer),
      onColorContainer: argbToHex(scheme.onSecondaryContainer),
    },
    tertiary: {
      color: argbToHex(scheme.tertiary),
      onColor: argbToHex(scheme.onTertiary),
      colorContainer: argbToHex(scheme.tertiaryContainer),
      onColorContainer: argbToHex(scheme.onTertiaryContainer),
    },
    error: {
      color: argbToHex(scheme.error),
      onColor: argbToHex(scheme.onError),
      colorContainer: argbToHex(scheme.errorContainer),
      onColorContainer: argbToHex(scheme.onErrorContainer),
    },
    background: {
      color: argbToHex(scheme.background),
      onColor: argbToHex(scheme.onBackground),
    },
    surface: {
      color: argbToHex(scheme.surface),
      onColor: argbToHex(scheme.onSurface),
      colorContainerLowest: argbToHex(
        blendColors(scheme.surface, scheme.onSurface, 0.0)
      ),
      colorContainerLow: argbToHex(
        blendColors(scheme.surface, scheme.onSurface, 0.05)
      ),
      colorContainer: argbToHex(
        blendColors(scheme.surface, scheme.onSurface, 0.08)
      ),
      colorContainerHigh: argbToHex(
        blendColors(scheme.surface, scheme.onSurface, 0.11)
      ),
      colorContainerHighest: argbToHex(
        blendColors(scheme.surface, scheme.onSurface, 0.15)
      ),
      onColorContainer: argbToHex(scheme.onSurface),
      bright: argbToHex(changeFromArgb(scheme.surface, isDark ? 13 : 98)),
      dim: argbToHex(changeFromArgb(scheme.surface, isDark ? 2 : 87)),
    },
    surfaceVariant: argbToHex(scheme.surfaceVariant),
    onSurfaceVariant: argbToHex(scheme.onSurfaceVariant),
    outline: argbToHex(scheme.outline),
    outlineVariant: argbToHex(scheme.outlineVariant),
    shadow: argbToHex(scheme.shadow),
    scrim: argbToHex(scheme.scrim),
    inverse: {
      surface: argbToHex(scheme.inverseSurface),
      onSurface: argbToHex(scheme.inverseOnSurface),
      primary: argbToHex(scheme.inversePrimary),
    },
  };
}

export function getTheme(
  color: string,
  customColors?: CustomColor[],
  harmonyMode: HarmonyMode = "default"
): ParsedTheme {
  const sourceArgb = argbFromHex(color);
  const theme = themeFromSourceColor(sourceArgb, customColors);

  const rCustomColors: ParsedColorGroup[] = theme.customColors.map(
    translateParsedColorGroup
  );
  const { dark: schemeDark, light: schemeLight } = theme.schemes;
  const palettes = translatePalettes(theme.palettes);

  let dark = translateScheme(schemeDark, true);
  let light = translateScheme(schemeLight, false);

  if (harmonyMode !== "default") {
    const sourceHct = Hct.fromInt(sourceArgb);
    const sourceHue = sourceHct.hue;
    const offsets: [number, number] =
      harmonyMode === "analogous" ? [30, 60] : [120, 240];

    const secondaryChroma = theme.palettes.secondary.keyColor.chroma;
    const tertiaryChroma = theme.palettes.tertiary.keyColor.chroma;

    const secondaryPalette = TonalPalette.fromHueAndChroma(
      (sourceHue + offsets[0]) % 360,
      secondaryChroma
    );
    const tertiaryPalette = TonalPalette.fromHueAndChroma(
      (sourceHue + offsets[1]) % 360,
      tertiaryChroma
    );

    dark = {
      ...dark,
      secondary: colorGroupFromPalette(secondaryPalette, true),
      tertiary: colorGroupFromPalette(tertiaryPalette, true),
    };
    light = {
      ...light,
      secondary: colorGroupFromPalette(secondaryPalette, false),
      tertiary: colorGroupFromPalette(tertiaryPalette, false),
    };

    palettes.secondary = parseHct(secondaryPalette.keyColor);
    palettes.tertiary = parseHct(tertiaryPalette.keyColor);
  }

  return {
    themeColor: color,
    customColors: rCustomColors,
    palettes,
    schemes: {
      dark,
      light,
    },
  };
}
