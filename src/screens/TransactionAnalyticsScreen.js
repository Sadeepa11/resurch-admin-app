import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Screen, Card, Badge, EmptyState, StatCardRow } from "../components/ui";
import { transactionsApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

export default function TransactionAnalyticsScreen() {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [an, or] = await Promise.all([
        transactionsApi.analytics().catch(() => null),
        transactionsApi.orders({ per_page: 30 }),
      ]);
      if (an) setAnalytics(an.data?.data || an.data);
      setOrders(or.data?.data?.data || or.data?.data || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = analytics
    ? [
        { label: "Total Volume", value: `${analytics.currency || "$"}${analytics.total_volume || 0}`, color: colors.primary },
        { label: "Avg Order", value: `${analytics.currency || "$"}${analytics.avg_order_value || 0}`, color: colors.info },
        { label: "Success Rate", value: `${analytics.success_rate || 0}%`, color: colors.success },
        { label: "Refunds", value: analytics.total_refunds || 0, color: colors.warning },
      ]
    : null;

  return (
    <Screen scroll={false}>
      <FlatList
        data={orders}
        keyExtractor={(o, i) => String(o.id || i)}
        ListHeaderComponent={
          <View style={{ padding: spacing.md }}>
            <Text style={styles.heading}>📈 Transaction Analytics</Text>
            {stats ? <StatCardRow items={stats} /> : null}
            <Text style={styles.sub}>Recent Transactions</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = (item.status || "").toLowerCase();
          const tone = status === "completed" || status === "paid" ? "success" : status === "pending" ? "warning" : "danger";
          return (
            <View style={{ paddingHorizontal: spacing.md }}>
              <Card>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>#{item.order_id || item.id}</Text>
                    <Text style={styles.sub2}>{item.user?.email || "—"}</Text>
                  </View>
                  <Text style={styles.amount}>
                    {item.currency || "$"} {item.amount || item.total || 0}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Badge tone={tone}>{status || "n/a"}</Badge>
                  <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</Text>
                </View>
              </Card>
            </View>
          );
        }}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); load(); }}
        ListEmptyComponent={loading ? <EmptyState loading /> : <EmptyState icon="📊" title="No transactions" />}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  sub: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginTop: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 13, fontWeight: "700", color: colors.text },
  sub2: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: "800", color: colors.success },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  date: { fontSize: 10, color: colors.textLight },
});
