import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { semanticTokens } from "@serrucho/ui";
import { DSText } from "./DSText";

export interface DSSectionProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const DSSection: React.FC<DSSectionProps> = ({
  title,
  action,
  children,
  style,
}) => {
  return (
    <View style={[styles.sectionContainer, style]}>
      {(title || action) && (
        <View style={styles.headerRow}>
          {title && (
            <DSText
              variant="caption"
              color="secondary"
              weight="bold"
              style={styles.titleText}
            >
              {title.toUpperCase()}
            </DSText>
          )}
          {action && <View style={styles.actionContainer}>{action}</View>}
        </View>
      )}
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: semanticTokens.spacing.section,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: semanticTokens.spacing.screen,
    marginBottom: 8,
  },
  titleText: {
    letterSpacing: 0.8,
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  contentContainer: {
    width: "100%",
  },
});
