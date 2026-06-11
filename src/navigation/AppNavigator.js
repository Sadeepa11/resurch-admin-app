import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { colors, spacing, radius } from "../theme/colors";
import { dashboardApi, notificationsApi } from "../api/endpoints";

const LOGO = require("../../assets/logo-source.png");

import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import UserManagementScreen from "../screens/UserManagementScreen";
import AdminManagementScreen from "../screens/AdminManagementScreen";
import BlockedUsersScreen from "../screens/BlockedUsersScreen";
import VideoValidationScreen from "../screens/VideoValidationScreen";
import VideoUploadPaymentsScreen from "../screens/VideoUploadPaymentsScreen";
import ResearchPapersScreen from "../screens/ResearchPapersScreen";
import InnovationReviewScreen from "../screens/InnovationReviewScreen";
import ResearchReviewScreen from "../screens/ResearchReviewScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";
import RemoveContentScreen from "../screens/RemoveContentScreen";
import MarketingScreen from "../screens/MarketingScreen";
import HubCardsScreen from "../screens/HubCardsScreen";
import JobManagementScreen from "../screens/JobManagementScreen";
import PostJobScreen from "../screens/PostJobScreen";
import CommunityManagementScreen from "../screens/CommunityManagementScreen";
import InvestorZoneScreen from "../screens/InvestorZoneScreen";
import HireRequestsScreen from "../screens/HireRequestsScreen";
import AdvertisementsScreen from "../screens/AdvertisementsScreen";
import MembershipsScreen from "../screens/MembershipsScreen";
import PaymentsRevenueScreen from "../screens/PaymentsRevenueScreen";
import TransactionAnalyticsScreen from "../screens/TransactionAnalyticsScreen";
import AuditLogsScreen from "../screens/AuditLogsScreen";
import RolePermissionsScreen from "../screens/RolePermissionsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Drawer menu groups (mirrors web sidebar)
const MENU_GROUPS = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", icon: "stats-chart", title: "Dashboard" },
    ],
  },
  {
    label: "User Management",
    items: [
      { name: "UserManagement", icon: "people", title: "All Users", perm: "all_users" },
      { name: "AdminManagement", icon: "shield-checkmark", title: "Admin Users", perm: "admin_users" },
      { name: "BlockedUsers", icon: "ban", title: "Blocked Users", perm: "blocked_users" },
    ],
  },
  {
    label: "Innovation & Research",
    items: [
      { name: "VideoValidation", icon: "videocam", title: "Video Validation", perm: "video_validation", badgeKey: "video_validation" },
      { name: "VideoUploadPayments", icon: "cash", title: "Video Upload Payments", perm: "video_upload_payments" },
      { name: "ResearchPapers", icon: "document-text", title: "Research Papers", perm: "research_papers", badgeKey: "research_papers" },
      { name: "InnovationReview", icon: "bulb", title: "Innovation Reviews", perm: "innovation_review" },
      { name: "ResearchReview", icon: "book", title: "Research Reviews", perm: "research_review" },
      { name: "Leaderboard", icon: "trophy", title: "Leaderboard", perm: "leaderboard" },
      { name: "RemoveContent", icon: "trash", title: "Remove Content", perm: "remove_content", danger: true },
      { name: "Marketing", icon: "megaphone", title: "Marketing", perm: "marketing" },
    ],
  },
  {
    label: "Site Management",
    items: [
      { name: "HubCards", icon: "grid", title: "Home Hub Cards", perm: "hub_cards" },
      { name: "JobManagement", icon: "briefcase", title: "Job Management", perm: "job_management", badgeKey: "job_management" },
      { name: "PostJob", icon: "add-circle", title: "Post New Job", perm: "post_job" },
    ],
  },
  {
    label: "Community & Social",
    items: [
      { name: "CommunityManagement", icon: "chatbubbles", title: "Community Posts", perm: "community_management", badgeKey: "community_management" },
      { name: "InvestorZone", icon: "trending-up", title: "Investor Zone", perm: "investor_zone_management", badgeKey: "investor_zone" },
      { name: "HireRequests", icon: "hand-right", title: "Hire Requests", perm: "hire_requests", badgeKey: "hire_requests" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { name: "Advertisements", icon: "megaphone-outline", title: "Advertisements", perm: "advertisements" },
      { name: "Memberships", icon: "ribbon", title: "Memberships", perm: "membership_management" },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "PaymentsRevenue", icon: "wallet", title: "Payments & Revenue", perm: "payments" },
      { name: "TransactionAnalytics", icon: "analytics", title: "Transaction Analytics", perm: "transaction_analytics" },
    ],
  },
  {
    label: "System",
    items: [
      { name: "AuditLogs", icon: "lock-closed", title: "Audit Logs", perm: "audit_logs" },
      { name: "RolePermissions", icon: "key", title: "Role Permissions", superAdminOnly: true },
    ],
  },
];

const SCREEN_COMPONENTS = {
  Dashboard: DashboardScreen,
  UserManagement: UserManagementScreen,
  AdminManagement: AdminManagementScreen,
  BlockedUsers: BlockedUsersScreen,
  VideoValidation: VideoValidationScreen,
  VideoUploadPayments: VideoUploadPaymentsScreen,
  ResearchPapers: ResearchPapersScreen,
  InnovationReview: InnovationReviewScreen,
  ResearchReview: ResearchReviewScreen,
  Leaderboard: LeaderboardScreen,
  RemoveContent: RemoveContentScreen,
  Marketing: MarketingScreen,
  HubCards: HubCardsScreen,
  JobManagement: JobManagementScreen,
  PostJob: PostJobScreen,
  CommunityManagement: CommunityManagementScreen,
  InvestorZone: InvestorZoneScreen,
  HireRequests: HireRequestsScreen,
  Advertisements: AdvertisementsScreen,
  Memberships: MembershipsScreen,
  PaymentsRevenue: PaymentsRevenueScreen,
  TransactionAnalytics: TransactionAnalyticsScreen,
  AuditLogs: AuditLogsScreen,
  RolePermissions: RolePermissionsScreen,
  Notifications: NotificationsScreen,
};

const DEFAULT_PERMISSIONS = {
  manager: {
    dashboard: true, all_users: true, admin_users: false, blocked_users: true,
    video_validation: true, video_upload_payments: true, research_papers: true, innovation_review: true,
    research_review: true, leaderboard: true, remove_content: false,
    marketing: false, hub_cards: true, job_management: true, post_job: true,
    community_management: true, investor_zone_management: true, hire_requests: true,
    advertisements: true, membership_management: false,
    payments: true, transaction_analytics: true, audit_logs: false,
  },
  marketing: {
    dashboard: true, marketing: true, advertisements: true,
  },
  admin: {
    dashboard: true, all_users: true, blocked_users: true,
    video_validation: true, research_papers: true, innovation_review: true, research_review: true,
    leaderboard: true, hub_cards: true, job_management: true, post_job: true,
    community_management: true, investor_zone_management: true, hire_requests: true,
    advertisements: true, payments: true, transaction_analytics: true, audit_logs: true,
  },
};

function getAllowedItems(role, isSuperAdmin) {
  const allItems = MENU_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));
  if (isSuperAdmin) return allItems;
  const perms = DEFAULT_PERMISSIONS[role] || {};
  return allItems
    .filter((i) => !i.superAdminOnly)
    .filter((i) => !i.perm || perms[i.perm]);
}

function CustomDrawerContent(props) {
  const { user, logout, role, isSuperAdmin } = useAuth();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await dashboardApi.sidebarCounts();
        if (res.data?.data) setCounts(res.data.data);
      } catch (_) {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () =>
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);

  const initials =
    `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "AD";

  return (
    <View style={drawerStyles.root}>
      <View style={drawerStyles.header}>
        <View style={drawerStyles.brandRow}>
          <View style={drawerStyles.brandLogoBox}>
            <Image source={LOGO} style={drawerStyles.brandLogo} resizeMode="contain" />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={drawerStyles.brandTitle}>Admin Panel</Text>
            <Text style={drawerStyles.brandSub}>Manage your platform</Text>
          </View>
        </View>
        <View style={drawerStyles.userRow}>
          <View style={drawerStyles.avatar}>
            <Text style={drawerStyles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={drawerStyles.userName} numberOfLines={1}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "Admin"}
            </Text>
            <Text style={drawerStyles.userEmail} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
        <View style={drawerStyles.roleBadge}>
          <Text style={drawerStyles.roleBadgeText}>{role || "user"}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.sm }}>
        {MENU_GROUPS.map((group) => {
          const allowed = group.items
            .filter((i) => isSuperAdmin || !i.superAdminOnly)
            .filter((i) => isSuperAdmin || !i.perm || (DEFAULT_PERMISSIONS[role] || {})[i.perm]);
          if (allowed.length === 0) return null;
          return (
            <View key={group.label} style={drawerStyles.group}>
              <Text style={drawerStyles.groupLabel}>{group.label}</Text>
              {allowed.map((item) => {
                const focused = props.state.routeNames[props.state.index] === item.name;
                const badgeCount = item.badgeKey ? (counts[item.badgeKey] || 0) : 0;
                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => props.navigation.navigate(item.name)}
                    style={[drawerStyles.item, focused && drawerStyles.itemActive]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.danger ? colors.danger : focused ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        drawerStyles.itemText,
                        item.danger && { color: colors.danger },
                        focused && { color: colors.primary, fontWeight: "700" },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {badgeCount > 0 && (
                      <View style={drawerStyles.badge}>
                        <Text style={drawerStyles.badgeText}>
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity onPress={handleLogout} style={drawerStyles.logoutBtn}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={drawerStyles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

function BellButton({ navigation, unreadCount }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Notifications")}
      style={styles.bellBtn}
    >
      <Ionicons name="notifications-outline" size={22} color={colors.text} />
      {unreadCount > 0 && (
        <View style={styles.bellBadge}>
          <Text style={styles.bellBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function AdminDrawer() {
  const { role, isSuperAdmin } = useAuth();
  const allowed = getAllowedItems(role, isSuperAdmin);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationsApi.unreadCount();
        const count = res.data?.unread_count ?? 0;
        setUnreadCount(count);
      } catch (_) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        drawerStyle: { width: 290 },
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontSize: 16, fontWeight: "700", color: colors.text },
        headerTintColor: colors.primary,
        headerRight: () => (
          <BellButton navigation={navigation} unreadCount={unreadCount} />
        ),
      })}
    >
      {allowed.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          component={SCREEN_COMPONENTS[item.name]}
          options={{ title: item.title }}
        />
      ))}
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Notifications", drawerItemStyle: { display: "none" } }}
      />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 16, color: colors.primary, fontWeight: "700" }}>Loading…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={AdminDrawer} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const drawerStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    paddingTop: spacing.xxl + spacing.md,
  },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  brandLogoBox: {
    backgroundColor: "#fff",
    paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: 10,
  },
  brandLogo: { width: 70, height: 22 },
  brandTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  brandSub: { color: "rgba(255,255,255,0.85)", fontSize: 11 },
  userRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  userName: { color: "#fff", fontSize: 13, fontWeight: "700" },
  userEmail: { color: "rgba(255,255,255,0.85)", fontSize: 11 },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  roleBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  group: { marginBottom: spacing.sm },
  groupLabel: {
    fontSize: 10, fontWeight: "800", color: colors.textLight,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.xs,
    textTransform: "uppercase", letterSpacing: 0.6,
  },
  item: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, paddingHorizontal: spacing.lg,
  },
  itemActive: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  itemText: {
    marginLeft: spacing.sm, fontSize: 13, fontWeight: "600",
    color: colors.text, flex: 1,
  },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 5, marginLeft: spacing.xs,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800", lineHeight: 12 },
  logoutBtn: {
    margin: spacing.md,
    backgroundColor: colors.primary,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: radius.md,
  },
  logoutText: { color: "#fff", fontSize: 13, fontWeight: "700", marginLeft: 6 },
});

const styles = StyleSheet.create({
  bellBtn: { marginRight: spacing.md, padding: 4 },
  bellBadge: {
    position: "absolute", top: 0, right: spacing.md - 4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800", lineHeight: 11 },
});
