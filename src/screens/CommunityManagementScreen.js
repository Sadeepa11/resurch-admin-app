import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Alert, Image } from "react-native";
import { Screen, Card, Button, Input, Badge, EmptyState } from "../components/ui";
import { communityApi } from "../api/endpoints";
import { colors, spacing, radius } from "../theme/colors";

export default function CommunityManagementScreen() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await communityApi.list({ search, per_page: 50 });
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
    Alert.alert("Delete post", "Permanently remove this community post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await communityApi.remove(post.id);
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
        <Input label="Search posts" value={search} onChangeText={setSearch} placeholder="Content or author" />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(item.user?.first_name || "?")[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.user?.first_name} {item.user?.last_name}</Text>
                  <Text style={styles.email}>{item.user?.email}</Text>
                </View>
              </View>
              <Text style={styles.content}>{item.content}</Text>
              {item.image ? <Image source={{ uri: item.image }} style={styles.image} /> : null}
              <View style={styles.metaRow}>
                <Badge tone="info">❤ {item.likes_count || 0}</Badge>
                <Badge tone="purple">💬 {item.comments_count || 0}</Badge>
                <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</Text>
              </View>
              <Button title="🗑 Remove Post" variant="danger" size="sm" onPress={() => remove(item)} style={{ marginTop: spacing.sm }} />
            </Card>
          )}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="💬" title="No community posts" />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center", marginRight: spacing.sm,
  },
  avatarText: { color: colors.primary, fontWeight: "800" },
  name: { fontSize: 13, fontWeight: "700", color: colors.text },
  email: { fontSize: 11, color: colors.textMuted },
  content: { fontSize: 13, color: colors.text, lineHeight: 19 },
  image: { width: "100%", height: 180, borderRadius: radius.md, marginTop: spacing.sm, backgroundColor: colors.bg },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm, alignItems: "center" },
  date: { fontSize: 10, color: colors.textLight, marginLeft: "auto" },
});
