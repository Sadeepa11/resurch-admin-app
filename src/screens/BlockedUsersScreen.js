import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { Screen, Card, Button, Input, Badge, Modal, EmptyState } from "../components/ui";
import { usersApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

export default function BlockedUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [showBlock, setShowBlock] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await usersApi.list({ search, per_page: 100 });
      const list = res.data?.data?.data || res.data?.data || [];
      const blocked = list.filter((u) => (u.status || "").toLowerCase() === "inactive");
      setUsers(blocked);
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

  const unblock = async (u) => {
    try {
      await usersApi.setStatus(u.id, "Active");
      load();
    } catch {
      Alert.alert("Error", "Could not unblock");
    }
  };

  const submitBlock = async () => {
    try {
      await usersApi.setStatus(target.id, "Inactive");
      if (reason.trim()) {
        await usersApi.blockReason({ user_id: target.id, reason });
      }
      setShowBlock(false);
      setReason("");
      setTarget(null);
      load();
    } catch {
      Alert.alert("Error", "Could not block");
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Input label="Search blocked users" value={search} onChangeText={setSearch} />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <View style={styles.row}>
                <Badge tone="danger">Blocked</Badge>
                {item.role ? <Badge tone="info">{item.role}</Badge> : null}
              </View>
              <Button title="Unblock" variant="success" size="sm" onPress={() => unblock(item)} style={{ marginTop: spacing.sm }} />
            </Card>
          )}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="🚫" title="No blocked users" subtitle="All users are currently active." />}
        />
      )}

      <Modal
        visible={showBlock}
        onClose={() => setShowBlock(false)}
        title="Block User"
        footer={
          <>
            <Button title="Cancel" variant="outline" onPress={() => setShowBlock(false)} />
            <Button title="Block" variant="danger" onPress={submitBlock} />
          </>
        }
      >
        <Text style={{ color: colors.text, marginBottom: spacing.sm }}>
          Block {target?.email}?
        </Text>
        <Input label="Reason (optional)" value={reason} onChangeText={setReason} multiline />
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: "row", gap: 6, marginTop: 6 },
});
