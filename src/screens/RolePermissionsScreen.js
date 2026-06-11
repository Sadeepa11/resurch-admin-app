import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Screen, Card, Button, Badge } from "../components/ui";
import { colors, spacing } from "../theme/colors";

const STORAGE_KEY = "rh_role_permissions";

const PERMISSION_ITEMS = [
  { id: "dashboard", label: "Dashboard", group: "General" },
  { id: "all_users", label: "All Users", group: "User Management" },
  { id: "admin_users", label: "Admin Users", group: "User Management" },
  { id: "blocked_users", label: "Blocked Users", group: "User Management" },
  { id: "student_verification", label: "Student Verification", group: "User Management" },
  { id: "video_validation", label: "Video Validation", group: "Innovation & Research" },
  { id: "video_upload_payments", label: "Video Upload Payments", group: "Innovation & Research" },
  { id: "research_papers", label: "Research Papers", group: "Innovation & Research" },
  { id: "innovation_review", label: "Innovation Review", group: "Innovation & Research" },
  { id: "research_review", label: "Research Review", group: "Innovation & Research" },
  { id: "leaderboard", label: "Leaderboard", group: "Innovation & Research" },
  { id: "remove_content", label: "Remove Content", group: "Innovation & Research" },
  { id: "marketing", label: "Marketing", group: "Innovation & Research" },
  { id: "hub_cards", label: "Hub Cards", group: "Site Management" },
  { id: "job_management", label: "Job Management", group: "Site Management" },
  { id: "post_job", label: "Post New Job", group: "Site Management" },
  { id: "community_management", label: "Community Posts", group: "Community" },
  { id: "investor_zone_management", label: "Investor Zone", group: "Community" },
  { id: "hire_requests", label: "Hire Requests", group: "Community" },
  { id: "advertisements", label: "Advertisements", group: "Commerce" },
  { id: "membership_management", label: "Memberships", group: "Commerce" },
  { id: "payments", label: "Payments & Revenue", group: "Finance" },
  { id: "transaction_analytics", label: "Transaction Analytics", group: "Finance" },
  { id: "audit_logs", label: "Audit Logs", group: "System" },
];

const GROUPS = Array.from(new Set(PERMISSION_ITEMS.map((i) => i.group)));

const ROLES = [
  { key: "manager", label: "Manager" },
  { key: "marketing", label: "Marketing" },
  { key: "admin", label: "Admin" },
];

const DEFAULT_PERMISSIONS = {
  manager: {
    dashboard: true, all_users: true, blocked_users: true, student_verification: true,
    video_validation: true, video_upload_payments: true, research_papers: true,
    innovation_review: true, research_review: true, leaderboard: true,
    hub_cards: true, job_management: true, post_job: true,
    community_management: true, investor_zone_management: true, hire_requests: true,
    advertisements: true, payments: true, transaction_analytics: true,
  },
  marketing: { dashboard: true, marketing: true, advertisements: true },
  admin: {
    dashboard: true, all_users: true, blocked_users: true, student_verification: true,
    video_validation: true, research_papers: true, innovation_review: true,
    research_review: true, leaderboard: true,
    hub_cards: true, job_management: true, post_job: true,
    community_management: true, hire_requests: true,
    advertisements: true, payments: true, transaction_analytics: true, audit_logs: true,
  },
};

export default function RolePermissionsScreen() {
  const [activeRole, setActiveRole] = useState("manager");
  const [perms, setPerms] = useState(DEFAULT_PERMISSIONS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPerms({ ...DEFAULT_PERMISSIONS, ...JSON.parse(raw) });
      })
      .catch(() => {});
  }, []);

  const toggle = (id) => {
    setPerms((p) => ({
      ...p,
      [activeRole]: { ...(p[activeRole] || {}), [id]: !(p[activeRole] || {})[id] },
    }));
  };

  const save = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(perms));
      Alert.alert("Saved", "Permissions saved locally.");
    } catch {
      Alert.alert("Error", "Save failed");
    }
  };

  const reset = () => {
    Alert.alert("Reset", "Reset to defaults?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => setPerms(DEFAULT_PERMISSIONS),
      },
    ]);
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.heading}>🔑 Role Permissions</Text>
        <Text style={styles.note}>
          Configure menu access per role. Saved locally on the device.
        </Text>

        <View style={styles.roleTabs}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setActiveRole(r.key)}
              style={[styles.roleTab, activeRole === r.key && styles.roleTabActive]}
            >
              <Text style={[styles.roleTabText, activeRole === r.key && styles.roleTabTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {GROUPS.map((g) => (
        <Card key={g}>
          <Text style={styles.groupTitle}>{g}</Text>
          {PERMISSION_ITEMS.filter((i) => i.group === g).map((item) => {
            const value = !!(perms[activeRole] || {})[item.id];
            return (
              <View key={item.id} style={styles.permRow}>
                <Text style={styles.permLabel}>{item.label}</Text>
                <Switch
                  value={value}
                  onValueChange={() => toggle(item.id)}
                  thumbColor={value ? colors.primary : "#fff"}
                  trackColor={{ false: "#e5e7eb", true: colors.primaryLight }}
                />
              </View>
            );
          })}
        </Card>
      ))}

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Button title="Reset Defaults" variant="outline" onPress={reset} style={{ flex: 1 }} />
        <Button title="Save" onPress={save} style={{ flex: 1 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 16, fontWeight: "800", color: colors.text },
  note: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: spacing.md },
  roleTabs: { flexDirection: "row", gap: 6 },
  roleTab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: "center", borderWidth: 1, borderColor: colors.border,
  },
  roleTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleTabText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  roleTabTextActive: { color: "#fff" },
  groupTitle: { fontSize: 13, fontWeight: "800", color: colors.text, marginBottom: spacing.sm, textTransform: "uppercase" },
  permRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  permLabel: { fontSize: 13, color: colors.text, flex: 1 },
});
