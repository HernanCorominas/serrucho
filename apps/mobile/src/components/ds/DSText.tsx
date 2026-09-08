import React from "react";
import { Text, StyleSheet, TextStyle, TextProps, StyleProp } from "react-native";
import { semanticTokens } from "@serrucho/ui";

export type DSTextVariant =
  | "title"
  | "section"
  | "body"
  | "bodyMedium"
  | "secondary"
  | "caption"
  | "badge";

export type DSTextColor =
  | "primary"
  | "secondary"
  | "muted"
  | "accent"
  | "super"
  | "destructive"
  | "success"
  | "inverse";

export interface DSTextProps extends TextProps {
  variant?: DSTextVariant;
  color?: DSTextColor;
  weight?: "regular" | "medium" | "semibold" | "bold";
  align?: "left" | "center" | "right";
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export const DSText: React.FC<DSTextProps> = ({
  variant = "body",
  color = "primary",
  weight,
  align,
  children,
  style,
  ...props
}) => {
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case "title":
        return {
          fontSize: semanticTokens.typography.sizes.screenTitle,
          lineHeight: semanticTokens.typography.lineHeights.screenTitle,
          fontWeight: weight
            ? semanticTokens.typography.weights[weight]
            : semanticTokens.typography.weights.bold,
        };
      case "section":
        return {
          fontSize: semanticTokens.typography.sizes.section,
          lineHeight: semanticTokens.typography.lineHeights.section,
          fontWeight: weight
            ? semanticTokens.typography.weights[weight]
            : semanticTokens.typography.weights.semibold,
        };
      case "bodyMedium":
        return {
          fontSize: semanticTokens.typography.sizes.body,
          lineHeight: semanticTokens.typography.lineHeights.body,
          fontWeight: weight
            ? semanticTokens.typography.weights[weight]
            : semanticTokens.typography.weights.medium,
        };
      case "secondary":
        return {
          fontSize: semanticTokens.typography.sizes.secondary,
          lineHeight: semanticTokens.typography.lineHeights.secondary,
          fontWeight: weight
            ? semanticTokens.typography.weights[weight]
            : semanticTokens.typography.weights.regular,
        };
      case "caption":
        return {
          fontSize: semanticTokens.typography.sizes.caption,
          lineHeight: semanticTokens.typography.lineHeights.caption,
          fontWeight: weight
            ? semanticTokens.typography.weights[weight]
            : semanticTokens.typography.weights.medium,
        };
      case "badge":
        return {
          fontSize: semanticTokens.typography.sizes.badge,
          lineHeight: semanticTokens.typography.lineHeights.badge,
          fontWeight: weight
            ? semanticTokens.typography.weights[weight]
            : semanticTokens.typography.weights.bold,
        };
      case "body":
      default:
        return {
          fontSize: semanticTokens.typography.sizes.body,
          lineHeight: semanticTokens.typography.lineHeights.body,
          fontWeight: weight
            ? semanticTokens.typography.weights[weight]
            : semanticTokens.typography.weights.regular,
        };
    }
  };

  const getColorValue = (): string => {
    switch (color) {
      case "secondary":
        return semanticTokens.colors.text.secondary;
      case "muted":
        return semanticTokens.colors.text.muted;
      case "accent":
        return semanticTokens.colors.accent.primary;
      case "super":
        return semanticTokens.colors.accent.super;
      case "destructive":
        return semanticTokens.colors.destructive.base;
      case "success":
        return semanticTokens.colors.success.base;
      case "inverse":
        return semanticTokens.colors.text.inverse;
      case "primary":
      default:
        return semanticTokens.colors.text.primary;
    }
  };

  return (
    <Text
      style={[
        styles.base,
        getVariantStyle(),
        { color: getColorValue(), textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: semanticTokens.typography.fontFamily,
    includeFontPadding: false,
  },
});
