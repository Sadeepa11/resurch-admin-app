import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { colors, radius, spacing } from "../../theme/colors";

export function Select({ label, value, onValueChange, options = [], style }) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.box}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={Platform.OS === "android" ? styles.pickerAndroid : styles.pickerIOS}
          dropdownIconColor={colors.textMuted}
        >
          {options.map((o) => (
            <Picker.Item key={String(o.value)} label={o.label} value={o.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: "600", color: colors.text, marginBottom: 4 },
  box: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  pickerAndroid: { color: colors.text },
  pickerIOS: { color: colors.text },
});
