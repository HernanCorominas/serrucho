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
import { colors } from "../../src/theme/colors";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Input } from "../../src/components/ui/Input";
import { mobileStorage } from "../../src/services/storage";
import { triggerHaptic } from "../../src/utils/haptics";
import {
  CATEGORY_INFO,
  calculateParticipantBalances,
  type ExpenseCategory,
  type ExpenseWithSplits,
} from "@serrucho/core";

export default function AddExpenseModal() {
  const { serruchoId } = useLocalSearchParams<{ serruchoId: string }>();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("FOOD_GROCERIES");
  const [loading, setLoading] = useState(false);

  const categories: ExpenseCategory[] = [
    "LODGING",
    "FOOD_GROCERIES",
    "DRINKS_ALCOHOL",
    "FUEL_TRANSPORT",
    "RESTAURANT",
    "OTHER",
  ];

  const handleAdd = async () => {
    const amountNum = parseFloat(amount);
    if (!description.trim() || !amountNum || amountNum <= 0) {
      triggerHaptic("error");
      Alert.alert("Datos inválidos", "Ingresa una descripción y un monto válido.");
      return;
    }

    setLoading(true);
    triggerHaptic("medium");

    if (serruchoId) {
      const detail = await mobileStorage.getSerruchoDetail(serruchoId);
      if (detail) {
        const amountCents = Math.round(amountNum * 100);
        const splitPerPerson = detail.participants.length > 0
          ? Math.round(amountCents / detail.participants.length)
          : amountCents;

        const payer = detail.participants[0];
        const expId = `exp-${Date.now()}`;
        const newExpense: ExpenseWithSplits = {
          id: expId,
          serrucho_id: serruchoId,
          paid_by_participant_id: payer?.id || "p1",
          paid_by_name: payer?.name || "Organizador",
          description: description.trim(),
          amount_cents: amountCents,
          split_method: "EQUAL",
          category,
          expense_date: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          splits: detail.participants.map((p: typeof detail.participants[0]) => ({
            expense_id: expId,
            participant_id: p.id,
            participant_name: p.name,
            owed_cents: splitPerPerson,
            percentage_basis_points: detail.participants.length > 0
              ? Math.round(10000 / detail.participants.length)
              : 10000,
          })),
        };

        const updatedExpenses = [newExpense, ...detail.expenses];
        const newBalances = calculateParticipantBalances(detail.participants, updatedExpenses);

        await mobileStorage.saveSerruchoDetail(serruchoId, {
          ...detail,
          expenses: updatedExpenses,
          balances: newBalances,
        });
      }
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
          Registrar Nuevo Gasto 💸
        </Text>

        <Input
          label="Concepto del Gasto *"
          placeholder="Ej. Supermercado Nacional, Gasolina, etc."
          value={description}
          onChangeText={setDescription}
          autoFocus
        />

        <Input
          label="Monto en Pesos (RD$) *"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        {/* Category Picker */}
        <Text style={[styles.catLabel, { color: theme.text }]}>Categoría</Text>
        <View style={styles.catGrid}>
          {categories.map((catKey) => {
            const info = CATEGORY_INFO[catKey];
            const isSelected = category === catKey;

            return (
              <Button
                key={catKey}
                title={`${info.emoji} ${info.label.split("/")[0]}`}
                variant={isSelected ? "primary" : "outline"}
                size="sm"
                onPress={() => {
                  triggerHaptic("light");
                  setCategory(catKey);
                }}
                style={styles.catBtn}
              />
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button
            title="Guardar Gasto"
            onPress={handleAdd}
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
    marginBottom: 12,
  },
  catLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  catBtn: {
    borderRadius: 12,
  },
  actions: {
    marginTop: 8,
  },
});
