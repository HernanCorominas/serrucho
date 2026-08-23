import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../src/theme/colors";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Input } from "../../src/components/ui/Input";
import { mobileStorage } from "../../src/services/storage";
import { triggerHaptic } from "../../src/utils/haptics";
import type { Serrucho, Participant, ParticipantFinancials } from "@serrucho/core";

export default function CreateSerruchoModal() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

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
      Alert.alert("Campo requerido", "Por favor ingresa un nombre para el serrucho.");
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
    const myName = creatorName.trim() || "Tú (Organizador)";
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
    });
    await mobileStorage.addRecent({ id: serruchoId, name: newSerrucho.name });

    triggerHaptic("success");
    setLoading(false);
    router.replace(`/serrucho/${newSerrucho.id}`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>
          Información del Serrucho 🪚
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Crea tu grupo para empezar a anotar los gastos del coro o viaje.
        </Text>

        <Input
          label="Nombre del Serrucho *"
          placeholder="Ej. Fin de Semana en Las Terrenas 🌴"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Input
          label="Tu Nombre / Apodo (Opcional)"
          placeholder="Ej. Braulio"
          value={creatorName}
          onChangeText={setCreatorName}
        />

        <Input
          label="Amigos del coro (Opcional, separados por coma)"
          placeholder="Ej. Carlos, Laura, Marcos, Paola"
          value={initialParticipantsText}
          onChangeText={setInitialParticipantsText}
        />

        <View style={styles.currencyRow}>
          <Text style={[styles.currencyLabel, { color: theme.text }]}>
            Moneda:
          </Text>
          <View style={styles.currencyButtons}>
            {(["DOP", "USD", "EUR"] as const).map((curr) => (
              <Button
                key={curr}
                title={curr === "DOP" ? "🇩🇴 RD$" : curr === "USD" ? "🇺🇸 USD$" : "🇪🇺 EUR€"}
                variant={currency === curr ? "primary" : "outline"}
                size="sm"
                onPress={() => {
                  triggerHaptic("selection");
                  setCurrency(curr);
                }}
                style={styles.currencyBtn}
              />
            ))}
          </View>
        </View>

        <Input
          label="Descripción o Notas (Opcional)"
          placeholder="Ej. Alquiler de villa, comida, gasolina y bebidas"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
          style={{ height: 60 }}
        />

        <Input
          label="Fecha del Evento"
          placeholder="AAAA-MM-DD"
          value={eventDate}
          onChangeText={setEventDate}
        />

        <View style={styles.actions}>
          <Button
            title="Crear Serrucho ➔"
            onPress={handleCreate}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  currencyRow: {
    marginBottom: 14,
  },
  currencyLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  currencyButtons: {
    flexDirection: "row",
    gap: 8,
  },
  currencyBtn: {
    flex: 1,
  },
  actions: {
    marginTop: 16,
  },
});
