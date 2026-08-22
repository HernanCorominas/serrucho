import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  useColorScheme,
  Pressable,
} from "react-native";
import { colors } from "../../theme/colors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: "default" | "active" | "muted";
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = "default",
}) => {
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const getBorderColor = () => {
    if (variant === "active") return colors.primary;
    return theme.cardBorder;
  };

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: getBorderColor(),
          borderWidth: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginVertical: 6,
  },
});
