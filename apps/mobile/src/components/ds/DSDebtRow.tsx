import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { semanticTokens } from "@serrucho/ui";
import { DSAvatar } from "./DSAvatar";
import { DSText } from "./DSText";
import { DSButton } from "./DSButton";
import { DSDivider } from "./DSDivider";

export interface DSDebtRowProps {
  debtorName: string;
  creditorName: string;
  amountFormatted: string;
  onSettle?: () => void;
  onWhatsApp?: () => void;
  canSettle?: boolean;
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const DSDebtRow: React.FC<DSDebtRowProps> = ({
  debtorName,
  creditorName,
  amountFormatted,
  onSettle,
  onWhatsApp,
  canSettle = true,
  showDivider = true,
  style,
}) => {
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.container}>
        {/* Top: Avatars & Description Row */}
        <View style={styles.topRow}>
          <View style={styles.avatarPair}>
            <DSAvatar name={debtorName} size="sm" />
            <View style={styles.arrowBadge}>
              <Ionicons
                name="arrow-forward"
                size={12}
                color={semanticTokens.colors.accent.primary}
              />
            </View>
            <DSAvatar name={creditorName} size="sm" style={styles.creditorAvatar} />
          </View>

          <View style={styles.textSlot}>
            <View style={styles.relationRow}>
              <DSText variant="bodyMedium" weight="bold" color="primary">
                {debtorName}
              </DSText>
              <DSText variant="caption" color="secondary" style={styles.middleText}>
                le debe a
              </DSText>
              <DSText variant="bodyMedium" weight="bold" color="primary">
                {creditorName}
              </DSText>
            </View>
            <DSText
              variant="title"
              weight="bold"
              style={styles.amountText}
            >
              {amountFormatted}
            </DSText>
          </View>
        </View>

        {/* Bottom: Action Buttons */}
        <View style={styles.actionRow}>
          {canSettle && onSettle && (
            <DSButton
              title="Saldar ✓"
              variant="primary"
              size="sm"
              onPress={onSettle}
              style={styles.actionBtn}
            />
          )}

          {onWhatsApp && (
            <DSButton
              title="WhatsApp"
              variant="secondary"
              size="sm"
              icon={
                <Ionicons
                  name="logo-whatsapp"
                  size={15}
                  color={semanticTokens.colors.text.primary}
                />
              }
              onPress={onWhatsApp}
              style={styles.actionBtn}
            />
          )}
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
    paddingVertical: semanticTokens.spacing.md,
    paddingHorizontal: semanticTokens.spacing.screen,
    backgroundColor: "transparent",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: semanticTokens.spacing.sm,
  },
  avatarPair: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: semanticTokens.spacing.md,
  },
  arrowBadge: {
    marginHorizontal: -4,
    zIndex: 2,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: semanticTokens.radius.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: semanticTokens.colors.divider,
  },
  creditorAvatar: {
    zIndex: 1,
  },
  textSlot: {
    flex: 1,
    justifyContent: "center",
  },
  relationRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 2,
  },
  middleText: {
    marginHorizontal: 2,
  },
  amountText: {
    color: semanticTokens.colors.accent.primaryLight,
    letterSpacing: 0.3,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 38,
  },
  divider: {
    marginVertical: semanticTokens.spacing.xs,
  },
});
