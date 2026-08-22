import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";

interface BadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "neutral",
  size = "md",
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case "success":
        return { bg: colors.successLight, text: colors.success, border: "#a7f3d0" };
      case "warning":
        return { bg: "#fef3c7", text: "#b45309", border: "#fde68a" };
      case "danger":
        return { bg: colors.dangerLight, text: colors.danger, border: "#fecaca" };
      case "info":
        return { bg: colors.primaryLight, text: colors.primary, border: "#fed7aa" };
      default:
        return { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
    }
  };

  const current = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
          paddingVertical: size === "sm" ? 2 : 4,
          paddingHorizontal: size === "sm" ? 6 : 10,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: current.text,
            fontSize: size === "sm" ? 10 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
  },
});
