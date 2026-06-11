import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Image, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Button, Input, Badge, Modal, EmptyState, Select, StatCardRow } from "../components/ui";
import { studentVerificationApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, radius } from "../theme/colors";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function VerificationCard({ student, onReview, onDelete }) {
  const status = (student.verification_status || "pending").toLowerCase();
  const tone = status === "approved" ? "success" : status === "rejected" ? "danger" : "warning";

  return (
    <Card>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(student.student_name || "?")[0]?.toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{student.student_name}</Text>
          <Text style={styles.email}>{student.email}</Text>
          <View style={styles.tagRow}>
            <Badge tone={tone}>{student.verification_status}</Badge>
            <Text style={styles.date}>Grade {student.grade_level}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>🏫 <Text style={{ fontWeight: "600" }}>School:</Text> {student.school_name}</Text>
        {student.student_id ? (
          <Text style={styles.detailText}>🆔 <Text style={{ fontWeight: "600" }}>ID:</Text> {student.student_id}</Text>
        ) : null}
        {student.verification_notes ? (
          <Text style={styles.notesText}>📝 <Text style={{ fontWeight: "600" }}>Notes:</Text> {student.verification_notes}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          title="Review"
          variant="outline"
          size="sm"
          onPress={() => onReview(student)}
        />
        <Button
          title="Delete"
          variant="danger"
          size="sm"
          onPress={() => onDelete(student)}
        />
      </View>
    </Card>
  );
}

function ReviewModal({ visible, onClose, onAction, student, token, submitting }) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (student) {
      setNotes(student.verification_notes || "");
    } else {
      setNotes("");
    }
  }, [student, visible]);

  if (!student) return null;

  const mime = student.birth_certificate_mime || "";
  const isImage = mime.startsWith("image/");

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Verify Student Registration"
      footer={
        <>
          <Button title="Cancel" variant="outline" onPress={onClose} disabled={submitting} />
          <Button
            title="Reject"
            variant="danger"
            onPress={() => onAction("rejected", notes)}
            loading={submitting}
          />
          <Button
            title="Approve"
            variant="success"
            onPress={() => onAction("approved", notes)}
            loading={submitting}
          />
        </>
      }
    >
      <View style={styles.modalContent}>
        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{student.student_name}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{student.email}</Text>
          </View>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>School</Text>
            <Text style={styles.infoValue}>{student.school_name}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Grade Level</Text>
            <Text style={styles.infoValue}>Grade {student.grade_level}</Text>
          </View>
        </View>

        {/* Certificate Section */}
        <Text style={styles.sectionTitle}>Birth Certificate</Text>
        {isImage && student.birth_certificate_url ? (
          <Image
            source={{
              uri: student.birth_certificate_url,
              headers: { Authorization: `Bearer ${token}` },
            }}
            style={styles.certificateImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.pdfContainer}>
            <Ionicons name="document-text" size={32} color={colors.textMuted} />
            <Text style={styles.pdfText}>PDF Document</Text>
            <Text style={styles.pdfSubtext}>{student.birth_certificate_mime || "application/pdf"}</Text>
          </View>
        )}

        {/* Notes Input */}
        <View style={{ marginTop: spacing.md }}>
          <Input
            label="Verification Notes"
            placeholder="Add reasoning, e.g., missing ID number..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function StudentVerificationScreen() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (p = 1, replace = true) => {
    try {
      const res = await studentVerificationApi.list({
        search,
        status: statusFilter,
        page: p,
        per_page: 15,
      });

      const rootData = res.data;
      if (rootData.success) {
        const paginated = rootData.data;
        const list = paginated?.data || [];
        setStudents((prev) => (replace ? list : [...prev, ...list]));
        setHasMore(paginated?.last_page ? p < paginated.last_page : false);
        if (rootData.summary) {
          setSummary(rootData.summary);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch student verifications", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  // Debounced search / filter trigger
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setPage(1);
      load(1, true);
    }, 350);
    return () => clearTimeout(t);
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    load(1, true);
  };

  const onEndReached = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    load(next, false);
  };

  const handleAction = async (status, notes) => {
    setSubmitting(true);
    try {
      await studentVerificationApi.update(selectedStudent.id, { status, notes });
      setShowReview(false);
      setSelectedStudent(null);
      onRefresh();
      Alert.alert("Success", `Student registration status updated to ${status}.`);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to update status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (student) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to permanently delete the registration for ${student.student_name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await studentVerificationApi.remove(student.id);
              onRefresh();
            } catch {
              Alert.alert("Error", "Failed to delete student registration.");
            }
          },
        },
      ]
    );
  };

  const statItems = [
    { label: "Total", value: String(summary.total || 0), color: colors.text },
    { label: "Pending", value: String(summary.pending || 0), color: "#d97706" },
    { label: "Approved", value: String(summary.approved || 0), color: "#059669" },
    { label: "Rejected", value: String(summary.rejected || 0), color: "#dc2626" },
  ];

  return (
    <Screen scroll={false}>
      {/* Header filter options */}
      <View style={styles.header}>
        <Input
          label="Search"
          placeholder="Search name, email, school..."
          value={search}
          onChangeText={setSearch}
        />
        <Select
          label="Status Filter"
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={STATUS_OPTIONS}
        />
      </View>

      {/* Main List */}
      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => String(s.id)}
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.md }}>
              <StatCardRow items={statItems} />
            </View>
          }
          renderItem={({ item }) => (
            <VerificationCard
              student={item}
              onReview={(s) => {
                setSelectedStudent(s);
                setShowReview(true);
              }}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={{ padding: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState icon="🎓" title="No Student Verifications" subtitle="No verification requests match your filters." />
          }
        />
      )}

      {/* Verification modal */}
      <ReviewModal
        visible={showReview}
        onClose={() => setShowReview(false)}
        student={selectedStudent}
        token={token}
        onAction={handleAction}
        submitting={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 16,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  email: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
  },
  cardDetails: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.text,
  },
  notesText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
    backgroundColor: "#f9fafb",
    padding: 6,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalContent: {
    paddingVertical: spacing.sm,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "700",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  certificateImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#f3f4f6",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pdfContainer: {
    height: 150,
    backgroundColor: "#f3f4f6",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  pdfText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  pdfSubtext: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
