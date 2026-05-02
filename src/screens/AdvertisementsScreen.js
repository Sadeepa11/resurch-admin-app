import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Image } from "react-native";
import { Screen, Card, Button, Input, Badge, Modal, EmptyState, StatCardRow } from "../components/ui";
import { advertisementsApi } from "../api/endpoints";
import { colors, spacing, radius } from "../theme/colors";

export default function AdvertisementsScreen() {
  const [ads, setAds] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("all");

  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricing, setPricing] = useState({ home: "", banner: "", sidebar: "" });
  const [savingPricing, setSavingPricing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [adRes, anRes, prRes] = await Promise.all([
        advertisementsApi.list(),
        advertisementsApi.analytics().catch(() => null),
        advertisementsApi.pricing().catch(() => null),
      ]);
      setAds(adRes.data?.data || []);
      if (anRes) setAnalytics(anRes.data?.data || anRes.data);
      if (prRes) {
        const p = prRes.data?.data || prRes.data || {};
        setPricing({
          home: String(p.home || ""),
          banner: String(p.banner || ""),
          sidebar: String(p.sidebar || ""),
        });
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    try { await advertisementsApi.approve(id); load(); } catch { Alert.alert("Error", "Approve failed"); }
  };
  const reject = async (id) => {
    try { await advertisementsApi.reject(id); load(); } catch { Alert.alert("Error", "Reject failed"); }
  };
  const remove = (id) =>
    Alert.alert("Delete ad", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try { await advertisementsApi.remove(id); load(); } catch { Alert.alert("Error", "Delete failed"); }
        },
      },
    ]);

  const savePricing = async () => {
    setSavingPricing(true);
    try {
      await advertisementsApi.updatePricing({
        home: parseFloat(pricing.home) || 0,
        banner: parseFloat(pricing.banner) || 0,
        sidebar: parseFloat(pricing.sidebar) || 0,
      });
      setPricingOpen(false);
      Alert.alert("Saved", "Pricing updated.");
    } catch {
      Alert.alert("Error", "Save failed");
    } finally {
      setSavingPricing(false);
    }
  };

  const filtered = ads.filter((a) => {
    if (tab === "all") return true;
    return (a.status || "").toLowerCase() === tab;
  });

  const stats = [
    { label: "Total Ads", value: ads.length },
    { label: "Active", value: ads.filter((a) => a.status === "approved").length, color: colors.success },
    { label: "Pending", value: ads.filter((a) => a.status === "pending").length, color: colors.warning },
    { label: "Rejected", value: ads.filter((a) => a.status === "rejected").length, color: colors.danger },
  ];

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.heading}>Advertisements</Text>
        <Button title="💰 Update Pricing" variant="outline" size="sm" onPress={() => setPricingOpen(true)} />
      </View>

      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <StatCardRow items={stats} />
        <View style={styles.tabs}>
          {["all", "pending", "approved", "rejected"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => String(a.id)}
          renderItem={({ item }) => {
            const s = (item.status || "pending").toLowerCase();
            const tone = s === "approved" ? "success" : s === "rejected" ? "danger" : "warning";
            return (
              <Card>
                <View style={styles.row}>
                  {item.image_url || item.image ? (
                    <Image source={{ uri: item.image_url || item.image }} style={styles.thumb} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={2}>{item.title || `Ad #${item.id}`}</Text>
                    <Text style={styles.sub} numberOfLines={2}>{item.description || ""}</Text>
                    <View style={styles.metaRow}>
                      <Badge tone={tone}>{s}</Badge>
                      {item.type ? <Badge tone="info">{item.type}</Badge> : null}
                    </View>
                  </View>
                </View>
                <View style={styles.actions}>
                  {s === "pending" && (
                    <>
                      <Button title="Approve" variant="success" size="sm" onPress={() => approve(item.id)} />
                      <Button title="Reject" variant="danger" size="sm" onPress={() => reject(item.id)} />
                    </>
                  )}
                  <Button title="Delete" variant="outline" size="sm" onPress={() => remove(item.id)} />
                </View>
              </Card>
            );
          }}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="📢" title="No ads" />}
        />
      )}

      <Modal
        visible={pricingOpen}
        onClose={() => setPricingOpen(false)}
        title="Ad Pricing"
        footer={
          <>
            <Button title="Cancel" variant="outline" onPress={() => setPricingOpen(false)} />
            <Button title="Save" onPress={savePricing} loading={savingPricing} />
          </>
        }
      >
        <Input label="Home Page Price" value={pricing.home} onChangeText={(v) => setPricing({ ...pricing, home: v })} keyboardType="decimal-pad" />
        <Input label="Banner Price" value={pricing.banner} onChangeText={(v) => setPricing({ ...pricing, banner: v })} keyboardType="decimal-pad" />
        <Input label="Sidebar Price" value={pricing.sidebar} onChangeText={(v) => setPricing({ ...pricing, sidebar: v })} keyboardType="decimal-pad" />
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
  tabs: { flexDirection: "row", gap: 6, marginBottom: spacing.sm },
  tab: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff",
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "capitalize" },
  tabTextActive: { color: "#fff" },
  row: { flexDirection: "row", gap: spacing.sm },
  thumb: { width: 70, height: 70, borderRadius: radius.md, backgroundColor: colors.bg },
  title: { fontSize: 13, fontWeight: "700", color: colors.text },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
});
