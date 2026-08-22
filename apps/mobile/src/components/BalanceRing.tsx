import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { colors } from "../theme/colors";
import { formatDOP } from "@serrucho/core";

interface BalanceRingProps {
  totalCents: number;
  collectedCents: number;
  size?: number;
}

export const BalanceRing: React.FC<BalanceRingProps> = ({
  totalCents,
  collectedCents,
  size = 120,
}) => {
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const pct = totalCents > 0 ? Math.min(Math.max(collectedCents / totalCents, 0), 1) : 0;
  const strokeDashoffset = circumference * (1 - pct);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="serruchoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? "#1e293b" : "#f1f5f9"}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#serruchoGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.textContainer}>
        <Text style={[styles.pctText, { color: theme.text }]}>
          {Math.round(pct * 100)}%
        </Text>
        <Text style={[styles.label, { color: theme.textMuted }]}>
          COBRADO
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pctText: {
    fontSize: 20,
    fontWeight: "900",
  },
  label: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
