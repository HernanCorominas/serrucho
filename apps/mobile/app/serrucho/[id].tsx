import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  TouchableOpacity,
  Share,
  Linking,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  calculateParticipantBalances,
  simplifyDebts,
  formatDOP,
  type Serrucho,
  type Participant,
  type ExpenseWithSplits,
  type ParticipantFinancials,
  type SimplifiedTransfer,
  type Transfer,
  type ActivityEvent,
  type SerruchoTier,
} from "@serrucho/core";
import { semanticTokens } from "@serrucho/ui";
import { useAppTheme } from "../../src/theme/colors";
import { triggerHaptic } from "../../src/utils/haptics";
import {
  DSText,
  DSDivider,
  DSSurface,
  DSButton,
  DSAvatar,
  DSSettingRow,
  DSIconButton,
  DSBadge,
  DSSection,
  DSEmptyState,
  DSExpenseRow,
  DSDebtRow,
  DSBalanceRow,
} from "../../src/components/ds";
import { ContextualTopAppBar } from "../../src/components/navigation/ContextualTopAppBar";
import {
  ActiveKittyBottomTabs,
  type ActiveKittyTab,
} from "../../src/components/navigation/ActiveKittyBottomTabs";
import { useGlobalNavigation } from "../../src/navigation/GlobalNavigationContext";
import {
  mobileStorage,
  type MobileSerruchoDetailData,
  type BilateralSettlement,
} from "../../src/services/storage";
import { BilateralSettlementModal } from "../../src/components/settlement/BilateralSettlementModal";
import { PaymentSettledAnimation } from "../../src/components/ui/PaymentSettledAnimation";

export default function SerruchoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    activeSerruchoId,
    setActiveSerruchoId,
    setActiveSerruchoName,
    registerRecent,
  } = useGlobalNavigation();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<ActiveKittyTab>("expenses");

  // Core Data
  const { tokens } = useAppTheme();
  const [serrucho, setSerrucho] = useState<Serrucho | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithSplits[]>([]);
  const [balances, setBalances] = useState<ParticipantFinancials[]>([]);
  const [debts, setDebts] = useState<SimplifiedTransfer[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [tier, setTier] = useState<SerruchoTier>("FREE");
  const [bilateralSettlements, setBilateralSettlements] = useState<BilateralSettlement[]>([]);

  // Payment Celebration Animation State
  const [settledAnimationData, setSettledAnimationData] = useState<{
    visible: boolean;
    debtorName: string;
    creditorName: string;
    amountCents: number;
  }>({
    visible: false,
    debtorName: "",
    creditorName: "",
    amountCents: 0,
  });

  // Identity & Permissions
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editParticipantNameValue, setEditParticipantNameValue] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuperModal, setShowSuperModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<SimplifiedTransfer | null>(null);

  // Sync route param with global context
  useEffect(() => {
    if (id && id !== activeSerruchoId) {
      setActiveSerruchoId(id);
    }
  }, [id, activeSerruchoId, setActiveSerruchoId]);

  // Load Data
  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const myId = await mobileStorage.getMyIdentity(id);
      setMyParticipantId(myId);

      const stored = await mobileStorage.getSerruchoDetail(id);
      if (stored) {
        setSerrucho(stored.serrucho);
        setParticipants(stored.participants || []);
        setExpenses(stored.expenses || []);
        setTransfers(stored.transfers || []);
        setActivities(stored.activities || []);
        setTier(stored.tier || "FREE");
        setBilateralSettlements(stored.bilateral_settlements || []);
        setActiveSerruchoName(stored.serrucho.name);
        await registerRecent(stored.serrucho.id, stored.serrucho.name);

        const calculated = calculateParticipantBalances(
          stored.participants || [],
          stored.expenses || [],
          stored.transfers || []
        );
        setBalances(calculated);
        setDebts(simplifyDebts(stored.participants || [], calculated));
      } else {
        // Fallback default initial state
        const now = new Date().toISOString();
        const initialSerrucho: Serrucho = {
          id,
          owner_id: "p1",
          name: "Viaje a Las Terrenas 🏖️",
          description: "Coro en la playa de fin de semana",
          currency: "DOP",
          event_date: now,
          status: "OPEN",
          payment_instructions: null,
          payment_deadline: null,
          closed_at: null,
          created_at: now,
          updated_at: now,
        };
        const p1: Participant = {
          id: "p1",
          serrucho_id: id,
          name: "Juan (Tú)",
          email: null,
          phone: null,
          preferred_channel: "WHATSAPP",
          created_at: now,
          updated_at: now,
        };
        const p2: Participant = {
          id: "p2",
          serrucho_id: id,
          name: "Pedro",
          email: null,
          phone: null,
          preferred_channel: "WHATSAPP",
          created_at: now,
          updated_at: now,
        };
        const p3: Participant = {
          id: "p3",
          serrucho_id: id,
          name: "María",
          email: null,
          phone: null,
          preferred_channel: "WHATSAPP",
          created_at: now,
          updated_at: now,
        };
        const initialParticipants = [p1, p2, p3];

        const initialExpenses: ExpenseWithSplits[] = [
          {
            id: "e1",
            serrucho_id: id,
            description: "Supermercado Nacional",
            amount_cents: 450000,
            paid_by_participant_id: "p1",
            paid_by_name: "Juan (Tú)",
            expense_date: now,
            split_method: "EQUAL",
            category: "GROCERIES",
            created_at: now,
            updated_at: now,
            splits: [
              { expense_id: "e1", participant_id: "p1", participant_name: "Juan (Tú)", percentage_basis_points: 3334, owed_cents: 150000 },
              { expense_id: "e1", participant_id: "p2", participant_name: "Pedro", percentage_basis_points: 3333, owed_cents: 150000 },
              { expense_id: "e1", participant_id: "p3", participant_name: "María", percentage_basis_points: 3333, owed_cents: 150000 },
            ],
          },
          {
            id: "e2",
            serrucho_id: id,
            description: "Gasolina Autopista del Nordeste",
            amount_cents: 240000,
            paid_by_participant_id: "p2",
            paid_by_name: "Pedro",
            expense_date: now,
            split_method: "EQUAL",
            category: "GAS_FUEL",
            created_at: now,
            updated_at: now,
            splits: [
              { expense_id: "e2", participant_id: "p1", participant_name: "Juan (Tú)", percentage_basis_points: 3334, owed_cents: 80000 },
              { expense_id: "e2", participant_id: "p2", participant_name: "Pedro", percentage_basis_points: 3333, owed_cents: 80000 },
              { expense_id: "e2", participant_id: "p3", participant_name: "María", percentage_basis_points: 3333, owed_cents: 80000 },
            ],
          },
        ];

        const initialActivities: ActivityEvent[] = [
          {
            id: "act1",
            serrucho_id: id,
            action_type: "EXPENSE_CREATED",
            entity_type: "EXPENSE",
            actor_name: "Juan (Tú)",
            summary: "Juan agregó el gasto 'Supermercado Nacional'",
            created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            id: "act2",
            serrucho_id: id,
            action_type: "EXPENSE_CREATED",
            entity_type: "EXPENSE",
            actor_name: "Pedro",
            summary: "Pedro agregó el gasto 'Gasolina Autopista del Nordeste'",
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          },
          {
            id: "act3",
            serrucho_id: id,
            action_type: "PARTICIPANT_ADDED",
            entity_type: "PARTICIPANT",
            actor_name: "María",
            summary: "María se unió al Serrucho",
            created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          },
        ];

        setSerrucho(initialSerrucho);
        setParticipants(initialParticipants);
        setExpenses(initialExpenses);
        setTransfers([]);
        setActivities(initialActivities);
        setTier("FREE");
        setMyParticipantId("p1");
        await mobileStorage.setMyIdentity(id, "p1");

        const calculated = calculateParticipantBalances(initialParticipants, initialExpenses, []);
        setBalances(calculated);
        setDebts(simplifyDebts(initialParticipants, calculated));

        const detail: MobileSerruchoDetailData = {
          serrucho: initialSerrucho,
          participants: initialParticipants,
          expenses: initialExpenses,
          balances: calculated,
          transfers: [],
          activities: initialActivities,
          tier: "FREE",
        };
        await mobileStorage.saveSerruchoDetail(id, detail);
        setActiveSerruchoName(initialSerrucho.name);
        await registerRecent(initialSerrucho.id, initialSerrucho.name);
      }
    } catch (e) {
      console.warn("Failed to load serrucho data", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();

    // Reactive subscription for instant UI updates (add expense, settlement, etc.)
    if (id) {
      const unsubscribe = mobileStorage.subscribeToDetail(id, (updated) => {
        if (updated) {
          setSerrucho(updated.serrucho);
          setParticipants(updated.participants || []);
          setExpenses(updated.expenses || []);
          setTransfers(updated.transfers || []);
          setActivities(updated.activities || []);
          setTier(updated.tier || "FREE");
          setBilateralSettlements(updated.bilateral_settlements || []);
          const calculated = calculateParticipantBalances(
            updated.participants || [],
            updated.expenses || [],
            updated.transfers || []
          );
          setBalances(calculated);
          setDebts(simplifyDebts(updated.participants || [], calculated));
        }
      });
      return unsubscribe;
    }
  }, [id, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Helpers
  const persistChanges = async (
    updatedSerrucho: Serrucho,
    updatedParticipants: Participant[],
    updatedExpenses: ExpenseWithSplits[],
    updatedTransfers: Transfer[] = transfers,
    updatedActivities: ActivityEvent[] = activities,
    updatedTier: SerruchoTier = tier,
    updatedBilateralSettlements: BilateralSettlement[] = bilateralSettlements
  ) => {
    if (!id) return;
    const calculated = calculateParticipantBalances(updatedParticipants, updatedExpenses, updatedTransfers);
    setBalances(calculated);
    setDebts(simplifyDebts(updatedParticipants, calculated));
    setSerrucho(updatedSerrucho);
    setParticipants(updatedParticipants);
    setExpenses(updatedExpenses);
    setTransfers(updatedTransfers);
    setActivities(updatedActivities);
    setTier(updatedTier);
    setBilateralSettlements(updatedBilateralSettlements);

    await mobileStorage.saveSerruchoDetail(id, {
      serrucho: updatedSerrucho,
      participants: updatedParticipants,
      expenses: updatedExpenses,
      balances: calculated,
      transfers: updatedTransfers,
      activities: updatedActivities,
      tier: updatedTier,
      bilateral_settlements: updatedBilateralSettlements,
    });
  };

  const isClosed = serrucho?.status === "CLOSED";
  const isReadOnly = (serrucho as any)?.is_read_only === true;

  // Relative time formatter
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Justo ahora";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Ayer";
      if (diffDays < 7) return `Hace ${diffDays} días`;
      return new Date(isoString).toLocaleDateString("es-DO", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  };

  // --- ACTIONS ---

  // Rename Serrucho
  const handleOpenRename = () => {
    if (isReadOnly || isClosed) return;
    setEditNameValue(serrucho?.name || "");
    setShowRenameModal(true);
  };

  const handleSaveRename = async () => {
    const trimmed = editNameValue.trim();
    if (!trimmed || trimmed.length > 100 || !serrucho) {
      Alert.alert("Nombre inválido", "El nombre debe tener entre 1 y 100 caracteres.");
      return;
    }
    const updated: Serrucho = { ...serrucho, name: trimmed, updated_at: new Date().toISOString() };
    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      serrucho_id: serrucho.id,
      action_type: "SERRUCHO_UPDATED",
      entity_type: "SERRUCHO",
      actor_name: participants.find((p) => p.id === myParticipantId)?.name || "Alguien",
      summary: `Se actualizó el nombre a "${trimmed}"`,
      created_at: new Date().toISOString(),
    };
    const newActs = [newActivity, ...activities];
    await persistChanges(updated, participants, expenses, transfers, newActs, tier);
    setActiveSerruchoName(trimmed);
    await registerRecent(serrucho.id, trimmed);
    setShowRenameModal(false);
  };

  // Participant Management
  const handleAddParticipant = async () => {
    const trimmed = newParticipantName.trim();
    if (!trimmed || !serrucho) {
      Alert.alert("Nombre requerido", "Por favor ingresa el nombre del participante.");
      return;
    }
    const now = new Date().toISOString();
    const newPart: Participant = {
      id: `p_${Date.now()}`,
      serrucho_id: serrucho.id,
      name: trimmed,
      email: null,
      phone: null,
      preferred_channel: "WHATSAPP",
      created_at: now,
      updated_at: now,
    };
    const updatedParts = [...participants, newPart];
    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      serrucho_id: serrucho.id,
      action_type: "PARTICIPANT_ADDED",
      entity_type: "PARTICIPANT",
      actor_name: trimmed,
      summary: `${trimmed} fue agregado al Serrucho`,
      created_at: now,
    };
    const newActs = [newActivity, ...activities];
    await persistChanges(serrucho, updatedParts, expenses, transfers, newActs, tier);
    setNewParticipantName("");
    setShowAddParticipantModal(false);
  };

  const handleOpenEditParticipant = (p: Participant) => {
    if (isReadOnly || isClosed) return;
    setEditingParticipant(p);
    setEditParticipantNameValue(p.name);
  };

  const handleSaveEditParticipant = async () => {
    if (!editingParticipant || !serrucho) return;
    const trimmed = editParticipantNameValue.trim();
    if (!trimmed) {
      Alert.alert("Nombre requerido", "El nombre no puede estar vacío.");
      return;
    }
    const oldName = editingParticipant.name;
    const updatedParts = participants.map((p) => (p.id === editingParticipant.id ? { ...p, name: trimmed, updated_at: new Date().toISOString() } : p));
    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      serrucho_id: serrucho.id,
      action_type: "PARTICIPANT_UPDATED",
      entity_type: "PARTICIPANT",
      actor_name: trimmed,
      summary: `Se cambió el nombre de "${oldName}" a "${trimmed}"`,
      created_at: new Date().toISOString(),
    };
    const newActs = [newActivity, ...activities];
    await persistChanges(serrucho, updatedParts, expenses, transfers, newActs, tier);
    setEditingParticipant(null);
  };

  const handleDeleteParticipant = (p: Participant) => {
    if (isReadOnly || isClosed || !serrucho) return;

    // Financial guard: Check if participant has expenses or transfers
    const hasPaidExpense = expenses.some((e) => e.paid_by_participant_id === p.id);
    const hasSplits = expenses.some((e) => e.splits?.some((s) => s.participant_id === p.id && s.owed_cents > 0));
    const hasTransfers = transfers.some((t) => t.sender_participant_id === p.id || t.receiver_participant_id === p.id);

    if (hasPaidExpense || hasSplits || hasTransfers) {
      Alert.alert(
        "No se puede eliminar",
        `${p.name} tiene actividad financiera registrada (gastos pagados, divisiones o transferencias). Para eliminar a este participante, primero debes reasignar o borrar sus movimientos.`
      );
      return;
    }

    Alert.alert(
      "Eliminar participante",
      `¿Estás seguro de que deseas eliminar a ${p.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const updatedParts = participants.filter((item) => item.id !== p.id);
            const newActivity: ActivityEvent = {
              id: `act_${Date.now()}`,
              serrucho_id: serrucho.id,
              action_type: "PARTICIPANT_REMOVED",
              entity_type: "PARTICIPANT",
              actor_name: p.name,
              summary: `${p.name} fue eliminado del Serrucho`,
              created_at: new Date().toISOString(),
            };
            const newActs = [newActivity, ...activities];
            await persistChanges(serrucho, updatedParts, expenses, transfers, newActs, tier);
          },
        },
      ]
    );
  };

  // WhatsApp & Link Sharing
  const handleShareWhatsApp = async () => {
    if (!serrucho) return;
    const url = `https://serrucho.app/s/${serrucho.id}`;
    const message = `¡Hola! Te invito a unirte a nuestro serrucho *${serrucho.name}* para dividir los gastos fácilmente sin costo. Entra aquí: ${url}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({ message, url });
      }
    } catch {
      await Share.share({ message, url });
    }
  };

  const handleShareLink = async () => {
    if (!serrucho) return;
    const url = `https://serrucho.app/s/${serrucho.id}`;
    const message = `Únete a mi Serrucho "${serrucho.name}": ${url}`;
    try {
      await Share.share({ message, url });
    } catch (e) {
      console.warn("Share failed", e);
    }
  };

  // Lifecycle
  const handleConfirmClose = async () => {
    if (!serrucho) return;
    const updated: Serrucho = { ...serrucho, status: "CLOSED", closed_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      serrucho_id: serrucho.id,
      action_type: "SERRUCHO_CLOSED",
      entity_type: "SERRUCHO",
      actor_name: participants.find((p) => p.id === myParticipantId)?.name || "Organizador",
      summary: "El Serrucho fue cerrado. Ya no se pueden agregar ni editar gastos.",
      created_at: new Date().toISOString(),
    };
    const newActs = [newActivity, ...activities];
    await persistChanges(updated, participants, expenses, transfers, newActs, tier);
    setShowCloseModal(false);
  };

  const handleConfirmReopen = async () => {
    if (!serrucho) return;
    const updated: Serrucho = { ...serrucho, status: "OPEN", closed_at: null, updated_at: new Date().toISOString() };
    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      serrucho_id: serrucho.id,
      action_type: "SERRUCHO_UPDATED",
      entity_type: "SERRUCHO",
      actor_name: participants.find((p) => p.id === myParticipantId)?.name || "Organizador",
      summary: "El Serrucho fue reabierto. Las ediciones vuelven a estar disponibles.",
      created_at: new Date().toISOString(),
    };
    const newActs = [newActivity, ...activities];
    await persistChanges(updated, participants, expenses, transfers, newActs, tier);
    setShowReopenModal(false);
  };

  // Danger Zone - Delete Serrucho
  const handleConfirmDelete = async () => {
    if (!serrucho) return;
    try {
      await mobileStorage.deleteSerrucho(serrucho.id);
      setActiveSerruchoId(null);
      setShowDeleteModal(false);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", "No se pudo eliminar el Serrucho.");
    }
  };

  // Export
  const handleExportXLSX = async () => {
    if (!serrucho) return;
    const msg = `Exportación XLSX de "${serrucho.name}":\nTotal de gastos: ${expenses.length}\nParticipantes: ${participants.length}\nGenerado por Serrucho RD.`;
    await Share.share({ message: msg, title: `${serrucho.name}.xlsx` });
  };

  const handleExportCSV = async () => {
    if (!serrucho) return;
    let csv = "Fecha,Descripción,Pagado Por,Monto RD$\n";
    expenses.forEach((e) => {
      const payer = participants.find((p) => p.id === e.paid_by_participant_id)?.name || "Desconocido";
      const amount = (e.amount_cents / 100).toFixed(2);
      const dateStr = e.expense_date ? e.expense_date.split("T")[0] : "";
      csv += `"${dateStr}","${e.description}","${payer}",${amount}\n`;
    });
    await Share.share({ message: csv, title: `${serrucho.name}.csv` });
  };

  // Super Serrucho $0 simulated upgrade
  const handleUpgradeSuper = async () => {
    if (!serrucho) return;
    const newTier: SerruchoTier = "SUPER_SERRUCHO";
    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      serrucho_id: serrucho.id,
      action_type: "SERRUCHO_UPDATED",
      entity_type: "SERRUCHO",
      actor_name: participants.find((p) => p.id === myParticipantId)?.name || "Organizador",
      summary: "¡Se activó Super Serrucho (Etapa gratuita $0)!",
      created_at: new Date().toISOString(),
    };
    const newActs = [newActivity, ...activities];
    await persistChanges(serrucho, participants, expenses, transfers, newActs, newTier);
    setShowSuperModal(false);
    Alert.alert("¡Super Serrucho Activado!", "Disfruta de todas las ventajas Pro a costo $0.");
  };

  // Active bilateral settlement for the currently selected debt (if any)
  const activeSettlement = selectedDebt
    ? bilateralSettlements.find(
        (s) =>
          s.debtor_participant_id === selectedDebt.from_participant_id &&
          s.creditor_participant_id === selectedDebt.to_participant_id &&
          s.status !== "SETTLED" &&
          s.status !== "REJECTED"
      ) || null
    : null;

  // Bilateral Settlement Handlers
  const handleInitiateSettlement = async (paymentMethod: "TRANSFER" | "CASH" | "OTHER") => {
    if (!selectedDebt || !serrucho || isClosed || isReadOnly) return;
    const newSettlement: BilateralSettlement = {
      id: `bsett_${Date.now()}`,
      serrucho_id: serrucho.id,
      debtor_participant_id: selectedDebt.from_participant_id,
      debtor_name: selectedDebt.from_name,
      creditor_participant_id: selectedDebt.to_participant_id,
      creditor_name: selectedDebt.to_name,
      amount_cents: selectedDebt.amount_cents,
      payment_method: paymentMethod,
      notes: null,
      status: "PENDING_CONFIRMATION",
      confirmation_code: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      serrucho_id: serrucho.id,
      action_type: "TRANSFER_CREATED",
      entity_type: "TRANSFER",
      actor_name: selectedDebt.from_name,
      summary: `${selectedDebt.from_name} solicitó confirmar pago de ${formatDOP(selectedDebt.amount_cents)} a ${selectedDebt.to_name}`,
      created_at: new Date().toISOString(),
    };

    const updatedSettlements = [
      newSettlement,
      ...bilateralSettlements.filter(
        (s) =>
          !(
            s.debtor_participant_id === selectedDebt.from_participant_id &&
            s.creditor_participant_id === selectedDebt.to_participant_id &&
            (s.status === "PENDING_CONFIRMATION" || s.status === "REJECTED")
          )
      ),
    ];
    const newActs = [newActivity, ...activities];
    await persistChanges(serrucho, participants, expenses, transfers, newActs, tier, updatedSettlements);
    triggerHaptic("medium");
  };

  const handleCreditorConfirmSettlement = async () => {
    if (!activeSettlement || !selectedDebt || !serrucho) return;
    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    const updatedSettlement: BilateralSettlement = {
      ...activeSettlement,
      status: "CODE_PENDING",
      confirmation_code: randomCode,
      updated_at: new Date().toISOString(),
    };
    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      serrucho_id: serrucho.id,
      action_type: "TRANSFER_CREATED",
      entity_type: "TRANSFER",
      actor_name: selectedDebt.to_name,
      summary: `${selectedDebt.to_name} confirmó recibir el pago de ${selectedDebt.from_name}. Código de 4 dígitos generado.`,
      created_at: new Date().toISOString(),
    };
    const updatedSettlements = bilateralSettlements.map((s) =>
      s.id === updatedSettlement.id ? updatedSettlement : s
    );
    const newActs = [newActivity, ...activities];
    await persistChanges(serrucho, participants, expenses, transfers, newActs, tier, updatedSettlements);
    triggerHaptic("success");
  };

  const handleCreditorRejectSettlement = async () => {
    if (!activeSettlement || !selectedDebt || !serrucho) return;
    const updatedSettlement: BilateralSettlement = {
      ...activeSettlement,
      status: "REJECTED",
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      serrucho_id: serrucho.id,
      action_type: "TRANSFER_CREATED",
      entity_type: "TRANSFER",
      actor_name: selectedDebt.to_name,
      summary: `${selectedDebt.to_name} rechazó la solicitud de pago de ${selectedDebt.from_name}`,
      created_at: new Date().toISOString(),
    };
    const updatedSettlements = bilateralSettlements.map((s) =>
      s.id === updatedSettlement.id ? updatedSettlement : s
    );
    const newActs = [newActivity, ...activities];
    await persistChanges(serrucho, participants, expenses, transfers, newActs, tier, updatedSettlements);
    triggerHaptic("warning");
    setSelectedDebt(null);
  };

  const handleVerifySettlementCode = async (code: string): Promise<boolean> => {
    if (!activeSettlement || !selectedDebt || !serrucho) return false;
    if (code !== activeSettlement.confirmation_code) {
      return false;
    }

    const settledSettlement: BilateralSettlement = {
      ...activeSettlement,
      status: "SETTLED",
      settled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newTransfer: Transfer = {
      id: `t_${Date.now()}`,
      serrucho_id: serrucho.id,
      sender_participant_id: selectedDebt.from_participant_id,
      receiver_participant_id: selectedDebt.to_participant_id,
      amount_cents: selectedDebt.amount_cents,
      transfer_date: new Date().toISOString(),
      notes: `Saldado con código de 4 dígitos (${activeSettlement.payment_method})`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updatedTransfers = [...transfers, newTransfer];

    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      serrucho_id: serrucho.id,
      action_type: "TRANSFER_CREATED",
      entity_type: "TRANSFER",
      actor_name: selectedDebt.from_name,
      summary: `Deuda saldada: ${selectedDebt.from_name} pagó ${formatDOP(selectedDebt.amount_cents)} a ${selectedDebt.to_name}`,
      created_at: new Date().toISOString(),
    };

    const updatedSettlements = bilateralSettlements.map((s) =>
      s.id === settledSettlement.id ? settledSettlement : s
    );
    const newActs = [newActivity, ...activities];

    await persistChanges(
      serrucho,
      participants,
      expenses,
      updatedTransfers,
      newActs,
      tier,
      updatedSettlements
    );

    setSelectedDebt(null);
    setSettledAnimationData({
      visible: true,
      debtorName: selectedDebt.from_name,
      creditorName: selectedDebt.to_name,
      amountCents: selectedDebt.amount_cents,
    });
    return true;
  };

  const handleAddExpenseClick = () => {
    if (!myParticipantId) {
      Alert.alert(
        "Identidad Requerida",
        "Debes seleccionar quién eres en este Serrucho antes de registrar un gasto.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Seleccionar Quién Soy", onPress: () => setShowIdentityModal(true) },
        ]
      );
      return;
    }
    router.push({ pathname: "/serrucho/add-expense", params: { serruchoId: id } });
  };

  // Settlements / Payments
  const handleRecordPayment = async (debt: SimplifiedTransfer) => {
    if (isClosed || isReadOnly || !serrucho) return;
    const newTransfer: Transfer = {
      id: `t_${Date.now()}`,
      serrucho_id: serrucho.id,
      sender_participant_id: debt.from_participant_id,
      receiver_participant_id: debt.to_participant_id,
      amount_cents: debt.amount_cents,
      transfer_date: new Date().toISOString(),
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updatedTransfers = [...transfers, newTransfer];
    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      serrucho_id: serrucho.id,
      action_type: "TRANSFER_CREATED",
      entity_type: "TRANSFER",
      actor_name: debt.from_name,
      summary: `${debt.from_name} pagó ${formatDOP(debt.amount_cents)} a ${debt.to_name}`,
      created_at: new Date().toISOString(),
    };
    const newActs = [newActivity, ...activities];
    await persistChanges(serrucho, participants, expenses, updatedTransfers, newActs, tier);
    setSelectedDebt(null);
    Alert.alert("Pago Registrado", `Se registró la transferencia de ${formatDOP(debt.amount_cents)} exitosamente.`);
  };

  if (loading && !serrucho) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={semanticTokens.colors.accent.primary} />
        <DSText variant="body" color="secondary" style={{ marginTop: 16 }}>
          Cargando Serrucho...
        </DSText>
      </View>
    );
  }

  if (!serrucho) {
    return (
      <View style={styles.container}>
        <ContextualTopAppBar
          title="Serrucho"
          rightAction={null}
        />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <DSEmptyState
            illustration={<Ionicons name="alert-circle-outline" size={48} color={semanticTokens.colors.destructive.base} />}
            title="No pudimos cargar este Serrucho"
            description="El grupo solicitado no existe en tu almacenamiento local o ocurrió un error al cargarlo."
            action={
              <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                <DSButton
                  title="Reintentar"
                  variant="secondary"
                  onPress={loadData}
                  accessibilityLabel="Reintentar cargar datos"
                />
                <DSButton
                  title="Volver al inicio"
                  variant="primary"
                  onPress={() => router.replace("/")}
                  accessibilityLabel="Volver a tus Serruchos"
                />
              </View>
            }
          />
        </View>
      </View>
    );
  }

  const totalSpentCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0);
  const myBalance = balances.find((b) => b.id === myParticipantId);
  const myNetCents = myBalance?.net_balance_cents || 0;

  return (
    <View style={styles.container}>
      {/* Contextual Top App Bar */}
      <ContextualTopAppBar
        title={serrucho?.name || "Serrucho"}
        subtitle={isClosed ? "Cerrado" : `${participants.length} participantes · RD$`}
        rightAction={
          <DSIconButton
            icon={<Ionicons name="logo-whatsapp" size={22} color="#25D366" />}
            onPress={handleShareWhatsApp}
            accessibilityLabel="Compartir por WhatsApp"
          />
        }
      />

      {/* Closed Banner if applicable */}
      {isClosed && (
        <View style={styles.closedBanner}>
          <DSText variant="caption" weight="medium" style={styles.closedBannerText}>
            🔒 Este Serrucho está cerrado. Las funciones de edición están deshabilitadas.
          </DSText>
        </View>
      )}

      {/* Guest Mode / Unclaimed Identity Banner */}
      {!myParticipantId && (
        <TouchableOpacity
          onPress={() => setShowIdentityModal(true)}
          style={[styles.guestBanner, { backgroundColor: tokens.colors.surface.hover, borderColor: tokens.colors.accent.primary }]}
          accessibilityLabel="Seleccionar mi participante"
          accessibilityRole="button"
        >
          <Ionicons name="person-circle-outline" size={20} color={tokens.colors.accent.primary} />
          <DSText variant="caption" style={{ flex: 1, marginLeft: 8 }}>
            Modo invitado: <DSText variant="caption" weight="bold" color="accent">Selecciona quién eres</DSText> para poder agregar gastos o saldar deudas.
          </DSText>
          <Ionicons name="chevron-forward" size={16} color={tokens.colors.accent.primary} />
        </TouchableOpacity>
      )}

      {/* Main Content Area */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.accent.primary} />}
      >
        {/* ==================== TAB 1: GASTOS ==================== */}
        {activeTab === "expenses" && (
          <View style={styles.tabContainer}>
            {/* Identity Bar */}
            <TouchableOpacity
              style={styles.identityBar}
              onPress={() => setShowIdentityModal(true)}
              accessibilityLabel="Cambiar mi identidad"
              accessibilityRole="button"
            >
              <View style={styles.identityLeft}>
                <DSAvatar
                  name={participants.find((p) => p.id === myParticipantId)?.name || "¿?"}
                  size="sm"
                />
                <View style={{ marginLeft: 10 }}>
                  <DSText variant="caption" color="secondary">
                    Tu identidad en este grupo:
                  </DSText>
                  <DSText variant="body" weight="semibold">
                    {participants.find((p) => p.id === myParticipantId)?.name || "Seleccionar quién soy..."}
                  </DSText>
                </View>
              </View>
              <DSText variant="caption" color="accent">
                Cambiar ▾
              </DSText>
            </TouchableOpacity>

            {/* Financial Summary */}
            <DSSurface variant="elevated" style={styles.summaryCard}>
              <View style={styles.summaryCol}>
                <DSText variant="caption" color="secondary">
                  Total Gastado
                </DSText>
                <DSText variant="title" weight="bold">
                  {formatDOP(totalSpentCents)}
                </DSText>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCol}>
                <DSText variant="caption" color="secondary">
                  Tu Balance
                </DSText>
                <DSText
                  variant="title"
                  weight="bold"
                  color={myNetCents > 0 ? "success" : myNetCents < 0 ? "destructive" : "secondary"}
                >
                  {formatDOP(myNetCents, true)}
                </DSText>
              </View>
            </DSSurface>

            {/* Quick Add CTA */}
            {!isClosed && !isReadOnly && (
              <View style={styles.quickAddRow}>
                <DSButton
                  title="+ Agregar Gasto"
                  variant="primary"
                  onPress={handleAddExpenseClick}
                  accessibilityLabel="Agregar nuevo gasto"
                  style={{ flex: 1 }}
                />
              </View>
            )}

            {/* Expenses List */}
            <DSSection title="Historial de Gastos">
              {expenses.length === 0 ? (
                <DSEmptyState
                  illustration={<Ionicons name="receipt-outline" size={40} color={tokens.colors.text.secondary} />}
                  title="Aún no hay gastos"
                  description="Comienza agregando el primer gasto para calcular divisiones automáticamente."
                  action={
                    !isClosed && !isReadOnly ? (
                      <DSButton
                        title="+ Agregar Primer Gasto"
                        variant="primary"
                        onPress={handleAddExpenseClick}
                      />
                    ) : undefined
                  }
                />
              ) : (
                expenses.map((expense) => {
                  const payer = participants.find((p) => p.id === expense.paid_by_participant_id)?.name || "Alguien";
                  return (
                    <DSExpenseRow
                      key={expense.id}
                      id={expense.id}
                      description={expense.description}
                      payerName={payer}
                      amountFormatted={formatDOP(expense.amount_cents)}
                      participantsCount={expense.splits?.length || participants.length}
                      dateFormatted={expense.expense_date ? expense.expense_date.split("T")[0] : undefined}
                      onPress={() => {}}
                    />
                  );
                })
              )}
            </DSSection>
          </View>
        )}

        {/* ==================== TAB 2: SALDOS ==================== */}
        {activeTab === "balances" && (
          <View style={styles.tabContainer}>
            {/* Balances Section */}
            <DSSection title="Balances Netos">
              {balances.map((b) => (
                <DSBalanceRow
                  key={b.id}
                  id={b.id}
                  name={b.name}
                  netBalanceCents={b.net_balance_cents}
                  netBalanceFormatted={formatDOP(Math.abs(b.net_balance_cents))}
                  totalPaidFormatted={formatDOP(b.total_paid_cents)}
                  totalOwedFormatted={formatDOP(b.total_owed_cents)}
                />
              ))}
            </DSSection>

            {/* Debt Settlements Section */}
            <DSSection title="Quién le debe a quién">
              {expenses.length === 0 ? (
                <DSEmptyState
                  illustration={<Ionicons name="receipt-outline" size={40} color={semanticTokens.colors.text.secondary} />}
                  title="Sin movimientos aún"
                  description="Agrega gastos en la pestaña Gastos para calcular balances y liquidaciones automáticamente."
                />
              ) : debts.length === 0 ? (
                <DSEmptyState
                  illustration={<Ionicons name="checkmark-circle-outline" size={40} color={tokens.colors.success.base} />}
                  title="¡Están al día!"
                  description="No hay deudas pendientes en este Serrucho."
                />
              ) : (
                debts.map((debt, index) => {
                  const activeDebtSettlement = bilateralSettlements.find(
                    (s) =>
                      s.debtor_participant_id === debt.from_participant_id &&
                      s.creditor_participant_id === debt.to_participant_id &&
                      s.status !== "SETTLED" &&
                      s.status !== "REJECTED"
                  );
                  return (
                    <View key={`${debt.from_participant_id}_${debt.to_participant_id}_${index}`}>
                      <DSDebtRow
                        debtorName={debt.from_name}
                        creditorName={debt.to_name}
                        amountFormatted={formatDOP(debt.amount_cents)}
                        onSettle={!isClosed && !isReadOnly ? () => setSelectedDebt(debt) : undefined}
                        onWhatsApp={() => {
                          const msg = `¡Dímelo ${debt.from_name}! Te recuerdo el pago de ${formatDOP(debt.amount_cents)} para ${debt.to_name} en nuestro Serrucho.`;
                          Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
                        }}
                      />
                      {activeDebtSettlement ? (
                        <View style={{ paddingHorizontal: 16, paddingBottom: 8, marginTop: -4 }}>
                          <DSBadge
                            label={
                              activeDebtSettlement.status === "PENDING_CONFIRMATION"
                                ? "⏳ Confirmación pendiente"
                                : "🔑 Código de 4 dígitos generado"
                            }
                            variant={activeDebtSettlement.status === "CODE_PENDING" ? "accent" : "neutral"}
                            size="sm"
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </DSSection>
          </View>
        )}

        {/* ==================== TAB 3: AJUSTES (010E HIGH FIDELITY) ==================== */}
        {activeTab === "settings" && (
          <View style={styles.tabContainer}>
            {/* 1. INFORMACIÓN DEL SERRUCHO */}
            <DSSection title="Información del Serrucho">
              <DSSettingRow
                title="Nombre"
                subtitle={serrucho?.name}
                leading={<Ionicons name="pricetag-outline" size={20} color={semanticTokens.colors.accent.primary} />}
                onPress={!isReadOnly && !isClosed ? handleOpenRename : undefined}
                showChevron={!isReadOnly && !isClosed}
                accessibilityLabel="Editar nombre del Serrucho"
              />
              <DSSettingRow
                title="Moneda principal"
                subtitle="Fijada para República Dominicana"
                leading={<Ionicons name="cash-outline" size={20} color={semanticTokens.colors.accent.primary} />}
                trailing={<DSText variant="caption" color="secondary" weight="semibold">DOP · RD$</DSText>}
                showChevron={false}
                accessibilityLabel="Moneda principal DOP"
              />
              <DSSettingRow
                title="Organizador"
                subtitle={participants.find((p) => p.id === serrucho?.owner_id)?.name || "Creador del grupo"}
                leading={<Ionicons name="person-outline" size={20} color={semanticTokens.colors.accent.primary} />}
                showChevron={false}
                accessibilityLabel="Organizador del grupo"
              />
            </DSSection>

            {/* 2. PARTICIPANTES */}
            <DSSection
              title={`Participantes (${participants.length})`}
              action={
                !isReadOnly && !isClosed ? (
                  <DSButton
                    title="+ Agregar"
                    variant="ghost"
                    size="sm"
                    onPress={() => setShowAddParticipantModal(true)}
                    accessibilityLabel="Agregar participante"
                  />
                ) : undefined
              }
            >
              {participants.map((p) => {
                const isCreator = p.id === serrucho?.owner_id;
                const isMe = p.id === myParticipantId;
                return (
                  <View key={p.id} style={styles.participantRow}>
                    <View style={styles.participantInfo}>
                      <DSAvatar name={p.name} size="md" />
                      <View style={styles.participantText}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <DSText variant="body" weight="semibold">
                            {p.name}
                          </DSText>
                          {isCreator && <DSBadge label="Creador" variant="accent" size="sm" />}
                          {isMe && <DSBadge label="Tú" variant="neutral" size="sm" />}
                        </View>
                        <DSText variant="caption" color="secondary">
                          {isMe ? "Tu usuario activo" : "Participante"}
                        </DSText>
                      </View>
                    </View>

                    {!isReadOnly && !isClosed && (
                      <View style={styles.participantActions}>
                        <DSIconButton
                          icon={<Ionicons name="pencil" size={16} color={semanticTokens.colors.text.secondary} />}
                          onPress={() => handleOpenEditParticipant(p)}
                          accessibilityLabel={`Editar nombre de ${p.name}`}
                        />
                        <DSIconButton
                          icon={<Ionicons name="trash-outline" size={16} color={semanticTokens.colors.destructive.base} />}
                          onPress={() => handleDeleteParticipant(p)}
                          accessibilityLabel={`Eliminar a ${p.name}`}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </DSSection>

            {/* 3. COMPARTIR E INVITAR */}
            <DSSection title="Compartir e Invitar">
              <DSSettingRow
                title="Invitar por WhatsApp"
                subtitle="Envía el mensaje dominicano prellenado con enlace directo"
                leading={<Ionicons name="logo-whatsapp" size={20} color="#25D366" />}
                onPress={handleShareWhatsApp}
                accessibilityLabel="Invitar amigos por WhatsApp"
              />
              <DSSettingRow
                title="Compartir enlace secreto"
                subtitle="Cualquiera con el enlace podrá unirse al grupo"
                leading={<Ionicons name="share-social-outline" size={20} color={semanticTokens.colors.accent.primary} />}
                onPress={handleShareLink}
                accessibilityLabel="Compartir enlace secreto"
              />
            </DSSection>

            {/* 4. ACTIVIDAD RECIENTE */}
            <DSSection title="Actividad Reciente">
              {activities.length === 0 ? (
                <DSEmptyState
                  illustration={<Ionicons name="time-outline" size={40} color={semanticTokens.colors.text.secondary} />}
                  title="Sin actividad aún"
                  description="Los movimientos y modificaciones del grupo aparecerán aquí."
                />
              ) : (
                activities.slice(0, 8).map((act) => (
                  <View key={act.id} style={styles.activityItem}>
                    <View style={styles.activityDot} />
                    <View style={styles.activityBody}>
                      <DSText variant="body" weight="medium">
                        {act.summary}
                      </DSText>
                      <DSText variant="caption" color="secondary">
                        {formatRelativeTime(act.created_at)}
                      </DSText>
                    </View>
                  </View>
                ))
              )}
            </DSSection>

            {/* 5. SUPER SERRUCHO */}
            <DSSection title="Super Serrucho">
              <DSSurface variant="elevated" style={styles.superCard}>
                <View style={styles.superHeader}>
                  <DSText variant="title" weight="bold" color="super">
                    ⭐ Super Serrucho RD
                  </DSText>
                  <DSBadge label={tier === "SUPER_SERRUCHO" ? "ACTIVO ($0)" : "GRATIS $0"} variant="super" />
                </View>
                <DSText variant="body" color="secondary" style={{ marginTop: 6, marginBottom: 12 }}>
                  Exportes avanzados ilimitados, liquidaciones directas y soporte prioritario sin costo.
                </DSText>
                {tier !== "SUPER_SERRUCHO" && (
                  <DSButton
                    title="Activar Super Serrucho ($0)"
                    variant="primary"
                    size="sm"
                    onPress={() => setShowSuperModal(true)}
                    accessibilityLabel="Activar Super Serrucho gratis"
                  />
                )}
              </DSSurface>
            </DSSection>

            {/* 6. EXPORTAR */}
            <DSSection title="Exportar Datos">
              <DSSettingRow
                title="Exportar XLSX"
                subtitle="Hoja de cálculo completa con balances y divisiones"
                leading={<Ionicons name="document-text-outline" size={20} color={semanticTokens.colors.accent.primary} />}
                onPress={handleExportXLSX}
                accessibilityLabel="Exportar Serrucho a Excel XLSX"
              />
              <DSSettingRow
                title="Exportar CSV"
                subtitle="Formato estándar para importar en hojas de cálculo"
                leading={<Ionicons name="download-outline" size={20} color={semanticTokens.colors.accent.primary} />}
                onPress={handleExportCSV}
                accessibilityLabel="Exportar Serrucho a CSV"
              />
            </DSSection>

            {/* 7. ESTADO DEL GRUPO (LIFECYCLE) */}
            <DSSection title="Estado del Serrucho">
              {!isClosed ? (
                <DSSettingRow
                  title="Cerrar Serrucho"
                  subtitle="Bloquea adición o edición de gastos mientras mantiene los datos visibles"
                  leading={<Ionicons name="lock-closed-outline" size={20} color={semanticTokens.colors.accent.primary} />}
                  onPress={!isReadOnly ? () => setShowCloseModal(true) : undefined}
                  accessibilityLabel="Cerrar Serrucho"
                />
              ) : (
                <DSSettingRow
                  title="Reabrir Serrucho"
                  subtitle="Permite nuevamente agregar y modificar gastos"
                  leading={<Ionicons name="lock-open-outline" size={20} color={semanticTokens.colors.accent.primary} />}
                  onPress={!isReadOnly ? () => setShowReopenModal(true) : undefined}
                  accessibilityLabel="Reabrir Serrucho"
                />
              )}
            </DSSection>

            {/* 8. ZONA PELIGROSA */}
            <DSSection title="Zona Peligrosa">
              <DSSurface variant="elevated" style={styles.dangerSurface}>
                <DSSettingRow
                  title="Eliminar Serrucho"
                  subtitle="Esta acción es irreversible y borrará todos los gastos y participantes"
                  leading={<Ionicons name="trash-outline" size={20} color={semanticTokens.colors.destructive.base} />}
                  destructive
                  showDivider={false}
                  onPress={!isReadOnly ? () => setShowDeleteModal(true) : undefined}
                  accessibilityLabel="Eliminar Serrucho definitivamente"
                />
              </DSSurface>
            </DSSection>
          </View>
        )}
      </ScrollView>

      {/* Bottom Tabs */}
      <ActiveKittyBottomTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        expensesCount={expenses.length}
      />

      {/* ==================== MODALS ==================== */}

      {/* Identity Picker Modal */}
      <Modal visible={showIdentityModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <DSSurface variant="elevated" style={styles.modalContainer}>
            <DSText variant="title" weight="bold" style={{ marginBottom: 4 }}>
              ¿Quién eres tú? 👤
            </DSText>
            <DSText variant="caption" color="secondary" style={{ marginBottom: 16 }}>
              Selecciona tu nombre para personalizar tu vista y tus balances.
            </DSText>

            {participants.map((p) => {
              const isSelected = p.id === myParticipantId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.identityOption,
                    {
                      borderColor: isSelected
                        ? semanticTokens.colors.accent.primary
                        : semanticTokens.colors.divider,
                      backgroundColor: isSelected
                        ? semanticTokens.colors.surface.hover
                        : semanticTokens.colors.surface.base,
                    },
                  ]}
                  onPress={async () => {
                    setMyParticipantId(p.id);
                    if (id) await mobileStorage.setMyIdentity(id, p.id);
                    setShowIdentityModal(false);
                  }}
                >
                  <DSAvatar name={p.name} size="sm" />
                  <DSText variant="body" weight={isSelected ? "bold" : "medium"} style={{ marginLeft: 12, flex: 1 }}>
                    {p.name}
                  </DSText>
                  {isSelected && <DSBadge label="Activo" variant="accent" size="sm" />}
                </TouchableOpacity>
              );
            })}

            <DSButton
              title="Cerrar"
              variant="secondary"
              onPress={() => setShowIdentityModal(false)}
              style={{ marginTop: 12 }}
            />
          </DSSurface>
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={showRenameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <DSSurface variant="elevated" style={styles.modalContainer}>
            <DSText variant="title" weight="bold" style={{ marginBottom: 4 }}>
              Editar Nombre del Serrucho ✏️
            </DSText>
            <DSText variant="caption" color="secondary" style={{ marginBottom: 16 }}>
              El nuevo nombre se reflejará inmediatamente en la barra superior y en los accesos recientes.
            </DSText>
            <TextInput
              style={styles.modalInput}
              value={editNameValue}
              onChangeText={setEditNameValue}
              placeholder="Nombre del Serrucho..."
              placeholderTextColor={semanticTokens.colors.text.muted}
              maxLength={100}
              autoFocus
            />
            <View style={styles.modalButtonsRow}>
              <DSButton
                title="Cancelar"
                variant="secondary"
                onPress={() => setShowRenameModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <DSButton
                title="Guardar"
                variant="primary"
                onPress={handleSaveRename}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </DSSurface>
        </View>
      </Modal>

      {/* Add Participant Modal */}
      <Modal visible={showAddParticipantModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <DSSurface variant="elevated" style={styles.modalContainer}>
            <DSText variant="title" weight="bold" style={{ marginBottom: 4 }}>
              Agregar Participante 👥
            </DSText>
            <DSText variant="caption" color="secondary" style={{ marginBottom: 16 }}>
              Ingresa el nombre del nuevo miembro del grupo.
            </DSText>
            <TextInput
              style={styles.modalInput}
              value={newParticipantName}
              onChangeText={setNewParticipantName}
              placeholder="Ej: Laura, Carlos..."
              placeholderTextColor={semanticTokens.colors.text.muted}
              maxLength={50}
              autoFocus
            />
            <View style={styles.modalButtonsRow}>
              <DSButton
                title="Cancelar"
                variant="secondary"
                onPress={() => setShowAddParticipantModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <DSButton
                title="Agregar"
                variant="primary"
                onPress={handleAddParticipant}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </DSSurface>
        </View>
      </Modal>

      {/* Edit Participant Modal */}
      <Modal visible={editingParticipant !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <DSSurface variant="elevated" style={styles.modalContainer}>
            <DSText variant="title" weight="bold" style={{ marginBottom: 4 }}>
              Editar Participante ✏️
            </DSText>
            <DSText variant="caption" color="secondary" style={{ marginBottom: 16 }}>
              Modifica el nombre visible en los cálculos del Serrucho.
            </DSText>
            <TextInput
              style={styles.modalInput}
              value={editParticipantNameValue}
              onChangeText={setEditParticipantNameValue}
              placeholder="Nombre..."
              placeholderTextColor={semanticTokens.colors.text.muted}
              maxLength={50}
              autoFocus
            />
            <View style={styles.modalButtonsRow}>
              <DSButton
                title="Cancelar"
                variant="secondary"
                onPress={() => setEditingParticipant(null)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <DSButton
                title="Guardar"
                variant="primary"
                onPress={handleSaveEditParticipant}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </DSSurface>
        </View>
      </Modal>

      {/* Close Serrucho Confirmation Modal */}
      <Modal visible={showCloseModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <DSSurface variant="elevated" style={styles.modalContainer}>
            <DSText variant="title" weight="bold" style={{ marginBottom: 6 }}>
              ¿Cerrar Serrucho? 🔒
            </DSText>
            <DSText variant="body" color="secondary" style={{ marginBottom: 16 }}>
              Al cerrar el Serrucho se bloquearán la adición y edición de gastos. Todos los datos, balances y exportaciones seguirán disponibles para consulta. Podrás reabrirlo en cualquier momento.
            </DSText>
            <View style={styles.modalButtonsRow}>
              <DSButton
                title="Cancelar"
                variant="secondary"
                onPress={() => setShowCloseModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <DSButton
                title="Cerrar Serrucho"
                variant="primary"
                onPress={handleConfirmClose}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </DSSurface>
        </View>
      </Modal>

      {/* Reopen Serrucho Confirmation Modal */}
      <Modal visible={showReopenModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <DSSurface variant="elevated" style={styles.modalContainer}>
            <DSText variant="title" weight="bold" style={{ marginBottom: 6 }}>
              ¿Reabrir Serrucho? 🔓
            </DSText>
            <DSText variant="body" color="secondary" style={{ marginBottom: 16 }}>
              Al reabrir el Serrucho se habilitará nuevamente la capacidad de agregar gastos, modificar divisiones y registrar transferencias.
            </DSText>
            <View style={styles.modalButtonsRow}>
              <DSButton
                title="Cancelar"
                variant="secondary"
                onPress={() => setShowReopenModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <DSButton
                title="Reabrir"
                variant="primary"
                onPress={handleConfirmReopen}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </DSSurface>
        </View>
      </Modal>

      {/* Super Serrucho Info Modal */}
      <Modal visible={showSuperModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <DSSurface variant="elevated" style={styles.modalContainer}>
            <DSText variant="title" weight="bold" color="super" style={{ marginBottom: 6 }}>
              ⭐ Super Serrucho RD
            </DSText>
            <DSText variant="body" color="secondary" style={{ marginBottom: 12 }}>
              Obtén capacidades profesionales para tu grupo:
            </DSText>
            <DSText variant="caption" color="secondary" style={{ marginBottom: 4 }}>• Exportaciones ilimitadas en XLSX y CSV</DSText>
            <DSText variant="caption" color="secondary" style={{ marginBottom: 4 }}>• Historial extendido sin vencimiento</DSText>
            <DSText variant="caption" color="secondary" style={{ marginBottom: 16 }}>• Costo $0 en la etapa comunitaria</DSText>

            <View style={styles.modalButtonsRow}>
              <DSButton
                title="Quizás luego"
                variant="secondary"
                onPress={() => setShowSuperModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <DSButton
                title="Activar ($0)"
                variant="primary"
                onPress={handleUpgradeSuper}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </DSSurface>
        </View>
      </Modal>

      {/* Danger Zone Delete Modal (2-Step Explicit Confirmation) */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <DSSurface variant="elevated" style={styles.modalContainer}>
            <DSText variant="title" weight="bold" color="destructive" style={{ marginBottom: 6 }}>
              ⚠️ Eliminar Serrucho
            </DSText>
            <DSText variant="body" color="secondary" style={{ marginBottom: 16 }}>
              Esta acción eliminará permanentemente el Serrucho, todos sus gastos asociados, divisiones e historial. Esta operación no se puede deshacer.
            </DSText>
            <View style={styles.modalButtonsRow}>
              <DSButton
                title="Cancelar"
                variant="secondary"
                onPress={() => setShowDeleteModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <DSButton
                title="Eliminar definitivamente"
                variant="destructive"
                onPress={handleConfirmDelete}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </DSSurface>
        </View>
      </Modal>

      {/* Bilateral Settlement Modal */}
      <BilateralSettlementModal
        visible={selectedDebt !== null}
        debt={selectedDebt}
        myParticipantId={myParticipantId}
        serrucho={serrucho}
        activeSettlement={activeSettlement}
        onDismiss={() => setSelectedDebt(null)}
        onInitiate={handleInitiateSettlement}
        onCreditorConfirm={handleCreditorConfirmSettlement}
        onCreditorReject={handleCreditorRejectSettlement}
        onVerifyCode={handleVerifySettlementCode}
        onOpenIdentityModal={() => setShowIdentityModal(true)}
      />

      {/* Payment Settled Celebration Animation */}
      <PaymentSettledAnimation
        visible={settledAnimationData.visible}
        debtorName={settledAnimationData.debtorName}
        creditorName={settledAnimationData.creditorName}
        amountCents={settledAnimationData.amountCents}
        onFinish={() =>
          setSettledAnimationData({
            visible: false,
            debtorName: "",
            creditorName: "",
            amountCents: 0,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.base,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  closedBanner: {
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderBottomWidth: 1,
    borderBottomColor: semanticTokens.colors.divider,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closedBannerText: {
    color: semanticTokens.colors.text.secondary,
    textAlign: "center",
  },
  guestBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  identityBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: semanticTokens.colors.surface.base,
    borderWidth: 1,
    borderColor: semanticTokens.colors.divider,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  identityLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: semanticTokens.colors.divider,
    marginHorizontal: 12,
  },
  quickAddRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: semanticTokens.colors.divider,
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  participantText: {
    marginLeft: 12,
    flex: 1,
  },
  participantActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: semanticTokens.colors.divider,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: semanticTokens.colors.accent.primary,
    marginTop: 6,
    marginRight: 10,
  },
  activityBody: {
    flex: 1,
  },
  superCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: semanticTokens.colors.accent.super,
    marginBottom: 8,
  },
  superHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dangerSurface: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: semanticTokens.colors.destructive.base,
    overflow: "hidden",
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
  identityOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
});
