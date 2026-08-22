import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme/colors";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Input } from "../../src/components/ui/Input";
import { mobileStorage } from "../../src/services/storage";
import { triggerHaptic } from "../../src/utils/haptics";
import {
  formatDOP,
  calculateItemizedSplits,
  calculateParticipantBalances,
  toCents,
  type ExpenseWithSplits,
  type ItemizedExpenseLine,
} from "@serrucho/core";

export default function ItemizedExpenseScreen() {
  const { serruchoId } = useLocalSearchParams<{ serruchoId: string }>();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const [description, setDescription] = useState("Consumo en Restaurante");
  const [items, setItems] = useState<{ id: string; name: string; amountStr: string; participantIds: string[] }[]>([
    { id: "1", name: "Chivo Liniero", amountStr: "850", participantIds: [] },
    { id: "2", name: "Cerveza Presidente", amountStr: "350", participantIds: [] },
  ]);
  const [tipPct, setTipPct] = useState(10);
  const [includeITBIS, setIncludeITBIS] = useState(true);
  const [includeLey, setIncludeLey] = useState(true);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    triggerHaptic("light");
    setItems([
      ...items,
      { id: `${Date.now()}`, name: "", amountStr: "", participantIds: [] },
    ]);
  };

  const removeItem = (id: string) => {
    triggerHaptic("warning");
    setItems(items.filter((i) => i.id !== id));
  };

  const toggleParticipant = (itemId: string, partId: string) => {
    triggerHaptic("light");
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.participantIds.includes(partId);
        return {
          ...item,
          participantIds: exists
            ? item.participantIds.filter((p) => p !== partId)
            : [...item.participantIds, partId],
        };
      })
    );
  };

  const handleSave = async () => {
    if (!serruchoId) return;

    const validItems = items.filter((i) => i.name.trim() && parseFloat(i.amountStr) > 0);
    if (validItems.length === 0) {
      triggerHaptic("error");
      Alert.alert("Datos incompletos", "Agrega al menos un plato o consumo con su precio.");
      return;
    }

    setLoading(true);
    triggerHaptic("medium");

    const detail = await mobileStorage.getSerruchoDetail(serruchoId);
    if (detail) {
      const lineItems: ItemizedExpenseLine[] = validItems.map((item) => ({
        id: item.id,
        name: item.name.trim(),
        amountCents: toCents(item.amountStr),
        assignedParticipantIds:
          item.participantIds.length > 0
            ? item.participantIds
            : detail.participants.map((p: typeof detail.participants[0]) => p.id),
      }));

      const rawSubtotalCents = lineItems.reduce((sum, item) => sum + item.amountCents, 0);
      const tipCents = tipPct > 0 ? Math.round(rawSubtotalCents * (tipPct / 100)) : 0;

      const splitResult = calculateItemizedSplits({
        lines: lineItems,
        participantIds: detail.participants.map((p: typeof detail.participants[0]) => p.id),
        itbisPercent: includeITBIS ? 18 : 0,
        servicePercent: includeLey ? 10 : 0,
        customTipCents: tipCents,
      });

      const expId = `exp-itemized-${Date.now()}`;
      const payer = detail.participants[0];
      const newExpense: ExpenseWithSplits = {
        id: expId,
        serrucho_id: serruchoId,
        paid_by_participant_id: payer?.id || "p1",
        paid_by_name: payer?.name || "Organizador",
        description: description.trim(),
        amount_cents: splitResult.totalFinalCents,
        split_method: "EQUAL",
        category: "RESTAURANT",
        expense_date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        splits: splitResult.participantTotals.map((pt) => {
          const participantObj = detail.participants.find((p: typeof detail.participants[0]) => p.id === pt.participantId);
          return {
            expense_id: expId,
            participant_id: pt.participantId,
            participant_name: participantObj?.name || "Amigo",
            owed_cents: pt.totalOwedCents,
            percentage_basis_points: pt.basisPoints,
          };
        }),
      };

      const updatedExpenses = [newExpense, ...detail.expenses];
      const newBalances = calculateParticipantBalances(detail.participants, updatedExpenses);

      await mobileStorage.saveSerruchoDetail(serruchoId, {
        ...detail,
        expenses: updatedExpenses,
        balances: newBalances,
      });
    }

    triggerHaptic("success");
    setLoading(false);
    router.back();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>
          Desglose por Plato ("Quién comió qué") 🍽️
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Anota cada plato o trago individualmente. Los impuestos y propina se distribuirán proporcionalmente al consumo.
        </Text>

        <Input
          label="Lugar o Concepto"
          value={description}
          onChangeText={setDescription}
          placeholder="Ej. Restaurante Adrian Tropical"
        />

        {/* Line items */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Consumos</Text>
        {items.map((item, index) => (
          <Card key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemNumber, { color: colors.primary }]}>
                #{index + 1}
              </Text>
              {items.length > 1 && (
                <Button
                  title="Eliminar"
                  variant="ghost"
                  size="sm"
                  onPress={() => removeItem(item.id)}
                  textStyle={{ color: colors.danger, fontSize: 11 }}
                />
              )}
            </View>

            <View style={styles.itemRow}>
              <View style={{ flex: 2 }}>
                <Input
                  placeholder="Nombre del plato / trago"
                  value={item.name}
                  onChangeText={(val) =>
                    setItems(items.map((i) => (i.id === item.id ? { ...i, name: val } : i)))
                  }
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Input
                  placeholder="RD$"
                  value={item.amountStr}
                  onChangeText={(val) =>
                    setItems(items.map((i) => (i.id === item.id ? { ...i, amountStr: val } : i)))
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>
        ))}

        <Button
          title="+ Agregar otro plato"
          variant="outline"
          size="sm"
          onPress={addItem}
          icon={<Ionicons name="add" size={16} color={colors.primary} />}
          style={{ marginTop: 8 }}
        />

        <View style={styles.actions}>
          <Button
            title="Guardar Cuenta Desglosada"
            onPress={handleSave}
            loading={loading}
            size="lg"
          />
          <Button
            title="Cancelar"
            variant="ghost"
            onPress={() => router.back()}
            size="md"
            style={{ marginTop: 8 }}
          />
        </View>
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
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 6,
  },
  itemCard: {
    marginBottom: 8,
    padding: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemNumber: {
    fontWeight: "800",
    fontSize: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actions: {
    marginTop: 20,
  },
});
