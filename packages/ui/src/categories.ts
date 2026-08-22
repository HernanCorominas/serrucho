export interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
  bgHex: string;
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryMeta> = {
  LODGING: {
    label: "Villa / Alojamiento",
    emoji: "🏡",
    color: "#a855f7",
    bgHex: "#faf5ff",
  },
  FOOD_GROCERIES: {
    label: "Supermercado & Compras",
    emoji: "🛒",
    color: "#10b981",
    bgHex: "#ecfdf5",
  },
  DRINKS_ALCOHOL: {
    label: "Bebidas & Alcohol",
    emoji: "🍻",
    color: "#f59e0b",
    bgHex: "#fffbeb",
  },
  FUEL_TRANSPORT: {
    label: "Combustible & Peajes",
    emoji: "⛽",
    color: "#3b82f6",
    bgHex: "#eff6ff",
  },
  RESTAURANT: {
    label: "Restaurante & Cenas",
    emoji: "🍽️",
    color: "#f43f5e",
    bgHex: "#fff1f2",
  },
  ENTERTAINMENT: {
    label: "Entretenimiento & Paseos",
    emoji: "🎉",
    color: "#6366f1",
    bgHex: "#eef2ff",
  },
  OTHER: {
    label: "Otros Gastos",
    emoji: "📦",
    color: "#64748b",
    bgHex: "#f8fafc",
  },
};
