import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Image } from "react-native";
import { Screen, Card, Button, Badge, EmptyState } from "../components/ui";
import { leaderboardApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

const TYPES = [
  { label: "Innovation", value: "innovation" },
  { label: "Research", value: "research" },
];

export default function LeaderboardScreen() {
  const [type, setType] = useState("innovation");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await leaderboardApi.byContribution(type);
      
      // Fix: Extract data array from paginated response
      const data = res.data?.data?.data || res.data?.data || res.data || [];
      setItems(data);
    } catch (e) {
      console.warn("Leaderboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const toggleBest = async (userId) => {
    try {
      await leaderboardApi.toggleBest(userId, type);
      load();
    } catch {
      Alert.alert("Error", "Failed to toggle.");
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={styles.tabs}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setType(t.value)}
              style={[styles.tab, type === t.value && styles.tabActive]}
            >
              <Text style={[styles.tabText, type === t.value && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(u) => String(u.id)}
          renderItem={({ item, index }) => {
            const count = type === "innovation" ? item.innovation_count : item.research_count;
            const isBest = type === "innovation" ? item.is_best_innovator : item.is_best_researcher;
            return (
              <Card>
                <View style={styles.row}>
                  {(item.profile?.profile_image_url || item.profile?.profile_image) ? (
                    <Image source={{ uri: item.profile.profile_image_url || item.profile.profile_image }} style={styles.rankImage} />
                  ) : (
                    <Text style={styles.rank}>#{index + 1}</Text>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <Text style={styles.contrib}>
                      {count || 0} {type === "innovation" ? "innovations" : "papers"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    {isBest ? <Badge tone="warning">⭐ Best</Badge> : null}
                    <Button
                      title={isBest ? "Remove" : "Mark Best"}
                      variant={isBest ? "outline" : "primary"}
                      size="sm"
                      onPress={() => toggleBest(item.id)}
                      style={{ marginTop: 6 }}
                    />
                  </View>
                </View>
              </Card>
            );
          }}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="🏆" title="No contributors" />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  tabs: { flexDirection: "row", gap: spacing.sm },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: "center", borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  tabTextActive: { color: "#fff" },
  row: { flexDirection: "row", alignItems: "center" },
  rank: { fontSize: 18, fontWeight: "800", color: colors.primary, width: 40 },
  rankImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  email: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  contrib: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: "600" },
});
