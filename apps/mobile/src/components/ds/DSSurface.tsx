import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Pressable,
} from "react-native";
import { semanticTokens } from "@serrucho/ui";
import { triggerHaptic } from "../../utils/haptics";

export type DSSurfaceVariant = "base" | "elevated" | "drawer" | "bordered";

export interface DSSurfaceProps {
  variant?: DSSurfaceVariant;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export const DSSurface: React.FC<DSSurfaceProps> = ({
  variant = "base",
  style,
  children,
  onPress,
  disabled = false,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: semanticTokens.colors.surface.elevated,
          borderRadius: semanticTokens.radius.md,
          borderColor: semanticTokens.colors.cardBorder,
          borderWidth: semanticTokens.geometry.hairline,
        };
      case "drawer":
        return {
          backgroundColor: semanticTokens.colors.surface.drawer,
          borderRadius: 0,
        };
      case "bordered":
        return {
          backgroundColor: "transparent",
          borderRadius: semanticTokens.radius.md,
          borderColor: semanticTokens.colors.divider,
          borderWidth: semanticTokens.geometry.hairline,
        };
      case "base":
      default:
        return {
          backgroundColor: semanticTokens.colors.surface.base,
          borderRadius: 0,
        };
    }
  };

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          if (disabled) return;
          triggerHaptic("light");
          onPress();
        }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.base,
          getVariantStyle(),
          pressed && { backgroundColor: semanticTokens.colors.surface.hover },
          disabled && { opacity: 0.5 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.base, getVariantStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
