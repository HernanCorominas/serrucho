import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  useColorScheme,
} from "react-native";
import { colors } from "../../src/theme/colors";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Input } from "../../src/components/ui/Input";
import { WhatsAppShareButton } from "../../src/components/WhatsAppShareButton";
import { triggerHaptic } from "../../src/utils/haptics";
import { formatDOP, calculateTip } from "@serrucho/core";

export default function CalculatorScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const [subtotal, setSubtotal] = useState("3500");
  const [includeITBIS, setIncludeITBIS] = useState(true);
  const [includeLey, setIncludeLey] = useState(true);
  const [tipPct, setTipPct] = useState(10);
  const [peopleCount, setPeopleCount] = useState(4);

  const subtotalNumber = parseFloat(subtotal) || 0;
  const subtotalCents = Math.round(subtotalNumber * 100);

  const itbisCents = includeITBIS ? Math.round(subtotalCents * 0.18) : 0;
  const leyCents = includeLey ? Math.round(subtotalCents * 0.10) : 0;
  const taxableBaseCents = subtotalCents + itbisCents + leyCents;
  const tipCents = calculateTip(subtotalCents, tipPct);
  const totalCents = taxableBaseCents + tipCents;

  const perPersonCents = peopleCount > 0 ? Math.round(totalCents / peopleCount) : 0;

  const shareMessage = `🧾 *Desglose de Cuenta — Serrucho* 🪚\n` +
    `• Subtotal: ${formatDOP(subtotalCents)}\n` +
    (includeITBIS ? `• ITBIS (18%): ${formatDOP(itbisCents)}\n` : "") +
    (includeLey ? `• 10% de Ley: ${formatDOP(leyCents)}\n` : "") +
    (tipPct > 0 ? `• Propina voluntaria (${tipPct}%): ${formatDOP(tipCents)}\n` : "") +
    `--------------------------\n` +
    `💰 *TOTAL:* ${formatDOP(totalCents)}\n` +
    `👥 *Por persona (${peopleCount} amigos):* ${formatDOP(perPersonCents)}\n\n` +
    `_Calculado con Serrucho 🇩🇴_`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Monto del Consumo
        </Text>

        <Input
          label="Subtotal antes de impuestos (RD$)"
          value={subtotal}
          onChangeText={setSubtotal}
          keyboardType="numeric"
          placeholder="0.00"
        />

        {/* Taxes Switches */}
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>18% ITBIS</Text>
            <Text style={[styles.switchDesc, { color: theme.textMuted }]}>
              Impuesto sobre transferencias de bienes
            </Text>
          </View>
          <Switch
            value={includeITBIS}
            onValueChange={(val) => {
              triggerHaptic("light");
              setIncludeITBIS(val);
            }}
            trackColor={{ true: colors.primary, false: theme.border }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>10% de Ley</Text>
            <Text style={[styles.switchDesc, { color: theme.textMuted }]}>
              Propina legal obligatoria en restaurantes
            </Text>
          </View>
          <Switch
            value={includeLey}
            onValueChange={(val) => {
              triggerHaptic("light");
              setIncludeLey(val);
            }}
            trackColor={{ true: colors.primary, false: theme.border }}
          />
        </View>

        {/* Tip Selector */}
        <Text style={[styles.labelTitle, { color: theme.text }]}>
          Propina Adicional del Mozo
        </Text>
        <View style={styles.tipRow}>
          {[0, 5, 10, 15].map((pct) => (
            <Button
              key={pct}
              title={`${pct}%`}
              variant={tipPct === pct ? "primary" : "outline"}
              size="sm"
              onPress={() => {
                triggerHaptic("light");
                setTipPct(pct);
              }}
              style={styles.tipButton}
            />
          ))}
        </View>

        {/* People Count */}
        <Text style={[styles.labelTitle, { color: theme.text }]}>
          ¿Entre cuántos dividimos?
        </Text>
        <View style={styles.peopleRow}>
          <Button
            title="-"
            size="md"
            variant="outline"
            onPress={() => {
              triggerHaptic("light");
              setPeopleCount(Math.max(1, peopleCount - 1));
            }}
            style={styles.counterBtn}
          />
          <View style={styles.peopleCountBox}>
            <Text style={[styles.peopleCountText, { color: theme.text }]}>
              {peopleCount} {peopleCount === 1 ? "persona" : "personas"}
            </Text>
          </View>
          <Button
            title="+"
            size="md"
            variant="outline"
            onPress={() => {
              triggerHaptic("light");
              setPeopleCount(peopleCount + 1);
            }}
            style={styles.counterBtn}
          />
        </View>
      </Card>

      {/* Result Card */}
      <Card variant="active" style={styles.resultCard}>
        <Text style={styles.resultBadge}>CADA UNO PONE</Text>
        <Text style={styles.perPersonAmount}>{formatDOP(perPersonCents)}</Text>
        <Text style={styles.totalBreakdown}>Total cuenta: {formatDOP(totalCents)}</Text>

        <View style={styles.breakdownDetails}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownVal}>{formatDOP(subtotalCents)}</Text>
          </View>
          {includeITBIS && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>18% ITBIS</Text>
              <Text style={styles.breakdownVal}>{formatDOP(itbisCents)}</Text>
            </View>
          )}
          {includeLey && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>10% Ley</Text>
              <Text style={styles.breakdownVal}>{formatDOP(leyCents)}</Text>
            </View>
          )}
          {tipPct > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Propina ({tipPct}%)</Text>
              <Text style={styles.breakdownVal}>{formatDOP(tipCents)}</Text>
            </View>
          )}
        </View>

        <WhatsAppShareButton
          message={shareMessage}
          title="Compartir en Grupo de WhatsApp"
          size="md"
        />
      </Card>
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
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#cbd5e1",
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  switchDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  labelTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: "row",
    gap: 8,
  },
  tipButton: {
    flex: 1,
  },
  peopleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  counterBtn: {
    width: 48,
  },
  peopleCountBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  peopleCountText: {
    fontSize: 16,
    fontWeight: "800",
  },
  resultCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    alignItems: "center",
    paddingVertical: 24,
    marginTop: 12,
  },
  resultBadge: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fff",
    opacity: 0.9,
    letterSpacing: 1,
  },
  perPersonAmount: {
    fontSize: 34,
    fontWeight: "900",
    color: "#ffffff",
    marginVertical: 4,
  },
  totalBreakdown: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffedd5",
    marginBottom: 16,
  },
  breakdownDetails: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  breakdownLabel: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "500",
  },
  breakdownVal: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "800",
  },
});
