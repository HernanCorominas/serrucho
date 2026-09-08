import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { semanticTokens } from "@serrucho/ui";
import { DSText } from "./DSText";

export type DSBadgeVariant =
  | "accent"
  | "super"
  | "success"
  | "danger"
  | "warning"
  | "neutral";

export type DSBadgeSize = "sm" | "md";

export interface DSBadgeProps {
  label: string;
  variant?: DSBadgeVariant;
  size?: DSBadgeSize;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const DSBadge: React.FC<DSBadgeProps> = ({
  label,
  variant = "neutral",
  size = "md",
  icon,
  style,
}) => {
  const getColors = (): { bg: string; text: string; border: string } => {
    switch (variant) {
      case "accent":
        return {
          bg: "#2E1065",
          text: semanticTokens.colors.accent.primaryLight,
          border: semanticTokens.colors.accent.primaryDark,
        };
      case "super":
        return {
          bg: "#451A03",
          text: semanticTokens.colors.accent.superLight,
          border: semanticTokens.colors.accent.super,
        };
      case "success":
        return {
          bg: "#064E3B",
          text: semanticTokens.colors.success.light,
          border: semanticTokens.colors.success.base,
        };
      case "danger":
        return {
          bg: "#7F1D1D",
          text: semanticTokens.colors.destructive.light,
          border: semanticTokens.colors.destructive.base,
        };
      case "warning":
        return {
          bg: "#78350F",
          text: "#FEF3C7",
          border: "#D97706",
        };
      case "neutral":
      default:
        return {
          bg: semanticTokens.colors.surface.elevated,
          text: semanticTokens.colors.text.secondary,
          border: semanticTokens.colors.divider,
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingVertical: size === "sm" ? 2 : 4,
          paddingHorizontal: size === "sm" ? 8 : 12,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <DSText
        variant="badge"
        style={{
          color: colors.text,
          fontSize: size === "sm" ? 10 : 11,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </DSText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: semanticTokens.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: 4,
  },
});
