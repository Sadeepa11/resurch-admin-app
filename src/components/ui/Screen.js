import React from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { colors, spacing } from "../../theme/colors";

export function Screen({ children, scroll = true, refreshing, onRefresh, padded = true, style }) {
  if (!scroll) {
    return (
      <View style={[styles.container, padded && styles.padded, style]}>{children}</View>
    );
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[padded && styles.padded, style]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  padded: {
    padding: spacing.md,
  },
});
