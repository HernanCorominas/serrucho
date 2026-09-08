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
import { useAppTheme } from "../../src/theme/colors";
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
import { OnboardingModal } from "../../src/components/onboarding/OnboardingModal";
import { AppOpenSplash } from "../../src/components/ui/AppOpenSplash";
import type { Serrucho } from "@serrucho/core";

export default function DashboardScreen() {
  const router = useRouter();
  const { openDrawer } = useGlobalNavigation();
  const { tokens } = useAppTheme();

  const [serruchos, setSerruchos] = useState<Serrucho[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"OPEN" | "CLOSED">("OPEN");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSplashReady, setIsSplashReady] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Check onboarding
      const completed = await mobileStorage.hasCompletedOnboarding();
      if (!completed) {
        setShowOnboarding(true);
      }

      // Load saved serruchos from storage
      const cached = await mobileStorage.getSerruchos();
      const cleanList = (cached || []).filter(
        (s) => s.id !== "las-terrenas-2025" && s.id !== "cena-cumple-carlos" && s.id !== "serrucho-demo-1"
      );
      setSerruchos(cleanList);
      if (cleanList.length !== (cached || []).length) {
        await mobileStorage.saveSerruchos(cleanList);
      }
    } finally {
      setIsSplashReady(true);
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
    <View style={[styles.container, { backgroundColor: tokens.colors.background.base }]}>
      <AppOpenSplash isReady={isSplashReady} />
      <OnboardingModal
        visible={showOnboarding}
        onDismiss={() => setShowOnboarding(false)}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.accent.primary}
            colors={[tokens.colors.accent.primary]}
          />
        }
      >
        {/* Top Header Row with Brand Identity & Hamburger */}
        <View style={styles.headerRow}>
          <DSIconButton
            icon={<Ionicons name="menu" size={24} color={tokens.colors.text.primary} />}
            onPress={openDrawer}
            accessibilityLabel="Abrir menú principal"
            style={{ marginRight: 8 }}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.brandRow}>
              <View style={[styles.logoBadge, { backgroundColor: tokens.colors.accent.primary }]}>
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
          <View style={[styles.searchContainer, { backgroundColor: tokens.colors.surface.base, borderColor: tokens.colors.divider }]}>
            <Ionicons name="search" size={18} color={tokens.colors.text.secondary} style={styles.searchIcon as any} />
            <TextInput
              placeholder="Buscar Serrucho..."
              placeholderTextColor={tokens.colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: tokens.colors.text.primary }]}
            />
          </View>
        )}

        {/* Segmented Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: tokens.colors.surface.base, borderColor: tokens.colors.divider }]}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic("light");
              setActiveTab("OPEN");
            }}
            style={[
              styles.tabButton,
              activeTab === "OPEN" && { backgroundColor: tokens.colors.accent.primary },
            ]}
          >
            <DSText
              variant="caption"
              weight="bold"
              style={{ color: activeTab === "OPEN" ? "#FFFFFF" : tokens.colors.text.secondary }}
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
              activeTab === "CLOSED" && { backgroundColor: tokens.colors.accent.primary },
            ]}
          >
            <DSText
              variant="caption"
              weight="bold"
              style={{ color: activeTab === "CLOSED" ? "#FFFFFF" : tokens.colors.text.secondary }}
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
                illustration={<Ionicons name="search-outline" size={44} color={tokens.colors.text.secondary} />}
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
                illustration={<Ionicons name="albums-outline" size={44} color={tokens.colors.text.secondary} />}
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

                <View style={[styles.cardFooter, { borderTopColor: tokens.colors.divider }]}>
                  <View style={styles.footerInfo}>
                    <Ionicons name="calendar-outline" size={13} color={tokens.colors.text.secondary} />
                    <DSText variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                      {s.event_date || new Date(s.created_at).toLocaleDateString("es-DO")}
                    </DSText>
                  </View>

                  <View style={styles.footerAction}>
                    <DSText variant="caption" weight="bold" color="accent" style={{ marginRight: 2 }}>
                      {s.status === "OPEN" ? "Entrar al Serrucho" : "Ver Cuentas"}
                    </DSText>
                    <Ionicons name="chevron-forward" size={14} color={tokens.colors.accent.primary} />
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
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    height: 36,
    width: 36,
    borderRadius: 8,
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
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
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
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  tabBar: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  serruchoCard: {
    borderRadius: 12,
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
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
});
