import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { semanticTokens } from "@serrucho/ui";
import { triggerHaptic } from "../src/utils/haptics";
import {
  DSText,
  DSAvatar,
  DSIconButton,
  DSDivider,
  DSSettingRow,
  DSSection,
  DSBadge,
  DSButton,
  DSSurface,
} from "../src/components/ds";

const USER_NAME_KEY = "@serrucho:user_name";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [userName, setUserName] = useState("Usuario Serrucho");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  useEffect(() => {
    const loadUserName = async () => {
      try {
        const saved = await AsyncStorage.getItem(USER_NAME_KEY);
        if (saved) {
          setUserName(saved);
        }
      } catch {
        // Fallback default
      }
    };
    loadUserName();
  }, []);

  const handleBack = () => {
    triggerHaptic("light");
    router.back();
  };

  const handleOpenEditModal = () => {
    triggerHaptic("light");
    setEditNameValue(userName);
    setShowEditModal(true);
  };

  const handleSaveName = async () => {
    const trimmed = editNameValue.trim();
    if (!trimmed || trimmed.length > 50) {
      triggerHaptic("error");
      Alert.alert("Nombre inválido", "El nombre debe tener entre 1 y 50 caracteres.");
      return;
    }
    triggerHaptic("success");
    setUserName(trimmed);
    await AsyncStorage.setItem(USER_NAME_KEY, trimmed);
    setShowEditModal(false);
  };

  const handleLogout = () => {
    triggerHaptic("warning");
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas salir? En el modo local / invitado tus datos permanecen guardados en este dispositivo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: () => {
            triggerHaptic("medium");
            router.replace("/(tabs)");
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) }]}>
      {/* Top Header (REF-05) */}
      <View style={styles.headerRow}>
        <DSIconButton
          icon={<Ionicons name="arrow-back" size={24} color={semanticTokens.colors.text.primary} />}
          onPress={handleBack}
          accessibilityLabel="Volver"
        />
        <DSText variant="title" weight="bold" color="primary" align="center" style={styles.headerTitle}>
          Perfil
        </DSText>
        <View style={{ width: 44 }} />
      </View>

      <DSDivider />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Avatar & User Header Section (REF-05) */}
        <View style={styles.avatarSection}>
          <DSAvatar
            name={userName}
            size="lg"
            onEdit={handleOpenEditModal}
          />
          <DSText variant="title" weight="bold" color="primary" style={styles.userName}>
            {userName}
          </DSText>
          <View style={styles.badgeRow}>
            <DSBadge label="MODO LOCAL / INVITADO 🇩🇴" variant="accent" />
          </View>
        </View>

        <DSDivider style={styles.divider} />

        {/* Action Rows (REF-05) */}
        <DSSection title="MI CUENTA">
          <DSSettingRow
            title="Cambiar nombre"
            subtitle={userName}
            leading={
              <Ionicons name="pencil-outline" size={20} color={semanticTokens.colors.accent.primary} />
            }
            onPress={handleOpenEditModal}
            accessibilityLabel="Cambiar mi nombre"
          />
          <DSSettingRow
            title="Ajustes de la cuenta"
            subtitle="Seguridad, datos locales y opciones avanzadas"
            leading={
              <Ionicons name="settings-outline" size={20} color={semanticTokens.colors.text.primary} />
            }
            onPress={() => {
              triggerHaptic("selection");
              router.push("/account-settings");
            }}
            accessibilityLabel="Ir a ajustes de la cuenta"
          />
          <DSSettingRow
            title="Cerrar sesión"
            subtitle="Restablecer sesión local"
            leading={
              <Ionicons name="log-out-outline" size={20} color={semanticTokens.colors.destructive.base} />
            }
            destructive
            onPress={handleLogout}
            accessibilityLabel="Cerrar sesión"
          />
        </DSSection>

        <DSDivider style={styles.divider} />

        {/* Serrucho App Info Section */}
        <DSSection title="INFORMACIÓN DEL SISTEMA">
          <DSSettingRow
            title="Versión de la aplicación"
            subtitle="v1.0.0 (Kittysplit Mobile Parity)"
            leading={
              <Ionicons name="information-circle-outline" size={20} color={semanticTokens.colors.text.secondary} />
            }
            showChevron={false}
          />
          <DSSettingRow
            title="Región y Moneda"
            subtitle="República Dominicana (DOP · RD$)"
            leading={
              <Ionicons name="globe-outline" size={20} color={semanticTokens.colors.text.secondary} />
            }
            showChevron={false}
          />
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

      {/* Edit Name Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <DSSurface variant="elevated" style={styles.modalContainer}>
            <DSText variant="title" weight="bold" style={{ marginBottom: 4 }}>
              Editar Mi Nombre ✏️
            </DSText>
            <DSText variant="caption" color="secondary" style={{ marginBottom: 16 }}>
              Este nombre será visible en tus grupos y en el menú principal.
            </DSText>
            <TextInput
              style={styles.modalInput}
              value={editNameValue}
              onChangeText={setEditNameValue}
              placeholder="Tu nombre o apodo..."
              placeholderTextColor={semanticTokens.colors.text.muted}
              maxLength={50}
              autoFocus
            />
            <View style={styles.modalButtonsRow}>
              <DSButton
                title="Cancelar"
                variant="secondary"
                onPress={() => setShowEditModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <DSButton
                title="Guardar"
                variant="primary"
                onPress={handleSaveName}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </DSSurface>
        </View>
      </Modal>
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
  avatarSection: {
    alignItems: "center",
    paddingVertical: semanticTokens.spacing.lg,
  },
  userName: {
    marginTop: semanticTokens.spacing.sm,
  },
  badgeRow: {
    marginTop: semanticTokens.spacing.xs,
  },
  divider: {
    marginVertical: semanticTokens.spacing.md,
  },
  buttonContainer: {
    paddingHorizontal: semanticTokens.spacing.screen,
    marginTop: semanticTokens.spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: semanticTokens.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: semanticTokens.colors.divider,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: semanticTokens.colors.text.primary,
    backgroundColor: semanticTokens.colors.surface.base,
    fontSize: 15,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
