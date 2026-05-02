import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Alert, Image } from "react-native";
import { Screen, Card, Button, Input, Badge, EmptyState } from "../components/ui";
import { investorZoneApi } from "../api/endpoints";
import { colors, spacing, radius } from "../theme/colors";

export default function InvestorZoneScreen() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await investorZoneApi.list({ search, per_page: 50 });
      const list = res.data?.data?.data || res.data?.data || [];
      setPosts(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => { setLoading(true); load(); }, 350);
    return () => clearTimeout(t);
  }, [load]);

  const remove = (post) =>
    Alert.alert("Delete post", "Remove this investor post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await investorZoneApi.remove(post.id);
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
          } catch {
            Alert.alert("Error", "Delete failed");
          }
        },
      },
    ]);

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Input label="Search investor posts" value={search} onChangeText={setSearch} />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.title}>{item.title || "Untitled"}</Text>
              <Text style={styles.author}>By {item.user?.first_name} {item.user?.last_name}</Text>
              {item.image ? <Image source={{ uri: item.image }} style={styles.image} /> : null}
              <Text style={styles.content} numberOfLines={4}>{item.description || item.content}</Text>
              <View style={styles.metaRow}>
                {item.amount ? <Badge tone="success">💰 {item.amount}</Badge> : null}
                {item.category ? <Badge tone="info">{item.category}</Badge> : null}
                <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</Text>
              </View>
              <Button title="🗑 Remove" variant="danger" size="sm" onPress={() => remove(item)} style={{ marginTop: spacing.sm }} />
            </Card>
          )}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="💹" title="No investor posts" />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 14, fontWeight: "700", color: colors.text },
  author: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  image: { width: "100%", height: 160, borderRadius: radius.md, marginTop: spacing.sm, backgroundColor: colors.bg },
  content: { fontSize: 13, color: colors.text, lineHeight: 19, marginTop: spacing.sm },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: spacing.sm },
  date: { fontSize: 10, color: colors.textLight, marginLeft: "auto" },
});
