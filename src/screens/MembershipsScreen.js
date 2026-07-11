import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { Screen, Card, Button, Input, Badge, Modal, EmptyState, StatCardRow } from "../components/ui";
import { membershipsApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

export default function MembershipsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricing, setPricing] = useState({ bronze_to_silver: "", silver_to_gold: "", bronze_to_gold: "" });
  const [summary, setSummary] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [listRes, prRes] = await Promise.all([
        membershipsApi.list({ per_page: 50 }),
        membershipsApi.pricing().catch(() => null),
      ]);
      
      console.log("Memberships List API Response:", JSON.stringify(listRes.data, null, 2));
      if (prRes) console.log("Memberships Pricing API Response:", JSON.stringify(prRes.data, null, 2));
      
      setItems(listRes.data?.data?.data || listRes.data?.data || []);
      setSummary(listRes.data?.summary || null);
      
      if (prRes) {
        const p = prRes.data?.data || prRes.data || {};
        setPricing({
          bronze_to_silver: String(p.bronze_to_silver || ""),
          silver_to_gold: String(p.silver_to_gold || ""),
          bronze_to_gold: String(p.bronze_to_gold || ""),
        });
      }
    } catch (e) {
      console.warn("Memberships fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const savePricing = async () => {
    setSaving(true);
    try {
      await membershipsApi.updatePricing({
        bronze_to_silver: parseFloat(pricing.bronze_to_silver) || 0,
        silver_to_gold: parseFloat(pricing.silver_to_gold) || 0,
        bronze_to_gold: parseFloat(pricing.bronze_to_gold) || 0,
      });
      setPricingOpen(false);
      Alert.alert("Saved", "Membership pricing updated.");
    } catch {
      Alert.alert("Error", "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const stats = summary
    ? [
        { label: "Total", value: summary.total },
        { label: "Paid", value: summary.paid, color: colors.success },
        { label: "Revenue", value: `$${summary.revenue}`, color: colors.primary },
      ]
    : [
        { label: "Members", value: items.length },
        { label: "Active", value: items.filter((m) => (m.status || "").toLowerCase() === "active").length, color: colors.success },
        { label: "Expired", value: items.filter((m) => (m.status || "").toLowerCase() === "expired").length, color: colors.danger },
      ];

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.heading}>Memberships</Text>
        <Button title="💰 Pricing" variant="outline" size="sm" onPress={() => setPricingOpen(true)} />
      </View>

      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <StatCardRow items={stats} />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => {
            const st = (item.status || "active").toLowerCase();
            const tone = st === "active" ? "success" : st === "expired" ? "danger" : "warning";
            return (
              <Card>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.user?.first_name} {item.user?.last_name}</Text>
                    <Text style={styles.email}>{item.user?.email}</Text>
                  </View>
                  <Badge tone={tone}>{st}</Badge>
                </View>
                <View style={styles.metaRow}>
                  <Badge tone="purple">{item.plan || "basic"}</Badge>
                  {item.amount ? <Badge tone="success">${item.amount}</Badge> : null}
                </View>
                {item.expires_at ? (
                  <Text style={styles.date}>Expires: {new Date(item.expires_at).toLocaleDateString()}</Text>
                ) : null}
              </Card>
            );
          }}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="🏅" title="No memberships" />}
        />
      )}

      <Modal
        visible={pricingOpen}
        onClose={() => setPricingOpen(false)}
        title="Membership Pricing"
        footer={
          <>
            <Button title="Cancel" variant="outline" onPress={() => setPricingOpen(false)} />
            <Button title="Save" onPress={savePricing} loading={saving} />
          </>
        }
      >
        <Input label="Bronze to Silver" value={pricing.bronze_to_silver} onChangeText={(v) => setPricing({ ...pricing, bronze_to_silver: v })} keyboardType="decimal-pad" />
        <Input label="Silver to Gold" value={pricing.silver_to_gold} onChangeText={(v) => setPricing({ ...pricing, silver_to_gold: v })} keyboardType="decimal-pad" />
        <Input label="Bronze to Gold" value={pricing.bronze_to_gold} onChangeText={(v) => setPricing({ ...pricing, bronze_to_gold: v })} keyboardType="decimal-pad" />
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  heading: { fontSize: 16, fontWeight: "800", color: colors.text },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: 6, marginTop: spacing.sm },
  date: { fontSize: 11, color: colors.textLight, marginTop: 6 },
});
