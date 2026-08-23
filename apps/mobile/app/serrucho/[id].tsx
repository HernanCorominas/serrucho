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
import { BalanceRing } from "../../src/components/BalanceRing";
import { WhatsAppShareButton } from "../../src/components/WhatsAppShareButton";
import { mobileStorage } from "../../src/services/storage";
import { triggerHaptic } from "../../src/utils/haptics";
import {
  formatDOP,
  calculateParticipantBalances,
  CATEGORY_INFO,
  generateSerruchoInviteMessage,
  buildWhatsAppShareUrl,
  type Serrucho,
  type Participant,
  type ExpenseWithSplits,
  type ParticipantFinancials,
  type ExpenseCategory,
} from "@serrucho/core";

export default function SerruchoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const [serrucho, setSerrucho] = useState<Serrucho | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithSplits[]>([]);
  const [balances, setBalances] = useState<ParticipantFinancials[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"balances" | "expenses" | "participants">("balances");

  // Participant Management States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPName, setNewPName] = useState("");
  const [newPPhone, setNewPPhone] = useState("");
  const [editingP, setEditingP] = useState<Participant | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;

    // Check local storage first
    const cached = await mobileStorage.getSerruchoDetail(id);
    if (cached) {
      setSerrucho(cached.serrucho);
      setParticipants(cached.participants);
      setExpenses(cached.expenses);
      setBalances(cached.balances);
    } else {
      // Demo fallback for previewing in Expo Go
      const demoSerrucho: Serrucho = {
        id,
        owner_id: "demo-user",
        name: id === "las-terrenas-2025" ? "Villa en Las Terrenas 🌴" : "Serrucho del Coro",
        description: "Gastos compartidos del viaje",
        currency: "DOP",
        event_date: "2025-03-15",
        status: "OPEN",
        payment_instructions: "Transferir al BHD 829-555-0199 o tPago",
        payment_deadline: "2025-03-20",
        closed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const demoParticipants: Participant[] = [
        {
          id: "p1",
          serrucho_id: id,
          name: "Braulio (Tú)",
          email: "braulio@email.com",
          phone: "8295550199",
          preferred_channel: "WHATSAPP",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "p2",
          serrucho_id: id,
          name: "Camila",
          email: "camila@email.com",
          phone: "8095550122",
          preferred_channel: "WHATSAPP",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "p3",
          serrucho_id: id,
          name: "Manuel",
          email: "manuel@email.com",
          phone: "8495550133",
          preferred_channel: "WHATSAPP",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const demoExpenses: ExpenseWithSplits[] = [
        {
          id: "e1",
          serrucho_id: id,
          paid_by_participant_id: "p1",
          paid_by_name: "Tú (Organizador)",
          description: "Alquiler de la Villa",
          amount_cents: 3600000, // RD$ 36,000
          split_method: "EQUAL",
          category: "LODGING",
          expense_date: "2025-03-15",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          splits: [
            { expense_id: "e1", participant_id: "p1", participant_name: "Tú (Organizador)", owed_cents: 1200000, percentage_basis_points: 3334 },
            { expense_id: "e1", participant_id: "p2", participant_name: "Carlos Matos", owed_cents: 1200000, percentage_basis_points: 3333 },
            { expense_id: "e1", participant_id: "p3", participant_name: "Laura Gómez", owed_cents: 1200000, percentage_basis_points: 3333 },
          ],
        },
        {
          id: "e2",
          serrucho_id: id,
          paid_by_participant_id: "p2",
          paid_by_name: "Carlos Matos",
          description: "Supermercado Nacional & Bebidas",
          amount_cents: 1500000, // RD$ 15,000
          split_method: "EQUAL",
          category: "FOOD_GROCERIES",
          expense_date: "2025-03-16",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          splits: [
            { expense_id: "e2", participant_id: "p1", participant_name: "Tú (Organizador)", owed_cents: 500000, percentage_basis_points: 3334 },
            { expense_id: "e2", participant_id: "p2", participant_name: "Carlos Matos", owed_cents: 500000, percentage_basis_points: 3333 },
            { expense_id: "e2", participant_id: "p3", participant_name: "Laura Gómez", owed_cents: 500000, percentage_basis_points: 3333 },
          ],
        },
      ];

      const calculatedBalances = calculateParticipantBalances(demoParticipants, demoExpenses);

      setSerrucho(demoSerrucho);
      setParticipants(demoParticipants);
      setExpenses(demoExpenses);
      setBalances(calculatedBalances);

      await mobileStorage.saveSerruchoDetail(id, {
        serrucho: demoSerrucho,
        participants: demoParticipants,
        expenses: demoExpenses,
        balances: calculatedBalances,
      });
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        ? { ...editingP, name: editingP.name.trim(), phone: editingP.phone?.trim() || null, updated_at: new Date().toISOString() }
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
        `No puedes eliminar a "${pName}" porque tiene gastos o deudas registradas en este serrucho. Elimina o reasigna sus gastos primero para no romper las cuentas.`
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

  const handleShareSerrucho = async () => {
    if (!serrucho) return;
    triggerHaptic("medium");

    const joinUrl = `https://serrucho.do/dashboard/${id}`;
    const inviteMsg = generateSerruchoInviteMessage({
      serruchoName: serrucho.name,
      joinUrl,
    });

    try {
      await Share.share({
        message: inviteMsg,
        title: `Unirse a ${serrucho.name}`,
      });
    } catch {
      const waUrl = buildWhatsAppShareUrl(inviteMsg);
      await Linking.openURL(waUrl);
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
  const totalOwedCents = balances
    .filter((b) => b.net_balance_cents < 0)
    .reduce((sum, b) => sum + Math.abs(b.net_balance_cents), 0);
  const collectedCents = Math.max(0, totalExpensesCents - totalOwedCents);

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
        {/* Header Card */}
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
              label={serrucho.status === "OPEN" ? "EN CURSO" : "CERRADO"}
              variant={serrucho.status === "OPEN" ? "success" : "neutral"}
            />
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Total Gastos</Text>
              <Text style={[styles.metricVal, { color: colors.primary }]}>
                {formatDOP(totalExpensesCents)}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Participantes</Text>
              <Text style={[styles.metricVal, { color: theme.text }]}>
                {participants.length} amigos
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Gastos</Text>
              <Text style={[styles.metricVal, { color: theme.text }]}>
                {expenses.length} reg.
              </Text>
            </View>
          </View>

          {/* Share Coro Action */}
          <View style={{ marginTop: 12 }}>
            <Button
              title="Compartir con el Coro por WhatsApp 🇩🇴"
              onPress={handleShareSerrucho}
              variant="secondary"
              size="sm"
              icon={<Ionicons name="logo-whatsapp" size={16} color="#ffffff" />}
            />
          </View>
        </Card>

        {/* Progress Ring Card */}
        {serrucho.status === "CLOSED" && (
          <Card style={styles.progressCard}>
            <BalanceRing
              totalCents={totalExpensesCents}
              collectedCents={collectedCents}
            />
            <View style={styles.progressInfo}>
              <Text style={[styles.progressTitle, { color: theme.text }]}>
                Estado de Recaudación
              </Text>
              <Text style={[styles.progressSubtitle, { color: theme.textMuted }]}>
                {totalOwedCents === 0
                  ? "¡Cuentas saldadas al 100%! 🎉"
                  : `Faltan ${formatDOP(totalOwedCents)} por transferir`}
              </Text>
            </View>
          </Card>
        )}

        {/* Section Tabs */}
        <View style={[styles.tabBar, { backgroundColor: theme.inputBg }]}>
          <Button
            title="Balances ⚖️"
            variant={activeTab === "balances" ? "primary" : "ghost"}
            size="sm"
            onPress={() => {
              triggerHaptic("light");
              setActiveTab("balances");
            }}
            style={styles.tabBtn}
          />
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
            title={`Amigos (${participants.length})`}
            variant={activeTab === "participants" ? "primary" : "ghost"}
            size="sm"
            onPress={() => {
              triggerHaptic("light");
              setActiveTab("participants");
            }}
            style={styles.tabBtn}
          />
        </View>

        {/* Tab 1: Balances & WhatsApp Collections */}
        {activeTab === "balances" && (
          <View style={styles.tabContent}>
            {balances.map((p) => {
              const isCreditor = p.net_balance_cents > 0;
              const isDebtor = p.net_balance_cents < 0;

              const whatsappCobroMsg = `Hola ${p.name}! 🪚 En el serrucho *"${serrucho.name}"* te toca pagar *${formatDOP(Math.abs(p.net_balance_cents))}*.\n\nInstrucciones:\n${serrucho.payment_instructions || "Por favor transferir a la cuenta habitual."}\n\n¡Gracias! 🇩🇴`;

              return (
                <Card key={p.id} style={styles.balanceCard}>
                  <View style={styles.balanceHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.participantName, { color: theme.text }]}>
                        {p.name}
                      </Text>
                      <Text style={[styles.participantContact, { color: theme.textMuted }]}>
                        {p.phone || p.email || "Sin contacto"}
                      </Text>
                    </View>
                    <Badge
                      label={isCreditor ? "DEBE RECIBIR" : isDebtor ? "DEBE PAGAR" : "AL DÍA"}
                      variant={isCreditor ? "success" : isDebtor ? "danger" : "neutral"}
                    />
                  </View>

                  <View style={[styles.balanceGrid, { borderTopColor: theme.border }]}>
                    <View>
                      <Text style={[styles.gridLabel, { color: theme.textMuted }]}>Pagó</Text>
                      <Text style={[styles.gridVal, { color: theme.text }]}>
                        {formatDOP(p.total_paid_cents)}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.gridLabel, { color: theme.textMuted }]}>Le toca</Text>
                      <Text style={[styles.gridVal, { color: theme.text }]}>
                        {formatDOP(p.total_owed_cents)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.gridLabel, { color: theme.textMuted }]}>Balance</Text>
                      <Text
                        style={[
                          styles.gridVal,
                          {
                            color: isCreditor
                              ? colors.success
                              : isDebtor
                              ? colors.danger
                              : theme.textMuted,
                            fontWeight: "900",
                          },
                        ]}
                      >
                        {formatDOP(p.net_balance_cents, true)}
                      </Text>
                    </View>
                  </View>

                  {/* 1-Click WhatsApp Cobro for Debtors */}
                  {isDebtor && (
                    <View style={styles.cobroAction}>
                      <WhatsAppShareButton
                        phone={p.phone}
                        message={whatsappCobroMsg}
                        title={`Cobrar ${formatDOP(Math.abs(p.net_balance_cents))} por WhatsApp`}
                        size="sm"
                      />
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {/* Tab 2: Expenses */}
        {activeTab === "expenses" && (
          <View style={styles.tabContent}>
            {expenses.length === 0 ? (
              <Card style={styles.emptyTabCard}>
                <Text style={styles.emptyText}>No hay gastos registrados aún.</Text>
              </Card>
            ) : (
              expenses.map((e) => {
                const category = CATEGORY_INFO[(e.category as ExpenseCategory) || "OTHER"];
                const payer = participants.find((p) => p.id === e.paid_by_participant_id);

                return (
                  <Card key={e.id} style={styles.expenseCard}>
                    <View style={styles.expenseRow}>
                      <View style={styles.emojiBox}>
                        <Text style={{ fontSize: 24 }}>{category.emoji}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.expenseTitle, { color: theme.text }]}>
                          {e.description}
                        </Text>
                        <Text style={[styles.payerText, { color: theme.textMuted }]}>
                          Pagado por <Text style={{ fontWeight: "700" }}>{payer?.name || "Alguien"}</Text>
                        </Text>
                      </View>
                      <Text style={[styles.expenseAmount, { color: theme.text }]}>
                        {formatDOP(e.amount_cents)}
                      </Text>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* Tab 3: Participants */}
        {activeTab === "participants" && (
          <View style={styles.tabContent}>
            {serrucho.status === "OPEN" && (
              <Button
                title="+ Agregar Amigo al Serrucho"
                onPress={() => {
                  triggerHaptic("light");
                  setShowAddModal(true);
                }}
                variant="primary"
                size="md"
                style={{ marginBottom: 12 }}
                icon={<Ionicons name="person-add" size={16} color="#ffffff" />}
              />
            )}

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
                        {isOwner && <Badge label="ORGANIZADOR" variant="warning" size="sm" />}
                      </View>
                      <Text style={[styles.pPhone, { color: theme.textMuted }]}>
                        {p.phone ? `📱 ${p.phone}` : p.email ? `✉️ ${p.email}` : "Sin teléfono registrado"}
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
                            style={[styles.iconActionBtn, { backgroundColor: colors.danger + "20" }]}
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

      {/* Modal: Add Participant */}
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

      {/* Modal: Edit Participant */}
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

      {/* Floating Bottom Action Bar */}
      {serrucho.status === "OPEN" && (
        <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <Button
            title="+ Gasto"
            onPress={() => {
              triggerHaptic("medium");
              router.push(`/serrucho/add-expense?serruchoId=${id}`);
            }}
            variant="primary"
            size="sm"
            style={{ flex: 1 }}
            icon={<Ionicons name="add-circle" size={16} color="#ffffff" />}
          />
          <Button
            title="Por Platos 🍽️"
            onPress={() => {
              triggerHaptic("medium");
              router.push(`/serrucho/itemized?serruchoId=${id}`);
            }}
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
          />
          <Button
            title="Cerrar 🔒"
            onPress={() => {
              triggerHaptic("warning");
              router.push(`/serrucho/close?serruchoId=${id}`);
            }}
            variant="outline"
            size="sm"
            style={{ flex: 1 }}
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
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 16,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  progressSubtitle: {
    fontSize: 12,
    marginTop: 4,
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
  balanceCard: {
    marginBottom: 8,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "800",
  },
  participantContact: {
    fontSize: 12,
    marginTop: 1,
  },
  balanceGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  gridVal: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  cobroAction: {
    marginTop: 10,
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
    backgroundColor: "#fff7ed",
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
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#94a3b8",
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
});
