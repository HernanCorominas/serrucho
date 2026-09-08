import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { semanticTokens } from "@serrucho/ui";
import { DSText } from "./DSText";

export interface DSEmptyStateProps {
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const DSEmptyState: React.FC<DSEmptyStateProps> = ({
  illustration,
  title,
  description,
  action,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {illustration && <View style={styles.illustrationSlot}>{illustration}</View>}

      <DSText
        variant="title"
        color="primary"
        align="center"
        weight="bold"
        style={styles.title}
      >
        {title}
      </DSText>

      {description && (
        <DSText
          variant="body"
          color="secondary"
          align="center"
          style={styles.description}
        >
          {description}
        </DSText>
      )}

      {action && <View style={styles.actionSlot}>{action}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: semanticTokens.spacing.screen * 1.5,
    paddingVertical: semanticTokens.spacing.xxl,
    width: "100%",
  },
  illustrationSlot: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    maxWidth: 280,
  },
  actionSlot: {
    width: "100%",
    maxWidth: 240,
    alignItems: "center",
  },
});
