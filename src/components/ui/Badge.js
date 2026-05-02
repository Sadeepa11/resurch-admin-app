import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../../theme/colors";

const TONES = {
  success: { bg: colors.successLight, fg: "#047857" },
  warning: { bg: colors.warningLight, fg: "#92400e" },
  danger: { bg: colors.dangerLight, fg: "#b91c1c" },
  info: { bg: colors.infoLight, fg: "#334155" },
  purple: { bg: colors.purpleLight, fg: "#6d28d9" },
  neutral: { bg: "#f3f4f6", fg: "#374151" },
};

export function Badge({ children, tone = "neutral", style }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  text: { fontSize: 10, fontWeight: "700" },
});
