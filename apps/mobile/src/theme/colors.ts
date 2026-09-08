import { useColorScheme } from "react-native";
import { semanticTokens } from "@serrucho/ui";

export const darkThemeTokens = {
  colors: {
    background: {
      base: "#0B0F19",
      subtle: "#111827",
    },
    surface: {
      base: "#111827",
      elevated: "#1A2234",
      drawer: "#0F172A",
      hover: "#243048",
      active: "#2E3B55",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#94A3B8",
      muted: "#64748B",
      inverse: "#0F172A",
    },
    accent: {
      primary: "#8B5CF6",
      primaryHover: "#7C3AED",
      primaryLight: "#EDE9FE",
      primaryDark: "#6D28D9",
      super: "#F59E0B",
      superLight: "#FEF3C7",
    },
    destructive: {
      base: "#EF4444",
      hover: "#DC2626",
      light: "#FEE2E2",
    },
    success: {
      base: "#10B981",
      light: "#D1FAE5",
      hover: "#059669",
    },
    warning: {
      base: "#F59E0B",
      light: "#FEF3C7",
    },
    divider: "#1E293B",
    cardBorder: "#1E293B",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
};

export const lightThemeTokens = {
  colors: {
    background: {
      base: "#F8FAFC",
      subtle: "#F1F5F9",
    },
    surface: {
      base: "#FFFFFF",
      elevated: "#FFFFFF",
      drawer: "#FFFFFF",
      hover: "#F1F5F9",
      active: "#E2E8F0",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
      muted: "#94A3B8",
      inverse: "#FFFFFF",
    },
    accent: {
      primary: "#7C3AED",
      primaryHover: "#6D28D9",
      primaryLight: "#EDE9FE",
      primaryDark: "#5B21B6",
      super: "#D97706",
      superLight: "#FEF3C7",
    },
    destructive: {
      base: "#EF4444",
      hover: "#DC2626",
      light: "#FEE2E2",
    },
    success: {
      base: "#10B981",
      light: "#D1FAE5",
      hover: "#059669",
    },
    warning: {
      base: "#F59E0B",
      light: "#FEF3C7",
    },
    divider: "#E2E8F0",
    cardBorder: "#E2E8F0",
    overlay: "rgba(0, 0, 0, 0.4)",
  },
};

export function getThemeTokens(scheme: "light" | "dark" | null | undefined) {
  return scheme === "light" ? lightThemeTokens : darkThemeTokens;
}

/**
 * Mobile Theme & Color Bridge
 * Re-exports semantic tokens with full dynamic Light/Dark iOS system adaptation.
 */
export const colors = {
  // Brand / Primary
  primary: semanticTokens.colors.accent.primary,
  primaryLight: semanticTokens.colors.accent.primaryLight,
  primaryDark: semanticTokens.colors.accent.primaryDark,

  // Secondary
  secondary: semanticTokens.colors.surface.elevated,
  secondaryLight: semanticTokens.colors.surface.hover,

  // Accents & Highlights
  accent: semanticTokens.colors.accent.super,
  super: semanticTokens.colors.accent.super,

  // Feedback states
  success: semanticTokens.colors.success.base,
  successLight: semanticTokens.colors.success.light,

  danger: semanticTokens.colors.destructive.base,
  dangerLight: semanticTokens.colors.destructive.light,

  // Semantic surfaces & backgrounds
  light: {
    background: lightThemeTokens.colors.background.base,
    card: lightThemeTokens.colors.surface.elevated,
    cardBorder: lightThemeTokens.colors.cardBorder,
    text: lightThemeTokens.colors.text.primary,
    textMuted: lightThemeTokens.colors.text.secondary,
    border: lightThemeTokens.colors.divider,
    inputBg: lightThemeTokens.colors.surface.hover,
  },

  dark: {
    background: darkThemeTokens.colors.background.base,
    card: darkThemeTokens.colors.surface.elevated,
    cardBorder: darkThemeTokens.colors.cardBorder,
    text: darkThemeTokens.colors.text.primary,
    textMuted: darkThemeTokens.colors.text.secondary,
    border: darkThemeTokens.colors.divider,
    inputBg: darkThemeTokens.colors.surface.base,
  },

  // Direct access to semanticTokens
  tokens: semanticTokens,
};

export function useAppTheme() {
  const scheme = useColorScheme();
  const isDark = scheme !== "light"; // Defaults to dark baseline unless iOS appearance is explicitly light
  const tokens = isDark ? darkThemeTokens : lightThemeTokens;
  const themeColors = isDark ? colors.dark : colors.light;

  return {
    isDark,
    scheme: isDark ? ("dark" as const) : ("light" as const),
    tokens,
    colors: themeColors,
  };
}
