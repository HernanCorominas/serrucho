import React from "react";
import {
  Pressable,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { semanticTokens } from "@serrucho/ui";
import { triggerHaptic } from "../../utils/haptics";
import { DSText } from "./DSText";
import { DSDivider } from "./DSDivider";

export interface DSSettingRowProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  showDivider?: boolean;
  dividerInset?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const DSSettingRow: React.FC<DSSettingRowProps> = ({
  title,
  subtitle,
  leading,
  trailing,
  showChevron = true,
  onPress,
  disabled = false,
  destructive = false,
  showDivider = true,
  dividerInset = 0,
  style,
  accessibilityLabel,
}) => {
  const handlePress = () => {
    if (disabled || !onPress) return;
    triggerHaptic(destructive ? "warning" : "light");
    onPress();
  };

  const content = (
    <View style={[styles.rowContainer, style]}>
      <View style={styles.contentRow}>
        {leading && <View style={styles.leadingContainer}>{leading}</View>}

        <View style={styles.textContainer}>
          <DSText
            variant="bodyMedium"
            color={destructive ? "destructive" : "primary"}
            weight="medium"
            numberOfLines={1}
          >
            {title}
          </DSText>
          {subtitle && (
            <DSText
              variant="secondary"
              color="secondary"
              numberOfLines={2}
              style={styles.subtitle}
            >
              {subtitle}
            </DSText>
          )}
        </View>

        <View style={styles.trailingContainer}>
          {trailing}
          {showChevron && onPress && !trailing && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={semanticTokens.colors.text.secondary}
            />
          )}
        </View>
      </View>

      {showDivider && <DSDivider inset={dividerInset} />}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.pressable,
          pressed && { backgroundColor: semanticTokens.colors.surface.hover },
          disabled && styles.disabled,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  pressable: {
    minHeight: semanticTokens.geometry.settingRowHeight,
  },
  rowContainer: {
    width: "100%",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: semanticTokens.spacing.screen,
    minHeight: semanticTokens.geometry.settingRowHeight,
  },
  leadingContainer: {
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  subtitle: {
    marginTop: 2,
  },
  trailingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  disabled: {
    opacity: 0.5,
  },
});
