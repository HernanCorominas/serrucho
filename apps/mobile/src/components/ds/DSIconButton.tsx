import React from "react";
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { semanticTokens } from "@serrucho/ui";
import { triggerHaptic } from "../../utils/haptics";

export type DSIconButtonVariant = "default" | "filled" | "destructive" | "ghost";
export type DSIconButtonSize = "sm" | "md" | "lg";

export interface DSIconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: DSIconButtonVariant;
  size?: DSIconButtonSize;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const DSIconButton: React.FC<DSIconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  variant = "default",
  size = "md",
  disabled = false,
  style,
}) => {
  const getDimension = (): number => {
    switch (size) {
      case "sm":
        return 36;
      case "lg":
        return 52;
      case "md":
      default:
        return semanticTokens.geometry.touchTarget;
    }
  };

  const getBackgroundColor = (pressed: boolean): string => {
    if (disabled) return "transparent";
    switch (variant) {
      case "filled":
        return pressed
          ? semanticTokens.colors.surface.hover
          : semanticTokens.colors.surface.elevated;
      case "destructive":
        return pressed
          ? semanticTokens.colors.destructive.hover
          : semanticTokens.colors.destructive.base;
      case "ghost":
      case "default":
      default:
        return pressed ? semanticTokens.colors.surface.hover : "transparent";
    }
  };

  const dim = getDimension();

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        triggerHaptic(variant === "destructive" ? "warning" : "light");
        onPress();
      }}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: getBackgroundColor(pressed),
          minWidth: semanticTokens.geometry.touchTargetMinimum,
          minHeight: semanticTokens.geometry.touchTargetMinimum,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});
