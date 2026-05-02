import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, radius, spacing, shadow } from "../../theme/colors";

export function Card({ children, style, padded = true }) {
  return (
    <View style={[styles.card, padded && styles.padded, shadow.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  padded: {
    padding: spacing.md,
  },
});
