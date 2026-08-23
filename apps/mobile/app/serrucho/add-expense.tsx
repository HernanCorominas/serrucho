import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../../src/theme/colors";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Input } from "../../src/components/ui/Input";
import { Badge } from "../../src/components/ui/Badge";
import { mobileStorage } from "../../src/services/storage";
import { triggerHaptic } from "../../src/utils/haptics";
import {
  CATEGORY_INFO,
  calculateParticipantBalances,
  splitEqually,
  type ExpenseCategory,
  type ExpenseWithSplits,
  type Participant,
} from "@serrucho/core";

export default function AddExpenseScreen() {
  const { serruchoId } = useLocalSearchParams<{ serruchoId: string }>();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("FOOD_GROCERIES");
  const [paidById, setPaidById] = useState<string>("");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  const categories: ExpenseCategory[] = [
    "FOOD_GROCERIES",
    "RESTAURANT",
    "DRINKS_ALCOHOL",
    "FUEL_TRANSPORT",
    "LODGING",
    "OTHER",
  ];

  useEffect(() => {
    if (!serruchoId) return;
    mobileStorage.getSerruchoDetail(serruchoId).then((detail) => {
      if (detail && detail.participants.length > 0) {
        setParticipants(detail.participants);
        setPaidById(detail.participants[0].id);
        setSelectedParticipantIds(new Set(detail.participants.map((p: Participant) => p.id)));
      }
    });
  }, [serruchoId]);

  const toggleParticipant = (pId: string) => {
    triggerHaptic("light");
    const next = new Set(selectedParticipantIds);
    if (next.has(pId)) {
      if (next.size === 1) {
        Alert.alert("Atención", "El gasto debe dividirse entre al menos un participante.");
        return;
      }
      next.delete(pId);
    } else {
      next.add(pId);
    }
    setSelectedParticipantIds(next);
  };

  const selectAllParticipants = () => {
    triggerHaptic("selection");
    setSelectedParticipantIds(new Set(participants.map((p) => p.id)));
  };

  const handleAdd = async () => {
    if (loading) return; // Prevent double submit

    const amountNum = parseFloat(amount.replace(/,/g, ""));
    if (!description.trim()) {
      triggerHaptic("error");
      Alert.alert("Descripción requerida", "Ingresa un concepto para este gasto.");
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      triggerHaptic("error");
      Alert.alert("Monto inválido", "Ingresa un monto válido mayor a RD$ 0.");
      return;
    }

    if (!paidById) {
      triggerHaptic("error");
      Alert.alert("Pagador requerido", "Selecciona quién pagó este gasto.");
      return;
    }

    if (selectedParticipantIds.size === 0) {
      triggerHaptic("error");
      Alert.alert("Participantes requeridos", "Selecciona al menos una persona que participe en el gasto.");
      return;
    }

    setLoading(true);
    triggerHaptic("medium");

    try {
      if (serruchoId) {
        const detail = await mobileStorage.getSerruchoDetail(serruchoId);
        if (detail) {
          const amountCents = Math.round(amountNum * 100);
          const payer = detail.participants.find((p: Participant) => p.id === paidById) || detail.participants[0];
          const expId = `exp-${Date.now()}`;

          // Calculate exact splits using domain financial math
          const activeParticipants = detail.participants.filter((p: Participant) =>
            selectedParticipantIds.has(p.id)
          );
          const splitResults = splitEqually(
            amountCents,
            activeParticipants.map((p: Participant) => p.id)
          );

          const finalDesc = notes.trim()
            ? `${description.trim()} (${notes.trim()})`
            : description.trim();

          const newExpense: ExpenseWithSplits = {
            id: expId,
            serrucho_id: serruchoId,
            paid_by_participant_id: payer.id,
            paid_by_name: payer.name,
            description: finalDesc,
            amount_cents: amountCents,
            split_method: "EQUAL",
            category,
            expense_date: new Date().toISOString().split("T")[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            splits: splitResults.map((s) => {
              const part = detail.participants.find((p: Participant) => p.id === s.participantId);
              return {
                expense_id: expId,
                participant_id: s.participantId,
                participant_name: part?.name || "Amigo",
                owed_cents: s.owedCents,
                percentage_basis_points: Math.round((s.owedCents / amountCents) * 10000),
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
      }

      triggerHaptic("success");
      router.back();
    } catch (err: any) {
      triggerHaptic("error");
      Alert.alert("Error al guardar", err.message || "Ocurrió un error guardando el gasto.");
    } finally {
      setLoading(false);
    }
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
          placeholder="Ej. Supermercado, Gasolina, Uber, etc."
          value={description}
          onChangeText={setDescription}
          autoFocus
        />

        <Input
          label="Monto en Pesos Dominicanos (RD$) *"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Payer Selection */}
        <Text style={[styles.sectionLabel, { color: theme.text }]}>¿Quién pagó? *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {participants.map((p) => {
            const isPayer = paidById === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  triggerHaptic("selection");
                  setPaidById(p.id);
                }}
                style={[
                  styles.payerChip,
                  {
                    backgroundColor: isPayer ? colors.primary : theme.inputBg,
                    borderColor: isPayer ? colors.primary : theme.border,
                  },
                ]}
              >
                <Text style={[styles.payerChipText, { color: isPayer ? "#ffffff" : theme.text }]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Split Participants Selection */}
        <View style={styles.splitHeader}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            Dividir entre ({selectedParticipantIds.size} de {participants.length}) *
          </Text>
          <TouchableOpacity onPress={selectAllParticipants}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
              Seleccionar Todos
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.splitGrid}>
          {participants.map((p) => {
            const isSelected = selectedParticipantIds.has(p.id);
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => toggleParticipant(p.id)}
                style={[
                  styles.splitChip,
                  {
                    backgroundColor: isSelected ? colors.primary + "15" : theme.inputBg,
                    borderColor: isSelected ? colors.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.splitChipText,
                    { color: isSelected ? colors.primary : theme.textMuted, fontWeight: isSelected ? "800" : "500" },
                  ]}
                >
                  {isSelected ? "✓ " : ""}{p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category Picker */}
        <Text style={[styles.sectionLabel, { color: theme.text }]}>Categoría</Text>
        <View style={styles.catGrid}>
          {categories.map((catKey) => {
            const info = CATEGORY_INFO[catKey];
            const isSelected = category === catKey;

            return (
              <TouchableOpacity
                key={catKey}
                onPress={() => {
                  triggerHaptic("light");
                  setCategory(catKey);
                }}
                style={[
                  styles.catBtn,
                  {
                    backgroundColor: isSelected ? colors.primary : theme.inputBg,
                    borderColor: isSelected ? colors.primary : theme.border,
                  },
                ]}
              >
                <Text style={[styles.catBtnText, { color: isSelected ? "#ffffff" : theme.text }]}>
                  {info.emoji} {info.label.split("/")[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Nota u observación (Opcional)"
          placeholder="Ej. Factura #401, propina incluida"
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.actions}>
          <Button
            title={loading ? "Guardando..." : "Guardar Gasto"}
            onPress={handleAdd}
            loading={loading}
            size="lg"
            variant="primary"
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
    paddingBottom: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  horizontalScroll: {
    flexDirection: "row",
    marginBottom: 10,
  },
  payerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  payerChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  splitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  splitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  splitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  splitChipText: {
    fontSize: 12,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  catBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  catBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actions: {
    marginTop: 14,
  },
});
