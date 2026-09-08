import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { semanticTokens } from "@serrucho/ui";
import { colors } from "../src/theme/colors";
import { GlobalNavigationProvider } from "../src/navigation/GlobalNavigationContext";
import { GlobalDrawer } from "../src/components/navigation/GlobalDrawer";

export default function RootLayout() {
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  return (
    <SafeAreaProvider>
      <GlobalNavigationProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: semanticTokens.colors.surface.base,
            } as any,
            headerTintColor: semanticTokens.colors.text.primary,
            headerTitleStyle: {
              fontWeight: "700",
              fontSize: 18,
              color: semanticTokens.colors.text.primary,
            } as any,
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: semanticTokens.colors.background.base,
            } as any,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="serrucho/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="serrucho/create"
            options={{
              title: "Nuevo Serrucho 🪚",
              presentation: "modal",
              headerStyle: {
                backgroundColor: semanticTokens.colors.surface.base,
              } as any,
              headerTintColor: semanticTokens.colors.text.primary,
            }}
          />
          <Stack.Screen
            name="serrucho/add-expense"
            options={{
              title: "Agregar Gasto 💸",
              presentation: "modal",
              headerStyle: {
                backgroundColor: semanticTokens.colors.surface.base,
              } as any,
              headerTintColor: semanticTokens.colors.text.primary,
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="account-settings"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="import"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        <GlobalDrawer />
      </GlobalNavigationProvider>
    </SafeAreaProvider>
  );
}
