import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useAppTheme } from "../../theme/colors";
import { DSText } from "../ds";

interface AppOpenSplashProps {
  isReady: boolean;
  onFinish?: () => void;
}

export const AppOpenSplash: React.FC<AppOpenSplashProps> = ({
  isReady,
  onFinish,
}) => {
  const { tokens } = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Initial entrance scale
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  useEffect(() => {
    if (isReady) {
      // Smooth fade-out once the app data/initialization is ready
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }
  }, [isReady, fadeAnim, onFinish]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.background.base,
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: tokens.colors.accent.primaryLight }]}>
          <DSText style={styles.emoji}>🪚</DSText>
        </View>
        <DSText variant="title" weight="bold" style={styles.title}>
          SERRUCHO
        </DSText>
        <DSText variant="caption" color="secondary" style={styles.subtitle}>
          Gastos Claros · República Dominicana
        </DSText>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 26,
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    letterSpacing: 0.5,
  },
});
