import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Alert, Image,
  TextInput, TouchableOpacity, Modal as RNModal,
  KeyboardAvoidingView, ScrollView, Platform, StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Screen, Card, Badge, EmptyState, StatCardRow, Button, Input } from "../components/ui";
import { advertisementsApi } from "../api/endpoints";
import { colors, spacing, radius } from "../theme/colors";

const TYPE_LABELS = { carousel: "Carousel", banner: "Banner", side: "Side", popup: "Popup" };
const AD_TYPES    = ["carousel", "banner", "side", "popup"];

const EMPTY_FORM = {
  type: "carousel",
  title: "",
  description: "",
  cta_text: "Learn More",
  cta_link: "",
};

export default function MarketingScreen() {
  const [ads, setAds]               = useState([]);
  const [analytics, setAnalytics]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [pickedImage, setPickedImage] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [errors, setErrors]         = useState({});

  const load = useCallback(async () => {
    try {
      const [adRes, anRes] = await Promise.all([
        advertisementsApi.list(),
        advertisementsApi.analytics().catch(() => null),
      ]);
      setAds(adRes.data?.data || []);
      if (anRes) setAnalytics(anRes.data?.data || anRes.data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setPickedImage(null);
    setErrors({});
    setCreateOpen(true);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Photo access is needed to pick an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions?.Images || "images",
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setPickedImage(result.assets[0]);
      if (errors.image) setErrors((p) => ({ ...p, image: null }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!pickedImage)             e.image       = "Ad image is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("type",        form.type);
      fd.append("title",       form.title.trim());
      fd.append("description", form.description.trim());
      if (form.cta_text.trim()) fd.append("cta_text", form.cta_text.trim());
      if (form.cta_link.trim()) fd.append("cta_link", form.cta_link.trim());
      const uri  = pickedImage.uri;
      const name = uri.split("/").pop() || "ad.jpg";
      const type = pickedImage.mimeType || "image/jpeg";
      fd.append("image", { uri, name, type });

      await advertisementsApi.create(fd);
      setCreateOpen(false);
      load();
      Alert.alert("Created", "Ad created successfully.");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: "Total Ads",   value: analytics?.total_ads ?? ads.length },
    { label: "Active",      value: analytics?.active_ads ?? ads.filter((a) => a.is_active).length, color: colors.success },
    { label: "Impressions", value: (analytics?.total_impressions ?? 0).toLocaleString(), color: colors.purple },
    { label: "Clicks",      value: (analytics?.total_clicks ?? 0).toLocaleString(), color: colors.warning },
  ];

  const filtered = ads.filter((a) => {
    const matchSearch = !search || (a.title || "").toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || a.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <Screen scroll={false}>
      <FlatList
        data={filtered}
        keyExtractor={(a) => String(a.id)}
        ListHeaderComponent={
          <View style={{ padding: spacing.md }}>
            <View style={styles.headerRow}>
              <Text style={styles.pageTitle}>📢 Marketing Overview</Text>
              <Button title="+ Create Ad" size="sm" onPress={openCreate} />
            </View>

            <StatCardRow items={stats} />

            <TextInput
              style={styles.searchInput}
              placeholder="Search by title…"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />

            <View style={styles.filterRow}>
              {["all", ...AD_TYPES].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTypeFilter(t)}
                  style={[styles.chip, typeFilter === t && styles.chipActive]}
                >
                  <Text style={[styles.chipText, typeFilter === t && styles.chipTextActive]}>
                    {t === "all" ? "All Types" : TYPE_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isPaid  = item.payment_status === "paid";
          const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : null;
          const start   = fmtDate(item.start_date);
          const end     = fmtDate(item.end_date);
          return (
            <View style={{ paddingHorizontal: spacing.md }}>
              <Card>
                <View style={styles.cardRow}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumb} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adTitle} numberOfLines={2}>{item.title || `Ad #${item.id}`}</Text>
                    {item.subtitle ? (
                      <Text style={styles.sub} numberOfLines={1}>{item.subtitle}</Text>
                    ) : null}
                    <View style={styles.badgeRow}>
                      <Badge tone={item.is_active ? "success" : "neutral"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge tone={isPaid ? "success" : "warning"}>
                        {isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                      {item.type ? (
                        <Badge tone="info">{TYPE_LABELS[item.type] || item.type}</Badge>
                      ) : null}
                    </View>
                    <View style={styles.metricsRow}>
                      <Text style={styles.metricText}>👁 {(item.current_impressions ?? 0).toLocaleString()}</Text>
                      <Text style={styles.metricText}>👆 {(item.clicks ?? 0).toLocaleString()}</Text>
                      {start && end ? (
                        <Text style={styles.metricText}>{start} → {end}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          );
        }}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); load(); }}
        ListEmptyComponent={
          loading ? <EmptyState loading /> : <EmptyState icon="📢" title="No marketing data" />
        }
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      />

      {/* ── Full-screen Create Ad Form ── */}
      <RNModal
        visible={createOpen}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setCreateOpen(false)}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.bg }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Header */}
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={() => setCreateOpen(false)} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
              <Text style={styles.backText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.formTitle}>Create New Ad</Text>
            <Button
              title={saving ? "Saving…" : "Create"}
              size="sm"
              onPress={handleCreate}
              loading={saving}
            />
          </View>

          {/* Scrollable form content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.formBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Ad Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ad Type</Text>
              <View style={styles.typeRow}>
                {AD_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setForm((p) => ({ ...p, type: t }))}
                    style={[styles.typeChip, form.type === t && styles.typeChipActive]}
                  >
                    <Text style={[styles.typeChipText, form.type === t && styles.typeChipTextActive]}>
                      {TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Content fields */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ad Content</Text>
              <Input
                label="Title *"
                value={form.title}
                onChangeText={(v) => {
                  setForm((p) => ({ ...p, title: v }));
                  if (errors.title) setErrors((p) => ({ ...p, title: null }));
                }}
                placeholder="Enter a catchy headline"
                error={errors.title}
              />
              <Input
                label="Description *"
                value={form.description}
                onChangeText={(v) => {
                  setForm((p) => ({ ...p, description: v }));
                  if (errors.description) setErrors((p) => ({ ...p, description: null }));
                }}
                placeholder="Briefly describe what you are promoting"
                multiline
                numberOfLines={4}
                error={errors.description}
              />
            </View>

            {/* CTA fields */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Call to Action</Text>
              <Input
                label="Button Text"
                value={form.cta_text}
                onChangeText={(v) => setForm((p) => ({ ...p, cta_text: v }))}
                placeholder="Learn More"
              />
              <Input
                label="Target URL"
                value={form.cta_link}
                onChangeText={(v) => setForm((p) => ({ ...p, cta_link: v }))}
                placeholder="https://example.com"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            {/* Image picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ad Image *</Text>
              <TouchableOpacity
                onPress={pickImage}
                activeOpacity={0.8}
                style={[styles.imagePicker, errors.image && styles.imagePickerError]}
              >
                {pickedImage ? (
                  <Image
                    source={{ uri: pickedImage.uri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderIcon}>🖼️</Text>
                    <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                    <Text style={styles.imagePlaceholderSub}>JPG, PNG · Max 2MB</Text>
                  </View>
                )}
              </TouchableOpacity>
              {errors.image ? (
                <Text style={styles.errorText}>{errors.image}</Text>
              ) : null}
              {pickedImage ? (
                <TouchableOpacity onPress={pickImage} style={{ marginTop: spacing.sm }}>
                  <Text style={styles.changeImage}>Change image</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Bottom submit button (extra convenience) */}
            <View style={styles.submitRow}>
              <Button
                title={saving ? "Creating…" : "Create Ad"}
                onPress={handleCreate}
                loading={saving}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </RNModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  /* ── List ── */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  pageTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filterRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: spacing.sm },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { fontSize: 10, fontWeight: "700", color: colors.textMuted },
  chipTextActive: { color: "#fff" },
  cardRow: { flexDirection: "row", gap: spacing.sm },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.bg },
  adTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  metricsRow: { flexDirection: "row", gap: spacing.md, marginTop: 6, flexWrap: "wrap" },
  metricText: { fontSize: 11, color: colors.textMuted },

  /* ── Full-screen form ── */
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + spacing.sm : spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backIcon: { fontSize: 18, color: colors.primary, fontWeight: "700" },
  backText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  formTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  formBody: { padding: spacing.md, paddingBottom: spacing.xxl },
  section: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  typeChipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  typeChipText: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  typeChipTextActive: { color: "#fff" },
  imagePicker: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    overflow: "hidden",
    minHeight: 160,
    justifyContent: "center",
  },
  imagePickerError: { borderColor: colors.danger },
  imagePreview: { width: "100%", height: 200 },
  imagePlaceholder: { alignItems: "center", paddingVertical: spacing.xl },
  imagePlaceholderIcon: { fontSize: 36, marginBottom: 8 },
  imagePlaceholderText: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  imagePlaceholderSub: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  errorText: { fontSize: 11, color: colors.danger, marginTop: 4 },
  changeImage: { fontSize: 12, fontWeight: "700", color: colors.primary, textAlign: "center" },
  submitRow: { marginTop: spacing.sm },
});
