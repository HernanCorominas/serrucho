import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";
import { colors } from "../../src/theme/colors";
import { Card } from "../../src/components/ui/Card";
import { Badge } from "../../src/components/ui/Badge";
import { WhatsAppShareButton } from "../../src/components/WhatsAppShareButton";

export default function AwardsScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? colors.dark : colors.light;

  const awards = [
    {
      id: "financiero",
      title: "El Banquero del Coro 💳",
      holder: "Braulio",
      desc: "Pagó la mayor cantidad de gastos del viaje sin chistar.",
      amount: "RD$ 45,000",
      badge: "MVP",
      badgeVariant: "warning" as const,
    },
    {
      id: "puntual",
      title: "El Rayo de Sol ⚡",
      holder: "Camila",
      desc: "Transfirió su parte en menos de 5 minutos de cerrado el serrucho.",
      amount: "RD$ 6,250",
      badge: "PUNTUALIDAD",
      badgeVariant: "success" as const,
    },
    {
      id: "chipi",
      title: "El Chipi-Chipi 🤏",
      holder: "Manuel",
      desc: "Registró el gasto más detallado: unos chicles de RD$ 35.",
      amount: "RD$ 35",
      badge: "DETALLISTA",
      badgeVariant: "info" as const,
    },
    {
      id: "moroso",
      title: "El Paga-después 🐢",
      holder: "Pendiente del coro",
      desc: "El que siempre dice 'te lo paso por tPago ahorita' y se pierde.",
      amount: "RD$ 4,800",
      badge: "ATENCIÓN",
      badgeVariant: "danger" as const,
    },
  ];

  const shareText = `🏆 *Premios del Coro — Serrucho* 🪚\n\n` +
    `💳 *El Banquero:* Braulio (RD$ 45,000)\n` +
    `⚡ *El Rayo de Sol:* Camila (Pagó en 5 min)\n` +
    `🤏 *El Chipi-Chipi:* Manuel (Gasto de RD$ 35)\n\n` +
    `_¿Quién es el tuyo? Descúbrelo en Serrucho 🇩🇴_`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Insignias & Premios del Coro 🏆
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Reconocimientos automáticos generados al cerrar cada serrucho para relajar en el grupo.
        </Text>
      </View>

      {awards.map((award) => (
        <Card key={award.id} style={styles.awardCard}>
          <View style={styles.awardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.awardTitle, { color: theme.text }]}>
                {award.title}
              </Text>
              <Text style={[styles.awardHolder, { color: colors.primary }]}>
                {award.holder}
              </Text>
            </View>
            <Badge label={award.badge} variant={award.badgeVariant} />
          </View>

          <Text style={[styles.awardDesc, { color: theme.textMuted }]}>
            {award.desc}
          </Text>

          <View style={[styles.awardFooter, { borderTopColor: theme.border }]}>
            <Text style={[styles.footerLabel, { color: theme.textMuted }]}>Monto récord</Text>
            <Text style={[styles.footerAmount, { color: theme.text }]}>{award.amount}</Text>
          </View>
        </Card>
      ))}

      <View style={styles.shareSection}>
        <WhatsAppShareButton
          message={shareText}
          title="Compartir Premios en WhatsApp"
          size="lg"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  awardCard: {
    marginBottom: 12,
  },
  awardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  awardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  awardHolder: {
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  awardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  awardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  footerAmount: {
    fontSize: 14,
    fontWeight: "800",
  },
  shareSection: {
    marginTop: 12,
  },
});
