import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Screen, Card, Button, Input, Select } from "../components/ui";
import { jobsApi } from "../api/endpoints";
import { colors, spacing } from "../theme/colors";

const TYPES = [
  { label: "Full-time", value: "full-time" },
  { label: "Part-time", value: "part-time" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
];

const EMPTY = {
  title: "",
  company_name: "", // API expects company_name
  location: "",
  job_type: "full-time",
  category: "", // New field for category required by API
  salary: "",
  description: "",
  requirements: "",
  benefits: "",
  apply_link: "", // API expects apply_link
  expires_at: "",
};

export default function PostJobScreen() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.company_name || !form.apply_link || !form.category) {
      Alert.alert("Required", "Title, company name, apply link, and category are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await jobsApi.create(form);
      console.log("Post Job API Response:", JSON.stringify(res.data, null, 2));
      Alert.alert("Posted", "Job has been posted.", [{ text: "OK", onPress: () => setForm(EMPTY) }]);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Could not post job");
      console.warn("Post Job Error:", JSON.stringify(e.response?.data || e, null, 2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll={false} padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 80}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <Text style={styles.title}>📝 Post a New Job</Text>
            <Input label="Job Title *" value={form.title} onChangeText={(v) => set("title", v)} autoCapitalize="words" />
            <Input label="Company Name *" value={form.company_name} onChangeText={(v) => set("company_name", v)} autoCapitalize="words" />
            <Input label="Location" value={form.location} onChangeText={(v) => set("location", v)} />
            <Select label="Job Type" value={form.job_type} onValueChange={(v) => set("job_type", v)} options={TYPES} />
            <Input label="Category *" value={form.category} onChangeText={(v) => set("category", v)} placeholder="e.g. Software, Marketing" />
            <Input label="Salary" value={form.salary} onChangeText={(v) => set("salary", v)} placeholder="e.g. $50,000 - $80,000" />
            <Input label="Description" value={form.description} onChangeText={(v) => set("description", v)} multiline numberOfLines={4} />
            <Input label="Requirements" value={form.requirements} onChangeText={(v) => set("requirements", v)} multiline numberOfLines={4} />
            <Input label="Benefits" value={form.benefits} onChangeText={(v) => set("benefits", v)} multiline numberOfLines={3} />
            <Input label="Apply Link / Application URL *" value={form.apply_link} onChangeText={(v) => set("apply_link", v)} />
            <Input label="Expires (YYYY-MM-DD)" value={form.expires_at} onChangeText={(v) => set("expires_at", v)} />

            <Button title="Publish Job" onPress={submit} loading={saving} fullWidth />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
});
