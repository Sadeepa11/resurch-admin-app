import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../../theme/colors";

const variants = {
  primary: { bg: colors.primary, fg: "#fff", border: colors.primary },
  secondary: { bg: colors.secondary, fg: "#fff", border: colors.secondary },
  outline: { bg: "transparent", fg: colors.text, border: colors.border },
  danger: { bg: colors.danger, fg: "#fff", border: colors.danger },
  success: { bg: colors.success, fg: "#fff", border: colors.success },
  ghost: { bg: "transparent", fg: colors.primary, border: "transparent" },
  warning: { bg: colors.warning, fg: "#fff", border: colors.warning },
};

const sizes = {
  sm: { padV: 6, padH: 10, font: 12 },
  md: { padV: 10, padH: 14, font: 13 },
  lg: { padV: 12, padH: 18, font: 15 },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
  icon = null,
}) {
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingVertical: s.padV,
          paddingHorizontal: s.padH,
          opacity: disabled ? 0.55 : 1,
        },
        fullWidth && { alignSelf: "stretch" },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: v.fg, fontSize: s.font, marginLeft: icon ? 6 : 0 }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
  },
  text: { fontWeight: "700" },
});
