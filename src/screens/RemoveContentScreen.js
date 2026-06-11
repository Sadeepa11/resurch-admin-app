import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Image, Linking } from "react-native";
import { Screen, Card, Button, Input, Badge, EmptyState } from "../components/ui";
import { removeContentApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

const TYPES = [
  { label: "Innovations", value: "innovations",  listEndpoint: "/innovation",           deleteEndpoint: "/admin/innovations" },
  { label: "Research",    value: "research",     listEndpoint: "/research",              deleteEndpoint: "/admin/research" },
  { label: "Jobs",        value: "jobs",         listEndpoint: "/admin/jobs",            deleteEndpoint: "/jobs" },
  { label: "Community",   value: "community",    listEndpoint: "/admin/community/posts", deleteEndpoint: "/admin/community/posts" },
  { label: "Investor",    value: "investor",     listEndpoint: "/admin/investorzone/posts", deleteEndpoint: "/admin/investorzone/posts" },
];

export default function RemoveContentScreen() {
  const [type, setType] = useState(TYPES[0]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await removeContentApi.list(type.listEndpoint, { search, show_all: true, per_page: 50 });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data?.data || res.data?.data || res.data || []);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setError("Failed to load content. Pull down to retry.");
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
      "⚠️ Permanent Removal",
      `Permanently delete "${item.title || item.content?.slice(0, 60) || `Item #${item.id}`}"?\n\nThis will also remove all associated files from storage and cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            try {
              await removeContentApi.remove(`${type.deleteEndpoint}/${item.id}`);
              setItems((prev) => prev.filter((x) => x.id !== item.id));
            } catch {
              Alert.alert("Error", "Delete failed. Please try again.");
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
              onPress={() => { setType(t); setItems([]); setSearch(""); }}
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

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => (
            <Card>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                {(item.thumbnail || item.image_url || item.media_path) ? (
                  <Image 
                    source={{ uri: item.thumbnail || item.image_url || item.media_path }} 
                    style={styles.thumbnail} 
                  />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title || item.content?.slice(0, 80) || `Item #${item.id}`}
                  </Text>
                  {item.user || item.author ? (
                    <Text style={styles.sub}>By {item.user?.email || item.author?.email || "—"}</Text>
                  ) : null}
                  {item.created_at ? (
                    <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
                  ) : null}
                  {item.document_url ? (
                    <TouchableOpacity onPress={() => Linking.openURL(item.document_url)}>
                      <Text style={styles.docLink}>📄 View Document</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
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
  thumbnail: { width: 60, height: 60, borderRadius: 8 },
  docLink: { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: "600" },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  date: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  errorBox: { margin: spacing.md, padding: spacing.sm, backgroundColor: "#fee2e2", borderRadius: 8 },
  errorText: { fontSize: 13, color: "#991b1b" },
});
