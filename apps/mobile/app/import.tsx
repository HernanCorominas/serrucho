import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { semanticTokens } from "@serrucho/ui";
import { triggerHaptic } from "../src/utils/haptics";
import {
  DSText,
  DSIconButton,
  DSDivider,
  DSSettingRow,
  DSSection,
  DSButton,
} from "../src/components/ds";

export default function ImportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    triggerHaptic("light");
    router.back();
  };

  const handleImportSplitwise = () => {
    triggerHaptic("medium");
    Alert.alert(
      "Importar desde Splitwise",
      "La importación vía web ya está disponible en https://serrucho.do/api/import/preview. El soporte nativo en móvil llegará en la siguiente actualización.",
      [{ text: "Entendido" }]
    );
  };

  const handleImportJSON = () => {
    triggerHaptic("medium");
    Alert.alert(
      "Respaldo JSON",
      "Función de restauración desde archivo local disponible próximamente.",
      [{ text: "Entendido" }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) }]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <DSIconButton
          icon={<Ionicons name="arrow-back" size={24} color={semanticTokens.colors.text.primary} />}
          onPress={handleBack}
          accessibilityLabel="Volver"
        />
        <DSText variant="title" weight="bold" color="primary" align="center" style={styles.headerTitle}>
          Importar
        </DSText>
        <View style={{ width: 44 }} />
      </View>

      <DSDivider />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <DSSection title="FUENTES DISPONIBLES">
          <DSSettingRow
            title="Importar desde Splitwise CSV"
            subtitle="Cargar historial de gastos y participantes"
            leading={
              <Ionicons name="document-text-outline" size={22} color={semanticTokens.colors.accent.primary} />
            }
            onPress={handleImportSplitwise}
          />
          <DSSettingRow
            title="Restaurar Respaldo JSON"
            subtitle="Cargar serruchos previamente respaldados"
            leading={
              <Ionicons name="code-download-outline" size={22} color={semanticTokens.colors.text.secondary} />
            }
            onPress={handleImportJSON}
          />
        </DSSection>

        <DSDivider style={styles.divider} />

        <DSSection title="INSTRUCCIONES">
          <View style={styles.instructions}>
            <DSText variant="bodyMedium" color="secondary">
              1. Exporta tus datos desde la aplicación origen en formato compatible.
            </DSText>
            <DSText variant="bodyMedium" color="secondary" style={styles.step}>
              2. Selecciona el archivo para previsualizar participantes y saldos calculados.
            </DSText>
            <DSText variant="bodyMedium" color="secondary" style={styles.step}>
              3. Confirma la creación del nuevo Serrucho con todos los gastos asociados.
            </DSText>
          </View>
        </DSSection>

        <View style={styles.buttonContainer}>
          <DSButton
            title="Volver"
            variant="secondary"
            onPress={handleBack}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.base,
  },
  headerRow: {
    height: semanticTokens.geometry.appBarHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: semanticTokens.spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: semanticTokens.spacing.md,
    paddingBottom: semanticTokens.spacing.xl,
  },
  divider: {
    marginVertical: semanticTokens.spacing.md,
  },
  instructions: {
    paddingHorizontal: semanticTokens.spacing.screen,
    gap: 8,
  },
  step: {
    marginTop: 4,
  },
  buttonContainer: {
    paddingHorizontal: semanticTokens.spacing.screen,
    marginTop: semanticTokens.spacing.lg,
  },
});
