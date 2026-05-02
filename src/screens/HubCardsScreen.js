import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Screen, Card, Button, Input, Modal, EmptyState } from "../components/ui";
import { hubCardsApi } from "../api/endpoints";
import { colors, spacing, radius } from "../theme/colors";

export default function HubCardsScreen() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ label: "", subtitle: "", description: "", tag: "", image: "" });
  const [pickedImage, setPickedImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await hubCardsApi.list();
      setCards(res.data?.data || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (c) => {
    setEditing(c);
    setForm({
      label: c.label || "",
      subtitle: c.subtitle || "",
      description: c.description || "",
      tag: c.tag || "",
      image: c.image || "",
    });
    setPickedImage(null);
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
    }
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("label", form.label);
      fd.append("subtitle", form.subtitle);
      fd.append("description", form.description);
      fd.append("tag", form.tag);
      fd.append("_method", "PUT");
      if (pickedImage) {
        const uri = pickedImage.uri;
        const name = uri.split("/").pop() || "image.jpg";
        const type = pickedImage.mimeType || "image/jpeg";
        fd.append("image", { uri, name, type });
      }
      await hubCardsApi.update(editing.id, fd);
      setEditing(null);
      load();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll={false}>
      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(c) => String(c.id)}
          renderItem={({ item }) => (
            <Card>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : null}
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
              {item.tag ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>{item.tag}</Text>
                </View>
              ) : null}
              <Button title="Edit" variant="outline" size="sm" onPress={() => startEdit(item)} style={{ marginTop: spacing.sm }} />
            </Card>
          )}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={<EmptyState icon="🎴" title="No hub cards" />}
        />
      )}

      <Modal
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit: ${editing?.label || ""}`}
        footer={
          <>
            <Button title="Cancel" variant="outline" onPress={() => setEditing(null)} />
            <Button title="Save" onPress={save} loading={saving} />
          </>
        }
      >
        <Input label="Label" value={form.label} onChangeText={(v) => setForm({ ...form, label: v })} />
        <Input label="Subtitle" value={form.subtitle} onChangeText={(v) => setForm({ ...form, subtitle: v })} />
        <Input label="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />
        <Input label="Tag" value={form.tag} onChangeText={(v) => setForm({ ...form, tag: v })} />
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, marginBottom: 4 }}>Image</Text>
        {pickedImage ? (
          <Image source={{ uri: pickedImage.uri }} style={styles.preview} />
        ) : form.image ? (
          <Image source={{ uri: form.image }} style={styles.preview} />
        ) : null}
        <Button title="📷 Choose Image" variant="outline" onPress={pickImage} />
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: 140, borderRadius: radius.md, marginBottom: spacing.sm, backgroundColor: colors.bg },
  preview: { width: "100%", height: 160, borderRadius: radius.md, marginBottom: spacing.sm, backgroundColor: colors.bg },
  label: { fontSize: 16, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  desc: { fontSize: 12, color: colors.text, marginTop: 6 },
  tagPill: {
    alignSelf: "flex-start", marginTop: spacing.sm,
    backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.full,
  },
  tagText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
});
