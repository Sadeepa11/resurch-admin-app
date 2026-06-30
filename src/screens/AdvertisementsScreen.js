import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Image, TextInput } from "react-native";
import { Screen, Card, Button, Badge, Modal, EmptyState, StatCardRow, Input } from "../components/ui";
import { advertisementsApi } from "../api/endpoints";
import { colors, spacing, radius } from "../theme/colors";

const TYPE_LABELS = { carousel: "Carousel", banner: "Banner", side: "Side", popup: "Popup" };

export default function AdvertisementsScreen() {
  const [ads, setAds] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricing, setPricing] = useState({ carousel_price: "", banner_price: "", side_price: "", popup_price: "" });
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
          carousel_price: String(p.carousel_price || ""),
          banner_price:   String(p.banner_price   || ""),
          side_price:     String(p.side_price      || ""),
          popup_price:    String(p.popup_price     || ""),
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
    try { await advertisementsApi.approve(id); load(); }
    catch { Alert.alert("Error", "Approve failed"); }
  };

  const reject = (id) =>
    Alert.alert("Reject Ad", "Reject this advertisement?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: async () => {
        try { await advertisementsApi.reject(id); load(); }
        catch { Alert.alert("Error", "Reject failed"); }
      }},
    ]);

  const remove = (id) =>
    Alert.alert("Delete Ad", "Permanently delete this ad?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await advertisementsApi.remove(id); load(); }
        catch { Alert.alert("Error", "Delete failed"); }
      }},
    ]);

  const savePricing = async () => {
    setSavingPricing(true);
    try {
      await advertisementsApi.updatePricing({
        carousel_price: parseFloat(pricing.carousel_price) || 0,
        banner_price:   parseFloat(pricing.banner_price)   || 0,
        side_price:     parseFloat(pricing.side_price)     || 0,
        popup_price:    parseFloat(pricing.popup_price)    || 0,
      });
      setPricingOpen(false);
      Alert.alert("Saved", "Pricing updated.");
    } catch {
      Alert.alert("Error", "Save failed");
    } finally {
      setSavingPricing(false);
    }
  };

  const pendingCount = ads.filter((a) => a.payment_status !== "paid").length;

  const filtered = ads.filter((a) => {
    const matchSearch = !search || (a.title || "").toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || a.type === typeFilter;
    const matchTab    = tab === "all" || (tab === "pending" && a.payment_status !== "paid");
    return matchSearch && matchType && matchTab;
  });

  const stats = [
    { label: "Total Ads",    value: ads.length },
    { label: "Active",       value: ads.filter((a) => a.is_active).length,                           color: colors.success },
    { label: "Impressions",  value: (analytics?.total_impressions ?? 0).toLocaleString(),             color: colors.purple },
    { label: "Clicks",       value: (analytics?.total_clicks ?? 0).toLocaleString(),                  color: colors.warning },
  ];

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.heading}>Advertisements</Text>
        <Button title="💰 Pricing" variant="outline" size="sm" onPress={() => setPricingOpen(true)} />
      </View>

      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <StatCardRow items={stats} />

        <TextInput
          style={styles.searchInput}
          placeholder="Search by title…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.row}>
          {[
            { key: "all",     label: "All" },
            { key: "pending", label: pendingCount > 0 ? `Pending (${pendingCount})` : "Pending" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, tab === t.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.row, { marginBottom: spacing.sm, flexWrap: "wrap" }]}>
          {["all", "carousel", "banner", "side", "popup"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTypeFilter(t)}
              style={[styles.chip, typeFilter === t && styles.chipActive]}
            >
              <Text style={[styles.chipText, typeFilter === t && styles.chipTextActive]}>
                {t === "all" ? "All Types" : TYPE_LABELS[t]}
              </Text>
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
            const isPaid     = item.payment_status === "paid";
            const isRejected = item.payment_status === "rejected";

            return (
              <Card>
                <View style={styles.cardRow}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumb} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={2}>{item.title || `Ad #${item.id}`}</Text>
                    {item.subtitle ? (
                      <Text style={styles.sub} numberOfLines={1}>{item.subtitle}</Text>
                    ) : null}

                    <View style={styles.badgeRow}>
                      <Badge tone={item.is_active ? "success" : "neutral"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge tone={isPaid ? "success" : "warning"}>
                        {isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                      {item.type ? (
                        <Badge tone="info">{TYPE_LABELS[item.type] || item.type}</Badge>
                      ) : null}
                    </View>

                    {(item.current_impressions !== undefined || item.clicks !== undefined) && (
                      <View style={styles.metricsRow}>
                        <Text style={styles.metricText}>👁 {(item.current_impressions ?? 0).toLocaleString()}</Text>
                        <Text style={styles.metricText}>👆 {(item.clicks ?? 0).toLocaleString()}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.actions}>
                  {!isPaid && (
                    <Button title="Approve" variant="success" size="sm" onPress={() => approve(item.id)} />
                  )}
                  {!isRejected && (
                    <Button title="Reject" variant="danger" size="sm" onPress={() => reject(item.id)} />
                  )}
                  <Button title="Delete" variant="outline" size="sm" onPress={() => remove(item.id)} />
                </View>
              </Card>
            );
          }}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="📢" title="No ads found" />}
        />
      )}

      <Modal
        visible={pricingOpen}
        onClose={() => setPricingOpen(false)}
        title="Ad Type Pricing"
        footer={
          <>
            <Button title="Cancel" variant="outline" onPress={() => setPricingOpen(false)} />
            <Button title="Save" onPress={savePricing} loading={savingPricing} />
          </>
        }
      >
        <Input
          label="Carousel Ad Price (LKR)"
          value={pricing.carousel_price}
          onChangeText={(v) => setPricing({ ...pricing, carousel_price: v })}
          keyboardType="decimal-pad"
        />
        <Input
          label="Banner Ad Price (LKR)"
          value={pricing.banner_price}
          onChangeText={(v) => setPricing({ ...pricing, banner_price: v })}
          keyboardType="decimal-pad"
        />
        <Input
          label="Side Ad Price (LKR)"
          value={pricing.side_price}
          onChangeText={(v) => setPricing({ ...pricing, side_price: v })}
          keyboardType="decimal-pad"
        />
        <Input
          label="Popup Ad Price (LKR)"
          value={pricing.popup_price}
          onChangeText={(v) => setPricing({ ...pricing, popup_price: v })}
          keyboardType="decimal-pad"
        />
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: { fontSize: 16, fontWeight: "800", color: colors.text },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: "row", gap: 6, marginBottom: 6 },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 11, fontWeight: "700", color: colors.textMuted },
  tabTextActive: { color: "#fff" },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { fontSize: 10, fontWeight: "700", color: colors.textMuted },
  chipTextActive: { color: "#fff" },
  cardRow: { flexDirection: "row", gap: spacing.sm },
  thumb: { width: 70, height: 70, borderRadius: radius.md, backgroundColor: colors.bg },
  title: { fontSize: 13, fontWeight: "700", color: colors.text },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  metricsRow: { flexDirection: "row", gap: spacing.md, marginTop: 4 },
  metricText: { fontSize: 11, color: colors.textMuted },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexWrap: "wrap",
  },
});
