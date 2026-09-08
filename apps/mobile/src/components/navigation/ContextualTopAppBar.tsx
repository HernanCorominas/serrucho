import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { semanticTokens } from "@serrucho/ui";
import { useGlobalNavigation } from "../../navigation/GlobalNavigationContext";
import { DSText, DSIconButton, DSDivider } from "../ds";

export interface ContextualTopAppBarProps {
  title: string;
  subtitle?: string;
  onShare?: () => void;
  showShare?: boolean;
  rightAction?: React.ReactNode;
}

export const ContextualTopAppBar: React.FC<ContextualTopAppBarProps> = ({
  title,
  subtitle,
  onShare,
  showShare = true,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useGlobalNavigation();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 8),
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left: Hamburger button (>=44x44 touch target) */}
        <DSIconButton
          icon={<Ionicons name="menu" size={24} color={semanticTokens.colors.text.primary} />}
          onPress={openDrawer}
          accessibilityLabel="Abrir menú principal"
          style={styles.actionBtn}
        />

        {/* Center: Contextual Title with truncation */}
        <View style={styles.titleContainer}>
          <DSText
            variant="title"
            weight="bold"
            color="primary"
            numberOfLines={1}
            style={styles.titleText}
          >
            {title}
          </DSText>
          {subtitle ? (
            <DSText
              variant="caption"
              color="secondary"
              numberOfLines={1}
              style={styles.subtitleText}
            >
              {subtitle}
            </DSText>
          ) : null}
        </View>

        {/* Right: Share or Custom Action */}
        <View style={styles.rightContainer}>
          {rightAction ? (
            rightAction
          ) : showShare && onShare ? (
            <DSIconButton
              icon={<Ionicons name="share-social-outline" size={22} color={semanticTokens.colors.text.primary} />}
              onPress={onShare}
              accessibilityLabel="Compartir Serrucho"
              style={styles.actionBtn}
            />
          ) : (
            <View style={styles.placeholderBtn} />
          )}
        </View>
      </View>

      <DSDivider />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: semanticTokens.colors.surface.base,
    zIndex: 10,
  },
  contentRow: {
    height: semanticTokens.geometry.appBarHeight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: semanticTokens.spacing.sm,
  },
  actionBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: semanticTokens.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    textAlign: "center",
  },
  subtitleText: {
    textAlign: "center",
    marginTop: 1,
  },
  rightContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderBtn: {
    width: 44,
    height: 44,
  },
});
