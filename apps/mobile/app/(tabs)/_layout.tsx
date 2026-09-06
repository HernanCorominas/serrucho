import React from "react";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme/colors";

export default function TabLayout() {
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        } as any,
        tabBarLabelStyle: {
          fontWeight: "700",
          fontSize: 11,
        } as any,
        headerStyle: {
          backgroundColor: colors.primary,
        } as any,
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "900",
          fontSize: 18,
          color: "#ffffff",
        } as any,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Serruchos",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="pie-chart" size={size} color={color} />
          ),
          headerTitle: "Mis Serruchos 🪚",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="settings-sharp" size={size} color={color} />
          ),
          headerTitle: "Ajustes ⚙️",
        }}
      />
    </Tabs>

  );
}
