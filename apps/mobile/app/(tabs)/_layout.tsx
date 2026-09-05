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
          backgroundColor: theme.card,
        } as any,
        headerTitleStyle: {
          fontWeight: "900",
          fontSize: 18,
          color: theme.text,
        } as any,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Serruchos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart" size={size} color={color} />
          ),
          headerTitle: "Mis Serruchos 🪚",
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: "Calculadora",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calculator" size={size} color={color} />
          ),
          headerTitle: "Calculadora de Cuenta 🧮",
        }}
      />
      <Tabs.Screen
        name="awards"
        options={{
          title: "Premios",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
          headerTitle: "Premios del Coro 🏆",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" size={size} color={color} />
          ),
          headerTitle: "Ajustes ⚙️",
        }}
      />
    </Tabs>
  );
}
