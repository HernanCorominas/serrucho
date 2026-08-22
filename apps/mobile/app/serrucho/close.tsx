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

export default function CloseSerruchoModal() {
  const { serruchoId } = useLocalSearchParams<{ serruchoId: string }>();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const [instructions, setInstructions] = useState(
    "Transferir a cuenta corriente BHD: 001-234567-8 a nombre de Braulio o por tPago al 829-555-0199."
  );
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  const handleClose = async () => {
    if (!instructions.trim() || !deadline.trim()) {
      triggerHaptic("error");
      Alert.alert("Campos requeridos", "Por favor completa las instrucciones y fecha límite de pago.");
      return;
    }

    setLoading(true);
    triggerHaptic("heavy");

    if (serruchoId) {
      const detail = await mobileStorage.getSerruchoDetail(serruchoId);
      if (detail) {
        const closedSerrucho = {
          ...detail.serrucho,
          status: "CLOSED" as const,
          payment_instructions: instructions.trim(),
          payment_deadline: deadline.trim(),
          closed_at: new Date().toISOString(),
        };

        await mobileStorage.saveSerruchoDetail(serruchoId, {
          ...detail,
          serrucho: closedSerrucho,
        });

        // Also update in list
        const list = await mobileStorage.getSerruchos();
        const updatedList = list.map((s) => (s.id === serruchoId ? closedSerrucho : s));
        await mobileStorage.saveSerruchos(updatedList);
      }
    }

    triggerHaptic("success");
    setLoading(false);
    Alert.alert(
      "¡Serrucho Cerrado! 🔒",
      "Las cuentas han sido congeladas y los estados de cuenta están listos para enviar a tus amigos por WhatsApp.",
      [
        {
          text: "Ver Resultados",
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>
          Cerrar Serrucho & Cobrar 🔒
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Al cerrar el serrucho, se congelarán los gastos y cada participante recibirá su monto exacto a transferir.
        </Text>

        <Input
          label="Cuentas Bancarias / tPago para Recibir Pagos *"
          placeholder="Ej. BHD, Banreservas, Popular, tPago..."
          value={instructions}
          onChangeText={setInstructions}
          multiline
          numberOfLines={4}
          style={{ height: 90 }}
        />

        <Input
          label="Fecha Límite de Pago *"
          placeholder="AAAA-MM-DD"
          value={deadline}
          onChangeText={setDeadline}
        />

        <View style={styles.actions}>
          <Button
            title="Confirmar Cierre Irreversible 🔒"
            variant="danger"
            onPress={handleClose}
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
