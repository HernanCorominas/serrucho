import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
  TouchableOpacity,
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
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    // Load genuine saved data from local storage
    const cached = await mobileStorage.getSerruchos();
    // Filter out any legacy mock demo serruchos if they were previously saved
    const cleanList = (cached || []).filter(
      (s) => s.id !== "las-terrenas-2025" && s.id !== "cena-cumple-carlos" && s.id !== "serrucho-demo-1"
    );
    setSerruchos(cleanList);
    if (cleanList.length !== (cached || []).length) {
      await mobileStorage.saveSerruchos(cleanList);
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
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
        {/* Top Header Row with Brand Identity */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoEmoji}>🪚</Text>
              </View>
              <View>
                <Text style={[styles.brandTitle, { color: theme.text }]}>SERRUCHO</Text>
                <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>
                  REPARTO INTELIGENTE 🇩🇴
                </Text>
              </View>
            </View>
          </View>
          <Button
            title="+ Crear"
            onPress={() => {
              triggerHaptic("light");
              router.push("/serrucho/create");
            }}
            size="sm"
            style={styles.createBtnTop}
          />
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{serruchos.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{openCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Activos</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.textMuted }]}>{closedCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Liquidados</Text>
          </View>
        </View>

        {/* Search Bar */}
        {serruchos.length > 0 && (
          <Input
            placeholder="Buscar serrucho..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Ionicons name="search" size={16} color={theme.textMuted} />}
            style={{ height: 42, marginBottom: 12 }}
          />
        )}

        {/* Segmented Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: theme.inputBg }]}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic("light");
              setActiveTab("OPEN");
            }}
            style={[
              styles.tabButton,
              activeTab === "OPEN" && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === "OPEN" ? "#ffffff" : theme.textMuted },
              ]}
            >
              En Curso ({openCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic("light");
              setActiveTab("CLOSED");
            }}
            style={[
              styles.tabButton,
              activeTab === "CLOSED" && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === "CLOSED" ? "#ffffff" : theme.textMuted },
              ]}
            >
              Liquidados ({closedCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List of Serruchos or Clean Empty State */}
        {filtered.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyEmoji}>🪚</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {activeTab === "OPEN"
                ? "No tienes ningún serrucho activo"
                : "No hay serruchos archivados"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              {activeTab === "OPEN"
                ? "Crea tu primer serrucho para organizar las cuentas de tu próxima salida, viaje o coro."
                : "Los serruchos cerrados y liquidados aparecerán aquí."}
            </Text>
            {activeTab === "OPEN" && (
              <Button
                title="+ Crear mi primer serrucho"
                onPress={() => {
                  triggerHaptic("light");
                  router.push("/serrucho/create");
                }}
                style={styles.emptyCta}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    height: 38,
    width: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: {
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: -1,
  },
  createBtnTop: {
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
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
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  serruchoTitle: {
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
    marginRight: 8,
  },
  serruchoDesc: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 17,
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
    paddingVertical: 36,
    marginTop: 8,
    borderRadius: 24,
  },
  emptyIconCircle: {
    height: 64,
    width: 64,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  emptyCta: {
    marginTop: 18,
    borderRadius: 14,
    paddingHorizontal: 20,
  },
});
