import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { Screen, Card, Badge, EmptyState } from "../components/ui";
import { auditLogsApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

const ACTION_TONES = {
  create: "success",
  update: "info",
  delete: "danger",
  login: "purple",
  logout: "neutral",
  block: "warning",
  unblock: "success",
};

export default function AuditLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (p = 1, replace = true) => {
    setError("");
    try {
      const res = await auditLogsApi.list(p);
      const data = res.data?.data;
      const items = data?.data || (Array.isArray(data) ? data : []);
      setHasMore(data?.last_page ? p < data.last_page : false);
      setLogs((prev) => (replace ? items : [...prev, ...items]));
    } catch (e) {
      setError("Failed to load audit logs. Pull down to retry.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(1, true); }, [load]);

  const onEnd = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    load(next, false);
  };

  return (
    <Screen scroll={false}>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load(1, true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(l, i) => String(l.id || i)}
          renderItem={({ item }) => {
            const action = (item.action || "").toLowerCase();
            const tone = ACTION_TONES[action] || "neutral";
            return (
              <Card>
                <View style={styles.row}>
                  <Badge tone={tone}>{action || "event"}</Badge>
                  <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</Text>
                </View>
                <Text style={styles.title}>{item.description || item.title || "Action"}</Text>
                {item.user ? (
                  <Text style={styles.sub}>👤 {item.user?.first_name} {item.user?.last_name} ({item.user?.email})</Text>
                ) : null}
                {item.ip_address ? <Text style={styles.sub}>🌐 {item.ip_address}</Text> : null}
                {item.user_agent ? <Text style={styles.sub} numberOfLines={1}>🖥 {item.user_agent}</Text> : null}
              </Card>
            );
          }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            setPage(1);
            load(1, true);
          }}
          contentContainerStyle={{ padding: spacing.md }}
          onEndReached={onEnd}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: 16 }} /> : null}
          ListEmptyComponent={<EmptyState icon="🔒" title="No audit logs" />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 13, fontWeight: "700", color: colors.text },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  date: { fontSize: 10, color: colors.textLight },
  errorBox: { margin: spacing.md, padding: spacing.sm, backgroundColor: "#fee2e2", borderRadius: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorText: { fontSize: 13, color: "#991b1b", flex: 1 },
  retryText: { fontSize: 13, fontWeight: "700", color: "#dc2626", marginLeft: 8 },
});
