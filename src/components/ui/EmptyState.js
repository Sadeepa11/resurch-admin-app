import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors, spacing } from "../../theme/colors";

export function EmptyState({ icon = "📭", title = "Nothing here yet", subtitle, loading = false }) {
  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.subtitle}>Loading…</Text>
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xxl, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 40, marginBottom: spacing.sm },
  title: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 12, color: colors.textMuted, textAlign: "center" },
});
