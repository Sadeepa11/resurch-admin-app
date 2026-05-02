import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { Screen, Card, Button, Input, Badge, EmptyState } from "../components/ui";
import { videoUploadApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

export default function VideoUploadPaymentsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fee, setFee] = useState({ amount: "", currency: "LKR" });
  const [savingFee, setSavingFee] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pmts, feeRes] = await Promise.all([
        videoUploadApi.payments({ per_page: 50 }),
        videoUploadApi.fee(),
      ]);
      setItems(pmts.data?.data?.data || pmts.data?.data || []);
      const feeData = feeRes.data?.data || feeRes.data;
      if (feeData) setFee({ amount: String(feeData.amount || ""), currency: feeData.currency || "LKR" });
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveFee = async () => {
    setSavingFee(true);
    try {
      await videoUploadApi.updateFee({ amount: parseFloat(fee.amount), currency: fee.currency });
      Alert.alert("Saved", "Upload fee updated.");
    } catch {
      Alert.alert("Error", "Could not update fee.");
    } finally {
      setSavingFee(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Fee</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 2 }}>
            <Input label="Amount" value={fee.amount} onChangeText={(v) => setFee({ ...fee, amount: v })} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Currency" value={fee.currency} onChangeText={(v) => setFee({ ...fee, currency: v.toUpperCase() })} autoCapitalize="characters" />
          </View>
        </View>
        <Button title="Save Fee" onPress={saveFee} loading={savingFee} fullWidth />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, i) => String(it.id || i)}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.user?.first_name} {item.user?.last_name}</Text>
                  <Text style={styles.email}>{item.user?.email}</Text>
                </View>
                <Text style={styles.amount}>
                  {item.currency || fee.currency} {item.amount}
                </Text>
              </View>
              {item.innovation?.title ? (
                <Text style={styles.innov} numberOfLines={1}>📹 {item.innovation.title}</Text>
              ) : null}
              <View style={styles.tagRow}>
                <Badge tone={item.status === "paid" ? "success" : "warning"}>{item.status || "pending"}</Badge>
                <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</Text>
              </View>
            </Card>
          )}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="💳" title="No payments yet" />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  email: { fontSize: 11, color: colors.textMuted },
  amount: { fontSize: 16, fontWeight: "800", color: colors.success },
  innov: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  tagRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  date: { fontSize: 10, color: colors.textLight },
});
