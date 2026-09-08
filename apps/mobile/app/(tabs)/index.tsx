import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { semanticTokens } from "@serrucho/ui";
import { mobileStorage } from "../../src/services/storage";
import { triggerHaptic } from "../../src/utils/haptics";
import { useGlobalNavigation } from "../../src/navigation/GlobalNavigationContext";
import {
  DSText,
  DSIconButton,
  DSBadge,
  DSButton,
  DSSurface,
  DSEmptyState,
} from "../../src/components/ds";
import type { Serrucho } from "@serrucho/core";

export default function DashboardScreen() {
  const router = useRouter();
  const { openDrawer } = useGlobalNavigation();

  const [serruchos, setSerruchos] = useState<Serrucho[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"OPEN" | "CLOSED">("OPEN");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    // Load saved serruchos from storage
    const cached = await mobileStorage.getSerruchos();
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
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={semanticTokens.colors.accent.primary}
            colors={[semanticTokens.colors.accent.primary]}
          />
        }
      >
        {/* Top Header Row with Brand Identity & Hamburger */}
        <View style={styles.headerRow}>
          <DSIconButton
            icon={<Ionicons name="menu" size={24} color={semanticTokens.colors.text.primary} />}
            onPress={openDrawer}
            accessibilityLabel="Abrir menú principal"
            style={{ marginRight: 8 }}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <DSText style={styles.logoEmoji}>🪚</DSText>
              </View>
              <View>
                <DSText variant="title" weight="bold" color="primary" style={styles.brandTitle}>
                  SERRUCHO
                </DSText>
                <DSText variant="caption" color="secondary" weight="semibold" style={styles.brandSubtitle}>
                  REPARTO INTELIGENTE 🇩🇴
                </DSText>
              </View>
            </View>
          </View>
          <DSButton
            title="+ Crear"
            variant="primary"
            size="sm"
            onPress={() => {
              triggerHaptic("light");
              router.push("/serrucho/create");
            }}
            accessibilityLabel="Crear nuevo Serrucho"
          />
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsRow}>
          <DSSurface variant="elevated" style={styles.statBox}>
            <DSText variant="title" weight="bold" color="accent" style={styles.statValue}>
              {serruchos.length}
            </DSText>
            <DSText variant="caption" color="secondary">Total</DSText>
          </DSSurface>
          <DSSurface variant="elevated" style={styles.statBox}>
            <DSText variant="title" weight="bold" color="success" style={styles.statValue}>
              {openCount}
            </DSText>
            <DSText variant="caption" color="secondary">Activos</DSText>
          </DSSurface>
          <DSSurface variant="elevated" style={styles.statBox}>
            <DSText variant="title" weight="bold" color="muted" style={styles.statValue}>
              {closedCount}
            </DSText>
            <DSText variant="caption" color="secondary">Liquidados</DSText>
          </DSSurface>
        </View>

        {/* Search Bar */}
        {serruchos.length > 0 && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={semanticTokens.colors.text.secondary} style={styles.searchIcon as any} />
            <TextInput
              placeholder="Buscar Serrucho..."
              placeholderTextColor={semanticTokens.colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
        )}

        {/* Segmented Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic("light");
              setActiveTab("OPEN");
            }}
            style={[
              styles.tabButton,
              activeTab === "OPEN" && styles.tabButtonActive,
            ]}
          >
            <DSText
              variant="caption"
              weight="bold"
              style={{ color: activeTab === "OPEN" ? "#FFFFFF" : semanticTokens.colors.text.secondary }}
            >
              En Curso ({openCount})
            </DSText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic("light");
              setActiveTab("CLOSED");
            }}
            style={[
              styles.tabButton,
              activeTab === "CLOSED" && styles.tabButtonActive,
            ]}
          >
            <DSText
              variant="caption"
              weight="bold"
              style={{ color: activeTab === "CLOSED" ? "#FFFFFF" : semanticTokens.colors.text.secondary }}
            >
              Liquidados ({closedCount})
            </DSText>
          </TouchableOpacity>
        </View>

        {/* List of Serruchos or Clean Empty State */}
        {filtered.length === 0 ? (
          <DSSurface variant="elevated" style={styles.emptyContainer}>
            {searchQuery.trim() !== "" ? (
              <DSEmptyState
                illustration={<Ionicons name="search-outline" size={44} color={semanticTokens.colors.text.secondary} />}
                title="Sin resultados"
                description={`No encontramos ningún Serrucho que coincida con "${searchQuery}".`}
                action={
                  <DSButton
                    title="Limpiar búsqueda"
                    variant="secondary"
                    onPress={() => {
                      triggerHaptic("light");
                      setSearchQuery("");
                    }}
                    accessibilityLabel="Limpiar filtro de búsqueda"
                  />
                }
              />
            ) : (
              <DSEmptyState
                illustration={<Ionicons name="albums-outline" size={44} color={semanticTokens.colors.text.secondary} />}
                title={activeTab === "OPEN" ? "No tienes ningún Serrucho activo" : "No hay Serruchos liquidados"}
                description={
                  activeTab === "OPEN"
                    ? "Crea tu primer Serrucho para organizar las cuentas de tu próxima salida, viaje o coro."
                    : "Los Serruchos cerrados y liquidados aparecerán aquí."
                }
                action={
                  activeTab === "OPEN" ? (
                    <DSButton
                      title="+ Crear mi primer Serrucho"
                      variant="primary"
                      onPress={() => {
                        triggerHaptic("light");
                        router.push("/serrucho/create");
                      }}
                      accessibilityLabel="Crear mi primer Serrucho"
                    />
                  ) : undefined
                }
              />
            )}
          </DSSurface>
        ) : (
          filtered.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => {
                triggerHaptic("light");
                router.push(`/serrucho/${s.id}`);
              }}
              activeOpacity={0.8}
            >
              <DSSurface variant="elevated" style={styles.serruchoCard}>
                <View style={styles.cardHeader}>
                  <DSText variant="bodyMedium" weight="bold" color="primary" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
                    {s.name}
                  </DSText>
                  <DSBadge
                    label={s.status === "OPEN" ? "EN CURSO" : "CERRADO"}
                    variant={s.status === "OPEN" ? "accent" : "neutral"}
                    size="sm"
                  />
                </View>

                {s.description ? (
                  <DSText variant="caption" color="secondary" numberOfLines={2} style={styles.serruchoDesc}>
                    {s.description}
                  </DSText>
                ) : null}

                <View style={styles.cardFooter}>
                  <View style={styles.footerInfo}>
                    <Ionicons name="calendar-outline" size={13} color={semanticTokens.colors.text.secondary} />
                    <DSText variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                      {s.event_date || new Date(s.created_at).toLocaleDateString("es-DO")}
                    </DSText>
                  </View>

                  <View style={styles.footerAction}>
                    <DSText variant="caption" weight="bold" color="accent" style={{ marginRight: 2 }}>
                      {s.status === "OPEN" ? "Entrar al Serrucho" : "Ver Cuentas"}
                    </DSText>
                    <Ionicons name="chevron-forward" size={14} color={semanticTokens.colors.accent.primary} />
                  </View>
                </View>
              </DSSurface>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.base,
  },
  content: {
    padding: semanticTokens.spacing.screen,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: semanticTokens.spacing.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    height: 36,
    width: 36,
    borderRadius: semanticTokens.radius.sm,
    backgroundColor: semanticTokens.colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: {
    fontSize: 18,
  },
  brandTitle: {
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    letterSpacing: 0.8,
    marginTop: -2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: semanticTokens.spacing.md,
  },
  statBox: {
    flex: 1,
    borderRadius: semanticTokens.radius.md,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    lineHeight: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: semanticTokens.colors.surface.base,
    borderWidth: 1,
    borderColor: semanticTokens.colors.divider,
    borderRadius: semanticTokens.radius.md,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: semanticTokens.spacing.md,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: semanticTokens.colors.text.primary,
    fontSize: 14,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: semanticTokens.colors.surface.base,
    borderWidth: 1,
    borderColor: semanticTokens.colors.divider,
    borderRadius: semanticTokens.radius.md,
    padding: 4,
    marginBottom: semanticTokens.spacing.md,
  },
  tabButton: {
    flex: 1,
    borderRadius: semanticTokens.radius.sm,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: semanticTokens.colors.accent.primary,
  },
  serruchoCard: {
    borderRadius: semanticTokens.radius.md,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  serruchoDesc: {
    marginBottom: 8,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.divider,
    paddingTop: 8,
    marginTop: 4,
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyContainer: {
    borderRadius: semanticTokens.radius.lg,
    overflow: "hidden",
    marginTop: 8,
  },
});
