import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Modal, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDOP } from "@serrucho/core";
import { useAppTheme } from "../../theme/colors";
import { triggerHaptic } from "../../utils/haptics";
import { DSText, DSSurface } from "../ds";

interface PaymentSettledAnimationProps {
  visible: boolean;
  debtorName: string;
  creditorName: string;
  amountCents: number;
  onFinish: () => void;
}

export const PaymentSettledAnimation: React.FC<PaymentSettledAnimationProps> = ({
  visible,
  debtorName,
  creditorName,
  amountCents,
  onFinish,
}) => {
  const { tokens } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      triggerHaptic("success");
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim, onFinish]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={[styles.overlay, { backgroundColor: tokens.colors.overlay }]}>
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <DSSurface variant="elevated" style={styles.card}>
            {/* Green Check Circle */}
            <View style={[styles.checkCircle, { backgroundColor: tokens.colors.success.base }]}>
              <Ionicons name="checkmark-sharp" size={48} color="#FFFFFF" />
            </View>

            <DSText variant="title" weight="bold" style={styles.title}>
              ¡Pago Confirmado! 🎉
            </DSText>

            <DSText variant="title" weight="bold" style={[styles.amountText, { color: tokens.colors.success.base }]}>
              {formatDOP(amountCents)}
            </DSText>

            <DSText variant="body" color="secondary" style={styles.detailsText}>
              <DSText variant="body" weight="semibold">{debtorName}</DSText> saldó su deuda con{" "}
              <DSText variant="body" weight="semibold">{creditorName}</DSText>.
            </DSText>

            <View style={[styles.badgeContainer, { backgroundColor: tokens.colors.success.light, borderColor: tokens.colors.success.base }]}>
              <DSText variant="caption" weight="bold" style={{ color: tokens.colors.success.hover }}>
                ✓ ESTADO: SALDADO
              </DSText>
            </View>
          </DSSurface>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 360,
  },
  card: {
    padding: 28,
    borderRadius: 24,
    alignItems: "center",
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  amountText: {
    fontSize: 28,
    marginBottom: 12,
  },
  detailsText: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  badgeContainer: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
});
