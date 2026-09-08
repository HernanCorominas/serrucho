import { describe, it, expect } from "vitest";
import { semanticTokens, designTokens } from "@serrucho/ui";
import {
  splitEqually,
  simplifyDebts,
  toCents,
  fromCents,
  formatDOP,
} from "@serrucho/core";

describe("SER-KITTY-010B — Design System Tokens & Shared Primitives", () => {
  describe("1. Semantic Design Tokens Structure", () => {
    it("DS-01: resolves core dark background & surface tokens", () => {
      expect(semanticTokens.colors.background.base).toBeDefined();
      expect(typeof semanticTokens.colors.background.base).toBe("string");
      expect(semanticTokens.colors.surface.elevated).toBeDefined();
      expect(semanticTokens.colors.surface.drawer).toBeDefined();
      expect(semanticTokens.colors.divider).toBeDefined();
    });

    it("DS-02: resolves high-contrast typography and text colors", () => {
      expect(semanticTokens.colors.text.primary).toBeDefined();
      expect(semanticTokens.colors.text.secondary).toBeDefined();
      expect(semanticTokens.colors.text.muted).toBeDefined();
      expect(semanticTokens.typography.sizes.screenTitle).toBeGreaterThanOrEqual(18);
      expect(semanticTokens.typography.sizes.body).toBe(14);
      expect(semanticTokens.typography.weights.bold).toBe("700");
    });

    it("DS-03: resolves purple/lilac primary accent and destructive tokens", () => {
      expect(semanticTokens.colors.accent.primary).toBeDefined();
      expect(semanticTokens.colors.accent.super).toBeDefined();
      expect(semanticTokens.colors.destructive.base).toBeDefined();
      expect(semanticTokens.colors.success.base).toBeDefined();
    });

    it("DS-04: verifies spacing grid and radius geometry", () => {
      expect(semanticTokens.spacing.screen).toBe(16);
      expect(semanticTokens.spacing.xs).toBe(4);
      expect(semanticTokens.spacing.sm).toBe(8);
      expect(semanticTokens.spacing.md).toBe(12);
      expect(semanticTokens.spacing.lg).toBe(16);
      expect(semanticTokens.spacing.section).toBe(24);

      expect(semanticTokens.radius.pill).toBe(9999);
      expect(semanticTokens.radius.md).toBe(12);
    });

    it("DS-05: verifies accessibility geometry constraints", () => {
      expect(semanticTokens.geometry.touchTargetMinimum).toBeGreaterThanOrEqual(44);
      expect(semanticTokens.geometry.touchTarget).toBeGreaterThanOrEqual(48);
      expect(semanticTokens.geometry.hairline).toBe(1);
      expect(semanticTokens.geometry.appBarHeight).toBe(56);
      expect(semanticTokens.geometry.bottomTabBarHeight).toBe(60);
    });
  });

  describe("2. Backward Compatibility Layer", () => {
    it("DS-06: preserves legacy designTokens format for existing components", () => {
      expect(designTokens.colors.primary).toBe(semanticTokens.colors.accent.primary);
      expect(designTokens.colors.dark.background).toBe(semanticTokens.colors.background.base);
      expect(designTokens.colors.dark.card).toBe(semanticTokens.colors.surface.elevated);
      expect(designTokens.radius.md).toBe(semanticTokens.radius.md);
      expect(designTokens.spacing.screen).toBe(16);
    });
  });

  describe("3. Financial Invariant & Security Shielding (Non-Regression)", () => {
    it("DS-07: confirms BAL-08 deterministic integer remainder allocation is unchanged", () => {
      const splits = splitEqually(10000, ["p1", "p2", "p3"]);
      expect(splits).toHaveLength(3);
      const totalOwed = splits.reduce((sum, s) => sum + s.owedCents, 0);
      expect(totalOwed).toBe(10000);

      // Deterministic sorted ID distribution
      expect(splits[0].owedCents).toBe(3334);
      expect(splits[1].owedCents).toBe(3333);
      expect(splits[2].owedCents).toBe(3333);
    });

    it("DS-08: confirms integer cents math & zero-sum law remain intact", () => {
      expect(toCents(12.5)).toBe(1250);
      expect(fromCents(1250)).toBe(12.5);
      expect(formatDOP(1250)).toContain("12.50");

      const participants = [
        { id: "p1", name: "Juan" },
        { id: "p2", name: "Maria" },
      ];
      const netBalances = new Map<string, number>([
        ["p1", -5000],
        ["p2", 5000],
      ]);

      const transfers = simplifyDebts(participants, netBalances);
      expect(transfers).toHaveLength(1);
      expect(transfers[0].amount_cents).toBe(5000);
      expect(transfers[0].from_participant_id).toBe("p1");
      expect(transfers[0].to_participant_id).toBe("p2");
    });

    it("DS-09: confirms 0 runtime references to Itemized Split in tokens/design system", () => {
      const tokenKeys = JSON.stringify(semanticTokens);
      expect(tokenKeys.toLowerCase()).not.toContain("itemized");
    });
  });
});
