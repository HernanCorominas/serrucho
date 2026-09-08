/**
 * Central Brand & Design System Configuration for Serrucho.
 * 
 * Edit this file to customize:
 * - App Name & Tagline
 * - Logo Symbol, Badges & Variants
 * - Brand Colors (Primary, Accents, Gradients)
 * - Dominican Currency & Bank Presets
 */

export const BRAND_CONFIG = {
  name: "Serrucho",
  legalName: "Serrucho 🇩🇴",
  tagline: "Reparto Inteligente",
  subtitle: "Divide gastos en grupo sin enredos ni estrés",
  domain: "serrucho.do",
  currency: {
    code: "DOP",
    symbol: "RD$",
    name: "Peso Dominicano",
  },
  logo: {
    emoji: "🪚",
    textGradient: "from-purple-600 via-violet-600 to-indigo-600",
    bgGradient: "from-purple-600 to-violet-600",
    badgeBorder: "border-purple-500/20",
    shadow: "shadow-purple-500/25",
  },
  colors: {
    primary: "#8B5CF6", // Serrucho primary purple
    primaryDark: "#7C3AED",
    primaryLight: "#EDE9FE",
    accent: "#F97316", // Warm coral accent
    success: "#10B981", // Success green
    destructive: "#EF4444", // Destructive red
  },
  links: {
    helpWhatsApp: "https://wa.me/18095550100",
    supportEmail: "soporte@serrucho.do",
  },
} as const;

export type BrandConfig = typeof BRAND_CONFIG;
