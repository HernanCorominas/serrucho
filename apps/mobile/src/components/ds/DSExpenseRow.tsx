import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
} from "react-native";
import { semanticTokens } from "@serrucho/ui";
import { DSAvatar } from "./DSAvatar";
import { DSText } from "./DSText";
import { DSDivider } from "./DSDivider";
import { triggerHaptic } from "../../utils/haptics";

export interface DSExpenseRowProps {
  id: string;
  description: string;
  amountFormatted: string;
  payerName: string;
  participantsCount: number;
  categoryEmoji?: string;
  dateFormatted?: string;
  onPress?: () => void;
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const DSExpenseRow: React.FC<DSExpenseRowProps> = ({
  id,
  description,
  amountFormatted,
  payerName,
  participantsCount,
  categoryEmoji,
  dateFormatted,
  onPress,
  showDivider = true,
  style,
}) => {
  const handlePress = () => {
    if (!onPress) return;
    triggerHaptic("light");
    onPress();
  };

  const splitText =
    participantsCount === 1
      ? "1 persona"
      : `${participantsCount} personas`;

  return (
    <View style={[styles.wrapper, style]}>
      <Pressable
        onPress={handlePress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`Gasto: ${description}, ${amountFormatted}, pagado por ${payerName}`}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
        ]}
      >
        {/* Left: Payer Avatar */}
        <View style={styles.avatarSlot}>
          <DSAvatar name={payerName} size="sm" />
          {categoryEmoji && (
            <View style={styles.categoryBadge}>
              <DSText style={styles.categoryEmoji}>{categoryEmoji}</DSText>
            </View>
          )}
        </View>

        {/* Center: Description & Subtitle */}
        <View style={styles.detailsSlot}>
          <DSText
            variant="bodyMedium"
            weight="bold"
            color="primary"
            numberOfLines={1}
            style={styles.description}
          >
            {description}
          </DSText>
          <View style={styles.metaRow}>
            <DSText variant="caption" color="secondary" numberOfLines={1}>
              {payerName} • {splitText}
              {dateFormatted ? ` • ${dateFormatted}` : ""}
            </DSText>
          </View>
        </View>

        {/* Right: Amount */}
        <View style={styles.amountSlot}>
          <DSText
            variant="bodyMedium"
            weight="bold"
            color="primary"
            style={styles.amount}
          >
            {amountFormatted}
          </DSText>
        </View>
      </Pressable>

      {showDivider && <DSDivider style={styles.divider} />}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: semanticTokens.spacing.row,
    paddingHorizontal: semanticTokens.spacing.screen,
    minHeight: semanticTokens.geometry.touchTargetMinimum,
    backgroundColor: "transparent",
  },
  pressed: {
    backgroundColor: semanticTokens.colors.surface.hover,
  },
  avatarSlot: {
    position: "relative",
    marginRight: semanticTokens.spacing.md,
  },
  categoryBadge: {
    position: "absolute",
    bottom: -3,
    right: -5,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: semanticTokens.radius.pill,
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: semanticTokens.colors.divider,
  },
  categoryEmoji: {
    fontSize: 10,
    lineHeight: 12,
  },
  detailsSlot: {
    flex: 1,
    justifyContent: "center",
    marginRight: semanticTokens.spacing.sm,
  },
  description: {
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountSlot: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  amount: {
    letterSpacing: 0.2,
  },
  divider: {
    marginLeft: semanticTokens.spacing.screen + semanticTokens.geometry.avatarSmall + semanticTokens.spacing.md,
  },
});
