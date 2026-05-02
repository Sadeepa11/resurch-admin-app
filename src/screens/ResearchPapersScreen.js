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
  Linking,
} from "react-native";
import api from "../api/api";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"];

const STATUS_COLORS = {
  pending:  { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  approved: { bg: "#d1fae5", text: "#065f46", dot: "#22c55e" },
  rejected: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
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

function ResearchDetailModal({ visible, research, onClose, onStatusChange }) {
  const [updating, setUpdating] = useState(false);

  const handleStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await api.put(`/research/${research.id}/status`, { status: newStatus });
      onStatusChange(research.id, newStatus);
      onClose();
    } catch (e) {
      Alert.alert("Error", "Failed to update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (!research) return null;

  const researcher = research.innovator || {};

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>Research Details</Text>
          <TouchableOpacity style={modal.closeBtn} onPress={onClose}>
            <Text style={modal.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={modal.body} showsVerticalScrollIndicator={false}>
          {research.thumbnail ? (
            <Image source={{ uri: research.thumbnail }} style={modal.thumbnail} resizeMode="contain" />
          ) : (
            <View style={modal.placeholderThumb}>
              <Text style={modal.placeholderIcon}>📄</Text>
            </View>
          )}

          <View style={modal.section}>
            <Text style={modal.researchTitle}>{research.title}</Text>
            <StatusBadge status={research.status} />
          </View>

          {research.description ? (
            <View style={modal.abstractBox}>
              <Text style={modal.abstractLabel}>ABSTRACT</Text>
              <Text style={modal.abstractText}>{research.description}</Text>
            </View>
          ) : null}

          <View style={modal.grid}>
            <View style={modal.gridItem}>
              <Text style={modal.gridLabel}>Researcher</Text>
              <Text style={modal.gridValue}>
                {researcher.first_name} {researcher.last_name}
              </Text>
            </View>
            <View style={modal.gridItem}>
              <Text style={modal.gridLabel}>Category</Text>
              <Text style={modal.gridValue}>{research.category || "—"}</Text>
            </View>
            <View style={modal.gridItem}>
              <Text style={modal.gridLabel}>Views</Text>
              <Text style={modal.gridValue}>{research.views || 0}</Text>
            </View>
            <View style={modal.gridItem}>
              <Text style={modal.gridLabel}>Downloads</Text>
              <Text style={modal.gridValue}>{research.downloads || 0}</Text>
            </View>
          </View>

          {research.pdf_url ? (
            <TouchableOpacity
              style={modal.pdfBtn}
              onPress={() => Linking.openURL(research.pdf_url)}
            >
              <Text style={modal.pdfBtnText}>View PDF</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={modal.actionLabel}>Update Status</Text>
          <View style={modal.actionRow}>
            <TouchableOpacity
              style={[modal.actionBtn, modal.approveBtn, (updating || research.status === "approved") && modal.disabledBtn]}
              onPress={() => handleStatus("approved")}
              disabled={updating || research.status === "approved"}
            >
              {updating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modal.actionBtnText}>Approve</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.actionBtn, modal.rejectBtn, (updating || research.status === "rejected") && modal.disabledBtn]}
              onPress={() => handleStatus("rejected")}
              disabled={updating || research.status === "rejected"}
            >
              <Text style={modal.actionBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ResearchPapersScreen() {
  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const fetchResearches = useCallback(async () => {
    setError("");
    try {
      let url = "/research";
      if (filterStatus !== "all") url = `/research?status=${filterStatus}`;
      const res = await api.get(url);
      setResearches(res.data.data.data || []);
    } catch (e) {
      setError("Failed to load research papers. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    setLoading(true);
    fetchResearches();
  }, [fetchResearches]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResearches();
  };

  const handleStatusChange = (id, newStatus) => {
    setResearches((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  const filtered = researches.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const researcher = r.innovator || {};
    return (
      r.title?.toLowerCase().includes(q) ||
      researcher.first_name?.toLowerCase().includes(q) ||
      researcher.last_name?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q)
    );
  });

  const renderResearch = ({ item }) => {
    const researcher = item.innovator || {};
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { setSelectedResearch(item); setShowModal(true); }}
        activeOpacity={0.8}
      >
        <View style={styles.cardIconBox}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.cardIcon} resizeMode="cover" />
          ) : (
            <View style={[styles.cardIcon, styles.placeholderIcon]}>
              <Text style={styles.placeholderText}>📄</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {researcher.first_name} {researcher.last_name}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardCategory}>{item.category || "Uncategorized"}</Text>
            <StatusBadge status={item.status} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
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

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title, researcher, category..."
          placeholderTextColor="#98a2b3"
          clearButtonMode="while-editing"
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchResearches}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
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
          renderItem={renderResearch}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#dc2626" />}
          contentContainerStyle={[styles.list, !filtered.length && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>No research papers found</Text>
              <Text style={styles.emptySubtitle}>Try a different filter or search term.</Text>
            </View>
          }
        />
      )}

      <ResearchDetailModal
        visible={showModal}
        research={selectedResearch}
        onClose={() => setShowModal(false)}
        onStatusChange={handleStatusChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f9fafb" },
  filterRow: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e4e7ec" },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 10 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, backgroundColor: "#f2f4f7", marginRight: 8,
  },
  filterTabActive: { backgroundColor: "#dc2626" },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#667085" },
  filterTabTextActive: { color: "#fff" },
  searchWrapper: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchInput: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e4e7ec",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: "#101828",
  },
  list: { padding: 16 },
  emptyList: { flexGrow: 1 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, flexDirection: "row",
    overflow: "hidden", marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardIconBox: { width: 90, height: 90 },
  cardIcon: { width: 90, height: 90 },
  placeholderIcon: { backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
  placeholderText: { fontSize: 28 },
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: "#e4e7ec",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#101828" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f2f4f7", alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 14, color: "#667085", fontWeight: "700" },
  body: { flex: 1 },
  thumbnail: { width: "100%", height: 200, backgroundColor: "#f9fafb" },
  placeholderThumb: { width: "100%", height: 200, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
  placeholderIcon: { fontSize: 60 },
  section: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 20, paddingBottom: 12, gap: 12 },
  researchTitle: { fontSize: 16, fontWeight: "700", color: "#101828", flex: 1, lineHeight: 24 },
  abstractBox: { marginHorizontal: 20, marginBottom: 16, padding: 14, backgroundColor: "#f9fafb", borderRadius: 10 },
  abstractLabel: { fontSize: 10, fontWeight: "700", color: "#98a2b3", letterSpacing: 1, marginBottom: 6 },
  abstractText: { fontSize: 13, color: "#475467", lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, marginBottom: 16 },
  gridItem: { width: "50%", paddingHorizontal: 4, paddingVertical: 8 },
  gridLabel: { fontSize: 11, fontWeight: "600", color: "#98a2b3", marginBottom: 2 },
  gridValue: { fontSize: 14, fontWeight: "600", color: "#101828" },
  pdfBtn: {
    marginHorizontal: 20, marginBottom: 20, paddingVertical: 12,
    backgroundColor: "#fee2e2", borderRadius: 10, alignItems: "center",
  },
  pdfBtnText: { fontSize: 14, fontWeight: "700", color: "#dc2626" },
  actionLabel: { fontSize: 13, fontWeight: "700", color: "#344054", paddingHorizontal: 20, marginBottom: 10 },
  actionRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 40 },
  actionBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  approveBtn: { backgroundColor: "#22c55e" },
  rejectBtn: { backgroundColor: "#ef4444" },
  disabledBtn: { opacity: 0.5 },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
