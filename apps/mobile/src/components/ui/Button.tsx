import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from "react-native";
import { colors } from "../../theme/colors";
import { triggerHaptic } from "../../utils/haptics";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const isDark = useColorScheme() === "dark";

  const handlePress = () => {
    if (disabled || loading) return;
    triggerHaptic("light");
    onPress();
  };

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return isDark ? "#334155" : "#cbd5e1";
    switch (variant) {
      case "primary":
        return pressed ? colors.primaryDark : colors.primary;
      case "secondary":
        return pressed ? "#0f766e" : colors.secondary;
      case "danger":
        return pressed ? "#b91c1c" : colors.danger;
      case "outline":
      case "ghost":
        return pressed ? (isDark ? "#1e293b" : "#f1f5f9") : "transparent";
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return isDark ? "#64748b" : "#94a3b8";
    switch (variant) {
      case "outline":
        return colors.primary;
      case "ghost":
        return isDark ? colors.dark.text : colors.light.text;
      default:
        return "#ffffff";
    }
  };

  const getPadding = () => {
    switch (size) {
      case "sm":
        return { paddingVertical: 8, paddingHorizontal: 12 };
      case "lg":
        return { paddingVertical: 16, paddingHorizontal: 24 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 16 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "sm":
        return 13;
      case "lg":
        return 16;
      default:
        return 14;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: variant === "outline" ? colors.primary : "transparent",
          borderWidth: variant === "outline" ? 1.5 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getFontSize(), marginLeft: icon ? 8 : 0 },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontWeight: "700",
    textAlign: "center",
  },
});
