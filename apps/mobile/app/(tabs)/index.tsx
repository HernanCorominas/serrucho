import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme/colors";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Badge } from "../../src/components/ui/Badge";
import { Input } from "../../src/components/ui/Input";
import { mobileStorage } from "../../src/services/storage";
import { triggerHaptic } from "../../src/utils/haptics";
import type { Serrucho } from "@serrucho/core";

export default function DashboardScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const [serruchos, setSerruchos] = useState<Serrucho[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"OPEN" | "CLOSED">("OPEN");

  const loadData = useCallback(async () => {
    // Load cached first
    const cached = await mobileStorage.getSerruchos();
    if (cached && cached.length > 0) {
      setSerruchos(cached);
    }

    // Attempt to load from API if configured, else default to demo serruchos
    if (cached.length === 0) {
      const demoData: Serrucho[] = [
        {
          id: "las-terrenas-2025",
          owner_id: "demo-user",
          name: "Villa en Las Terrenas 🌴",
          description: "Fin de semana largo en la playa con el coro",
          currency: "DOP",
          event_date: "2025-03-15",
          status: "OPEN",
          payment_instructions: "Transferencia BHD o Banreservas al 829-555-0199",
          payment_deadline: "2025-03-20",
          closed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "cena-cumple-carlos",
          owner_id: "demo-user",
          name: "Cena Cumpleaños Carlos 🎂",
          description: "Restaurante en Piantini",
          currency: "DOP",
          event_date: "2025-02-10",
          status: "CLOSED",
          payment_instructions: "tPago al 809-555-0144",
          payment_deadline: "2025-02-12",
          closed_at: "2025-02-12T18:00:00Z",
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
      ];
      setSerruchos(demoData);
      await mobileStorage.saveSerruchos(demoData);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    triggerHaptic("light");
    await loadData();
    setRefreshing(false);
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filtered = serruchos.filter((s) => {
    const matchesStatus = s.status === activeTab;
    const matchesQuery =
      searchQuery.trim() === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });
  const openCount = serruchos.filter((s) => s.status === "OPEN").length;
  const closedCount = serruchos.filter((s) => s.status === "CLOSED").length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
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
      {/* Top CTA Banner */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: theme.text }]}>¡Hola, Coro! 👋</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {openCount} {openCount === 1 ? "serrucho activo" : "serruchos activos"} en curso
          </Text>
        </View>
        <Button
          title="Crear"
          onPress={() => router.push("/serrucho/create")}
          size="sm"
          icon={<Ionicons name="add-circle" size={16} color="#ffffff" />}
        />
      </View>

      {/* Search Bar */}
      <Input
        placeholder="Buscar serrucho por nombre o lugar..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={<Ionicons name="search" size={16} color={theme.textMuted} />}
        style={{ height: 40 }}
      />

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.inputBg, marginTop: 8 }]}>
        <Button
          title={`En Curso (${openCount})`}
          variant={activeTab === "OPEN" ? "primary" : "ghost"}
          size="sm"
          onPress={() => {
            triggerHaptic("light");
            setActiveTab("OPEN");
          }}
          style={styles.tabButton}
        />
        <Button
          title={`Cerrados (${closedCount})`}
          variant={activeTab === "CLOSED" ? "primary" : "ghost"}
          size="sm"
          onPress={() => {
            triggerHaptic("light");
            setActiveTab("CLOSED");
          }}
          style={styles.tabButton}
        />
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🪚</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No hay serruchos {activeTab === "OPEN" ? "activos" : "cerrados"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            {activeTab === "OPEN"
              ? "Crea tu primer serrucho para organizar las cuentas del próximo viaje o salida."
              : "Los serruchos liquidados se guardarán aquí."}
          </Text>
          {activeTab === "OPEN" && (
            <Button
              title="Crear mi primer serrucho"
              onPress={() => router.push("/serrucho/create")}
              style={{ marginTop: 12 }}
            />
          )}
        </Card>
      ) : (
        filtered.map((s) => (
          <Card
            key={s.id}
            onPress={() => {
              triggerHaptic("light");
              router.push(`/serrucho/${s.id}`);
            }}
            variant={s.status === "OPEN" ? "default" : "muted"}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.serruchoTitle, { color: theme.text }]}>{s.name}</Text>
              <Badge
                label={s.status === "OPEN" ? "EN CURSO" : "CERRADO"}
                variant={s.status === "OPEN" ? "success" : "neutral"}
                size="sm"
              />
            </View>

            {s.description ? (
              <Text
                style={[styles.serruchoDesc, { color: theme.textMuted }]}
                numberOfLines={2}
              >
                {s.description}
              </Text>
            ) : null}

            <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
              <View style={styles.footerInfo}>
                <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.footerText, { color: theme.textMuted }]}>
                  {s.event_date || new Date(s.created_at).toLocaleDateString("es-DO")}
                </Text>
              </View>

              <View style={styles.footerAction}>
                <Text style={styles.enterText}>
                  {s.status === "OPEN" ? "Entrar al Serrucho" : "Ver Cuentas"}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            </View>
          </Card>
        ))
      )}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  serruchoTitle: {
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
    marginRight: 8,
  },
  serruchoDesc: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  enterText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 32,
    marginTop: 12,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
