import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { Screen, Card, Button, Input, Badge, Modal, EmptyState, Select } from "../components/ui";
import { usersApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

const ADMIN_ROLES = ["Admin", "SuperAdmin", "Super Admin", "Manager", "Marketing"];

function AdminCard({ admin, onToggle, onEdit, onDelete }) {
  const status = (admin.status || "Active").toLowerCase();
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(admin.first_name || "?")[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{admin.first_name} {admin.last_name}</Text>
          <Text style={styles.email}>{admin.email}</Text>
          <View style={styles.tagRow}>
            <Badge tone="purple">{admin.role}</Badge>
            <Badge tone={status === "active" ? "success" : "danger"}>{admin.status}</Badge>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Button title="Edit" variant="outline" size="sm" onPress={() => onEdit(admin)} />
        <Button
          title={status === "active" ? "Deactivate" : "Activate"}
          variant={status === "active" ? "warning" : "success"}
          size="sm"
          onPress={() => onToggle(admin)}
        />
        <Button title="Delete" variant="danger" size="sm" onPress={() => onDelete(admin)} />
      </View>
    </Card>
  );
}

function FormModal({ visible, onClose, onSave, admin }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", role: "Admin", password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (admin) {
      setForm({
        first_name: admin.first_name || "",
        last_name: admin.last_name || "",
        email: admin.email || "",
        role: admin.role || "Admin",
        password: "",
      });
    } else {
      setForm({ first_name: "", last_name: "", email: "", role: "Admin", password: "" });
    }
  }, [admin, visible]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={admin ? "Edit Admin" : "New Admin"}
      footer={
        <>
          <Button title="Cancel" variant="outline" onPress={onClose} />
          <Button title="Save" onPress={submit} loading={saving} />
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
          { label: "Admin", value: "Admin" },
          { label: "Manager", value: "Manager" },
          { label: "Marketing", value: "Marketing" },
        ]}
      />
      <Input
        label={admin ? "Password (optional)" : "Password"}
        value={form.password}
        onChangeText={(v) => setForm({ ...form, password: v })}
        secureTextEntry
      />
    </Modal>
  );
}

export default function AdminManagementScreen() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await usersApi.list({ search, per_page: 100 });
      const list = res.data?.data?.data || res.data?.data || [];
      setAdmins(list.filter((u) => ADMIN_ROLES.includes(u.role)));
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      load();
    }, 350);
    return () => clearTimeout(t);
  }, [load]);

  const onToggle = async (a) => {
    try {
      await usersApi.toggleStatus(a.id);
      load();
    } catch {
      Alert.alert("Error", "Failed");
    }
  };

  const onDelete = (a) =>
    Alert.alert("Delete admin", `Remove ${a.email}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await usersApi.remove(a.id);
            setAdmins((prev) => prev.filter((u) => u.id !== a.id));
          } catch {
            Alert.alert("Error", "Delete failed");
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
        <Input label="Search admins" value={search} onChangeText={setSearch} placeholder="Name or email" />
        <Button title="+ New Admin" fullWidth onPress={() => { setEditing(null); setShowForm(true); }} />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(u) => String(u.id)}
          renderItem={({ item }) => (
            <AdminCard
              admin={item}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={(u) => { setEditing(u); setShowForm(true); }}
            />
          )}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState title="No admins" />}
        />
      )}

      <FormModal visible={showForm} onClose={() => setShowForm(false)} onSave={onSave} admin={editing} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: "row" },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.purpleLight,
    alignItems: "center", justifyContent: "center", marginRight: spacing.sm,
  },
  avatarText: { color: colors.purple, fontWeight: "800", fontSize: 16 },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tagRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  actions: {
    flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
});
