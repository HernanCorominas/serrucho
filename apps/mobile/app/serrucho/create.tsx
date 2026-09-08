import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { semanticTokens } from "@serrucho/ui";
import { mobileStorage } from "../../src/services/storage";
import { triggerHaptic } from "../../src/utils/haptics";
import {
  DSText,
  DSButton,
  DSSurface,
} from "../../src/components/ds";
import type { Serrucho, Participant, ParticipantFinancials } from "@serrucho/core";

export default function CreateSerruchoModal() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [initialParticipantsText, setInitialParticipantsText] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<"DOP" | "USD" | "EUR">("DOP");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      triggerHaptic("error");
      Alert.alert("Campo requerido", "Por favor ingresa un nombre para el Serrucho.");
      return;
    }

    setLoading(true);
    triggerHaptic("medium");

    const serruchoId = `serrucho-${Date.now()}`;
    const now = new Date().toISOString();

    const newSerrucho: Serrucho = {
      id: serruchoId,
      owner_id: "current-user",
      name: name.trim(),
      description: description.trim() || null,
      currency,
      event_date: eventDate || null,
      status: "OPEN",
      payment_instructions: null,
      payment_deadline: null,
      closed_at: null,
      created_at: now,
      updated_at: now,
    };

    // Build participants list: creator + any initial participants
    const myName = creatorName.trim() || "Organizador";
    const participantList: Participant[] = [
      {
        id: `p-${Date.now()}-1`,
        serrucho_id: serruchoId,
        name: myName,
        email: null,
        phone: null,
        preferred_channel: "WHATSAPP",
        created_at: now,
        updated_at: now,
      },
    ];

    if (initialParticipantsText.trim()) {
      const extraNames = initialParticipantsText
        .split(/[,;\n]/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0 && n !== myName);

      extraNames.forEach((extName, idx) => {
        participantList.push({
          id: `p-${Date.now()}-${idx + 2}`,
          serrucho_id: serruchoId,
          name: extName,
          email: null,
          phone: null,
          preferred_channel: "WHATSAPP",
          created_at: now,
          updated_at: now,
        });
      });
    }

    const initialBalances: ParticipantFinancials[] = participantList.map((p) => ({
      ...p,
      total_paid_cents: 0,
      total_owed_cents: 0,
      net_balance_cents: 0,
    }));

    // Save in storage
    const currentList = await mobileStorage.getSerruchos();
    await mobileStorage.saveSerruchos([newSerrucho, ...currentList]);
    await mobileStorage.saveSerruchoDetail(serruchoId, {
      serrucho: newSerrucho,
      participants: participantList,
      expenses: [],
      balances: initialBalances,
      transfers: [],
      activities: [
        {
          id: `act_${Date.now()}`,
          serrucho_id: serruchoId,
          action_type: "SERRUCHO_CREATED",
          entity_type: "SERRUCHO",
          actor_name: myName,
          summary: `Se creó el Serrucho "${newSerrucho.name}"`,
          created_at: now,
        },
      ],
      tier: "FREE",
    });
    await mobileStorage.addRecent({ id: serruchoId, name: newSerrucho.name });

    triggerHaptic("success");
    setLoading(false);
    router.replace(`/serrucho/${newSerrucho.id}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <DSSurface variant="elevated" style={styles.card}>
        <DSText variant="title" weight="bold" color="primary" style={styles.title}>
          Información del Serrucho 🪚
        </DSText>
        <DSText variant="caption" color="secondary" style={styles.subtitle}>
          Crea tu grupo para empezar a anotar los gastos del coro, viaje o salida.
        </DSText>

        <View style={styles.inputGroup}>
          <DSText variant="caption" color="secondary" weight="semibold" style={styles.inputLabel}>
            Nombre del Serrucho *
          </DSText>
          <TextInput
            style={styles.input}
            placeholder="Ej. Fin de Semana en Las Terrenas 🌴"
            placeholderTextColor={semanticTokens.colors.text.muted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        <View style={styles.inputGroup}>
          <DSText variant="caption" color="secondary" weight="semibold" style={styles.inputLabel}>
            Tu Nombre / Apodo (Opcional)
          </DSText>
          <TextInput
            style={styles.input}
            placeholder="Ej. Braulio"
            placeholderTextColor={semanticTokens.colors.text.muted}
            value={creatorName}
            onChangeText={setCreatorName}
          />
        </View>

        <View style={styles.inputGroup}>
          <DSText variant="caption" color="secondary" weight="semibold" style={styles.inputLabel}>
            Amigos del coro (Opcional, separados por coma)
          </DSText>
          <TextInput
            style={styles.input}
            placeholder="Ej. Carlos, Laura, Marcos, Paola"
            placeholderTextColor={semanticTokens.colors.text.muted}
            value={initialParticipantsText}
            onChangeText={setInitialParticipantsText}
          />
        </View>

        <View style={styles.currencyRow}>
          <DSText variant="caption" color="secondary" weight="semibold" style={styles.inputLabel}>
            Moneda principal:
          </DSText>
          <View style={styles.currencyButtons}>
            {(["DOP", "USD", "EUR"] as const).map((curr) => {
              const isSelected = currency === curr;
              return (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyBtn,
                    isSelected ? styles.currencyBtnActive : styles.currencyBtnInactive,
                  ]}
                  onPress={() => {
                    triggerHaptic("selection");
                    setCurrency(curr);
                  }}
                >
                  <DSText
                    variant="caption"
                    weight="bold"
                    style={{ color: isSelected ? "#FFFFFF" : semanticTokens.colors.text.secondary }}
                  >
                    {curr === "DOP" ? "🇩🇴 RD$" : curr === "USD" ? "🇺🇸 USD$" : "🇪🇺 EUR€"}
                  </DSText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <DSText variant="caption" color="secondary" weight="semibold" style={styles.inputLabel}>
            Descripción o Notas (Opcional)
          </DSText>
          <TextInput
            style={[styles.input, { height: 64, textAlignVertical: "top", paddingTop: 10 }]}
            placeholder="Ej. Villa, comida, gasolina y bebidas"
            placeholderTextColor={semanticTokens.colors.text.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.inputGroup}>
          <DSText variant="caption" color="secondary" weight="semibold" style={styles.inputLabel}>
            Fecha del Evento
          </DSText>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={semanticTokens.colors.text.muted}
            value={eventDate}
            onChangeText={setEventDate}
          />
        </View>

        <View style={styles.actions}>
          <DSButton
            title={loading ? "Creando..." : "Crear Serrucho ➔"}
            variant="primary"
            onPress={handleCreate}
            disabled={loading}
            fullWidth
            accessibilityLabel="Crear Serrucho"
          />
          <DSButton
            title="Cancelar"
            variant="ghost"
            onPress={() => router.back()}
            fullWidth
            style={{ marginTop: 8 }}
            accessibilityLabel="Cancelar creación"
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
    padding: semanticTokens.spacing.screen,
    paddingBottom: 40,
  },
  card: {
    borderRadius: semanticTokens.radius.lg,
    padding: 16,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    marginBottom: 4,
  },
  input: {
    height: 44,
    backgroundColor: semanticTokens.colors.surface.base,
    borderWidth: 1,
    borderColor: semanticTokens.colors.divider,
    borderRadius: semanticTokens.radius.md,
    paddingHorizontal: 12,
    color: semanticTokens.colors.text.primary,
    fontSize: 14,
  },
  currencyRow: {
    marginBottom: 12,
  },
  currencyButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  currencyBtn: {
    flex: 1,
    height: 38,
    borderRadius: semanticTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  currencyBtnActive: {
    backgroundColor: semanticTokens.colors.accent.primary,
    borderColor: semanticTokens.colors.accent.primary,
  },
  currencyBtnInactive: {
    backgroundColor: semanticTokens.colors.surface.base,
    borderColor: semanticTokens.colors.divider,
  },
  actions: {
    marginTop: 16,
  },
});
