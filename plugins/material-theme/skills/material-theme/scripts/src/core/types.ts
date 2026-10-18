export type HarmonyMode = "default" | "analogous" | "triadic";

export type ParsedColorGroupItem = {
  color: string;
  onColor: string;
  colorContainer: string;
  onColorContainer: string;
};

export type ParsedColorGroup = {
  color: string;
  dark: ParsedColorGroupItem;
  light: ParsedColorGroupItem;
};

export type ParsedPalettes = {
  primary: string;
  secondary: string;
  tertiary: string;
  neutral: string;
  neutralVariant: string;
  error: string;
};

export type ParsedScheme = {
  primary: ParsedColorGroupItem;
  secondary: ParsedColorGroupItem;
  tertiary: ParsedColorGroupItem;
  error: ParsedColorGroupItem;
  background: Omit<ParsedColorGroupItem, "colorContainer" | "onColorContainer">;
  surface: Omit<ParsedColorGroupItem, "colorContainer" | "onColorContainer"> & {
    colorContainerLowest: string;
    colorContainerLow: string;
    colorContainer: string;
    colorContainerHigh: string;
    colorContainerHighest: string;
    onColorContainer: string;
    bright: string;
    dim: string;
  };
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverse: {
    surface: string;
    onSurface: string;
    primary: string;
  };
};

export type ParsedTheme = {
  themeColor: string;
  customColors: ParsedColorGroup[];
  palettes: ParsedPalettes;
  schemes: {
    dark: ParsedScheme;
    light: ParsedScheme;
  };
};

export type ExportFormat =
  | "css"
  | "css-hsl"
  | "css-oklch"
  | "tailwind"
  | "shadcn"
  | "react-native"
  | "swift"
  | "kotlin-compose"
  | "flutter"
  | "json";
