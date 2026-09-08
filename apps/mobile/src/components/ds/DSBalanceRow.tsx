import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { semanticTokens } from "@serrucho/ui";
import { DSAvatar } from "./DSAvatar";
import { DSText } from "./DSText";
import { DSBadge } from "./DSBadge";
import { DSDivider } from "./DSDivider";

export interface DSBalanceRowProps {
  id: string;
  name: string;
  totalPaidFormatted: string;
  totalOwedFormatted: string;
  netBalanceCents: number;
  netBalanceFormatted: string;
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const DSBalanceRow: React.FC<DSBalanceRowProps> = ({
  id,
  name,
  totalPaidFormatted,
  totalOwedFormatted,
  netBalanceCents,
  netBalanceFormatted,
  showDivider = true,
  style,
}) => {
  const isCreditor = netBalanceCents > 0;
  const isDebtor = netBalanceCents < 0;

  const badgeVariant = isCreditor ? "success" : isDebtor ? "danger" : "neutral";
  const badgeLabel = isCreditor
    ? `+${netBalanceFormatted}`
    : isDebtor
    ? `${netBalanceFormatted}`
    : "RD$ 0.00";

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.container}>
        {/* Left: Avatar */}
        <DSAvatar name={name} size="sm" style={styles.avatar} />

        {/* Center: Name & Paid/Owed Subtitle */}
        <View style={styles.textSlot}>
          <DSText variant="bodyMedium" weight="bold" color="primary" numberOfLines={1}>
            {name}
          </DSText>
          <DSText variant="caption" color="secondary" numberOfLines={1} style={styles.subtitle}>
            Pagó: {totalPaidFormatted} • Le toca: {totalOwedFormatted}
          </DSText>
        </View>

        {/* Right: Net Balance Badge */}
        <View style={styles.badgeSlot}>
          <DSBadge
            label={badgeLabel}
            variant={badgeVariant}
            size="sm"
          />
        </View>
      </View>

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
  avatar: {
    marginRight: semanticTokens.spacing.md,
  },
  textSlot: {
    flex: 1,
    justifyContent: "center",
    marginRight: semanticTokens.spacing.sm,
  },
  subtitle: {
    marginTop: 2,
  },
  badgeSlot: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  divider: {
    marginLeft: semanticTokens.spacing.screen + semanticTokens.geometry.avatarSmall + semanticTokens.spacing.md,
  },
});
