import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../theme/colors";
import { mobileStorage } from "../../services/storage";
import { triggerHaptic } from "../../utils/haptics";
import { DSText, DSButton, DSSurface } from "../ds";

interface OnboardingModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const SLIDES = [
  {
    icon: "calculator-outline" as const,
    title: "Divide gastos sin enredos 🪚",
    description:
      "Crea un Serrucho para viajes, salidas o coro con amigos. Cada gasto se divide con matemática exacta en DOP.",
  },
  {
    icon: "share-social-outline" as const,
    title: "Invita y únete al instante 🔗",
    description:
      "Comparte el enlace directo por WhatsApp. Cada persona entra y selecciona quién es sin necesidad de registros complicados.",
  },
  {
    icon: "pie-chart-outline" as const,
    title: "Balances y deudas mínimas ⚖️",
    description:
      "Serrucho simplifica automáticamente las deudas para que el grupo haga la menor cantidad posible de transferencias.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Saldos seguros con 4 dígitos 🔒",
    description:
      "Solo el deudor y el acreedor intervienen al saldar, confirmando la recepción con un código numérico real de 4 dígitos.",
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { tokens } = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleFinish = async () => {
    triggerHaptic("success");
    await mobileStorage.setOnboardingCompleted();
    onDismiss();
  };

  const handleNext = () => {
    triggerHaptic("light");
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const currentSlide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
        <DSSurface variant="elevated" style={styles.modalCard}>
          {/* Skip button on top right */}
          <View style={styles.topRow}>
            <View style={{ flex: 1 }} />
            {!isLast ? (
              <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
                <DSText variant="caption" color="secondary" weight="semibold">
                  Saltar
                </DSText>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Slide Icon */}
          <View style={[styles.iconCircle, { backgroundColor: tokens.colors.accent.primaryLight }]}>
            <Ionicons
              name={currentSlide.icon}
              size={42}
              color={tokens.colors.accent.primary}
            />
          </View>

          {/* Slide Content */}
          <DSText variant="title" weight="bold" style={styles.title}>
            {currentSlide.title}
          </DSText>
          <DSText variant="body" color="secondary" style={styles.description}>
            {currentSlide.description}
          </DSText>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      idx === currentIndex
                        ? tokens.colors.accent.primary
                        : tokens.colors.divider,
                    width: idx === currentIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Actions */}
          <DSButton
            title={isLast ? "¡Comenzar ahora! 🚀" : "Siguiente"}
            variant="primary"
            size="lg"
            onPress={handleNext}
            style={styles.actionButton}
          />
        </DSSurface>
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
  modalCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  topRow: {
    width: "100%",
    flexDirection: "row",
    marginBottom: 12,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionButton: {
    width: "100%",
  },
});
