/**
 * @serrucho/ui Design System Tokens
 * Grounded in Kittysplit Dark Theme Golden Reference Specification (SER-KITTY-010A.1).
 * All HEX codes are marked as estimated approximations to be calibrated visually.
 */

export const semanticTokens = {
  colors: {
    // Backgrounds
    background: {
      base: "#0B0F19", // Estimated approximation: deep dark navy
      subtle: "#111827", // Estimated approximation: charcoal dark
    },
    // Surfaces
    surface: {
      base: "#111827", // Estimated approximation: base dark container
      elevated: "#1A2234", // Estimated approximation: elevated card / row
      drawer: "#0F172A", // Estimated approximation: drawer panel
      hover: "#243048", // Estimated approximation: pressed / hovered row
      active: "#2E3B55", // Estimated approximation: active list item
    },
    // Typography / Text
    text: {
      primary: "#FFFFFF", // High-contrast crisp white
      secondary: "#94A3B8", // Cool slate / soft gray
      muted: "#64748B", // Muted subtext
      inverse: "#0F172A", // Dark text on light / accent surfaces
    },
    // Accents
    accent: {
      primary: "#8B5CF6", // Estimated approximation: purple / violet / lilac
      primaryHover: "#7C3AED", // Estimated approximation: pressed purple
      primaryLight: "#EDE9FE", // Light purple tint for badges
      primaryDark: "#6D28D9",
      super: "#F59E0B", // Warm gold / amber accent for Super Kitty
      superLight: "#FEF3C7",
    },
    // Semantic feedback
    destructive: {
      base: "#EF4444", // Crimson red / dark-mode red
      hover: "#DC2626",
      light: "#FEE2E2",
    },
    success: {
      base: "#10B981", // Green positive balance indicator
      light: "#D1FAE5",
      hover: "#059669",
    },
    warning: {
      base: "#F59E0B",
      light: "#FEF3C7",
    },
    // Borders, Dividers & Overlay
    divider: "#1E293B", // Subtle dark 1px hairline divider
    cardBorder: "#1E293B", // Subtle border for cards & dialogs
    overlay: "rgba(0, 0, 0, 0.6)", // Dark backdrop overlay (60% opacity)
  },

  typography: {
    fontFamily: "System",
    sizes: {
      screenTitle: 19,
      section: 15,
      body: 14,
      bodyMedium: 14,
      secondary: 13,
      caption: 11,
      badge: 11,
    },
    weights: {
      regular: "400" as const,
      medium: "500" as const,
      semibold: "600" as const,
      bold: "700" as const,
    },
    lineHeights: {
      screenTitle: 26,
      section: 22,
      body: 20,
      secondary: 18,
      caption: 16,
      badge: 16,
    },
  },

  spacing: {
    screen: 16,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    section: 24,
    row: 12,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 9999,
    avatar: 9999,
    full: 9999,
  },

  geometry: {
    touchTargetMinimum: 44,
    touchTarget: 48,
    appBarHeight: 56,
    bottomTabBarHeight: 60,
    settingRowHeight: 52,
    avatarSmall: 36,
    avatarMedium: 48,
    avatarLarge: 80,
    hairline: 1,
  },
};

/**
 * Backward compatibility export aliasing semantic tokens to legacy designTokens format.
 */
export const designTokens = {
  colors: {
    primary: semanticTokens.colors.accent.primary,
    primaryLight: semanticTokens.colors.accent.primaryLight,
    primaryDark: semanticTokens.colors.accent.primaryDark,
    secondary: semanticTokens.colors.surface.elevated,
    secondaryLight: semanticTokens.colors.surface.hover,
    accent: semanticTokens.colors.accent.super,
    success: semanticTokens.colors.success.base,
    successLight: semanticTokens.colors.success.light,
    danger: semanticTokens.colors.destructive.base,
    dangerLight: semanticTokens.colors.destructive.light,
    light: {
      background: semanticTokens.colors.background.base,
      card: semanticTokens.colors.surface.elevated,
      cardBorder: semanticTokens.colors.cardBorder,
      text: semanticTokens.colors.text.primary,
      textMuted: semanticTokens.colors.text.secondary,
      border: semanticTokens.colors.divider,
      inputBg: semanticTokens.colors.surface.base,
    },
    dark: {
      background: semanticTokens.colors.background.base,
      card: semanticTokens.colors.surface.elevated,
      cardBorder: semanticTokens.colors.cardBorder,
      text: semanticTokens.colors.text.primary,
      textMuted: semanticTokens.colors.text.secondary,
      border: semanticTokens.colors.divider,
      inputBg: semanticTokens.colors.surface.base,
    },
  },
  radius: semanticTokens.radius,
  spacing: semanticTokens.spacing,
  typography: semanticTokens.typography,
  geometry: semanticTokens.geometry,
};

export type SemanticTokens = typeof semanticTokens;
export type DesignTokens = typeof designTokens;
