import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { semanticTokens } from "@serrucho/ui";
import { triggerHaptic } from "../../utils/haptics";
import { DSText, DSDivider } from "../ds";

export type ActiveKittyTab = "expenses" | "balances" | "settings";

export interface ActiveKittyBottomTabsProps {
  activeTab: ActiveKittyTab;
  onSelectTab: (tab: ActiveKittyTab) => void;
  expensesCount?: number;
}

export const ActiveKittyBottomTabs: React.FC<ActiveKittyBottomTabsProps> = ({
  activeTab,
  onSelectTab,
  expensesCount,
}) => {
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab: ActiveKittyTab) => {
    if (tab === activeTab) return;
    triggerHaptic("selection");
    onSelectTab(tab);
  };

  const tabs: {
    key: ActiveKittyTab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
    badgeCount?: number;
  }[] = [
    {
      key: "expenses",
      label: "Gastos",
      icon: "receipt-outline",
      activeIcon: "receipt",
      badgeCount: expensesCount,
    },
    {
      key: "balances",
      label: "Saldos",
      icon: "scale-outline",
      activeIcon: "scale",
    },
    {
      key: "settings",
      label: "Ajustes",
      icon: "settings-outline",
      activeIcon: "settings-sharp",
    },
  ];

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <DSDivider />
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const color = isActive
            ? semanticTokens.colors.accent.primary
            : semanticTokens.colors.text.secondary;

          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(tab.key)}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              {/* Active top line accent indicator */}
              {isActive && <View style={styles.activeIndicator} />}

              <View style={styles.iconContainer}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={color}
                />
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <View style={styles.badge}>
                    <DSText variant="caption" weight="bold" style={styles.badgeText}>
                      {tab.badgeCount > 99 ? "99+" : tab.badgeCount}
                    </DSText>
                  </View>
                )}
              </View>

              <DSText
                variant="caption"
                weight={isActive ? "bold" : "regular"}
                style={{ color, marginTop: 2, fontSize: 11 }}
              >
                {tab.label}
              </DSText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: semanticTokens.colors.surface.base,
    borderTopWidth: 0,
  },
  container: {
    height: semanticTokens.geometry.bottomTabBarHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingTop: 4,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 32,
    height: 3,
    backgroundColor: semanticTokens.colors.accent.primary,
    borderRadius: semanticTokens.radius.pill,
  },
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: semanticTokens.colors.accent.primary,
    borderRadius: semanticTokens.radius.pill,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    color: "#FFFFFF",
    lineHeight: 11,
  },
});
