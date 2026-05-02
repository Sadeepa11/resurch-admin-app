import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing, shadow } from "../../theme/colors";

export function StatGrid({ items = [] }) {
  return (
    <View style={styles.grid}>
      {items.map((it, i) => (
        <View key={i} style={[styles.cell, shadow.card]}>
          <Text style={styles.label}>{it.label}</Text>
          <Text style={[styles.value, { color: it.color || colors.text }]}>{it.value}</Text>
          {it.sub ? <Text style={styles.sub}>{it.sub}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs },
  cell: {
    width: "50%",
    paddingHorizontal: spacing.xs,
  },
  label: { fontSize: 11, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase" },
  value: { fontSize: 20, fontWeight: "800", marginTop: 4, color: colors.text },
  sub: { fontSize: 10, color: colors.textLight, marginTop: 2 },
});

export function StatCardRow({ items = [] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs }}>
      {items.map((it, i) => (
        <View
          key={i}
          style={[
            {
              width: "50%",
              padding: spacing.xs,
            },
          ]}
        >
          <View style={[s2.card, shadow.card]}>
            <Text style={s2.label}>{it.label}</Text>
            <Text style={[s2.value, { color: it.color || colors.text }]}>{it.value}</Text>
            {it.sub ? <Text style={s2.sub}>{it.sub}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const s2 = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 10, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  value: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  sub: { fontSize: 10, color: colors.textLight, marginTop: 2 },
});
