import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { Screen, Card, Button, Badge, Modal, Input, EmptyState } from "../components/ui";
import { usersApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const initials = (u) =>
  `${(u.first_name?.[0] || "").toUpperCase()}${(u.last_name?.[0] || "").toUpperCase()}` || "?";

export default function DeletedUsersScreen() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retention, setRetention]   = useState(30);

  // Restore confirm
  const [restoreTarget, setRestoreTarget] = useState(null);

  // Permanent delete confirm
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [confirmText, setConfirmText]     = useState("");
  const [busy, setBusy]                   = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await usersApi.deletedList();
      setUsers(res.data?.data || []);
      if (res.data?.retention_days) setRetention(res.data.retention_days);
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to load deleted users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setBusy(true);
    try {
      await usersApi.restore(restoreTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== restoreTarget.id));
      Alert.alert("Restored", `${restoreTarget.email} has been restored.`);
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to restore user");
    } finally {
      setBusy(false);
      setRestoreTarget(null);
    }
  };

  const handleForceDelete = async () => {
    if (!deleteTarget || confirmText !== "DELETE") return;
    setBusy(true);
    try {
      await usersApi.forceDelete(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      Alert.alert("Deleted", "User permanently deleted.");
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to permanently delete user");
    } finally {
      setBusy(false);
      setDeleteTarget(null);
      setConfirmText("");
    }
  };

  const renderItem = ({ item: u }) => {
    const canDelete = !!u.can_permanently_delete;
    return (
      <Card>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(u)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{u.first_name} {u.last_name}</Text>
            <Text style={styles.email}>{u.email}</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          {u.role ? <Badge tone="info">{u.role}</Badge> : null}
          {canDelete
            ? <Badge tone="danger">Eligible for deletion</Badge>
            : <Badge tone="warning">{u.days_remaining} day{u.days_remaining !== 1 ? "s" : ""} left</Badge>
          }
        </View>

        <Text style={styles.deletedOn}>Deleted: {fmtDate(u.deleted_at)}</Text>

        <View style={styles.actions}>
          <Button
            title="Restore"
            variant="success"
            size="sm"
            style={styles.actionBtn}
            onPress={() => setRestoreTarget(u)}
          />
          <Button
            title="Delete Forever"
            variant="danger"
            size="sm"
            style={styles.actionBtn}
            disabled={!canDelete}
            onPress={() => { setDeleteTarget(u); setConfirmText(""); }}
          />
        </View>
      </Card>
    );
  };

  return (
    <Screen scroll={false}>
      {/* Retention notice */}
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          Deleted accounts are retained for {retention} days. Permanent deletion is irreversible and only available after the retention period.
        </Text>
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="trash" title="No deleted accounts" subtitle="The deleted-users list is empty." />}
        />
      )}

      {/* Restore confirmation */}
      <Modal
        visible={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        title="Restore User"
        footer={
          <>
            <Button title="Cancel" variant="outline" onPress={() => setRestoreTarget(null)} />
            <Button title="Restore" variant="success" disabled={busy} onPress={handleRestore} />
          </>
        }
      >
        <Text style={styles.modalText}>
          Restore account for{" "}
          <Text style={styles.bold}>{restoreTarget?.first_name} {restoreTarget?.last_name}</Text>
          {" "}({restoreTarget?.email})?
        </Text>
      </Modal>

      {/* Permanent delete confirmation */}
      <Modal
        visible={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setConfirmText(""); }}
        title="Permanent Deletion"
        footer={
          <>
            <Button title="Cancel" variant="outline" onPress={() => { setDeleteTarget(null); setConfirmText(""); }} />
            <Button
              title="Delete Forever"
              variant="danger"
              disabled={confirmText !== "DELETE" || busy}
              onPress={handleForceDelete}
            />
          </>
        }
      >
        <Text style={styles.modalText}>
          This will <Text style={styles.danger}>permanently and irreversibly</Text> delete{" "}
          <Text style={styles.bold}>{deleteTarget?.email}</Text> and all associated data.
        </Text>
        <Text style={[styles.modalText, { marginTop: spacing.sm }]}>
          Type <Text style={styles.code}>DELETE</Text> to confirm:
        </Text>
        <Input
          label=""
          placeholder="DELETE"
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
        />
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: "#fffbeb",
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
    padding: spacing.md,
  },
  noticeText: {
    fontSize: 12,
    color: "#92400e",
    lineHeight: 18,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: spacing.xs },
  deletedOn: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm },
  actionBtn: { flex: 1 },
  modalText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  bold: { fontWeight: "700" },
  danger: { fontWeight: "700", color: colors.danger || "#dc2626" },
  code: { fontFamily: "monospace", backgroundColor: "#f3f4f6", color: "#dc2626" },
});
