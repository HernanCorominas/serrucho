import { describe, it, expect } from "vitest";
import {
  generateSettlementToken,
  hashSettlementToken,
  maskDestination,
} from "@/lib/security/tokens";

describe("Token Security Module", () => {
  it("generates unique 64-character hex tokens", () => {
    const token1 = generateSettlementToken();
    const token2 = generateSettlementToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it("produces deterministic SHA-256 hashes", () => {
    const token = "d0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const hash1 = hashSettlementToken(token);
    const hash2 = hashSettlementToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("masks emails and phones correctly for notification logs", () => {
    expect(maskDestination("carlos@serrucho.do")).toBe("c***s@serrucho.do");
    expect(maskDestination("8095550199")).toBe("809***0199");
  });
});
