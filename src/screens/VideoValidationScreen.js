import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { innovationsApi } from "../api/endpoints";

const STATUS_FILTERS = ["all", "pending", "active", "inactive", "revision_requested", "permanently_rejected"];

const STATUS_COLORS = {
  pending:              { bg: "#fef3c7", text: "#92400e",  dot: "#f59e0b" },
  active:               { bg: "#d1fae5", text: "#065f46",  dot: "#22c55e" },
  inactive:             { bg: "#fee2e2", text: "#991b1b",  dot: "#ef4444" },
  revision_requested:   { bg: "#fff7ed", text: "#9a3412",  dot: "#f97316" },
  permanently_rejected: { bg: "#f3e8ff", text: "#5b21b6",  dot: "#7c3aed" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status?.toLowerCase()] || { bg: "#f2f4f7", text: "#667085", dot: "#98a2b3" };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: s.dot }]} />
      <Text style={[styles.badgeText, { color: s.text }]}>{status || "unknown"}</Text>
    </View>
  );
}

function VideoDetailModal({ visible, video, onClose, onStatusChange }) {
  const [updating, setUpdating] = useState(false);
  const [actionMode, setActionMode] = useState(null); // 'revision' | 'perm_reject'
  const [reason, setReason] = useState("");
  const [blockUser, setBlockUser] = useState(false);

  const reset = () => { setActionMode(null); setReason(""); setBlockUser(false); };
  const handleClose = () => { reset(); onClose(); };

  const handleStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await innovationsApi.setStatus(video.id, newStatus);
      onStatusChange(video.id, newStatus);
      handleClose();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleRevision = async () => {
    if (!reason.trim()) { Alert.alert("Required", "Please enter a reason for the revision request."); return; }
    setUpdating(true);
    try {
      await innovationsApi.requestRevision(video.id, { reason: reason.trim(), block: blockUser });
      onStatusChange(video.id, "revision_requested");
      reset();
      onClose();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to request revision.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePermReject = async () => {
    if (!reason.trim()) { Alert.alert("Required", "Please enter a reason for permanently rejecting."); return; }
    setUpdating(true);
    try {
      await innovationsApi.permanentlyReject(video.id, { reason: reason.trim() });
      onStatusChange(video.id, "permanently_rejected");
      reset();
      onClose();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to permanently reject.");
    } finally {
      setUpdating(false);
    }
  };

  if (!video) return null;
  const isPermanent = video.status === "permanently_rejected";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>Video Details</Text>
          <TouchableOpacity style={modal.closeBtn} onPress={handleClose}>
            <Text style={modal.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={modal.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {video.thumbnail ? (
            <Image source={{ uri: video.thumbnail }} style={modal.thumbnail} resizeMode="cover" />
          ) : (
            <View style={modal.placeholderThumb}>
              <Text style={modal.placeholderIcon}>▶</Text>
            </View>
          )}

          <View style={modal.section}>
            <Text style={modal.videoTitle}>{video.title}</Text>
            <StatusBadge status={video.status} />
          </View>

          {video.description ? (
            <View style={modal.descBox}>
              <Text style={modal.descLabel}>DESCRIPTION</Text>
              <Text style={modal.descText}>{video.description}</Text>
            </View>
          ) : null}

          <View style={modal.grid}>
            <View style={modal.gridItem}>
              <Text style={modal.gridLabel}>Uploader</Text>
              <Text style={modal.gridValue}>{video.first_name} {video.last_name}</Text>
            </View>
            <View style={modal.gridItem}>
              <Text style={modal.gridLabel}>Category</Text>
              <Text style={modal.gridValue}>{video.category || "—"}</Text>
            </View>
            <View style={modal.gridItem}>
              <Text style={modal.gridLabel}>Views</Text>
              <Text style={modal.gridValue}>{video.views || 0}</Text>
            </View>
            <View style={modal.gridItem}>
              <Text style={modal.gridLabel}>Likes</Text>
              <Text style={modal.gridValue}>{video.likes || 0}</Text>
            </View>
          </View>

          <Text style={modal.actionLabel}>Update Status</Text>

          {actionMode ? (
            <View style={modal.reasonBox}>
              <Text style={modal.reasonTitle}>
                {actionMode === "revision" ? "Request Revision" : "Permanently Reject"}
              </Text>
              <TextInput
                style={modal.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder="Enter reason..."
                placeholderTextColor="#98a2b3"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {actionMode === "revision" && (
                <TouchableOpacity style={modal.checkRow} onPress={() => setBlockUser((b) => !b)}>
                  <View style={[modal.checkbox, blockUser && modal.checkboxChecked]}>
                    {blockUser ? <Text style={modal.checkmark}>✓</Text> : null}
                  </View>
                  <Text style={modal.checkLabel}>Block user from further uploads</Text>
                </TouchableOpacity>
              )}
              <View style={[modal.actionRow, { marginTop: 14 }]}>
                <TouchableOpacity
                  style={[modal.actionBtn, modal.cancelBtn]}
                  onPress={reset}
                  disabled={updating}
                >
                  <Text style={[modal.actionBtnText, { color: "#667085" }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modal.actionBtn, actionMode === "revision" ? modal.revisionBtn : modal.permRejectBtn, updating && modal.disabledBtn]}
                  onPress={actionMode === "revision" ? handleRevision : handlePermReject}
                  disabled={updating}
                >
                  {updating
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={modal.actionBtnText}>Confirm</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={modal.actionsBox}>
              <View style={modal.actionRow}>
                <TouchableOpacity
                  style={[modal.actionBtn, modal.approveBtn, (updating || video.status === "active") && modal.disabledBtn]}
                  onPress={() => handleStatus("active")}
                  disabled={updating || video.status === "active" || isPermanent}
                >
                  {updating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modal.actionBtnText}>Approve</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modal.actionBtn, modal.rejectBtn, (updating || video.status === "inactive") && modal.disabledBtn]}
                  onPress={() => handleStatus("inactive")}
                  disabled={updating || video.status === "inactive" || isPermanent}
                >
                  <Text style={modal.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
              <View style={[modal.actionRow, { marginTop: 10 }]}>
                <TouchableOpacity
                  style={[modal.actionBtn, modal.revisionBtn, (updating || video.status === "revision_requested" || isPermanent) && modal.disabledBtn]}
                  onPress={() => setActionMode("revision")}
                  disabled={updating || video.status === "revision_requested" || isPermanent}
                >
                  <Text style={modal.actionBtnText}>Request Revision</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modal.actionBtn, modal.permRejectBtn, (updating || isPermanent) && modal.disabledBtn]}
                  onPress={() => setActionMode("perm_reject")}
                  disabled={updating || isPermanent}
                >
                  <Text style={modal.actionBtnText}>Perm. Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function VideoValidationScreen() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const fetchVideos = useCallback(async () => {
    setError("");
    try {
      let allVideos = [];
      if (filterStatus === "all") {
        const res = await innovationsApi.list({ show_all: true });
        allVideos = res.data?.data?.data || res.data?.data || [];
      } else {
        const res = await innovationsApi.list({ status: filterStatus, show_all: true });
        allVideos = res.data?.data?.data || res.data?.data || [];
      }
      setVideos(allVideos);
    } catch (e) {
      setError("Failed to load videos. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    setLoading(true);
    fetchVideos();
  }, [fetchVideos]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const handleStatusChange = (id, newStatus) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    );
  };

  const filtered = videos.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.title?.toLowerCase().includes(q) ||
      v.first_name?.toLowerCase().includes(q) ||
      v.last_name?.toLowerCase().includes(q) ||
      v.category?.toLowerCase().includes(q)
    );
  });

  const renderVideo = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => { setSelectedVideo(item); setShowModal(true); }}
      activeOpacity={0.8}
    >
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.placeholderThumb]}>
          <Text style={styles.placeholderIcon}>▶</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {item.first_name} {item.last_name}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardCategory}>{item.category || "Uncategorized"}</Text>
          <StatusBadge status={item.status} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filterStatus === f && styles.filterTabActive]}
              onPress={() => setFilterStatus(f)}
            >
              <Text style={[styles.filterTabText, filterStatus === f && styles.filterTabTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title, uploader, category..."
          placeholderTextColor="#98a2b3"
          clearButtonMode="while-editing"
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchVideos}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#dc2626" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderVideo}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#dc2626" />}
          contentContainerStyle={[styles.list, !filtered.length && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📹</Text>
              <Text style={styles.emptyTitle}>No videos found</Text>
              <Text style={styles.emptySubtitle}>Try a different filter or search term.</Text>
            </View>
          }
        />
      )}

      <VideoDetailModal
        visible={showModal}
        video={selectedVideo}
        onClose={() => setShowModal(false)}
        onStatusChange={handleStatusChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f9fafb" },
  filterRow: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e4e7ec" },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f2f4f7",
    marginRight: 8,
  },
  filterTabActive: { backgroundColor: "#dc2626" },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#667085" },
  filterTabTextActive: { color: "#fff" },
  searchWrapper: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4e7ec",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#101828",
  },
  list: { padding: 16, gap: 12 },
  emptyList: { flexGrow: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  thumb: { width: 100, height: 90 },
  placeholderThumb: { backgroundColor: "#1d2939", alignItems: "center", justifyContent: "center" },
  placeholderIcon: { fontSize: 24, color: "#fff" },
  cardBody: { flex: 1, padding: 12, justifyContent: "space-between" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#101828", lineHeight: 20 },
  cardMeta: { fontSize: 12, color: "#667085", marginTop: 2 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  cardCategory: { fontSize: 11, color: "#98a2b3", fontWeight: "500" },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 4 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#344054" },
  emptySubtitle: { fontSize: 13, color: "#667085", marginTop: 4 },
  errorBox: { margin: 16, padding: 14, backgroundColor: "#fee2e2", borderRadius: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorText: { fontSize: 13, color: "#991b1b", flex: 1 },
  retryText: { fontSize: 13, fontWeight: "700", color: "#dc2626", marginLeft: 8 },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e7ec",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#101828" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f2f4f7", alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 14, color: "#667085", fontWeight: "700" },
  body: { flex: 1 },
  thumbnail: { width: "100%", height: 220 },
  placeholderThumb: { width: "100%", height: 220, backgroundColor: "#1d2939", alignItems: "center", justifyContent: "center" },
  placeholderIcon: { fontSize: 48, color: "#fff" },
  section: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 20, paddingBottom: 12, gap: 12 },
  videoTitle: { fontSize: 16, fontWeight: "700", color: "#101828", flex: 1, lineHeight: 24 },
  descBox: { marginHorizontal: 20, marginBottom: 16, padding: 14, backgroundColor: "#f9fafb", borderRadius: 10 },
  descLabel: { fontSize: 10, fontWeight: "700", color: "#98a2b3", letterSpacing: 1, marginBottom: 6 },
  descText: { fontSize: 13, color: "#475467", lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, marginBottom: 16 },
  gridItem: { width: "50%", paddingHorizontal: 4, paddingVertical: 8 },
  gridLabel: { fontSize: 11, fontWeight: "600", color: "#98a2b3", marginBottom: 2 },
  gridValue: { fontSize: 14, fontWeight: "600", color: "#101828" },
  actionLabel: { fontSize: 13, fontWeight: "700", color: "#344054", paddingHorizontal: 20, marginBottom: 10 },
  actionsBox: { paddingHorizontal: 20, paddingBottom: 40 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  approveBtn: { backgroundColor: "#22c55e" },
  rejectBtn: { backgroundColor: "#ef4444" },
  revisionBtn: { backgroundColor: "#f59e0b" },
  permRejectBtn: { backgroundColor: "#7c3aed" },
  cancelBtn: { backgroundColor: "#f2f4f7" },
  disabledBtn: { opacity: 0.45 },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  reasonBox: { paddingHorizontal: 20, paddingBottom: 40 },
  reasonTitle: { fontSize: 14, fontWeight: "700", color: "#344054", marginBottom: 10 },
  reasonInput: {
    borderWidth: 1, borderColor: "#e4e7ec", borderRadius: 10,
    padding: 12, fontSize: 13, color: "#101828", minHeight: 90,
  },
  checkRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: "#d0d5dd", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  checkmark: { color: "#fff", fontSize: 11, fontWeight: "800" },
  checkLabel: { fontSize: 13, color: "#344054", flex: 1 },
});
