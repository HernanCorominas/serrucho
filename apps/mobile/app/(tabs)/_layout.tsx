import React from "react";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: "none",
        } as any,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Serruchos",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
        }}
      />
    </Tabs>
  );
}
