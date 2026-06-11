import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, EmptyState, Button } from "../components/ui";
import { notificationsApi } from "../api/endpoints";
import { colors, spacing, radius } from "../theme/colors";

const TYPE_META = {
  new_order:        { icon: "cart-outline",      bg: colors.successLight, fg: colors.success },
  new_user:         { icon: "person-outline",    bg: "#dbeafe",           fg: "#2563eb" },
  new_hire_request: { icon: "briefcase-outline", bg: colors.warningLight, fg: colors.warning },
  new_video_upload: { icon: "videocam-outline",  bg: colors.purpleLight,  fg: colors.purple },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async (pageNum = 1, append = false) => {
    setError("");
    try {
      const res = await notificationsApi.list({ per_page: 20, page: pageNum });
      const raw = res.data?.data?.data || res.data?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      const total = res.data?.data?.total ?? list.length;
      setItems((prev) => append ? [...prev, ...list] : list);
      setHasMore(pageNum * 20 < total);
      setPage(pageNum);
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1, false);
  }, [load]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleMarkAllRead} style={{ marginRight: spacing.md }}>
          <Text style={styles.headerAction}>Mark all read</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleMarkRead = async (id) => {
    setBusyId(id);
    try {
      await notificationsApi.markRead(id);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch {
      Alert.alert("Error", "Could not mark as read.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Notification", "Remove this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setBusyId(id);
          try {
            await notificationsApi.remove(id);
            setItems((prev) => prev.filter((n) => n.id !== id));
          } catch {
            Alert.alert("Error", "Could not delete notification.");
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const handleMarkAllRead = () => {
    Alert.alert("Mark All Read", "Mark all notifications as read?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark All",
        onPress: async () => {
          try {
            await notificationsApi.markAllRead();
            setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
          } catch {
            Alert.alert("Error", "Could not mark all as read.");
          }
        },
      },
    ]);
  };

  const handleClearRead = () => {
    Alert.alert("Clear Read", "Remove all read notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await notificationsApi.clearRead();
            setItems((prev) => prev.filter((n) => !n.is_read));
          } catch {
            Alert.alert("Error", "Could not clear read notifications.");
          }
        },
      },
    ]);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    load(page + 1, true);
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <Screen scroll={false}>
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
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(1, false); }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={<EmptyState title="No notifications" />}
          ListFooterComponent={
            items.length > 0 ? (
              <View style={styles.footer}>
                {loadingMore ? (
                  <Text style={styles.footerText}>Loading…</Text>
                ) : null}
                <Button
                  title="Clear Read"
                  variant="outline"
                  size="sm"
                  onPress={handleClearRead}
                  style={{ marginTop: spacing.sm }}
                />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type] || { icon: "notifications-outline", bg: colors.bg, fg: colors.textMuted };
            const isBusy = busyId === item.id;
            return (
              <TouchableOpacity
                activeOpacity={item.is_read ? 1 : 0.7}
                onPress={() => !item.is_read && handleMarkRead(item.id)}
                style={[styles.card, !item.is_read && styles.cardUnread]}
              >
                <View style={styles.cardInner}>
                  <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={20} color={meta.fg} />
                  </View>
                  <View style={styles.content}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.title, !item.is_read && styles.titleUnread]} numberOfLines={1}>
                        {item.title || "Notification"}
                      </Text>
                      {!item.is_read && <View style={styles.dot} />}
                    </View>
                    {item.message ? (
                      <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                    ) : null}
                    <Text style={styles.time}>{item.created_at ? timeAgo(item.created_at) : ""}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    disabled={isBusy}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="close" size={16} color={colors.textLight} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: { fontSize: 13, color: colors.primary, fontWeight: "700" },
  errorBox: { margin: spacing.md, padding: spacing.sm, backgroundColor: colors.dangerLight, borderRadius: radius.md },
  errorText: { fontSize: 13, color: "#991b1b" },
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: {
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
  },
  cardInner: { flexDirection: "row", alignItems: "flex-start" },
  iconBox: {
    width: 40, height: 40, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
    marginRight: spacing.sm,
  },
  content: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 13, fontWeight: "600", color: colors.text, flex: 1 },
  titleUnread: { fontWeight: "800", color: colors.text },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#3b82f6",
  },
  message: { fontSize: 12, color: colors.textMuted, marginTop: 3, lineHeight: 17 },
  time: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  deleteBtn: {
    paddingLeft: spacing.sm,
    alignSelf: "flex-start",
  },
  footer: { paddingTop: spacing.sm, alignItems: "center" },
  footerText: { fontSize: 12, color: colors.textMuted },
});
