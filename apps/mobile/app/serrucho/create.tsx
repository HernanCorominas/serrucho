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
import type { Serrucho } from "@serrucho/core";

export default function CreateSerruchoModal() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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

    const newSerrucho: Serrucho = {
      id: `serrucho-${Date.now()}`,
      owner_id: "current-user",
      name: name.trim(),
      description: description.trim() || null,
      currency: "DOP",
      event_date: eventDate || null,
      status: "OPEN",
      payment_instructions: null,
      payment_deadline: null,
      closed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const currentList = await mobileStorage.getSerruchos();
    const updatedList = [newSerrucho, ...currentList];
    await mobileStorage.saveSerruchos(updatedList);

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
          label="Descripción o Notas (Opcional)"
          placeholder="Ej. Alquiler de villa, comida, gasolina y bebidas"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ height: 70 }}
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
  actions: {
    marginTop: 16,
  },
});
