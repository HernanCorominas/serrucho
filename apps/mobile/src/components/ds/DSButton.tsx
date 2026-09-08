import React from "react";
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from "react-native";
import { semanticTokens } from "@serrucho/ui";
import { triggerHaptic } from "../../utils/haptics";
import { DSText } from "./DSText";

export type DSButtonVariant = "primary" | "secondary" | "destructive" | "ghost" | "outline";
export type DSButtonSize = "sm" | "md" | "lg";

export interface DSButtonProps {
  title: string;
  onPress: () => void;
  variant?: DSButtonVariant;
  size?: DSButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const DSButton: React.FC<DSButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    triggerHaptic(variant === "destructive" ? "warning" : "light");
    onPress();
  };

  const getBackgroundColor = (pressed: boolean): string => {
    if (disabled) return "#1E293B"; // Dark disabled surface

    switch (variant) {
      case "primary":
        return pressed
          ? semanticTokens.colors.accent.primaryHover
          : semanticTokens.colors.accent.primary;
      case "secondary":
        return pressed
          ? semanticTokens.colors.surface.hover
          : semanticTokens.colors.surface.elevated;
      case "destructive":
        return pressed
          ? semanticTokens.colors.destructive.hover
          : semanticTokens.colors.destructive.base;
      case "outline":
      case "ghost":
        return pressed ? semanticTokens.colors.surface.hover : "transparent";
      default:
        return semanticTokens.colors.accent.primary;
    }
  };

  const getBorderColor = (): string => {
    if (disabled) return "transparent";
    switch (variant) {
      case "outline":
        return semanticTokens.colors.accent.primary;
      case "secondary":
        return semanticTokens.colors.cardBorder;
      default:
        return "transparent";
    }
  };

  const getTextColor = (): "primary" | "secondary" | "muted" | "accent" | "destructive" | "inverse" => {
    if (disabled) return "muted";
    switch (variant) {
      case "outline":
      case "ghost":
        return "primary";
      case "primary":
      case "destructive":
      default:
        return "primary";
    }
  };

  const getDimensions = (): { height: number; paddingHorizontal: number; fontSize: number } => {
    switch (size) {
      case "sm":
        return { height: 36, paddingHorizontal: 12, fontSize: 13 };
      case "lg":
        return { height: 56, paddingHorizontal: 24, fontSize: 16 };
      case "md":
      default:
        return {
          height: semanticTokens.geometry.touchTarget,
          paddingHorizontal: 16,
          fontSize: 14,
        };
    }
  };

  const dims = getDimensions();

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" || variant === "secondary" ? 1 : 0,
          height: dims.height,
          paddingHorizontal: dims.paddingHorizontal,
          minHeight: semanticTokens.geometry.touchTargetMinimum,
          minWidth: semanticTokens.geometry.touchTargetMinimum,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={semanticTokens.colors.text.primary} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === "left" && <View style={styles.leftIcon}>{icon}</View>}
          <DSText
            variant="bodyMedium"
            color={getTextColor()}
            weight="bold"
            style={[{ fontSize: dims.fontSize }, textStyle]}
          >
            {title}
          </DSText>
          {icon && iconPosition === "right" && <View style={styles.rightIcon}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: semanticTokens.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
