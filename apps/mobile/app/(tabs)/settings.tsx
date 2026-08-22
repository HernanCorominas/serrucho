import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Linking,
} from "react-native";
import { colors } from "../../src/theme/colors";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { Badge } from "../../src/components/ui/Badge";
import { triggerHaptic } from "../../src/utils/haptics";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const [currency, setCurrency] = useState("DOP");

  const dominicanBanks = [
    { name: "Banco BHD", icon: "business" },
    { name: "Banco Popular", icon: "business" },
    { name: "Banreservas", icon: "business" },
    { name: "Qik Banco Digital", icon: "phone-portrait" },
    { name: "tPago", icon: "flash" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Moneda Principal */}
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Moneda Predeterminada 💰
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
          Todos los cálculos y desgloses se mostrarán con esta moneda.
        </Text>
        <View style={styles.currencyRow}>
          {["DOP", "USD", "EUR"].map((curr) => (
            <Button
              key={curr}
              title={curr === "DOP" ? "RD$ (DOP)" : curr === "USD" ? "$ (USD)" : "€ (EUR)"}
              variant={currency === curr ? "primary" : "outline"}
              size="sm"
              onPress={() => {
                triggerHaptic("light");
                setCurrency(curr);
              }}
              style={styles.currBtn}
            />
          ))}
        </View>
      </Card>

      {/* Métodos de Pago Dominicanos */}
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Métodos de Pago Soportados 🇩🇴
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
          Opciones recomendadas para las instrucciones de cobro en tus serruchos:
        </Text>
        {dominicanBanks.map((bank) => (
          <View
            key={bank.name}
            style={[styles.bankRow, { borderBottomColor: theme.border }]}
          >
            <View style={styles.bankInfo}>
              <Ionicons name={bank.icon as any} size={18} color={colors.primary} />
              <Text style={[styles.bankName, { color: theme.text }]}>{bank.name}</Text>
            </View>
            <Badge label="ACTIVO" variant="success" size="sm" />
          </View>
        ))}
      </Card>

      {/* Info & Arquitectura */}
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Sobre Serrucho Mobile 🪚
        </Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Versión</Text>
          <Text style={[styles.infoVal, { color: theme.text }]}>1.0.0 (Expo SDK 52)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Arquitectura</Text>
          <Text style={[styles.infoVal, { color: theme.text }]}>Monorepo React Native + Web</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Costo de Operación</Text>
          <Badge label="$0.00 USD / mes" variant="success" size="sm" />
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Modo Offline</Text>
          <Badge label="Soportado (AsyncStorage)" variant="info" size="sm" />
        </View>
      </Card>

      {/* Feedback button */}
      <Button
        title="Enviar Sugerencia o Feedback 🇩🇴"
        variant="outline"
        size="md"
        onPress={() => {
          triggerHaptic("medium");
          Linking.openURL("https://wa.me/?text=Hola%20tengo%20un%20feedback%20para%20Serrucho");
        }}
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 8,
  },
  currBtn: {
    flex: 1,
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bankName: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: "700",
  },
});
