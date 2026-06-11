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

      const list = Array.isArray(res.data) ? res.data : (res.data?.data?.data || res.data?.data || []);
      // Filter out admins/superadmins to only show regular users (General User, Investor, Both, Marketing, etc. if required)
      const regularUsers = list.filter((u) => {
        const role = (u.role || "").toLowerCase();
        return role !== "admin" && role !== "superadmin";
      });
      setUsers(regularUsers);
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
      await usersApi.toggleStatus(u.id);
      load();
      Alert.alert("Success", `${u.first_name || "User"} has been unblocked.`);
    } catch {
      Alert.alert("Error", "Could not unblock");
    }
  };

  const handleBlockPress = (u) => {
    setTarget(u);
    setReason("");
    setShowBlock(true);
  };

  const submitBlock = async () => {
    try {
      // Toggle to Inactive
      await usersApi.toggleStatus(target.id);
      if (reason.trim()) {
        try {
          await usersApi.blockReason({ user_id: target.id, reason });
        } catch (error) {
          console.warn("Block reason endpoint failed or not implemented on backend:", error);
        }
      }
      setShowBlock(false);
      setReason("");
      setTarget(null);
      load();
      Alert.alert("Success", "User has been blocked.");
    } catch (e) {
      Alert.alert("Error", "Could not block");
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Input label="Search users" placeholder="Search by name, email..." value={search} onChangeText={setSearch} />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          renderItem={({ item }) => {
            const isBlocked = (item.status || "Active").toLowerCase() === "inactive";
            return (
              <Card>
                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <View style={styles.row}>
                  <Badge tone={isBlocked ? "danger" : "success"}>
                    {isBlocked ? "Blocked" : "Active"}
                  </Badge>
                  {item.role ? <Badge tone="info">{item.role}</Badge> : null}
                </View>
                {isBlocked ? (
                  <Button title="Unblock" variant="success" size="sm" onPress={() => unblock(item)} style={{ marginTop: spacing.sm }} />
                ) : (
                  <Button title="Block" variant="danger" size="sm" onPress={() => handleBlockPress(item)} style={{ marginTop: spacing.sm }} />
                )}
              </Card>
            );
          }}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="users" title="No users found" />}
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
          Provide a reason for blocking {target?.first_name} {target?.last_name} ({target?.email}):
        </Text>
        <Input label="Block Reason" placeholder="e.g. Terms of service violation..." value={reason} onChangeText={setReason} multiline />
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
