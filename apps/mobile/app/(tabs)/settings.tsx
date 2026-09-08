import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { semanticTokens } from "@serrucho/ui";
import { triggerHaptic } from "../../src/utils/haptics";
import {
  DSText,
  DSSurface,
  DSButton,
  DSBadge,
  DSSettingRow,
  DSSection,
  DSDivider,
} from "../../src/components/ds";

export default function SettingsScreen() {
  const [currency, setCurrency] = useState("DOP");

  const dominicanBanks = [
    { name: "Banco BHD", icon: "business-outline" },
    { name: "Banco Popular", icon: "business-outline" },
    { name: "Banreservas", icon: "business-outline" },
    { name: "Qik Banco Digital", icon: "phone-portrait-outline" },
    { name: "tPago", icon: "flash-outline" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Moneda Principal */}
        <DSSection title="MONEDA PREDETERMINADA">
          <DSSurface variant="elevated" style={styles.card}>
            <DSText variant="caption" color="secondary" style={styles.cardSubtitle}>
              Todos los cálculos y desgloses se mostrarán con esta moneda.
            </DSText>
            <View style={styles.currencyRow}>
              {(["DOP", "USD", "EUR"] as const).map((curr) => (
                <DSButton
                  key={curr}
                  title={curr === "DOP" ? "RD$ (DOP)" : curr === "USD" ? "$ (USD)" : "€ (EUR)"}
                  variant={currency === curr ? "primary" : "secondary"}
                  size="sm"
                  onPress={() => {
                    triggerHaptic("light");
                    setCurrency(curr);
                  }}
                  style={styles.currBtn}
                  accessibilityLabel={`Seleccionar ${curr} como moneda`}
                />
              ))}
            </View>
          </DSSurface>
        </DSSection>

        <DSDivider style={styles.divider} />

        {/* Métodos de Pago Dominicanos */}
        <DSSection title="MÉTODOS DE PAGO SOPORTADOS 🇩🇴">
          <DSSurface variant="elevated" style={styles.card}>
            <DSText variant="caption" color="secondary" style={styles.cardSubtitle}>
              Opciones recomendadas para las instrucciones de cobro:
            </DSText>
            {dominicanBanks.map((bank, index) => (
              <DSSettingRow
                key={bank.name}
                title={bank.name}
                leading={
                  <Ionicons
                    name={bank.icon as any}
                    size={18}
                    color={semanticTokens.colors.text.primary}
                  />
                }
                trailing={<DSBadge label="ACTIVO" variant="success" size="sm" />}
                showChevron={false}
                showDivider={index < dominicanBanks.length - 1}
              />
            ))}
          </DSSurface>
        </DSSection>

        <DSDivider style={styles.divider} />

        {/* Info & Arquitectura */}
        <DSSection title="SOBRE SERRUCHO MOBILE 🪚">
          <DSSurface variant="elevated" style={styles.card}>
            <DSSettingRow
              title="Versión"
              subtitle="1.0.0 (Expo SDK 57 · KITTYsplit Parity)"
              showChevron={false}
              showDivider
            />
            <DSSettingRow
              title="Arquitectura"
              subtitle="Monorepo React Native + Web"
              showChevron={false}
              showDivider
            />
            <DSSettingRow
              title="Costo de Operación"
              trailing={<DSBadge label="$0.00 / mes" variant="accent" size="sm" />}
              showChevron={false}
              showDivider
            />
            <DSSettingRow
              title="Modo Offline"
              trailing={<DSBadge label="AsyncStorage" variant="neutral" size="sm" />}
              showChevron={false}
              showDivider={false}
            />
          </DSSurface>
        </DSSection>

        <DSDivider style={styles.divider} />

        {/* Feedback */}
        <DSButton
          title="Enviar Sugerencia o Feedback 🇩🇴"
          variant="secondary"
          size="md"
          onPress={() => {
            triggerHaptic("medium");
            Linking.openURL("https://wa.me/?text=Hola%20tengo%20un%20feedback%20para%20Serrucho%20RD");
          }}
          style={styles.feedbackBtn}
          accessibilityLabel="Enviar sugerencias por WhatsApp"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.base,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingVertical: semanticTokens.spacing.md,
    paddingBottom: 48,
  },
  card: {
    marginHorizontal: semanticTokens.spacing.screen,
    borderRadius: semanticTokens.radius.md,
    overflow: "hidden",
  },
  cardSubtitle: {
    paddingHorizontal: semanticTokens.spacing.screen,
    paddingTop: semanticTokens.spacing.sm,
    paddingBottom: semanticTokens.spacing.xs,
    lineHeight: 18,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: semanticTokens.spacing.screen,
    paddingVertical: semanticTokens.spacing.sm,
  },
  currBtn: {
    flex: 1,
  },
  divider: {
    marginVertical: semanticTokens.spacing.sm,
  },
  feedbackBtn: {
    marginHorizontal: semanticTokens.spacing.screen,
    marginTop: semanticTokens.spacing.xs,
  },
});
