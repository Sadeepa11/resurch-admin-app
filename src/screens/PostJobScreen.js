import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
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
  company: "",
  location: "",
  job_type: "full-time",
  salary: "",
  description: "",
  requirements: "",
  benefits: "",
  application_url: "",
  expires_at: "",
};

export default function PostJobScreen() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.company) {
      Alert.alert("Required", "Title and company are required.");
      return;
    }
    setSaving(true);
    try {
      await jobsApi.create(form);
      Alert.alert("Posted", "Job has been posted.", [{ text: "OK", onPress: () => setForm(EMPTY) }]);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Could not post job");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>📝 Post a New Job</Text>
        <Input label="Job Title *" value={form.title} onChangeText={(v) => set("title", v)} autoCapitalize="words" />
        <Input label="Company *" value={form.company} onChangeText={(v) => set("company", v)} autoCapitalize="words" />
        <Input label="Location" value={form.location} onChangeText={(v) => set("location", v)} />
        <Select label="Type" value={form.job_type} onValueChange={(v) => set("job_type", v)} options={TYPES} />
        <Input label="Salary" value={form.salary} onChangeText={(v) => set("salary", v)} placeholder="e.g. $50,000 - $80,000" />
        <Input label="Description" value={form.description} onChangeText={(v) => set("description", v)} multiline numberOfLines={4} />
        <Input label="Requirements" value={form.requirements} onChangeText={(v) => set("requirements", v)} multiline numberOfLines={4} />
        <Input label="Benefits" value={form.benefits} onChangeText={(v) => set("benefits", v)} multiline numberOfLines={3} />
        <Input label="Application URL" value={form.application_url} onChangeText={(v) => set("application_url", v)} keyboardType="url" />
        <Input label="Expires (YYYY-MM-DD)" value={form.expires_at} onChangeText={(v) => set("expires_at", v)} />

        <Button title="Publish Job" onPress={submit} loading={saving} fullWidth />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
});
