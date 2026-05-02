import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Screen, Card, Input, Badge, EmptyState, Select } from "../components/ui";
import { hireRequestsApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function HireRequestsScreen() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await hireRequestsApi.list({ search, status, per_page: 50 });
      const list = res.data?.data?.data || res.data?.data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(() => { setLoading(true); load(); }, 350);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Input label="Search" value={search} onChangeText={setSearch} placeholder="Name, skill…" />
        <Select label="Status" value={status} onValueChange={setStatus} options={STATUS_FILTERS} />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => {
            const st = (item.status || "pending").toLowerCase();
            const tone = st === "approved" ? "success" : st === "rejected" ? "danger" : "warning";
            return (
              <Card>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.requester?.first_name} {item.requester?.last_name}</Text>
                    <Text style={styles.email}>{item.requester?.email}</Text>
                  </View>
                  <Badge tone={tone}>{st}</Badge>
                </View>
                {item.target ? (
                  <Text style={styles.meta}>👤 Target: {item.target?.first_name} {item.target?.last_name}</Text>
                ) : null}
                {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
                {item.budget ? <Text style={styles.meta}>💰 Budget: {item.budget}</Text> : null}
                <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</Text>
              </Card>
            );
          }}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="🤝" title="No hire requests" />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 14, fontWeight: "700", color: colors.text },
  email: { fontSize: 12, color: colors.textMuted },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  message: { fontSize: 13, color: colors.text, marginTop: spacing.sm, lineHeight: 19 },
  date: { fontSize: 10, color: colors.textLight, marginTop: 6 },
});
