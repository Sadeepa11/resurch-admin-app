import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from "react-native";
import { Screen, Card, Button, Input, Badge, Modal, EmptyState, StatCardRow } from "../components/ui";
import { paymentsApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

const TABS = [
  { key: "orders", label: "Orders" },
  { key: "ads", label: "Ad Payments" },
  { key: "payouts", label: "Payouts" },
  { key: "overdue", label: "Overdue" },
];

export default function PaymentsRevenueScreen() {
  const [tab, setTab] = useState("orders");
  const [overview, setOverview] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noteModal, setNoteModal] = useState({ open: false, orderId: null });
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    paymentsApi.overview().then((res) => setOverview(res.data?.data || res.data)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (tab === "orders") res = await paymentsApi.orders({ per_page: 30 });
      else if (tab === "ads") res = await paymentsApi.ads({ per_page: 30 });
      else if (tab === "payouts") res = await paymentsApi.payouts({ per_page: 30 });
      else res = await paymentsApi.overdue(1);
      const data = res.data?.data?.data || res.data?.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const markPayout = async () => {
    try {
      await paymentsApi.markPayout(noteModal.orderId, noteText);
      setNoteModal({ open: false, orderId: null });
      setNoteText("");
      load();
    } catch {
      Alert.alert("Error", "Could not mark payout");
    }
  };

  const stats = overview
    ? [
        { label: "Revenue", value: `${overview.currency || "$"}${overview.total_revenue || 0}`, color: colors.primary },
        { label: "MRR", value: `${overview.currency || "$"}${overview.mrr || 0}`, color: colors.success },
        { label: "Orders", value: overview.total_orders || 0 },
        { label: "Pending Payouts", value: overview.pending_payouts || 0, color: colors.warning },
      ]
    : null;

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        {stats ? <StatCardRow items={stats} /> : null}
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, tab === t.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, i) => String(it.id || i)}
          renderItem={({ item }) => {
            const status = (item.status || "").toLowerCase();
            const tone = status === "paid" || status === "completed" ? "success" : status === "pending" ? "warning" : status === "failed" ? "danger" : "info";
            return (
              <Card>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>
                      Order #{item.order_id || item.id}
                    </Text>
                    {item.user || item.buyer ? (
                      <Text style={styles.sub}>{item.user?.email || item.buyer?.email}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.amount}>
                    {item.currency || "$"} {item.amount || item.total || 0}
                  </Text>
                </View>
                {item.product?.title || item.title ? (
                  <Text style={styles.product} numberOfLines={1}>
                    🛒 {item.product?.title || item.title}
                  </Text>
                ) : null}
                <View style={styles.metaRow}>
                  <Badge tone={tone}>{status || "n/a"}</Badge>
                  {item.payment_method ? <Badge tone="info">{item.payment_method}</Badge> : null}
                  <Text style={styles.date}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                  </Text>
                </View>
                {tab === "payouts" && status !== "paid" ? (
                  <Button
                    title="Mark Paid"
                    variant="success"
                    size="sm"
                    onPress={() => {
                      setNoteText(item.payout_notes || "");
                      setNoteModal({ open: true, orderId: item.order_id || item.id });
                    }}
                    style={{ marginTop: spacing.sm }}
                  />
                ) : null}
              </Card>
            );
          }}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="💰" title="No records" />}
        />
      )}

      <Modal
        visible={noteModal.open}
        onClose={() => setNoteModal({ open: false, orderId: null })}
        title="Mark Payout Paid"
        footer={
          <>
            <Button title="Cancel" variant="outline" onPress={() => setNoteModal({ open: false, orderId: null })} />
            <Button title="Mark Paid" variant="success" onPress={markPayout} />
          </>
        }
      >
        <Input label="Payout Notes" value={noteText} onChangeText={setNoteText} multiline />
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  tabs: { flexDirection: "row", gap: 6, marginTop: spacing.sm, flexWrap: "wrap" },
  tab: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff",
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 11, fontWeight: "700", color: colors.textMuted },
  tabTextActive: { color: "#fff" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 13, fontWeight: "700", color: colors.text },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: "800", color: colors.success },
  product: { fontSize: 12, color: colors.text, marginTop: 6 },
  metaRow: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: spacing.sm },
  date: { fontSize: 10, color: colors.textLight, marginLeft: "auto" },
});
