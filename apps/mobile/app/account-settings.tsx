import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { semanticTokens } from "@serrucho/ui";
import { triggerHaptic } from "../src/utils/haptics";
import {
  DSText,
  DSIconButton,
  DSDivider,
  DSSettingRow,
  DSSection,
  DSSurface,
  DSButton,
} from "../src/components/ds";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    triggerHaptic("light");
    router.back();
  };

  const handleClearSessions = () => {
    triggerHaptic("warning");
    Alert.alert(
      "Cerrar sesiones activas",
      "Esto restablecerá las credenciales locales de sesión en este dispositivo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesiones",
          style: "destructive",
          onPress: () => {
            triggerHaptic("medium");
            Alert.alert("Sesiones cerradas", "Se han restablecido los accesos locales.");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    triggerHaptic("error");
    Alert.alert(
      "⚠️ Eliminar datos y cuenta",
      "Esta acción es permanente e irreversible. Borrará todo el historial local, preferencias y grupos guardados en este dispositivo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar definitivamente",
          style: "destructive",
          onPress: async () => {
            triggerHaptic("error");
            try {
              await AsyncStorage.clear();
              Alert.alert("Datos eliminados", "La aplicación ha sido restablecida a su estado inicial.", [
                {
                  text: "OK",
                  onPress: () => router.replace("/(tabs)"),
                },
              ]);
            } catch {
              Alert.alert("Error", "No se pudieron borrar todos los datos locales.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) }]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <DSIconButton
          icon={<Ionicons name="arrow-back" size={24} color={semanticTokens.colors.text.primary} />}
          onPress={handleBack}
          accessibilityLabel="Volver a Perfil"
        />
        <DSText variant="title" weight="bold" color="primary" align="center" style={styles.headerTitle}>
          Ajustes de cuenta
        </DSText>
        <View style={{ width: 44 }} />
      </View>

      <DSDivider />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Account Info Section */}
        <DSSection title="ESTADO DE LA CUENTA">
          <DSSettingRow
            title="Tipo de Cuenta"
            subtitle="Modo Local Anónimo / Sin Registro"
            leading={
              <Ionicons name="shield-outline" size={20} color={semanticTokens.colors.accent.primary} />
            }
            showChevron={false}
          />
          <DSSettingRow
            title="Privacidad y Datos"
            subtitle="Los datos residen en tu dispositivo (AsyncStorage)"
            leading={
              <Ionicons name="lock-closed-outline" size={20} color={semanticTokens.colors.text.secondary} />
            }
            showChevron={false}
          />
        </DSSection>

        <DSDivider style={styles.divider} />

        {/* Danger Zone Section */}
        <DSSection title="ZONA PELIGROSA">
          <DSSurface variant="elevated" style={styles.dangerCard}>
            <DSSettingRow
              title="Cerrar sesión en todos los dispositivos"
              subtitle="Cierra y desvincula tus accesos de invitado activos"
              leading={
                <Ionicons name="log-out-outline" size={20} color={semanticTokens.colors.destructive.base} />
              }
              destructive
              showDivider={true}
              onPress={handleClearSessions}
              accessibilityLabel="Cerrar sesión en todos los dispositivos"
            />
            <DSSettingRow
              title="Eliminar cuenta y datos locales"
              subtitle="Borra permanentemente todos los Serruchos e identidades guardadas"
              leading={
                <Ionicons name="trash-outline" size={20} color={semanticTokens.colors.destructive.base} />
              }
              destructive
              showDivider={false}
              onPress={handleDeleteAccount}
              accessibilityLabel="Eliminar cuenta y datos locales"
            />
          </DSSurface>
        </DSSection>

        <View style={styles.buttonContainer}>
          <DSButton
            title="Volver a Perfil"
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
  dangerCard: {
    borderRadius: semanticTokens.radius.md,
    borderWidth: 1,
    borderColor: semanticTokens.colors.destructive.base,
    overflow: "hidden",
    marginHorizontal: semanticTokens.spacing.screen,
  },
  buttonContainer: {
    paddingHorizontal: semanticTokens.spacing.screen,
    marginTop: semanticTokens.spacing.xl,
  },
});
