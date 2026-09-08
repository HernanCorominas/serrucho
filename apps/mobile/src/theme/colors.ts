import { semanticTokens } from "@serrucho/ui";

/**
 * Mobile Theme & Color Bridge
 * Re-exports semantic tokens from @serrucho/ui with backward compatibility for existing code.
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

  // Semantic surfaces & backgrounds (Dark Baseline)
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

  // Direct access to semanticTokens
  tokens: semanticTokens,
};
