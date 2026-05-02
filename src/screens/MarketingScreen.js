import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Screen, Card, Badge, EmptyState, StatCardRow } from "../components/ui";
import { advertisementsApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

export default function MarketingScreen() {
  const [ads, setAds] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [adRes, anRes] = await Promise.all([
        advertisementsApi.list(),
        advertisementsApi.analytics().catch(() => null),
      ]);
      setAds(adRes.data?.data || []);
      if (anRes) setAnalytics(anRes.data?.data || anRes.data);
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
        { label: "Total Ads", value: analytics.total_ads || ads.length },
        { label: "Active", value: analytics.active || 0, color: colors.success },
        { label: "Pending", value: analytics.pending || 0, color: colors.warning },
        { label: "Revenue", value: `$${analytics.revenue || 0}`, color: colors.primary },
      ]
    : [
        { label: "Total Ads", value: ads.length },
        { label: "Active", value: ads.filter((a) => a.status === "approved").length, color: colors.success },
      ];

  return (
    <Screen scroll={false}>
      <FlatList
        data={ads}
        keyExtractor={(a) => String(a.id)}
        ListHeaderComponent={
          <View style={{ padding: spacing.md }}>
            <Text style={styles.title}>📢 Marketing Overview</Text>
            <StatCardRow items={stats} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.md }}>
            <Card>
              <Text style={styles.adTitle} numberOfLines={2}>{item.title || `Ad #${item.id}`}</Text>
              <Text style={styles.sub} numberOfLines={2}>{item.description || ""}</Text>
              <View style={styles.row}>
                <Badge tone={item.status === "approved" ? "success" : item.status === "pending" ? "warning" : "danger"}>
                  {item.status || "pending"}
                </Badge>
                <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</Text>
              </View>
            </Card>
          </View>
        )}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); load(); }}
        ListEmptyComponent={loading ? <EmptyState loading /> : <EmptyState icon="📢" title="No marketing data" />}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  adTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm, alignItems: "center" },
  date: { fontSize: 11, color: colors.textLight },
});
