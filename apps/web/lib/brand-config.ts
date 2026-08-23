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
  subtitle: "Divide gastos en coro sin enredos ni cálculos raros",
  domain: "serrucho.do",
  currency: {
    code: "DOP",
    symbol: "RD$",
    name: "Peso Dominicano",
  },
  logo: {
    emoji: "🪚",
    textGradient: "from-orange-600 via-amber-500 to-orange-500",
    bgGradient: "from-orange-600 to-amber-500",
    badgeBorder: "border-orange-500/20",
    shadow: "shadow-orange-500/25",
  },
  colors: {
    primary: "#ea580c", // Orange 600
    primaryLight: "#fff7ed",
    accent: "#f59e0b", // Amber 500
    success: "#10b981", // Emerald 500
    destructive: "#ef4444", // Red 500
  },
  links: {
    helpWhatsApp: "https://wa.me/18095550100",
    supportEmail: "soporte@serrucho.do",
  },
} as const;

export type BrandConfig = typeof BRAND_CONFIG;
