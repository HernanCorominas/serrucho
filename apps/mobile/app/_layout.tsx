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
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.card,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: "900",
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
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
        <Stack.Screen
          name="serrucho/itemized"
          options={{
            title: "Desglose por Plato 🍽️",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="serrucho/close"
          options={{
            title: "Cerrar Serrucho 🔒",
            presentation: "modal",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
