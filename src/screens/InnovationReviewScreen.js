import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { innovationCommentsApi } from "../api/endpoints";

function StarRating({ rating, color = "#f59e0b" }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={[styles.star, { color: s <= rating ? color : "#d0d5dd" }]}>★</Text>
      ))}
    </View>
  );
}

function ReviewCard({ item, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Remove Review",
      "Are you sure you want to remove this review? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await innovationCommentsApi.remove(item.id);
              onDelete(item.id);
            } catch (e) {
              Alert.alert("Error", "Failed to delete the review. Please try again.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Extract name and email from response structure
  const userName = item.author || `${item.user?.first_name || ""} ${item.user?.last_name || ""}`.trim() || "Unknown";
  const userEmail = item.author_email || item.user?.email || "";
  const innovationTitle = item.innovation_title || item.innovation?.title || "";
  const commentText = item.text || item.comment || "";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userName[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color="#ef4444" size="small" />
          ) : (
            <Text style={styles.deleteBtnText}>✕</Text>
          )}
        </TouchableOpacity>
      </View>

      {innovationTitle ? (
        <View style={styles.subjectRow}>
          <Text style={styles.subjectLabel}>Innovation: </Text>
          <Text style={styles.subjectValue} numberOfLines={1}>{innovationTitle}</Text>
        </View>
      ) : null}

      <View style={styles.ratingRow}>
        <StarRating rating={item.rating || 0} color="#f59e0b" />
        <Text style={styles.ratingValue}>{item.rating}/5</Text>
      </View>

      {commentText ? (
        <Text style={styles.comment}>{commentText}</Text>
      ) : null}

      <Text style={styles.date}>
        {item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : ""}
      </Text>
    </View>
  );
}

export default function InnovationReviewScreen() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchComments = useCallback(async (page = 1, replace = true) => {
    setError("");
    try {
      const res = await innovationCommentsApi.list({ page, search });
      
      // Handle different response structures robustly
      const data = Array.isArray(res.data) ? res.data : (res.data?.data?.data || res.data?.data || []);
      const totalPages = res.data?.data?.last_page || 1;
      
      setTotalPages(totalPages);
      setComments((prev) => (replace ? data : [...prev, ...data]));
    } catch (e) {
      console.warn("Fetch comments error:", e);
      setError("Failed to load reviews. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setCurrentPage(1);
      fetchComments(1, true);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchComments(1, true);
  };

  const handleLoadMore = () => {
    if (loadingMore || currentPage >= totalPages) return;
    const next = currentPage + 1;
    setCurrentPage(next);
    setLoadingMore(true);
    fetchComments(next, false);
  };

  const handleDelete = (id) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    setSuccessMsg("Review removed successfully");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search comments, users, or innovations..."
          placeholderTextColor="#98a2b3"
          clearButtonMode="while-editing"
        />
      </View>

      {successMsg ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchComments(1, true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#dc2626" size="large" />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ReviewCard item={item} onDelete={handleDelete} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#dc2626" />}
          contentContainerStyle={[styles.list, !comments.length && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color="#dc2626" style={{ paddingVertical: 16 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No reviews found</Text>
              <Text style={styles.emptySubtitle}>Try a different search term.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f9fafb" },
  searchWrapper: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e4e7ec" },
  searchInput: {
    backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e4e7ec",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: "#101828",
  },
  list: { padding: 16 },
  emptyList: { flexGrow: 1 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: "#dc2626" },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "700", color: "#101828" },
  userEmail: { fontSize: 11, color: "#98a2b3", marginTop: 1 },
  deleteBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center",
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { fontSize: 13, color: "#ef4444", fontWeight: "700" },
  subjectRow: { flexDirection: "row", marginBottom: 8 },
  subjectLabel: { fontSize: 12, color: "#667085", fontWeight: "600" },
  subjectValue: { fontSize: 12, color: "#344054", flex: 1, fontWeight: "500" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  stars: { flexDirection: "row", gap: 2 },
  star: { fontSize: 16 },
  ratingValue: { fontSize: 12, color: "#667085", fontWeight: "600" },
  comment: { fontSize: 13, color: "#475467", lineHeight: 20, marginBottom: 8 },
  date: { fontSize: 11, color: "#98a2b3" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#344054" },
  emptySubtitle: { fontSize: 13, color: "#667085", marginTop: 4 },
  successBox: { margin: 16, marginBottom: 0, padding: 12, backgroundColor: "#d1fae5", borderRadius: 10 },
  successText: { fontSize: 13, color: "#065f46", fontWeight: "600" },
  errorBox: { margin: 16, marginBottom: 0, padding: 14, backgroundColor: "#fee2e2", borderRadius: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorText: { fontSize: 13, color: "#991b1b", flex: 1 },
  retryText: { fontSize: 13, fontWeight: "700", color: "#dc2626", marginLeft: 8 },
});
