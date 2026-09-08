import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { semanticTokens } from "@serrucho/ui";

export interface DSDividerProps {
  inset?: number;
  color?: string;
  style?: ViewStyle;
}

export const DSDivider: React.FC<DSDividerProps> = ({
  inset = 0,
  color = semanticTokens.colors.divider,
  style,
}) => {
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color,
          marginLeft: inset,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: semanticTokens.geometry.hairline,
    width: "100%",
  },
});
