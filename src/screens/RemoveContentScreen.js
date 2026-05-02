import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from "react-native";
import { Screen, Card, Button, Input, Badge, EmptyState } from "../components/ui";
import { removeContentApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

const TYPES = [
  { label: "Innovations", value: "innovations", endpoint: "/innovations" },
  { label: "Research", value: "research", endpoint: "/research" },
  { label: "Community", value: "community", endpoint: "/admin/community/posts" },
  { label: "Investor", value: "investor", endpoint: "/admin/investorzone/posts" },
];

export default function RemoveContentScreen() {
  const [type, setType] = useState(TYPES[0]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await removeContentApi.list(type.endpoint, { search, show_all: true, per_page: 50 });
      const list = res.data?.data?.data || res.data?.data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type, search]);

  useEffect(() => {
    const t = setTimeout(() => { setLoading(true); load(); }, 350);
    return () => clearTimeout(t);
  }, [load]);

  const remove = (item) =>
    Alert.alert(
      "Permanent Removal",
      `Remove "${item.title || item.content || item.id}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeContentApi.remove(`${type.endpoint}/${item.id}`);
              setItems((prev) => prev.filter((x) => x.id !== item.id));
            } catch {
              Alert.alert("Error", "Delete failed.");
            }
          },
        },
      ]
    );

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={styles.tabs}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setType(t)}
              style={[styles.tab, type.value === t.value && styles.tabActive]}
            >
              <Text style={[styles.tabText, type.value === t.value && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input label="Search" placeholder="Title or keyword" value={search} onChangeText={setSearch} />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.title} numberOfLines={2}>
                {item.title || item.content?.slice(0, 80) || `Item #${item.id}`}
              </Text>
              {item.user || item.author ? (
                <Text style={styles.sub}>By {item.user?.email || item.author?.email || "—"}</Text>
              ) : null}
              {item.created_at ? (
                <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
              ) : null}
              <Button
                title="🗑 Remove"
                variant="danger"
                size="sm"
                onPress={() => remove(item)}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          )}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="🗑️" title="No items to remove" />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.sm },
  tab: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff",
  },
  tabActive: { backgroundColor: colors.danger, borderColor: colors.danger },
  tabText: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  tabTextActive: { color: "#fff" },
  title: { fontSize: 14, fontWeight: "700", color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  date: { fontSize: 11, color: colors.textLight, marginTop: 4 },
});
