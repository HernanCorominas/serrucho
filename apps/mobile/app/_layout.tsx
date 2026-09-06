import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../src/theme/colors";

export default function RootLayout() {
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
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
          contentStyle: {
            backgroundColor: theme.background,
          } as any,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="serrucho/[id]"
          options={{
            title: "Detalle del Serrucho",
            headerBackTitle: "Atrás",
          }}
        />
        <Stack.Screen
          name="serrucho/create"
          options={{
            title: "Nuevo Serrucho 🪚",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="serrucho/add-expense"
          options={{
            title: "Agregar Gasto 💸",
            presentation: "modal",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
