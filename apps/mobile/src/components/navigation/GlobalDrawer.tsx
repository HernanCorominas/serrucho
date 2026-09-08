import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  BackHandler,
  ScrollView,
  Linking,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { semanticTokens } from "@serrucho/ui";
import { useGlobalNavigation } from "../../navigation/GlobalNavigationContext";
import { triggerHaptic } from "../../utils/haptics";
import {
  DSText,
  DSAvatar,
  DSDivider,
  DSSettingRow,
  DSSection,
  DSBadge,
} from "../ds";

const USER_NAME_KEY = "@serrucho:user_name";

export const GlobalDrawer: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { isDrawerOpen, closeDrawer, activeSerruchoId, recents, refreshRecents } = useGlobalNavigation();

  // Responsive width ~80%, clamped between 280px and 340px
  const drawerWidth = Math.min(Math.max(windowWidth * 0.8, 280), 340);

  const animProgress = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(isDrawerOpen);
  const [userName, setUserName] = useState("Usuario Serrucho");

  const loadProfileName = async () => {
    try {
      const saved = await AsyncStorage.getItem(USER_NAME_KEY);
      if (saved) {
        setUserName(saved);
      }
    } catch {
      // Fallback default
    }
  };

  const prevOpenRef = useRef(isDrawerOpen);

  useEffect(() => {
    if (isDrawerOpen) {
      setRendered(true);
      loadProfileName();
      refreshRecents();
      Animated.timing(animProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (prevOpenRef.current && !isDrawerOpen) {
      Animated.timing(animProgress, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setRendered(false);
      });
    }
    prevOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen]);

  // Android Back Handler: close drawer first
  useEffect(() => {
    if (!isDrawerOpen) return;

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      closeDrawer();
      return true;
    });

    return () => backHandler.remove();
  }, [isDrawerOpen, closeDrawer]);

  if (!rendered && !isDrawerOpen) {
    return null;
  }

  const translateX = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  const backdropOpacity = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.65],
  });

  const handleNavigate = (path: string) => {
    triggerHaptic("selection");
    closeDrawer();
    router.push(path as any);
  };

  const handleFeedback = () => {
    triggerHaptic("selection");
    closeDrawer();
    Linking.openURL("https://wa.me/?text=Hola%20tengo%20un%20feedback%20para%20Serrucho%20RD");
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isDrawerOpen ? "auto" : "none"}>
      {/* Semi-transparent Dimming Backdrop (REF-02) */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeDrawer}
          accessibilityLabel="Cerrar menú lateral"
          accessibilityRole="button"
        />
      </Animated.View>

      {/* Drawer Panel (REF-02) */}
      <Animated.View
        style={[
          styles.drawerPanel,
          {
            width: drawerWidth,
            paddingTop: Math.max(insets.top, 8),
            paddingBottom: Math.max(insets.bottom, 8) + 8,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Profile Header (REF-02 / REF-05 link) */}
        <Pressable
          style={styles.profileHeader}
          onPress={() => handleNavigate("/profile")}
          accessibilityLabel="Ver perfil de usuario"
          accessibilityRole="button"
        >
          <DSAvatar name={userName} size="md" />
          <View style={styles.profileInfo}>
            <DSText variant="bodyMedium" weight="bold" color="primary" numberOfLines={1}>
              {userName}
            </DSText>
            <DSText variant="caption" color="secondary" numberOfLines={1}>
              Modo Local / Invitado 🇩🇴
            </DSText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={semanticTokens.colors.text.secondary} />
        </Pressable>

        <DSDivider />

        {/* Scrollable Navigation Body */}
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
          {/* Global Actions (REF-02) */}
          <View style={styles.actionGroup}>
            <DSSettingRow
              title="Iniciar nuevo Serrucho"
              leading={
                <View style={[styles.iconBox, { backgroundColor: "#2E1065" }]}>
                  <Ionicons name="add" size={18} color={semanticTokens.colors.accent.primary} />
                </View>
              }
              onPress={() => handleNavigate("/serrucho/create")}
              showDivider={false}
              accessibilityLabel="Iniciar nuevo Serrucho"
            />

            <DSSettingRow
              title="Tus Serruchos"
              leading={
                <View style={[styles.iconBox, { backgroundColor: semanticTokens.colors.surface.elevated }]}>
                  <Ionicons name="grid-outline" size={18} color={semanticTokens.colors.text.primary} />
                </View>
              }
              onPress={() => handleNavigate("/(tabs)")}
              showDivider={false}
              accessibilityLabel="Ver todos tus Serruchos"
            />

            <DSSettingRow
              title="Importar"
              subtitle="Desde Splitwise o archivo"
              leading={
                <View style={[styles.iconBox, { backgroundColor: semanticTokens.colors.surface.elevated }]}>
                  <Ionicons name="cloud-download-outline" size={18} color={semanticTokens.colors.text.primary} />
                </View>
              }
              onPress={() => handleNavigate("/import")}
              showDivider={false}
              accessibilityLabel="Importar datos"
            />

            <DSSettingRow
              title="Feedback"
              subtitle="Sugerencias por WhatsApp"
              leading={
                <View style={[styles.iconBox, { backgroundColor: semanticTokens.colors.surface.elevated }]}>
                  <Ionicons name="chatbubbles-outline" size={18} color={semanticTokens.colors.text.primary} />
                </View>
              }
              onPress={handleFeedback}
              showDivider={false}
              accessibilityLabel="Enviar comentarios por WhatsApp"
            />
          </View>

          <DSDivider style={styles.sectionDivider} />

          {/* Recent Serruchos Section (REF-02) */}
          <DSSection title="SERRUCHOS RECIENTES">
            {recents.length === 0 ? (
              <View style={styles.emptyRecents}>
                <DSText variant="caption" color="muted" align="center">
                  No hay serruchos recientes aún.
                </DSText>
              </View>
            ) : (
              recents.map((item) => {
                const isActive = item.id === activeSerruchoId;
                return (
                  <DSSettingRow
                    key={item.id}
                    title={item.name}
                    leading={
                      <DSAvatar name={item.name} size="sm" />
                    }
                    trailing={
                      isActive ? (
                        <DSBadge label="ACTIVO" variant="accent" size="sm" />
                      ) : undefined
                    }
                    showChevron={!isActive}
                    onPress={() => handleNavigate(`/serrucho/${item.id}`)}
                    style={isActive ? styles.activeRowHighlight : undefined}
                    accessibilityLabel={`Abrir serrucho ${item.name}`}
                  />
                );
              })
            )}
          </DSSection>
        </ScrollView>

        {/* Drawer Footer (REF-02) */}
        <View style={styles.footer}>
          <DSDivider />
          <View style={styles.footerContent}>
            <DSText variant="caption" color="muted">
              Serrucho v1.0.0 • Costo $0
            </DSText>
            <DSText variant="caption" color="muted">
              Reparto Inteligente RD 🇩🇴
            </DSText>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: semanticTokens.colors.background.base,
  },
  drawerPanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: semanticTokens.colors.surface.drawer,
    borderRightWidth: semanticTokens.geometry.hairline,
    borderRightColor: semanticTokens.colors.divider,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 1000,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: semanticTokens.spacing.screen,
    paddingVertical: semanticTokens.spacing.md,
    minHeight: 64,
  },
  profileInfo: {
    flex: 1,
    marginLeft: semanticTokens.spacing.sm,
    justifyContent: "center",
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: semanticTokens.spacing.sm,
  },
  actionGroup: {
    paddingHorizontal: semanticTokens.spacing.xs,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: semanticTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionDivider: {
    marginVertical: semanticTokens.spacing.sm,
  },
  emptyRecents: {
    paddingVertical: semanticTokens.spacing.md,
    paddingHorizontal: semanticTokens.spacing.screen,
  },
  activeRowHighlight: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderRadius: semanticTokens.radius.sm,
  },
  footer: {
    paddingHorizontal: semanticTokens.spacing.screen,
    paddingTop: semanticTokens.spacing.sm,
  },
  footerContent: {
    paddingTop: semanticTokens.spacing.xs,
    alignItems: "center",
    gap: 2,
  },
});
