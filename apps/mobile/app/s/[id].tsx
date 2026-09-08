import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../src/theme/colors";
import { mobileStorage, type MobileSerruchoDetailData } from "../../src/services/storage";
import { triggerHaptic } from "../../src/utils/haptics";
import {
  DSText,
  DSButton,
  DSSurface,
  DSBadge,
  DSEmptyState,
} from "../../src/components/ds";
import type { Participant } from "@serrucho/core";

export default function JoinSerruchoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<MobileSerruchoDetailData | null>(null);
  const [step, setStep] = useState<"PREVIEW" | "CLAIM_IDENTITY">("PREVIEW");
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");

  const loadInvitation = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      // Check if user already claimed identity in this serrucho
      const existingMyId = await mobileStorage.getMyIdentity(id);
      if (existingMyId) {
        // Already a member — redirect directly
        router.replace(`/serrucho/${id}` as any);
        return;
      }

      const stored = await mobileStorage.getSerruchoDetail(id);
      if (stored) {
        setDetail(stored);
      }
    } catch (e) {
      console.warn("Failed to load invitation", e);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadInvitation();
  }, [loadInvitation]);

  const handleJoinClick = () => {
    triggerHaptic("medium");
    setStep("CLAIM_IDENTITY");
  };

  const handleConfirmIdentity = async () => {
    if (!detail || !id) return;

    try {
      let finalParticipantId = selectedParticipantId;

      if (isAddingNew && newParticipantName.trim()) {
        const newPart: Participant = {
          id: `p_${Date.now()}`,
          serrucho_id: id,
          name: newParticipantName.trim(),
          email: null,
          phone: null,
          preferred_channel: "WHATSAPP",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const updatedParticipants = [...detail.participants, newPart];
        const updatedDetail: MobileSerruchoDetailData = {
          ...detail,
          participants: updatedParticipants,
        };
        await mobileStorage.saveSerruchoDetail(id, updatedDetail);
        finalParticipantId = newPart.id;
      }

      if (!finalParticipantId) return;

      await mobileStorage.setMyIdentity(id, finalParticipantId);
      await mobileStorage.addRecent({
        id: detail.serrucho.id,
        name: detail.serrucho.name,
      });

      triggerHaptic("success");
      router.replace(`/serrucho/${id}` as any);
    } catch (e) {
      console.warn("Failed to join serrucho", e);
      triggerHaptic("error");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.background.base, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={tokens.colors.accent.primary} />
        <DSText variant="body" color="secondary" style={{ marginTop: 16 }}>
          Cargando invitación...
        </DSText>
      </View>
    );
  }

  if (!detail || !detail.serrucho) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.background.base, justifyContent: "center", padding: 24 }]}>
        <DSEmptyState
          title="Serrucho no encontrado"
          description="Este enlace de invitación no es válido o el Serrucho ha sido eliminado."
          action={
            <DSButton
              title="Ir a Inicio"
              variant="primary"
              onPress={() => router.replace("/(tabs)" as any)}
            />
          }
        />
      </View>
    );
  }

  const { serrucho, participants } = detail;
  const isClosed = serrucho.status === "CLOSED";
  const creator = participants[0]?.name || "Organizador";

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.base }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: tokens.colors.divider, backgroundColor: tokens.colors.surface.base }]}>
        <TouchableOpacity
          onPress={() => (step === "CLAIM_IDENTITY" ? setStep("PREVIEW") : router.replace("/(tabs)" as any))}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <DSText variant="title" weight="bold">
          {step === "PREVIEW" ? "Invitación" : "¿Quién eres?"}
        </DSText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === "PREVIEW" ? (
          <>
            {/* Invitation Hero Card */}
            <DSSurface variant="elevated" style={styles.card}>
              <View style={styles.badgeRow}>
                <DSBadge
                  label={isClosed ? "Cerrado" : "Abierto"}
                  variant={isClosed ? "neutral" : "success"}
                />
                <DSBadge label={serrucho.currency || "DOP"} variant="neutral" />
              </View>

              <DSText variant="caption" color="secondary" style={{ textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Te invitaron a un Serrucho 🪚
              </DSText>

              <DSText variant="title" weight="bold" style={styles.serruchoTitle}>
                {serrucho.name}
              </DSText>

              {serrucho.description ? (
                <DSText variant="body" color="secondary" style={{ marginBottom: 16 }}>
                  {serrucho.description}
                </DSText>
              ) : null}

              <View style={[styles.metaRow, { borderTopColor: tokens.colors.divider }]}>
                <Ionicons name="person-outline" size={18} color={tokens.colors.text.secondary} />
                <DSText variant="secondary" color="secondary" style={{ marginLeft: 8 }}>
                  Creado por: <DSText variant="secondary" weight="semibold">{creator}</DSText>
                </DSText>
              </View>

              <View style={[styles.metaRow, { borderTopColor: tokens.colors.divider }]}>
                <Ionicons name="people-outline" size={18} color={tokens.colors.text.secondary} />
                <DSText variant="secondary" color="secondary" style={{ marginLeft: 8 }}>
                  {participants.length} participante{participants.length === 1 ? "" : "s"}
                </DSText>
              </View>

              {/* Participant List Preview */}
              <DSText variant="caption" color="muted" style={{ marginTop: 16, marginBottom: 8, fontWeight: "600" }}>
                MIEMBROS DEL GRUPO:
              </DSText>
              <View style={styles.participantPillsRow}>
                {participants.map((p) => (
                  <View
                    key={p.id}
                    style={[
                      styles.participantPill,
                      { backgroundColor: tokens.colors.surface.hover, borderColor: tokens.colors.divider },
                    ]}
                  >
                    <DSText variant="caption" weight="medium">
                      {p.name}
                    </DSText>
                  </View>
                ))}
              </View>
            </DSSurface>

            {isClosed ? (
              <View style={[styles.warningBox, { backgroundColor: tokens.colors.surface.hover, borderColor: tokens.colors.divider }]}>
                <Ionicons name="lock-closed-outline" size={20} color={tokens.colors.warning.base} />
                <DSText variant="caption" color="secondary" style={{ marginLeft: 8, flex: 1 }}>
                  Este Serrucho ha sido cerrado. Puedes unirte en modo de solo lectura para consultar el historial.
                </DSText>
              </View>
            ) : null}

            <DSButton
              title="Unirme al Serrucho 🚀"
              variant="primary"
              size="lg"
              onPress={handleJoinClick}
              style={{ marginTop: 24 }}
            />
          </>
        ) : (
          <>
            {/* Step 2: Who are you? */}
            <DSSurface variant="elevated" style={styles.card}>
              <DSText variant="title" weight="bold" style={{ marginBottom: 6 }}>
                ¿Quién eres en este Serrucho? 👤
              </DSText>
              <DSText variant="body" color="secondary" style={{ marginBottom: 20 }}>
                Selecciona tu nombre para asociar tus pagos y deudas en este Serrucho.
              </DSText>

              {/* Participant options */}
              {participants.map((p) => {
                const isSelected = !isAddingNew && selectedParticipantId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setIsAddingNew(false);
                      setSelectedParticipantId(p.id);
                      triggerHaptic("selection");
                    }}
                    style={[
                      styles.participantOption,
                      {
                        borderColor: isSelected ? tokens.colors.accent.primary : tokens.colors.divider,
                        backgroundColor: isSelected ? tokens.colors.surface.hover : "transparent",
                      },
                    ]}
                  >
                    <View style={styles.radioRow}>
                      <View
                        style={[
                          styles.radioButton,
                          {
                            borderColor: isSelected ? tokens.colors.accent.primary : tokens.colors.text.muted,
                          },
                        ]}
                      >
                        {isSelected ? (
                          <View style={[styles.radioButtonInner, { backgroundColor: tokens.colors.accent.primary }]} />
                        ) : null}
                      </View>
                      <DSText variant="body" weight={isSelected ? "bold" : "regular"} style={{ marginLeft: 12 }}>
                        {p.name}
                      </DSText>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Option to add new participant if not in list */}
              <TouchableOpacity
                onPress={() => {
                  setIsAddingNew(true);
                  setSelectedParticipantId(null);
                  triggerHaptic("selection");
                }}
                style={[
                  styles.participantOption,
                  {
                    borderColor: isAddingNew ? tokens.colors.accent.primary : tokens.colors.divider,
                    backgroundColor: isAddingNew ? tokens.colors.surface.hover : "transparent",
                    marginTop: 8,
                  },
                ]}
              >
                <View style={styles.radioRow}>
                  <View
                    style={[
                      styles.radioButton,
                      {
                        borderColor: isAddingNew ? tokens.colors.accent.primary : tokens.colors.text.muted,
                      },
                    ]}
                  >
                    {isAddingNew ? (
                      <View style={[styles.radioButtonInner, { backgroundColor: tokens.colors.accent.primary }]} />
                    ) : null}
                  </View>
                  <DSText variant="body" weight={isAddingNew ? "bold" : "regular"} color={isAddingNew ? "primary" : "secondary"} style={{ marginLeft: 12 }}>
                    + No estoy en la lista (Agregarme)
                  </DSText>
                </View>
              </TouchableOpacity>

              {isAddingNew ? (
                <View style={{ marginTop: 12 }}>
                  <DSText variant="caption" color="secondary" style={{ marginBottom: 6 }}>
                    Tu nombre o apodo:
                  </DSText>
                  <TextInput
                    value={newParticipantName}
                    onChangeText={setNewParticipantName}
                    placeholder="Ej. Carlos"
                    placeholderTextColor={tokens.colors.text.muted}
                    style={[
                      styles.input,
                      {
                        color: tokens.colors.text.primary,
                        backgroundColor: tokens.colors.surface.hover,
                        borderColor: tokens.colors.divider,
                      },
                    ]}
                    autoFocus
                  />
                </View>
              ) : null}
            </DSSurface>

            <DSButton
              title="Continuar al Serrucho ✅"
              variant="primary"
              size="lg"
              disabled={!selectedParticipantId && (!isAddingNew || !newParticipantName.trim())}
              onPress={handleConfirmIdentity}
              style={{ marginTop: 24 }}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  serruchoTitle: {
    fontSize: 24,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  participantPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  participantPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  participantOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
