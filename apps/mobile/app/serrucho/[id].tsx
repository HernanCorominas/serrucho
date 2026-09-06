import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
  Modal,
  Alert,
  TouchableOpacity,
  Share,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme/colors";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Badge } from "../../src/components/ui/Badge";
import { Input } from "../../src/components/ui/Input";
import { WhatsAppShareButton } from "../../src/components/WhatsAppShareButton";
import { mobileStorage } from "../../src/services/storage";
import { triggerHaptic } from "../../src/utils/haptics";
import {
  formatDOP,
  calculateParticipantBalances,
  simplifyDebts,
  CATEGORY_INFO,
  generateSerruchoInviteMessage,
  generateSerruchoCollectionMessage,
  buildWhatsAppShareUrl,
  type Serrucho,
  type Participant,
  type ExpenseWithSplits,
  type ParticipantFinancials,
  type ExpenseCategory,
  type SimplifiedTransfer,
  type Transfer,
} from "@serrucho/core";

export default function SerruchoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const [serrucho, setSerrucho] = useState<Serrucho | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithSplits[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [balances, setBalances] = useState<ParticipantFinancials[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"expenses" | "balances" | "settings">("expenses");

  // Participant Management States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPName, setNewPName] = useState("");
  const [newPPhone, setNewPPhone] = useState("");
  const [editingP, setEditingP] = useState<Participant | null>(null);

  // Identity State ("Who are you?")
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  // Expense Detail Modal State
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithSplits | null>(null);

  // Group Settings State
  const [showEditSerruchoModal, setShowEditSerruchoModal] = useState(false);
  const [editSerruchoName, setEditSerruchoName] = useState("");
  const [editSerruchoDesc, setEditSerruchoDesc] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;

    // Load personal identity for this serrucho
    const storedMyId = await mobileStorage.getMyIdentity(id);
    setMyParticipantId(storedMyId);

    // Check local storage first
    const cached = await mobileStorage.getSerruchoDetail(id);
    if (cached) {
      setSerrucho(cached.serrucho);
      setParticipants(cached.participants || []);
      setExpenses(cached.expenses || []);
      setTransfers(cached.transfers || []);
      setBalances(
        cached.balances ||
          calculateParticipantBalances(
            cached.participants || [],
            cached.expenses || [],
            cached.transfers || []
          )
      );
    } else {
      // Look up serrucho in list
      const list = await mobileStorage.getSerruchos();
      const existing = list.find((s) => s.id === id);
      if (existing) {
        setSerrucho(existing);
        setParticipants([]);
        setExpenses([]);
        setTransfers([]);
        setBalances([]);
        await mobileStorage.saveSerruchoDetail(id, {
          serrucho: existing,
          participants: [],
          expenses: [],
          transfers: [],
          balances: [],
        });
      } else {
        // Fresh new Serrucho
        const fresh: Serrucho = {
          id,
          owner_id: "user-local",
          name: "Nuevo Serrucho",
          description: null,
          event_date: null,
          currency: "DOP",
          status: "OPEN",
          payment_instructions: "",
          payment_deadline: null,
          closed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setSerrucho(fresh);
        setParticipants([]);
        setExpenses([]);
        setBalances([]);
      }
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectIdentity = async (pId: string | null) => {
    triggerHaptic("selection");
    setMyParticipantId(pId);
    await mobileStorage.setMyIdentity(id, pId);
    setShowIdentityModal(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    triggerHaptic("light");
    await loadData();
    setRefreshing(false);
  };

  const handleAddParticipant = async () => {
    if (!newPName.trim()) {
      triggerHaptic("error");
      Alert.alert("Nombre requerido", "Por favor ingresa el nombre del amigo.");
      return;
    }

    triggerHaptic("medium");
    const newP: Participant = {
      id: `p-${Date.now()}`,
      serrucho_id: id,
      name: newPName.trim(),
      phone: newPPhone.trim() || null,
      email: null,
      preferred_channel: "WHATSAPP",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedParticipants = [...participants, newP];
    const updatedBalances = calculateParticipantBalances(updatedParticipants, expenses);
    setParticipants(updatedParticipants);
    setBalances(updatedBalances);

    if (serrucho) {
      await mobileStorage.saveSerruchoDetail(id, {
        serrucho,
        participants: updatedParticipants,
        expenses,
        balances: updatedBalances,
      });
    }

    setNewPName("");
    setNewPPhone("");
    setShowAddModal(false);
    triggerHaptic("success");
  };

  const handleUpdateParticipant = async () => {
    if (!editingP || !editingP.name.trim()) return;

    triggerHaptic("medium");
    const updatedParticipants = participants.map((p) =>
      p.id === editingP.id
        ? {
            ...editingP,
            name: editingP.name.trim(),
            phone: editingP.phone?.trim() || null,
            updated_at: new Date().toISOString(),
          }
        : p
    );
    const updatedBalances = calculateParticipantBalances(updatedParticipants, expenses);
    setParticipants(updatedParticipants);
    setBalances(updatedBalances);

    if (serrucho) {
      await mobileStorage.saveSerruchoDetail(id, {
        serrucho,
        participants: updatedParticipants,
        expenses,
        balances: updatedBalances,
      });
    }

    setEditingP(null);
    triggerHaptic("success");
  };

  const handleDeleteParticipant = (pId: string, pName: string) => {
    const hasPaid = expenses.some((e) => e.paid_by_participant_id === pId);
    const hasSplits = expenses.some((e) =>
      e.splits.some((s) => s.participant_id === pId && s.owed_cents > 0)
    );

    if (hasPaid || hasSplits) {
      triggerHaptic("warning");
      Alert.alert(
        "Integridad Contable",
        `No puedes eliminar a "${pName}" porque tiene gastos o deudas registradas en este serrucho. Elimina o reasigna sus gastos primero.`
      );
      return;
    }

    triggerHaptic("warning");
    Alert.alert(
      "Eliminar Amigo",
      `¿Deseas retirar a "${pName}" de este serrucho?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const updatedParticipants = participants.filter((p) => p.id !== pId);
            const updatedBalances = calculateParticipantBalances(updatedParticipants, expenses);
            setParticipants(updatedParticipants);
            setBalances(updatedBalances);

            if (serrucho) {
              await mobileStorage.saveSerruchoDetail(id, {
                serrucho,
                participants: updatedParticipants,
                expenses,
                balances: updatedBalances,
              });
            }
            triggerHaptic("success");
          },
        },
      ]
    );
  };

  const handleDeleteExpense = (expId: string, description: string) => {
    triggerHaptic("warning");
    Alert.alert(
      "Eliminar Gasto",
      `¿Deseas eliminar el gasto "${description}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const updatedExpenses = expenses.filter((e) => e.id !== expId);
            const updatedBalances = calculateParticipantBalances(participants, updatedExpenses, transfers);
            setExpenses(updatedExpenses);
            setBalances(updatedBalances);
            setSelectedExpense(null);

            if (serrucho) {
              await mobileStorage.saveSerruchoDetail(id, {
                serrucho,
                participants,
                expenses: updatedExpenses,
                transfers,
                balances: updatedBalances,
              });
            }
            triggerHaptic("success");
          },
        },
      ]
    );
  };

  const handleSettleTransfer = async (transfer: SimplifiedTransfer) => {
    triggerHaptic("medium");
    Alert.alert(
      "Confirmar Liquidación",
      `¿Marcar como pagada la transferencia de ${formatDOP(transfer.amount_cents)} de ${transfer.from_name} a ${transfer.to_name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar Pago ✓",
          onPress: async () => {
            const newTransfer: Transfer = {
              id: `trans-${Date.now()}`,
              serrucho_id: id,
              sender_participant_id: transfer.from_participant_id,
              receiver_participant_id: transfer.to_participant_id,
              amount_cents: transfer.amount_cents,
              transfer_date: new Date().toISOString().split("T")[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              notes: `Liquidación: ${transfer.from_name} ➔ ${transfer.to_name}`,
            };

            const updatedTransfers = [newTransfer, ...transfers];
            const updatedBalances = calculateParticipantBalances(participants, expenses, updatedTransfers);
            setTransfers(updatedTransfers);
            setBalances(updatedBalances);

            if (serrucho) {
              await mobileStorage.saveSerruchoDetail(id, {
                serrucho,
                participants,
                expenses,
                transfers: updatedTransfers,
                balances: updatedBalances,
              });
            }
            triggerHaptic("success");
          },
        },
      ]
    );
  };

  const handleDeleteTransfer = (transferId: string) => {
    triggerHaptic("warning");
    Alert.alert(
      "Anular Liquidación",
      "¿Deseas anular esta transferencia registrada? Se restaurarán los balances y deudas anteriores.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Anular Pago",
          style: "destructive",
          onPress: async () => {
            const updated = transfers.filter((t) => t.id !== transferId);
            const updatedBalances = calculateParticipantBalances(participants, expenses, updated);
            setTransfers(updated);
            setBalances(updatedBalances);

            if (serrucho) {
              await mobileStorage.saveSerruchoDetail(id, {
                serrucho,
                participants,
                expenses,
                transfers: updated,
                balances: updatedBalances,
              });
            }
            triggerHaptic("success");
          },
        },
      ]
    );
  };

  const handleUpdateSerruchoSettings = async () => {
    if (!serrucho) return;
    const trimmed = editSerruchoName.trim();
    if (!trimmed) {
      triggerHaptic("error");
      Alert.alert("Nombre requerido", "El serrucho debe tener un nombre válido.");
      return;
    }

    if (trimmed.length > 100) {
      triggerHaptic("error");
      Alert.alert("Nombre muy largo", "El nombre no puede exceder 100 caracteres.");
      return;
    }

    triggerHaptic("medium");
    const updated: Serrucho = {
      ...serrucho,
      name: trimmed,
      description: editSerruchoDesc.trim() || null,
      updated_at: new Date().toISOString(),
    };

    setSerrucho(updated);
    const list = await mobileStorage.getSerruchos();
    await mobileStorage.saveSerruchos(list.map((s) => (s.id === id ? updated : s)));
    await mobileStorage.saveSerruchoDetail(id, {
      serrucho: updated,
      participants,
      expenses,
      transfers,
      balances,
    });

    setShowEditSerruchoModal(false);
    triggerHaptic("success");
  };

  const handleToggleSerruchoStatus = async () => {
    if (!serrucho) return;
    triggerHaptic("medium");
    const nextStatus = serrucho.status === "OPEN" ? "CLOSED" : "OPEN";
    const actionText = nextStatus === "CLOSED" ? "Cerrar Serrucho" : "Reabrir Serrucho";
    const msg = nextStatus === "CLOSED"
      ? "¿Deseas cerrar este serrucho? Ya no se podrán agregar nuevos gastos ni participantes."
      : "¿Deseas reabrir este serrucho para permitir agregar nuevos gastos?";

    Alert.alert(actionText, msg, [
      { text: "Cancelar", style: "cancel" },
      {
        text: nextStatus === "CLOSED" ? "Cerrar" : "Reabrir",
        onPress: async () => {
          const updated: Serrucho = {
            ...serrucho,
            status: nextStatus,
            closed_at: nextStatus === "CLOSED" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          };

          setSerrucho(updated);
          const list = await mobileStorage.getSerruchos();
          await mobileStorage.saveSerruchos(list.map((s) => (s.id === id ? updated : s)));
          await mobileStorage.saveSerruchoDetail(id, {
            serrucho: updated,
            participants,
            expenses,
            transfers,
            balances,
          });
          triggerHaptic("success");
        },
      },
    ]);
  };

  const handleExportFinancialSummary = async () => {
    if (!serrucho) return;
    triggerHaptic("medium");

    const totalExpCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0);
    const simplified = simplifyDebts(participants, balances);

    const summaryLines = [
      `📊 *Resumen de Serrucho: ${serrucho.name}*`,
      `💰 *Total Gastado:* ${formatDOP(totalExpCents)}`,
      `📅 *Fecha:* ${serrucho.event_date || new Date().toISOString().split("T")[0]}`,
      "",
      `👥 *Balances de Participantes (${participants.length}):*`,
      ...balances.map(
        (b) =>
          `• ${b.name}: Pagó ${formatDOP(b.total_paid_cents)}, Le toca ${formatDOP(b.total_owed_cents)} ➔ *${
            b.net_balance_cents > 0
              ? `Le deben: +${formatDOP(b.net_balance_cents)}`
              : b.net_balance_cents < 0
              ? `Debe: ${formatDOP(b.net_balance_cents)}`
              : "Al día (RD$ 0.00)"
          }*`
      ),
      "",
      `⚖️ *Plan de Liquidación:*`,
      ...(simplified.length === 0
        ? ["¡Todas las cuentas están saldadas! 🎉"]
        : simplified.map((t) => `• *${t.from_name}* le paga a *${t.to_name}*: ${formatDOP(t.amount_cents)}`)),
      "",
      `📱 Generado con Serrucho 🇩🇴 (https://serrucho.do/k/${id})`,
    ];

    const message = summaryLines.join("\n");

    try {
      await Share.share({
        message,
        title: `Resumen de cuentas: ${serrucho.name}`,
      });
    } catch {
      const waUrl = buildWhatsAppShareUrl(message);
      await Linking.openURL(waUrl);
    }
  };

  const handleDeleteSerruchoPermanent = () => {
    if (!serrucho) return;
    triggerHaptic("warning");
    Alert.alert(
      "Eliminar Serrucho",
      `¿Estás seguro de eliminar permanentemente "${serrucho.name}"? Esta acción borrará todos los gastos, participantes y transferencias asociadas de este dispositivo.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar Permanentemente",
          style: "destructive",
          onPress: async () => {
            await mobileStorage.deleteSerrucho(id);
            triggerHaptic("success");
            router.replace("/(tabs)");
          },
        },
      ]
    );
  };

  const handleShareSerrucho = async () => {
    if (!serrucho) return;
    triggerHaptic("light");
    const shareUrl = `https://serrucho.do/s/${serrucho.id}`;
    const message = generateSerruchoInviteMessage({
      serruchoName: serrucho.name,
      joinUrl: shareUrl,
      organizerName: participants[0]?.name || "Un amigo",
    });

    try {
      await Share.share({
        message,
        url: shareUrl,
        title: `Únete a ${serrucho.name} en Serrucho 🇩🇴`,
      });
    } catch {
      // Fallback to WhatsApp URL
      const waUrl = buildWhatsAppShareUrl(message);
      Linking.openURL(waUrl);
    }
  };

  if (!serrucho) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textMuted }}>Cargando Serrucho...</Text>
      </View>
    );
  }

  const totalExpensesCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0);
  const simplifiedTransfers = simplifyDebts(participants, balances);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Kittysplit Signature Teal Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.serruchoName, { color: theme.text }]}>
                {serrucho.name}
              </Text>
              {serrucho.description ? (
                <Text style={[styles.serruchoDesc, { color: theme.textMuted }]}>
                  {serrucho.description}
                </Text>
              ) : null}
            </View>
            <Badge
              label={serrucho.status === "OPEN" ? "ABIERTO" : "CERRADO"}
              variant={serrucho.status === "OPEN" ? "success" : "neutral"}
            />
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Total Gastado</Text>
              <Text style={[styles.metricVal, { color: colors.primary }]}>
                {formatDOP(totalExpensesCents)}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Gastos</Text>
              <Text style={[styles.metricVal, { color: theme.text }]}>
                {expenses.length}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Amigos</Text>
              <Text style={[styles.metricVal, { color: theme.text }]}>
                {participants.length}
              </Text>
            </View>
          </View>

          {/* Share Action */}
          <View style={{ marginTop: 12 }}>
            <Button
              title="Compartir Enlace por WhatsApp 🇩🇴"
              onPress={handleShareSerrucho}
              variant="secondary"
              size="sm"
              icon={<Ionicons name="logo-whatsapp" size={16} color="#ffffff" />}
            />
          </View>
        </Card>

        {/* Kittysplit "Who are you?" Identity Banner */}
        {participants.length > 0 && (
          <Card style={styles.identityCard}>
            {myParticipantId ? (
              (() => {
                const myP = participants.find((p) => p.id === myParticipantId);
                const myBal = balances.find((b) => b.id === myParticipantId);
                const netCents = myBal?.net_balance_cents || 0;
                const isCreditor = netCents > 0;
                const isDebtor = netCents < 0;

                return (
                  <View style={styles.identityRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.identityLabel, { color: theme.textMuted }]}>
                        Tú eres: <Text style={{ fontWeight: "800", color: theme.text }}>{myP?.name || "Participante"}</Text>
                      </Text>
                      <Text style={[
                        styles.identityBalText,
                        { color: isCreditor ? colors.success : isDebtor ? colors.danger : theme.textMuted }
                      ]}>
                        {isCreditor ? `Te deben: +${formatDOP(netCents)}` : isDebtor ? `Debes: ${formatDOP(netCents)}` : "Estás al día (RD$ 0.00)"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic("light");
                        setShowIdentityModal(true);
                      }}
                      style={[styles.changeIdBtn, { borderColor: theme.border }]}
                    >
                      <Text style={[styles.changeIdText, { color: colors.primary }]}>Cambiar</Text>
                    </TouchableOpacity>
                  </View>
                );
              })()
            ) : (
              <View style={styles.identityRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.identityPromptTitle, { color: theme.text }]}>
                    ¿Quién eres tú en este Serrucho? 👤
                  </Text>
                  <Text style={[styles.identityPromptSub, { color: theme.textMuted }]}>
                    Elige tu nombre para ver tu balance personal.
                  </Text>
                </View>
                <Button
                  title="Elegir"
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    triggerHaptic("light");
                    setShowIdentityModal(true);
                  }}
                  style={{ borderRadius: 10 }}
                />
              </View>
            )}
          </Card>
        )}

        {/* Kittysplit 3 Canonical Tabs */}
        <View style={[styles.tabBar, { backgroundColor: theme.inputBg }]}>
          <Button
            title={`Gastos (${expenses.length})`}
            variant={activeTab === "expenses" ? "primary" : "ghost"}
            size="sm"
            onPress={() => {
              triggerHaptic("light");
              setActiveTab("expenses");
            }}
            style={styles.tabBtn}
          />
          <Button
            title="Saldos ⚖️"
            variant={activeTab === "balances" ? "primary" : "ghost"}
            size="sm"
            onPress={() => {
              triggerHaptic("light");
              setActiveTab("balances");
            }}
            style={styles.tabBtn}
          />
          <Button
            title={`Ajustes 👥`}
            variant={activeTab === "settings" ? "primary" : "ghost"}
            size="sm"
            onPress={() => {
              triggerHaptic("light");
              setActiveTab("settings");
            }}
            style={styles.tabBtn}
          />
        </View>

        {/* ─── TAB 1: GASTOS (EXPENSES) ────────────────────────────────────── */}
        {activeTab === "expenses" && (
          <View style={styles.tabContent}>
            {/* Top Add Expense Action */}
            {serrucho.status === "OPEN" && (
              <Button
                title="+ Añadir Gasto"
                onPress={() => {
                  triggerHaptic("medium");
                  router.push(`/serrucho/add-expense?serruchoId=${id}`);
                }}
                variant="primary"
                size="md"
                style={styles.addExpTopBtn}
                icon={<Ionicons name="add-circle" size={18} color="#ffffff" />}
              />
            )}

            {expenses.length === 0 ? (
              <Card style={styles.emptyTabCard}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="receipt-outline" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTabTitle, { color: theme.text }]}>
                  Aún no hay gastos registrados
                </Text>
                <Text style={[styles.emptyTabSubtitle, { color: theme.textMuted }]}>
                  ¡Sé el primero en anotar los gastos del grupo! Añade las compras, comida, combustible o villa.
                </Text>
                {serrucho.status === "OPEN" && (
                  <Button
                    title="+ Añadir Primer Gasto"
                    onPress={() => {
                      triggerHaptic("medium");
                      router.push(`/serrucho/add-expense?serruchoId=${id}`);
                    }}
                    variant="primary"
                    size="sm"
                    style={{ marginTop: 14, borderRadius: 12 }}
                  />
                )}
              </Card>
            ) : (
              expenses.map((e) => {
                const category = CATEGORY_INFO[(e.category as ExpenseCategory) || "OTHER"];
                const payer = participants.find((p) => p.id === e.paid_by_participant_id);
                const splitCount = e.splits ? e.splits.length : participants.length;

                return (
                  <TouchableOpacity
                    key={e.id}
                    onPress={() => {
                      triggerHaptic("light");
                      setSelectedExpense(e);
                    }}
                    activeOpacity={0.7}
                  >
                    <Card style={styles.expenseCard}>
                      <View style={styles.expenseRow}>
                        <View style={styles.emojiBox}>
                          <Text style={{ fontSize: 22 }}>{category?.emoji || "🧾"}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.expenseTitle, { color: theme.text }]}>
                            {e.description}
                          </Text>
                          <Text style={[styles.payerText, { color: theme.textMuted }]}>
                            Pagado por <Text style={{ fontWeight: "700" }}>{payer?.name || e.paid_by_name || "Alguien"}</Text> • {splitCount} {splitCount === 1 ? "persona" : "personas"}
                          </Text>
                        </View>
                        <Text style={[styles.expenseAmount, { color: theme.text }]}>
                          {formatDOP(e.amount_cents)}
                        </Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ─── TAB 2: SALDOS Y PAGOS (BALANCES & DEBTS) ─────────────────────── */}
        {activeTab === "balances" && (
          <View style={styles.tabContent}>
            {/* Section 1: Simplified Debts (Quién le debe a quién) */}
            <Text style={[styles.subSectionTitle, { color: theme.text }]}>
              Menos Transferencias Posibles ⚖️
            </Text>
            {simplifiedTransfers.length === 0 ? (
              <Card style={styles.emptyTabCard}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="checkmark-circle-outline" size={28} color={colors.success} />
                </View>
                <Text style={[styles.emptyTabTitle, { color: theme.text }]}>
                  ¡Todas las cuentas están saldadas! 🎉
                </Text>
                <Text style={[styles.emptyTabSubtitle, { color: theme.textMuted }]}>
                  No hay deudas pendientes entre los integrantes.
                </Text>
              </Card>
            ) : (
              simplifiedTransfers.map((t, idx) => {
                const debtorObj = participants.find((p) => p.id === t.from_participant_id);
                const collectionMsg = generateSerruchoCollectionMessage({
                  serruchoName: serrucho.name,
                  debtorName: t.from_name,
                  amountFormatted: formatDOP(t.amount_cents),
                  paymentInstructions: serrucho.payment_instructions,
                });

                return (
                  <Card key={`transfer-${idx}`} style={styles.transferCard}>
                    <View style={styles.transferRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.transferNameRow}>
                          <Text style={[styles.debtorName, { color: colors.danger }]}>
                            {t.from_name}
                          </Text>
                          <Text style={[styles.arrowText, { color: theme.textMuted }]}>
                            le debe a
                          </Text>
                          <Text style={[styles.creditorName, { color: colors.success }]}>
                            {t.to_name}
                          </Text>
                        </View>
                        <Text style={[styles.transferAmount, { color: colors.primary }]}>
                          {formatDOP(t.amount_cents)}
                        </Text>
                      </View>
                    </View>

                    {/* Action buttons: Saldar & WhatsApp */}
                    <View style={styles.transferActions}>
                      <Button
                        title="Saldar ✓"
                        size="sm"
                        variant="primary"
                        onPress={() => handleSettleTransfer(t)}
                        style={{ flex: 1, borderRadius: 10 }}
                      />
                      <WhatsAppShareButton
                        phone={debtorObj?.phone}
                        message={collectionMsg}
                        title="WhatsApp"
                        size="sm"
                        style={{ flex: 1 }}
                      />
                    </View>
                  </Card>
                );
              })
            )}

            {/* Section 2: Individual Balances */}
            <Text style={[styles.subSectionTitle, { color: theme.text, marginTop: 14 }]}>
              Balance de Cada Participante
            </Text>
            {balances.map((p) => {
              const isCreditor = p.net_balance_cents > 0;
              const isDebtor = p.net_balance_cents < 0;

              return (
                <Card key={p.id} style={styles.balanceCard}>
                  <View style={styles.balanceHeader}>
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>
                        {p.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.participantName, { color: theme.text }]}>
                        {p.name}
                      </Text>
                      <Text style={[styles.participantContact, { color: theme.textMuted }]}>
                        Pagó: {formatDOP(p.total_paid_cents)} • Le toca: {formatDOP(p.total_owed_cents)}
                      </Text>
                    </View>
                    <Badge
                      label={
                        isCreditor
                          ? `+${formatDOP(p.net_balance_cents)}`
                          : isDebtor
                          ? `${formatDOP(p.net_balance_cents)}`
                          : "RD$ 0.00"
                      }
                      variant={isCreditor ? "success" : isDebtor ? "danger" : "neutral"}
                    />
                  </View>
                </Card>
              );
            })}

            {/* Section 3: Registered Settlements / Transfers */}
            {transfers.length > 0 && (
              <>
                <Text style={[styles.subSectionTitle, { color: theme.text, marginTop: 16 }]}>
                  Pagos y Liquidaciones Registradas ({transfers.length}) ✓
                </Text>
                {transfers.map((t) => {
                  const sender = participants.find((p) => p.id === t.sender_participant_id);
                  const receiver = participants.find((p) => p.id === t.receiver_participant_id);

                  return (
                    <Card key={t.id} style={[styles.balanceCard, { borderLeftWidth: 3, borderLeftColor: colors.success }]}>
                      <View style={styles.balanceHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.participantName, { color: theme.text, fontSize: 13 }]}>
                            {sender?.name || "Deudor"} ➔ {receiver?.name || "Acreedor"}
                          </Text>
                          <Text style={[styles.participantContact, { color: theme.textMuted, fontSize: 11 }]}>
                            {t.transfer_date} • {t.notes || "Deuda saldada"}
                          </Text>
                        </View>
                        <Text style={{ fontWeight: "900", color: colors.success, fontSize: 13, marginRight: 8 }}>
                          {formatDOP(t.amount_cents)}
                        </Text>
                        {serrucho.status === "OPEN" && (
                          <TouchableOpacity
                            onPress={() => handleDeleteTransfer(t.id)}
                            style={[styles.iconActionBtn, { backgroundColor: colors.danger + "20" }]}
                          >
                            <Ionicons name="trash-outline" size={14} color={colors.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </Card>
                  );
                })}
              </>
            )}
          </View>
        )}

        {/* ─── TAB 3: AJUSTES & INTEGRANTES (SETTINGS & MEMBERS) ──────────── */}
        {activeTab === "settings" && (
          <View style={styles.tabContent}>
            {/* Group Configuration Card */}
            <Card style={{ marginBottom: 12 }}>
              <Text style={[styles.subSectionTitle, { color: theme.text, marginBottom: 8 }]}>
                Configuración del Serrucho ⚙️
              </Text>
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: theme.text }}>
                  {serrucho.name}
                </Text>
                {serrucho.description && (
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                    {serrucho.description}
                  </Text>
                )}
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                  Moneda base: 🇩🇴 RD$ (DOP) • Estado: <Text style={{ fontWeight: "700", color: serrucho.status === "OPEN" ? colors.success : colors.danger }}>{serrucho.status === "OPEN" ? "Abierto" : "Cerrado"}</Text>
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {serrucho.status === "OPEN" && (
                  <Button
                    title="Editar Nombre / Ajustes ✏️"
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      triggerHaptic("light");
                      setEditSerruchoName(serrucho.name);
                      setEditSerruchoDesc(serrucho.description || "");
                      setShowEditSerruchoModal(true);
                    }}
                    style={{ borderRadius: 10 }}
                  />
                )}

                <Button
                  title={serrucho.status === "OPEN" ? "Cerrar Serrucho 🔒" : "Reabrir Serrucho 🔓"}
                  variant="outline"
                  size="sm"
                  onPress={handleToggleSerruchoStatus}
                  style={{ borderRadius: 10 }}
                />

                <Button
                  title="Exportar / Compartir Resumen 📊"
                  variant="secondary"
                  size="sm"
                  onPress={handleExportFinancialSummary}
                  icon={<Ionicons name="share-outline" size={16} color="#ffffff" />}
                  style={{ borderRadius: 10 }}
                />

                <Button
                  title="Eliminar Serrucho Permanentemente 🗑️"
                  variant="danger"
                  size="sm"
                  onPress={handleDeleteSerruchoPermanent}
                  style={{ borderRadius: 10, marginTop: 4 }}
                />
              </View>
            </Card>

            {/* Participants Section Title */}
            <Text style={[styles.subSectionTitle, { color: theme.text, marginTop: 4, marginBottom: 8 }]}>
              Integrantes del Grupo ({participants.length}) 👥
            </Text>

            {/* Add Member Button */}
            {serrucho.status === "OPEN" && (
              <Button
                title="+ Agregar Amigo al Serrucho"
                onPress={() => {
                  triggerHaptic("light");
                  setShowAddModal(true);
                }}
                variant="primary"
                size="md"
                style={{ marginBottom: 12, borderRadius: 12 }}
                icon={<Ionicons name="person-add" size={16} color="#ffffff" />}
              />
            )}

            {/* Participants list */}
            {participants.map((p, idx) => {
              const isOwner = idx === 0 || p.name.includes("Organizador") || p.name.includes("Tú");
              return (
                <Card key={p.id} style={styles.participantCard}>
                  <View style={styles.participantRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{p.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={[styles.pName, { color: theme.text }]}>{p.name}</Text>
                        {isOwner && <Badge label="CREADOR" variant="warning" size="sm" />}
                      </View>
                      <Text style={[styles.pPhone, { color: theme.textMuted }]}>
                        {p.phone ? `📱 ${p.phone}` : "Sin teléfono registrado"}
                      </Text>
                    </View>

                    {serrucho.status === "OPEN" && (
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => {
                            triggerHaptic("light");
                            setEditingP(p);
                          }}
                          style={[styles.iconActionBtn, { backgroundColor: theme.border }]}
                        >
                          <Ionicons name="pencil" size={14} color={theme.text} />
                        </TouchableOpacity>

                        {!isOwner && (
                          <TouchableOpacity
                            onPress={() => handleDeleteParticipant(p.id, p.name)}
                            style={[
                              styles.iconActionBtn,
                              { backgroundColor: colors.danger + "20" },
                            ]}
                          >
                            <Ionicons name="trash-outline" size={14} color={colors.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ─── MODAL: EXPENSE DETAIL ────────────────────────────────────────── */}
      <Modal visible={!!selectedExpense} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {selectedExpense && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                      {selectedExpense.description}
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                      Fecha: {selectedExpense.expense_date}
                    </Text>
                  </View>
                  <Text style={[styles.modalBigAmount, { color: colors.primary }]}>
                    {formatDOP(selectedExpense.amount_cents)}
                  </Text>
                </View>

                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
                  Pagado por: <Text style={{ fontWeight: "900", color: colors.primary }}>{selectedExpense.paid_by_name || "Organizador"}</Text>
                </Text>

                <Text style={[styles.detailSectionTitle, { color: theme.text, marginTop: 10 }]}>
                  Reparto entre integrantes:
                </Text>
                <View style={[styles.splitsBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  {selectedExpense.splits && selectedExpense.splits.length > 0 ? (
                    selectedExpense.splits.map((s, idx) => (
                      <View key={idx} style={styles.splitLineRow}>
                        <Text style={[styles.splitName, { color: theme.text }]}>
                          {s.participant_name}
                        </Text>
                        <Text style={[styles.splitAmount, { color: theme.text }]}>
                          {formatDOP(s.owed_cents)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                      Dividido equitativamente entre todos.
                    </Text>
                  )}
                </View>

                <View style={styles.modalActions}>
                  {serrucho.status === "OPEN" && (
                    <Button
                      title="Editar Gasto ✏️"
                      variant="primary"
                      onPress={() => {
                        const expId = selectedExpense.id;
                        setSelectedExpense(null);
                        router.push(`/serrucho/add-expense?serruchoId=${id}&expenseId=${expId}`);
                      }}
                      size="md"
                      style={{ flex: 1 }}
                    />
                  )}
                  {serrucho.status === "OPEN" && (
                    <Button
                      title="Eliminar Gasto"
                      variant="danger"
                      onPress={() =>
                        handleDeleteExpense(selectedExpense.id, selectedExpense.description)
                      }
                      size="md"
                      style={{ flex: 1 }}
                    />
                  )}
                  <Button
                    title="Cerrar"
                    variant="ghost"
                    onPress={() => setSelectedExpense(null)}
                    size="md"
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: ADD PARTICIPANT ───────────────────────────────────────── */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Agregar Amigo al Serrucho 👥
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Añade a un amigo para incluirlo en la división de gastos.
            </Text>

            <Input
              label="Nombre del Amigo *"
              placeholder="Ej. Carlos Matos"
              value={newPName}
              onChangeText={setNewPName}
              autoFocus
            />

            <Input
              label="Teléfono / WhatsApp (Opcional)"
              placeholder="Ej. 829-555-0123"
              value={newPPhone}
              onChangeText={setNewPPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                variant="ghost"
                onPress={() => setShowAddModal(false)}
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Agregar ➔"
                variant="primary"
                onPress={handleAddParticipant}
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: EDIT PARTICIPANT ──────────────────────────────────────── */}
      <Modal visible={!!editingP} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Editar Amigo ✏️
            </Text>

            {editingP && (
              <>
                <Input
                  label="Nombre *"
                  placeholder="Nombre"
                  value={editingP.name}
                  onChangeText={(text) => setEditingP({ ...editingP, name: text })}
                  autoFocus
                />

                <Input
                  label="Teléfono / WhatsApp (Opcional)"
                  placeholder="809..."
                  value={editingP.phone || ""}
                  onChangeText={(text) => setEditingP({ ...editingP, phone: text })}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                variant="ghost"
                onPress={() => setEditingP(null)}
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Guardar Cambios"
                variant="primary"
                onPress={handleUpdateParticipant}
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: IDENTITY SELECTOR ("WHO ARE YOU?") ─────────────────────── */}
      <Modal visible={showIdentityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              ¿Quién eres tú? 👤
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Selecciona tu nombre en este Serrucho para resaltar tus cuentas en este dispositivo:
            </Text>

            <ScrollView style={{ maxHeight: 260, marginVertical: 10 }}>
              {participants.map((p) => {
                const isSelected = myParticipantId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => handleSelectIdentity(p.id)}
                    style={[
                      styles.identityOption,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : theme.inputBg,
                        borderColor: isSelected ? colors.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>{p.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text
                      style={[
                        styles.identityOptionText,
                        { color: isSelected ? colors.primary : theme.text, fontWeight: isSelected ? "800" : "600" },
                      ]}
                    >
                      {p.name}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                onPress={() => handleSelectIdentity(null)}
                style={[styles.identityOption, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 4 }]}
              >
                <Text style={[styles.identityOptionText, { color: theme.textMuted, fontStyle: "italic" }]}>
                  Ninguno (Solo espectador)
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <Button
              title="Cerrar"
              variant="ghost"
              onPress={() => setShowIdentityModal(false)}
              size="md"
              style={{ marginTop: 6 }}
            />
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: EDIT SERRUCHO SETTINGS ───────────────────────────────── */}
      <Modal visible={showEditSerruchoModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Editar Serrucho ⚙️
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Modifica el nombre o descripción del grupo:
            </Text>

            <Input
              label="Nombre del Serrucho *"
              placeholder="Ej. Villa en Jarabacoa"
              value={editSerruchoName}
              onChangeText={setEditSerruchoName}
              autoFocus
            />

            <Input
              label="Descripción (Opcional)"
              placeholder="Ej. Gastos del fin de semana"
              value={editSerruchoDesc}
              onChangeText={setEditSerruchoDesc}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                variant="ghost"
                onPress={() => setShowEditSerruchoModal(false)}
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Guardar"
                variant="primary"
                onPress={handleUpdateSerruchoSettings}
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── FLOATING BOTTOM ACTION BUTTON ───────────────────────────────── */}
      {serrucho.status === "OPEN" && (
        <View
          style={[
            styles.bottomBar,
            { backgroundColor: theme.card, borderTopColor: theme.border },
          ]}
        >
          <Button
            title="+ Añadir Gasto"
            onPress={() => {
              triggerHaptic("medium");
              router.push(`/serrucho/add-expense?serruchoId=${id}`);
            }}
            variant="primary"
            size="md"
            style={{ flex: 1, borderRadius: 14 }}
            icon={<Ionicons name="add-circle" size={18} color="#ffffff" />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 90,
  },
  headerCard: {
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  serruchoName: {
    fontSize: 20,
    fontWeight: "900",
  },
  serruchoDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#cbd5e1",
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricVal: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 10,
  },
  tabContent: {
    gap: 8,
  },
  addExpTopBtn: {
    borderRadius: 12,
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  transferCard: {
    marginBottom: 8,
    padding: 12,
  },
  transferRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  transferNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  debtorName: {
    fontSize: 15,
    fontWeight: "800",
  },
  arrowText: {
    fontSize: 12,
    fontWeight: "600",
  },
  creditorName: {
    fontSize: 15,
    fontWeight: "800",
  },
  transferAmount: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 3,
  },
  transferActions: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e2e8f0",
  },
  balanceCard: {
    marginBottom: 6,
    padding: 12,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmallText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
  },
  participantName: {
    fontSize: 14,
    fontWeight: "800",
  },
  participantContact: {
    fontSize: 11,
    marginTop: 1,
  },
  expenseCard: {
    marginBottom: 6,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  payerText: {
    fontSize: 12,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "900",
  },
  participantCard: {
    marginBottom: 6,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },
  pName: {
    fontSize: 15,
    fontWeight: "700",
  },
  pPhone: {
    fontSize: 12,
    marginTop: 1,
  },
  emptyTabCard: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: 20,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTabTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyTabSubtitle: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
    paddingHorizontal: 10,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 12,
    paddingBottom: 24,
    gap: 10,
    borderTopWidth: 1,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
  },
  modalBigAmount: {
    fontSize: 20,
    fontWeight: "900",
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  splitsBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 6,
    marginBottom: 14,
  },
  splitLineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  splitName: {
    fontSize: 13,
    fontWeight: "600",
  },
  splitAmount: {
    fontSize: 13,
    fontWeight: "800",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  identityCard: {
    marginBottom: 10,
    padding: 12,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  identityLabel: {
    fontSize: 12,
  },
  identityBalText: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  changeIdBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeIdText: {
    fontSize: 11,
    fontWeight: "700",
  },
  identityPromptTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  identityPromptSub: {
    fontSize: 11,
    marginTop: 1,
  },
  identityOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  identityOptionText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
});
