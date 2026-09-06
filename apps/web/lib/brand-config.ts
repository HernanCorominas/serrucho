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
    textGradient: "from-teal-600 via-emerald-600 to-cyan-600",
    bgGradient: "from-teal-600 to-emerald-600",
    badgeBorder: "border-teal-500/20",
    shadow: "shadow-teal-500/25",
  },
  colors: {
    primary: "#00a896", // Kittysplit signature teal
    primaryDark: "#028090",
    primaryLight: "#e6f6f4",
    accent: "#f26419", // Kittysplit warm coral accent
    success: "#10b981", // Emerald 500
    destructive: "#ef4444", // Red 500
  },
  links: {
    helpWhatsApp: "https://wa.me/18095550100",
    supportEmail: "soporte@serrucho.do",
  },
} as const;

export type BrandConfig = typeof BRAND_CONFIG;
