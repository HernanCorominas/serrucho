import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { semanticTokens } from "@serrucho/ui";
import {
  DSText,
  DSSurface,
  DSButton,
  DSBadge,
  DSIconButton,
} from "../../src/components/ds";
import { mobileStorage } from "../../src/services/storage";
import { mobileSyncEngine } from "../../src/services/sync";
import { triggerHaptic } from "../../src/utils/haptics";
import {
  CATEGORY_INFO,
  calculateParticipantBalances,
  splitEqually,
  splitByPercentage,
  splitByExactAmounts,
  splitByShares,
  type ExpenseCategory,
  type ExpenseWithSplits,
  type Participant,
  type SplitMethod,
} from "@serrucho/core";

export default function AddExpenseScreen() {
  const { serruchoId, expenseId } = useLocalSearchParams<{ serruchoId: string; expenseId?: string }>();
  const router = useRouter();

  const isEditing = !!expenseId;
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("FOOD_GROCERIES");
  const [paidById, setPaidById] = useState<string>("");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("EQUAL");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
    setFetching(true);
    mobileStorage.getSerruchoDetail(serruchoId).then((detail) => {
      if (detail && detail.participants.length > 0) {
        setParticipants(detail.participants);

        if (expenseId) {
          const existingExp = (detail.expenses || []).find((e: ExpenseWithSplits) => e.id === expenseId);
          if (existingExp) {
            setDescription(existingExp.description);
            setAmount((existingExp.amount_cents / 100).toString());
            setCategory((existingExp.category as ExpenseCategory) || "OTHER");
            setPaidById(existingExp.paid_by_participant_id);
            setSplitMethod(existingExp.split_method);

            if (existingExp.splits && existingExp.splits.length > 0) {
              const activeIds = new Set<string>(existingExp.splits.map((s: any) => String(s.participant_id)));
              setSelectedParticipantIds(activeIds);

              const initialPercentages: Record<string, string> = {};
              const initialExact: Record<string, string> = {};
              const initialShares: Record<string, string> = {};

              existingExp.splits.forEach((s: any) => {
                if (s.percentage_basis_points) {
                  initialPercentages[s.participant_id] = (s.percentage_basis_points / 100).toString();
                }
                initialExact[s.participant_id] = (s.owed_cents / 100).toString();
                initialShares[s.participant_id] = "1";
              });

              setPercentages(initialPercentages);
              setExactAmounts(initialExact);
              setShares(initialShares);
            }
            setFetching(false);
            return;
          }
        }

        setPaidById(detail.participants[0].id);
        setSelectedParticipantIds(new Set(detail.participants.map((p: Participant) => p.id)));

        const initialShares: Record<string, string> = {};
        detail.participants.forEach((p: Participant) => {
          initialShares[p.id] = (p.default_shares || 1).toString();
        });
        setShares(initialShares);
      }
      setFetching(false);
    });
  }, [serruchoId, expenseId]);

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
    if (loading) return;

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
          const expId = expenseId || `exp-${Date.now()}`;

          const activeParticipants = detail.participants.filter((p: Participant) =>
            selectedParticipantIds.has(p.id)
          );

          let splitResults: { participantId: string; owedCents: number; percentageBasisPoints?: number }[] = [];

          if (splitMethod === "EQUAL") {
            splitResults = splitEqually(
              amountCents,
              activeParticipants.map((p: Participant) => p.id)
            );
          } else if (splitMethod === "PERCENTAGE") {
            const pctArray = activeParticipants.map((p: Participant) => ({
              participantId: p.id,
              basisPoints: Math.round((parseFloat(percentages[p.id] || "0") || 0) * 100),
            }));
            const totalBps = pctArray.reduce((acc: number, item: { basisPoints: number }) => acc + item.basisPoints, 0);
            if (totalBps !== 10000) {
              setLoading(false);
              triggerHaptic("error");
              Alert.alert("Error en porcentajes", `La suma de los porcentajes debe ser exactamente 100%. Actual: ${(totalBps / 100).toFixed(1)}%`);
              return;
            }
            splitResults = splitByPercentage(amountCents, pctArray);
          } else if (splitMethod === "EXACT") {
            const exactArray = activeParticipants.map((p: Participant) => ({
              participantId: p.id,
              amountCents: Math.round((parseFloat(exactAmounts[p.id] || "0") || 0) * 100),
            }));
            const totalExactCents = exactArray.reduce((acc: number, item: { amountCents: number }) => acc + item.amountCents, 0);
            if (totalExactCents !== amountCents) {
              setLoading(false);
              triggerHaptic("error");
              Alert.alert("Error en montos", `La suma de los montos debe ser exactamente RD$ ${amountNum.toFixed(2)}.`);
              return;
            }
            splitResults = splitByExactAmounts(amountCents, exactArray);
          } else if (splitMethod === "SHARES") {
            const sharesArray = activeParticipants.map((p: Participant) => ({
              participantId: p.id,
              shares: parseFloat(shares[p.id] || "1") || 1,
            }));
            splitResults = splitByShares(amountCents, sharesArray);
          }

          const finalDesc = notes.trim()
            ? `${description.trim()} (${notes.trim()})`
            : description.trim();

          const existingExp = isEditing
            ? detail.expenses.find((e: ExpenseWithSplits) => e.id === expenseId)
            : null;

          const savedExpense: ExpenseWithSplits = {
            id: expId,
            serrucho_id: serruchoId,
            paid_by_participant_id: payer.id,
            paid_by_name: payer.name,
            description: finalDesc,
            amount_cents: amountCents,
            split_method: splitMethod,
            category,
            expense_date: existingExp?.expense_date || new Date().toISOString().split("T")[0],
            created_at: existingExp?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            splits: splitResults.map((s) => {
              const part = detail.participants.find((p: Participant) => p.id === s.participantId);
              return {
                expense_id: expId,
                participant_id: s.participantId,
                participant_name: part?.name || "Amigo",
                owed_cents: s.owedCents,
                percentage_basis_points: s.percentageBasisPoints || Math.round((s.owedCents / amountCents) * 10000),
              };
            }),
          };

          const updatedExpenses = isEditing
            ? detail.expenses.map((e: ExpenseWithSplits) => (e.id === expenseId ? savedExpense : e))
            : [savedExpense, ...detail.expenses];

          const newBalances = calculateParticipantBalances(
            detail.participants,
            updatedExpenses,
            detail.transfers || []
          );

          await mobileStorage.saveSerruchoDetail(serruchoId, {
            ...detail,
            expenses: updatedExpenses,
            balances: newBalances,
          });

          // Broadcast mutation to sync engine for multi-device synchronization
          const user = await mobileStorage.getGlobalUser();
          await mobileSyncEngine.broadcastMutation({
            id: `mut_exp_${Date.now()}`,
            serrucho_id: serruchoId,
            action_type: isEditing ? "EXPENSE_UPDATED" : "EXPENSE_CREATED",
            actor_user_id: user.id,
            actor_participant_id: payer.id,
            payload: savedExpense,
            timestamp: new Date().toISOString(),
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

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={semanticTokens.colors.accent.primary} />
        <DSText variant="body" color="secondary" style={{ marginTop: 12 }}>
          Cargando detalles...
        </DSText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <DSSurface variant="elevated" style={styles.formCard}>
        <View style={styles.headerRow}>
          <DSText variant="title" weight="bold" color="primary">
            {isEditing ? "Editar Gasto ✏️" : "Registrar Nuevo Gasto 💸"}
          </DSText>
          <DSBadge label="DOP · RD$" variant="accent" size="sm" />
        </View>

        {/* Description Input */}
        <DSText variant="caption" weight="bold" color="secondary" style={styles.inputLabel}>
          Concepto del Gasto *
        </DSText>
        <TextInput
          placeholder="Ej. Supermercado, Gasolina, Uber, etc."
          placeholderTextColor={semanticTokens.colors.text.muted}
          value={description}
          onChangeText={setDescription}
          style={styles.textInput}
          autoFocus
        />

        {/* Amount Input */}
        <DSText variant="caption" weight="bold" color="secondary" style={styles.inputLabel}>
          Monto en Pesos Dominicanos (RD$) *
        </DSText>
        <TextInput
          placeholder="0.00"
          placeholderTextColor={semanticTokens.colors.text.muted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={styles.textInput}
        />

        {/* Payer Selection */}
        <DSText variant="caption" weight="bold" color="secondary" style={styles.inputLabel}>
          ¿Quién pagó? *
        </DSText>
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
                    backgroundColor: isPayer
                      ? semanticTokens.colors.accent.primary
                      : semanticTokens.colors.surface.base,
                    borderColor: isPayer
                      ? semanticTokens.colors.accent.primary
                      : semanticTokens.colors.divider,
                  },
                ]}
                accessibilityLabel={`Pagado por ${p.name}`}
                accessibilityRole="button"
              >
                <DSText
                  variant="caption"
                  weight="bold"
                  style={{ color: isPayer ? "#FFFFFF" : semanticTokens.colors.text.primary }}
                >
                  {p.name}
                </DSText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Split Method Selector */}
        <DSText variant="caption" weight="bold" color="secondary" style={styles.inputLabel}>
          Método de Reparto
        </DSText>
        <View style={styles.methodRow}>
          {(
            [
              { key: "EQUAL", label: "Igual =" },
              { key: "SHARES", label: "Cuotas ⚖️" },
              { key: "EXACT", label: "RD$ Exacto" },
            ] as const
          ).map((m) => {
            const isSelected = splitMethod === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => {
                  triggerHaptic("light");
                  setSplitMethod(m.key);
                }}
                style={[
                  styles.methodBtn,
                  {
                    backgroundColor: isSelected
                      ? semanticTokens.colors.accent.primary
                      : semanticTokens.colors.surface.base,
                    borderColor: isSelected
                      ? semanticTokens.colors.accent.primary
                      : semanticTokens.colors.divider,
                  },
                ]}
                accessibilityLabel={`Método de reparto ${m.label}`}
                accessibilityRole="button"
              >
                <DSText
                  variant="caption"
                  weight="bold"
                  style={{ color: isSelected ? "#FFFFFF" : semanticTokens.colors.text.primary }}
                >
                  {m.label}
                </DSText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Split Participants Selection */}
        <View style={styles.splitHeader}>
          <DSText variant="caption" weight="bold" color="secondary">
            Dividir entre ({selectedParticipantIds.size} de {participants.length}) *
          </DSText>
          <TouchableOpacity onPress={selectAllParticipants} accessibilityLabel="Seleccionar todos los participantes">
            <DSText variant="caption" weight="bold" color="accent">
              Seleccionar Todos
            </DSText>
          </TouchableOpacity>
        </View>

        <View style={styles.splitGrid}>
          {participants.map((p) => {
            const isSelected = selectedParticipantIds.has(p.id);
            return (
              <View key={p.id} style={styles.participantSplitRow}>
                <TouchableOpacity
                  onPress={() => toggleParticipant(p.id)}
                  style={[
                    styles.splitChip,
                    {
                      backgroundColor: isSelected
                        ? semanticTokens.colors.accent.primary + "20"
                        : semanticTokens.colors.surface.base,
                      borderColor: isSelected
                        ? semanticTokens.colors.accent.primary
                        : semanticTokens.colors.divider,
                    },
                  ]}
                  accessibilityLabel={`Incluir a ${p.name}`}
                  accessibilityRole="checkbox"
                >
                  <DSText
                    variant="caption"
                    weight={isSelected ? "bold" : "medium"}
                    style={{
                      color: isSelected
                        ? semanticTokens.colors.accent.primary
                        : semanticTokens.colors.text.secondary,
                    }}
                  >
                    {isSelected ? "✓ " : ""}{p.name}
                  </DSText>
                </TouchableOpacity>

                {isSelected && splitMethod === "PERCENTAGE" && (
                  <View style={styles.inlineInputContainer}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="%"
                      placeholderTextColor={semanticTokens.colors.text.muted}
                      value={percentages[p.id] || ""}
                      onChangeText={(val) => setPercentages({ ...percentages, [p.id]: val })}
                      keyboardType="decimal-pad"
                    />
                    <DSText variant="caption" weight="bold" color="secondary">%</DSText>
                  </View>
                )}

                {isSelected && splitMethod === "EXACT" && (
                  <View style={styles.inlineInputContainer}>
                    <DSText variant="caption" weight="bold" color="secondary">RD$</DSText>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="0.00"
                      placeholderTextColor={semanticTokens.colors.text.muted}
                      value={exactAmounts[p.id] || ""}
                      onChangeText={(val) => setExactAmounts({ ...exactAmounts, [p.id]: val })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                )}

                {isSelected && splitMethod === "SHARES" && (
                  <View style={styles.inlineInputContainer}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="1"
                      placeholderTextColor={semanticTokens.colors.text.muted}
                      value={shares[p.id] || ""}
                      onChangeText={(val) => setShares({ ...shares, [p.id]: val })}
                      keyboardType="decimal-pad"
                    />
                    <DSText variant="caption" weight="bold" color="secondary">cuotas</DSText>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Category Picker */}
        <DSText variant="caption" weight="bold" color="secondary" style={styles.inputLabel}>
          Categoría
        </DSText>
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
                    backgroundColor: isSelected
                      ? semanticTokens.colors.accent.primary
                      : semanticTokens.colors.surface.base,
                    borderColor: isSelected
                      ? semanticTokens.colors.accent.primary
                      : semanticTokens.colors.divider,
                  },
                ]}
                accessibilityLabel={`Categoría ${info.label}`}
                accessibilityRole="button"
              >
                <DSText
                  variant="caption"
                  weight="semibold"
                  style={{
                    color: isSelected ? "#FFFFFF" : semanticTokens.colors.text.primary,
                    fontSize: 12,
                  }}
                >
                  {info.emoji} {info.label.split("/")[0]}
                </DSText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes Input */}
        <DSText variant="caption" weight="bold" color="secondary" style={styles.inputLabel}>
          Nota u observación (Opcional)
        </DSText>
        <TextInput
          placeholder="Ej. Factura #401, propina incluida"
          placeholderTextColor={semanticTokens.colors.text.muted}
          value={notes}
          onChangeText={setNotes}
          style={styles.textInput}
        />

        {/* Action Buttons */}
        <View style={styles.actions}>
          <DSButton
            title={loading ? "Guardando..." : isEditing ? "Guardar Cambios ✓" : "Guardar Gasto"}
            onPress={handleAdd}
            loading={loading}
            disabled={loading}
            variant="primary"
            accessibilityLabel="Guardar gasto"
          />
          <DSButton
            title="Cancelar"
            variant="ghost"
            onPress={() => router.back()}
            disabled={loading}
            style={{ marginTop: 8 }}
            accessibilityLabel="Cancelar y volver"
          />
        </View>
      </DSSurface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.base,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  formCard: {
    padding: 16,
    borderRadius: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  inputLabel: {
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: semanticTokens.colors.divider,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: semanticTokens.colors.text.primary,
    backgroundColor: semanticTokens.colors.surface.base,
    fontSize: 15,
  },
  horizontalScroll: {
    flexDirection: "row",
    marginBottom: 6,
  },
  payerChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  methodRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  splitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  splitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  participantSplitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 4,
  },
  splitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  inlineInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineInput: {
    width: 80,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: semanticTokens.colors.divider,
    backgroundColor: semanticTokens.colors.surface.base,
    color: semanticTokens.colors.text.primary,
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  catBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  actions: {
    marginTop: 20,
  },
});
