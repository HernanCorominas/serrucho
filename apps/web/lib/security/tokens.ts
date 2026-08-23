import crypto from "crypto";

/**
 * Generates a cryptographically secure random token for public settlement links.
 * Returns a 32-byte (256-bit) hex string.
 */
export function generateSettlementToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Computes the SHA-256 hash of a public token.
 * This hash is stored in the database so that raw tokens are never persisted in plaintext.
 */
export function hashSettlementToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Masks an email or phone number for privacy in notification logs.
 * Example: 'carlos@serrucho.do' -> 'c***s@serrucho.do'
 * Example: '8095550199' -> '809***0199'
 */
export function maskDestination(destination: string): string {
  if (!destination) return "***";
  if (destination.includes("@")) {
    const [local, domain] = destination.split("@");
    if (local.length <= 2) return `*@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }
  if (destination.length > 4) {
    return `${destination.slice(0, 3)}***${destination.slice(-4)}`;
  }
  return "***";
}

/**
 * Generates a cryptographically secure random token for read-only access links.
 * Returns a 16-byte (128-bit) hex string (32 characters).
 */
export function generateReadOnlyToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

