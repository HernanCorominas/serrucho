import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAppTheme } from "../src/theme/colors";
import { GlobalNavigationProvider } from "../src/navigation/GlobalNavigationContext";
import { GlobalDrawer } from "../src/components/navigation/GlobalDrawer";

export default function RootLayout() {
  const { isDark, tokens } = useAppTheme();

  return (
    <SafeAreaProvider>
      <GlobalNavigationProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: tokens.colors.surface.base,
            } as any,
            headerTintColor: tokens.colors.text.primary,
            headerTitleStyle: {
              fontWeight: "700",
              fontSize: 18,
              color: tokens.colors.text.primary,
            } as any,
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: tokens.colors.background.base,
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
            name="s/[id]"
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
                backgroundColor: tokens.colors.surface.base,
              } as any,
              headerTintColor: tokens.colors.text.primary,
            }}
          />
          <Stack.Screen
            name="serrucho/add-expense"
            options={{
              title: "Agregar Gasto 💸",
              presentation: "modal",
              headerStyle: {
                backgroundColor: tokens.colors.surface.base,
              } as any,
              headerTintColor: tokens.colors.text.primary,
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
