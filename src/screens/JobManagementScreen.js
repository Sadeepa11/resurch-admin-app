import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from "react-native";
import { Screen, Card, Button, Badge, EmptyState, Select } from "../components/ui";
import { jobsApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

const STATUSES = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function JobManagementScreen() {
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = { page: 1 };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await jobsApi.list(params);
      setJobs(res.data?.data?.data || res.data?.data || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const setStatus = async (job, newStatus) => {
    try {
      await jobsApi.setStatus(job.id, newStatus);
      load();
    } catch {
      Alert.alert("Error", "Status change failed");
    }
  };

  const remove = (job) =>
    Alert.alert("Delete job", `Remove "${job.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await jobsApi.remove(job.id);
            setJobs((prev) => prev.filter((j) => j.id !== job.id));
          } catch {
            Alert.alert("Error", "Delete failed");
          }
        },
      },
    ]);

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Select label="Status filter" value={statusFilter} onValueChange={setStatusFilter} options={STATUSES} />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => String(j.id)}
          renderItem={({ item }) => {
            const status = (item.status || "pending").toLowerCase();
            const tone = status === "approved" ? "success" : status === "rejected" ? "danger" : "warning";
            return (
              <Card>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.company}>{item.company_name || item.company || ""}</Text>
                  </View>
                  <Badge tone={tone}>{status}</Badge>
                </View>
                {item.location ? <Text style={styles.meta}>📍 {item.location}</Text> : null}
                {item.salary ? <Text style={styles.meta}>💰 {item.salary}</Text> : null}
                <View style={styles.actions}>
                  {status === "pending" && (
                    <>
                      <Button title="Approve" variant="success" size="sm" onPress={() => setStatus(item, "approved")} />
                      <Button title="Reject" variant="danger" size="sm" onPress={() => setStatus(item, "rejected")} />
                    </>
                  )}
                  <Button title="Delete" variant="outline" size="sm" onPress={() => remove(item)} />
                </View>
              </Card>
            );
          }}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="💼" title="No jobs" />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 14, fontWeight: "700", color: colors.text },
  company: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
});
