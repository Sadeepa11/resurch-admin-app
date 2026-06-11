import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Button, Input, Badge, Modal, EmptyState, Select } from "../components/ui";
import { usersApi } from "../api/endpoints";
import { colors, spacing, radius } from "../theme/colors";

const ROLES = [
  { label: "All Roles", value: "" },
  { label: "General User", value: "GENERAL_USER" },
  { label: "Investor", value: "INVESTOR" },
  { label: "Both", value: "BOTH" },
  { label: "Manager", value: "manager" },
  { label: "Marketing", value: "marketing" },
  { label: "Admin", value: "admin" },
  { label: "Super Admin", value: "superadmin" },
];

const STATUSES = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Pending", value: "Pending" },
];

function UserCard({ user, onToggle, onEdit, onDelete }) {
  const status = (user.status || "Active").toLowerCase();
  const tone = status === "active" ? "success" : status === "pending" ? "warning" : "danger";
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.first_name || user.email || "?")[0]?.toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.tagRow}>
            <Badge tone="info">{user.role || "User"}</Badge>
            <Badge tone={tone}>{user.status || "Active"}</Badge>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Button title="Edit" variant="outline" size="sm" onPress={() => onEdit(user)} />
        <Button
          title={status === "active" ? "Deactivate" : "Activate"}
          variant={status === "active" ? "warning" : "success"}
          size="sm"
          onPress={() => onToggle(user)}
        />
        <Button title="Delete" variant="danger" size="sm" onPress={() => onDelete(user)} />
      </View>
    </Card>
  );
}

function UserFormModal({ visible, onClose, onSave, user }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "manager",
    password: "",
    phone: "",
    address: "",
    userType: "OTHER",
    schoolName: "",
    gradeLevel: "",
    studentId: "",
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentPhone: "",
    relation: "Father",
    investmentPreferences: "",
  });

  useEffect(() => {
    if (user) {
      const isStudent = user.user_type === 'student' || user.schoolName || user.gradeLevel;
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        role: user.role || "manager",
        password: "",
        phone: user.phone || user.phoneNumber || "",
        address: user.address || "",
        userType: user.user_type || (isStudent ? "SCHOOL_STUDENT" : "OTHER"),
        schoolName: user.schoolName || "",
        gradeLevel: user.gradeLevel ? String(user.gradeLevel) : "",
        studentId: user.studentId || "",
        parentFirstName: user.parentFirstName || "",
        parentLastName: user.parentLastName || "",
        parentEmail: user.parentEmail || "",
        parentPhone: user.parentPhone || "",
        relation: user.relation || "Father",
        investmentPreferences: user.investmentPreferences || "",
      });
    } else {
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        role: "manager",
        password: "",
        phone: "",
        address: "",
        userType: "OTHER",
        schoolName: "",
        gradeLevel: "",
        studentId: "",
        parentFirstName: "",
        parentLastName: "",
        parentEmail: "",
        parentPhone: "",
        relation: "Father",
        investmentPreferences: "",
      });
    }
  }, [user, visible]);

  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const isStudent = form.userType === "SCHOOL_STUDENT";

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={user ? "Edit User" : "Add User"}
      footer={
        <>
          <Button title="Cancel" variant="outline" onPress={onClose} />
          <Button title={user ? "Save" : "Create"} onPress={submit} loading={saving} />
        </>
      }
    >
      <Input label="First name" value={form.first_name} onChangeText={(v) => setForm({ ...form, first_name: v })} autoCapitalize="words" />
      <Input label="Last name" value={form.last_name} onChangeText={(v) => setForm({ ...form, last_name: v })} autoCapitalize="words" />
      <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />
      
      <Select
        label="Role"
        value={form.role}
        onValueChange={(v) => setForm({ ...form, role: v })}
        options={[
          { label: "Manager", value: "manager" },
          { label: "Marketing", value: "marketing" },
          { label: "Admin", value: "admin" },
          { label: "Super Admin", value: "superadmin" },
          { label: "General User", value: "GENERAL_USER" },
          { label: "Investor", value: "INVESTOR" },
          { label: "Both", value: "BOTH" },
        ]}
      />

      <Input
        label={user ? "Password (leave blank to keep)" : "Password"}
        value={form.password}
        onChangeText={(v) => setForm({ ...form, password: v })}
        secureTextEntry
      />

      {/* Phone Number and Address */}
      {["GENERAL_USER", "INVESTOR", "BOTH"].includes(form.role) && (
        <>
          <Input label="Phone Number" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
          <Input label="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
        </>
      )}

      {/* User Type for General Users */}
      {["GENERAL_USER", "BOTH"].includes(form.role) && (
        <Select
          label="User Type"
          value={form.userType}
          onValueChange={(v) => setForm({ ...form, userType: v })}
          options={[
            { label: "Other", value: "OTHER" },
            { label: "School Student", value: "SCHOOL_STUDENT" },
          ]}
        />
      )}

      {/* Student Fields */}
      {["GENERAL_USER", "BOTH"].includes(form.role) && isStudent && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Student Details</Text>
          <Input label="School Name" value={form.schoolName} onChangeText={(v) => setForm({ ...form, schoolName: v })} />
          <Input label="Grade Level" value={form.gradeLevel} onChangeText={(v) => setForm({ ...form, gradeLevel: v })} keyboardType="number-pad" />
          <Input label="Student ID" value={form.studentId} onChangeText={(v) => setForm({ ...form, studentId: v })} />
          
          <Text style={styles.sectionHeader}>Parent/Guardian Details</Text>
          <Input label="Parent First Name" value={form.parentFirstName} onChangeText={(v) => setForm({ ...form, parentFirstName: v })} />
          <Input label="Parent Last Name" value={form.parentLastName} onChangeText={(v) => setForm({ ...form, parentLastName: v })} />
          <Input label="Parent Email" value={form.parentEmail} onChangeText={(v) => setForm({ ...form, parentEmail: v })} keyboardType="email-address" />
          <Input label="Parent Phone" value={form.parentPhone} onChangeText={(v) => setForm({ ...form, parentPhone: v })} keyboardType="phone-pad" />
          <Select
            label="Relation"
            value={form.relation}
            onValueChange={(v) => setForm({ ...form, relation: v })}
            options={[
              { label: "Father", value: "Father" },
              { label: "Mother", value: "Mother" },
              { label: "Guardian", value: "Guardian" },
              { label: "Other", value: "Other" },
            ]}
          />
        </View>
      )}

      {/* Investor Fields */}
      {["INVESTOR", "BOTH"].includes(form.role) && (
        <Input
          label="Investment Preferences"
          value={form.investmentPreferences}
          onChangeText={(v) => setForm({ ...form, investmentPreferences: v })}
          placeholder="e.g. Technology, healthcare, seed stage"
          multiline
        />
      )}
    </Modal>
  );
}

export default function UserManagementScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await usersApi.list({ search, role, status, per_page: 50 });
      
      // Fix: Handle direct array response
      const list = Array.isArray(res.data) ? res.data : (res.data?.data?.data || res.data?.data || []);
      
      setUsers(list);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, role, status]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      load();
    }, 350);
    return () => clearTimeout(t);
  }, [load]);

  const onToggle = async (user) => {
    try {
      await usersApi.toggleStatus(user.id);
      load();
    } catch (e) {
      Alert.alert("Error", "Could not change status.");
    }
  };

  const onDelete = (user) =>
    Alert.alert("Delete user", `Permanently remove ${user.email}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await usersApi.remove(user.id);
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
          } catch {
            Alert.alert("Error", "Delete failed.");
          }
        },
      },
    ]);

  const onSave = async (form) => {
    const isRegularUser = ["GENERAL_USER", "INVESTOR", "BOTH"].includes(form.role);

    if (editing) {
      // Edit User
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      };

      if (form.password) {
        payload.password = form.password;
      }

      // If they are an admin, update role. If they are regular, do not send role to avoid validation fail on PUT
      const adminRoles = ["admin", "manager", "marketing", "superadmin"];
      if (adminRoles.includes(form.role.toLowerCase())) {
        payload.role = form.role.toLowerCase();
      }

      if (form.userType === "SCHOOL_STUDENT") {
        payload.schoolName = form.schoolName;
        payload.gradeLevel = form.gradeLevel;
        payload.studentId = form.studentId;
        payload.parentFirstName = form.parentFirstName;
        payload.parentLastName = form.parentLastName;
        payload.parentEmail = form.parentEmail;
        payload.parentPhone = form.parentPhone;
        payload.relation = form.relation;
      }

      if (form.role === "INVESTOR" || form.role === "BOTH") {
        payload.investmentPreferences = form.investmentPreferences;
      }

      await usersApi.update(editing.id, payload);
    } else {
      // Create User
      if (isRegularUser) {
        if (form.role === "INVESTOR") {
          const payload = {
            investorDetails: {
              firstName: form.first_name,
              lastName: form.last_name,
              email: form.email,
              password: form.password,
              phone: form.phone,
              address: form.address || "",
              investmentPreferences: form.investmentPreferences,
            },
          };
          await usersApi.registerInvestor(payload);
        } else if (form.role === "GENERAL_USER") {
          const payload = {
            generalUserDetails: {
              firstName: form.first_name,
              lastName: form.last_name,
              email: form.email,
              password: form.password,
              phone: form.phone,
            },
            isSchoolStudent: form.userType === "SCHOOL_STUDENT",
          };
          if (form.userType === "SCHOOL_STUDENT") {
            payload.studentDetails = {
              schoolName: form.schoolName,
              gradeLevel: parseInt(form.gradeLevel) || 0,
              studentId: form.studentId,
            };
            payload.parentDetails = {
              parentFirstName: form.parentFirstName,
              parentLastName: form.parentLastName,
              parentEmail: form.parentEmail,
              parentPhone: form.parentPhone,
              relation: form.relation,
            };
          }
          await usersApi.registerGeneralUser(payload);
        } else if (form.role === "BOTH") {
          const payload = {
            coreDetails: {
              firstName: form.first_name,
              lastName: form.last_name,
              email: form.email,
              password: form.password,
            },
            investorDetails: {
              phone: form.phone,
              address: form.address || "",
              investmentPreferences: form.investmentPreferences,
            },
            isSchoolStudent: form.userType === "SCHOOL_STUDENT",
          };
          if (form.userType === "SCHOOL_STUDENT") {
            payload.studentDetails = {
              schoolName: form.schoolName,
              gradeLevel: parseInt(form.gradeLevel) || 0,
              studentId: form.studentId,
            };
            payload.parentDetails = {
              parentFirstName: form.parentFirstName,
              parentLastName: form.parentLastName,
              parentEmail: form.parentEmail,
              parentPhone: form.parentPhone,
              relation: form.relation,
            };
          }
          await usersApi.registerBoth(payload);
        }
      } else {
        // Admin user creation
        const payload = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          role: form.role.toLowerCase(),
          user_type: "admin",
        };
        await usersApi.create(payload);
      }
    }
    load();
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Input
          label="Search"
          placeholder="Name, email…"
          value={search}
          onChangeText={setSearch}
        />
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Select label="Role" value={role} onValueChange={setRole} options={ROLES} />
          </View>
          <View style={{ flex: 1 }}>
            <Select label="Status" value={status} onValueChange={setStatus} options={STATUSES} />
          </View>
        </View>
        <Button
          title="+ Add User"
          fullWidth
          onPress={() => {
            setEditing(null);
            setShowForm(true);
          }}
        />
      </View>

      {loading ? (
        <EmptyState loading />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={(u) => {
                setEditing(u);
                setShowForm(true);
              }}
            />
          )}
          contentContainerStyle={{ padding: spacing.md }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListEmptyComponent={<EmptyState title="No users" />}
        />
      )}

      <UserFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={onSave}
        user={editing}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: "row" },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center", marginRight: spacing.sm,
  },
  avatarText: { color: colors.primary, fontWeight: "800", fontSize: 16 },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tagRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  actions: {
    flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  sectionContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: "#f9fafb",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
});
