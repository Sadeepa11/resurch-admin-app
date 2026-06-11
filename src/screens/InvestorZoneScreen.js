import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Alert, Image } from "react-native";
import { Screen, Card, Button, Input, Badge, EmptyState } from "../components/ui";
import { investorZoneApi } from "../api/endpoints";
import { colors, spacing, radius } from "../theme/colors";

const STATUS_TONE = { approved: "success", pending: "warning", rejected: "danger" };

function PostActions({ post, onApprove, onReject, onRemove }) {
  const [busyAction, setBusyAction] = useState(null);

  const act = async (fn, label) => {
    setBusyAction(label);
    try { await fn(); }
    catch { Alert.alert("Error", `${label} failed. Please try again.`); }
    finally { setBusyAction(null); }
  };

  const busy = busyAction !== null;

  return (
    <View style={styles.actionRow}>
      {post.status !== "approved" && (
        <Button
          title="Approve"
          variant="success"
          size="sm"
          loading={busyAction === "approve"}
          disabled={busy}
          onPress={() => act(onApprove, "approve")}
          style={styles.actionBtn}
        />
      )}
      {post.status !== "rejected" && (
        <Button
          title="Reject"
          variant="danger"
          size="sm"
          loading={busyAction === "reject"}
          disabled={busy}
          onPress={() => act(onReject, "reject")}
          style={styles.actionBtn}
        />
      )}
      <Button
        title="Remove"
        variant="outline"
        size="sm"
        disabled={busy}
        onPress={onRemove}
        style={styles.actionBtn}
      />
    </View>
  );
}

export default function InvestorZoneScreen() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await investorZoneApi.list({ search, per_page: 50 });
      const list = res.data?.data?.data || res.data?.data || [];
      setPosts(Array.isArray(list) ? list : []);
    } catch (e) {
      setError("Failed to load investor posts. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => { setLoading(true); load(); }, 350);
    return () => clearTimeout(t);
  }, [load]);

  const handleApprove = (id) => async () => {
    await investorZoneApi.approve(id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: "approved" } : p));
  };

  const handleReject = (id) => async () => {
    await investorZoneApi.reject(id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: "rejected" } : p));
  };

  const handleRemove = (post) =>
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

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{item.title || "Untitled"}</Text>
                {item.status ? (
                  <Badge tone={STATUS_TONE[item.status] || "neutral"}>{item.status}</Badge>
                ) : null}
              </View>
              <Text style={styles.author}>By {item.user?.first_name} {item.user?.last_name}</Text>
              {item.image ? <Image source={{ uri: item.image }} style={styles.image} /> : null}
              <Text style={styles.content} numberOfLines={4}>{item.description || item.content}</Text>
              <View style={styles.metaRow}>
                {item.amount ? <Badge tone="success">💰 {item.amount}</Badge> : null}
                {item.category ? <Badge tone="info">{item.category}</Badge> : null}
                <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</Text>
              </View>
              <PostActions
                post={item}
                onApprove={handleApprove(item.id)}
                onReject={handleReject(item.id)}
                onRemove={() => handleRemove(item)}
              />
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
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 14, fontWeight: "700", color: colors.text, flex: 1 },
  author: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  image: { width: "100%", height: 160, borderRadius: radius.md, marginTop: spacing.sm, backgroundColor: colors.bg },
  content: { fontSize: 13, color: colors.text, lineHeight: 19, marginTop: spacing.sm },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: spacing.sm },
  date: { fontSize: 10, color: colors.textLight, marginLeft: "auto" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: spacing.sm, flexWrap: "wrap" },
  actionBtn: { flex: 1 },
  errorBox: { margin: spacing.md, padding: spacing.sm, backgroundColor: "#fee2e2", borderRadius: 8 },
  errorText: { fontSize: 13, color: "#991b1b" },
});
