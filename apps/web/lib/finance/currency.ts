/**
 * Multi-Currency Service for Serrucho
 * Uses free public exchange rate endpoints with zero API keys required,
 * with localStorage caching and offline fallback rates.
 */

export type SupportedCurrency = "DOP" | "USD" | "EUR";

export interface ExchangeRates {
  DOP: number; // 1 USD = X DOP (e.g. 60.50)
  EUR: number; // 1 USD = X EUR (e.g. 0.92)
  lastUpdated: string;
}

// Fallback rates if user is completely offline on initial visit
const FALLBACK_RATES: ExchangeRates = {
  DOP: 60.5,
  EUR: 0.92,
  lastUpdated: new Date().toISOString(),
};

const CACHE_KEY = "serrucho_exchange_rates";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours cache

/**
 * Fetches latest exchange rates or loads from cache / fallback.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - new Date(parsed.lastUpdated).getTime();
        if (age < CACHE_TTL_MS) {
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }

  try {
    // 100% Free public API, no key required, CORS enabled
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "force-cache",
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const rates: ExchangeRates = {
        DOP: Number(data.rates?.DOP) || FALLBACK_RATES.DOP,
        EUR: Number(data.rates?.EUR) || FALLBACK_RATES.EUR,
        lastUpdated: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
        } catch {
          // Ignore write errors
        }
      }
      return rates;
    }
  } catch (err) {
    console.warn("Could not fetch live exchange rates, using cached/fallback rates:", err);
  }

  return FALLBACK_RATES;
}

/**
 * Converts any supported currency amount to integer Dominican Pesos cents.
 */
export function convertToDOPCents(
  amount: number,
  currency: SupportedCurrency,
  customRate?: number
): number {
  if (amount <= 0 || isNaN(amount)) return 0;
  if (currency === "DOP") return Math.round(amount * 100);

  const rate = customRate || FALLBACK_RATES.DOP;

  if (currency === "USD") {
    return Math.round(amount * rate * 100);
  }

  if (currency === "EUR") {
    // If rate given is EUR to DOP, use directly; otherwise USD-based
    const eurToDopRate = customRate || FALLBACK_RATES.DOP / FALLBACK_RATES.EUR;
    return Math.round(amount * eurToDopRate * 100);
  }

  return Math.round(amount * 100);
}

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  DOP: "RD$",
  USD: "$",
  EUR: "€",
};

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  DOP: "Peso Dominicano (DOP)",
  USD: "Dólar Estadounidense (USD)",
  EUR: "Euro (EUR)",
};

/**
 * Formats a foreign amount with its currency symbol and code.
 */
export function formatForeignAmount(amountCents: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency as SupportedCurrency] || currency;
  const val = (amountCents / 100).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${val} ${currency}`;
}
