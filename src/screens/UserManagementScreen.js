import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Button, Input, Badge, Modal, EmptyState, Select } from "../components/ui";
import { usersApi } from "../api/endpoints";
import { colors, spacing, radius } from "../theme/colors";

const ROLES = [
  { label: "All Roles", value: "" },
  { label: "User", value: "User" },
  { label: "Manager", value: "Manager" },
  { label: "Admin", value: "Admin" },
  { label: "Super Admin", value: "SuperAdmin" },
];

const STATUSES = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Pending", value: "Pending" },
];

function UserCard({ user, onToggle, onEdit, onDelete }) {
  const status = (user.status || "Active").toLowerCase();
  const tone = status === "active" ? "success" : status === "pending" ? "warning" : "danger";
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.first_name || user.email || "?")[0]?.toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.tagRow}>
            <Badge tone="info">{user.role || "User"}</Badge>
            <Badge tone={tone}>{user.status || "Active"}</Badge>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Button title="Edit" variant="outline" size="sm" onPress={() => onEdit(user)} />
        <Button
          title={status === "active" ? "Deactivate" : "Activate"}
          variant={status === "active" ? "warning" : "success"}
          size="sm"
          onPress={() => onToggle(user)}
        />
        <Button title="Delete" variant="danger" size="sm" onPress={() => onDelete(user)} />
      </View>
    </Card>
  );
}

function UserFormModal({ visible, onClose, onSave, user }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "User",
    password: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        role: user.role || "User",
        password: "",
      });
    } else {
      setForm({ first_name: "", last_name: "", email: "", role: "User", password: "" });
    }
  }, [user, visible]);

  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={user ? "Edit User" : "Add User"}
      footer={
        <>
          <Button title="Cancel" variant="outline" onPress={onClose} />
          <Button title={user ? "Save" : "Create"} onPress={submit} loading={saving} />
        </>
      }
    >
      <Input label="First name" value={form.first_name} onChangeText={(v) => setForm({ ...form, first_name: v })} autoCapitalize="words" />
      <Input label="Last name" value={form.last_name} onChangeText={(v) => setForm({ ...form, last_name: v })} autoCapitalize="words" />
      <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />
      <Select
        label="Role"
        value={form.role}
        onValueChange={(v) => setForm({ ...form, role: v })}
        options={[
          { label: "User", value: "User" },
          { label: "Manager", value: "Manager" },
          { label: "Marketing", value: "Marketing" },
          { label: "Admin", value: "Admin" },
        ]}
      />
      <Input
        label={user ? "Password (leave blank to keep)" : "Password"}
        value={form.password}
        onChangeText={(v) => setForm({ ...form, password: v })}
        secureTextEntry
      />
    </Modal>
  );
}

export default function UserManagementScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await usersApi.list({ search, role, status, per_page: 50 });
      const list = res.data?.data?.data || res.data?.data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, role, status]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      load();
    }, 350);
    return () => clearTimeout(t);
  }, [load]);

  const onToggle = async (user) => {
    try {
      await usersApi.toggleStatus(user.id);
      load();
    } catch (e) {
      Alert.alert("Error", "Could not change status.");
    }
  };

  const onDelete = (user) =>
    Alert.alert("Delete user", `Permanently remove ${user.email}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await usersApi.remove(user.id);
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
          } catch {
            Alert.alert("Error", "Delete failed.");
          }
        },
      },
    ]);

  const onSave = async (form) => {
    if (editing) {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await usersApi.update(editing.id, payload);
    } else {
      await usersApi.create(form);
    }
    load();
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Input
          label="Search"
          placeholder="Name, email…"
          value={search}
          onChangeText={setSearch}
        />
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Select label="Role" value={role} onValueChange={setRole} options={ROLES} />
          </View>
          <View style={{ flex: 1 }}>
            <Select label="Status" value={status} onValueChange={setStatus} options={STATUSES} />
          </View>
        </View>
        <Button
          title="+ Add User"
          fullWidth
          onPress={() => {
            setEditing(null);
            setShowForm(true);
          }}
        />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={(u) => {
                setEditing(u);
                setShowForm(true);
              }}
            />
          )}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListEmptyComponent={<EmptyState title="No users" />}
        />
      )}

      <UserFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={onSave}
        user={editing}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: "row" },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center", marginRight: spacing.sm,
  },
  avatarText: { color: colors.primary, fontWeight: "800", fontSize: 16 },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tagRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  actions: {
    flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
});
