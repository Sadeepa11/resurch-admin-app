import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";

const LOGO = require("../../assets/logo-source.png");
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";

import { dashboardApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, radius, shadow } from "../theme/colors";

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - spacing.md * 2 - spacing.md * 2;

const RANGES = [
  { label: "24H", value: "24hours" },
  { label: "7D", value: "7days" },
  { label: "30D", value: "30days" },
  { label: "90D", value: "90days" },
];

const STAT_META = {
  Users: { icon: "people", color: colors.accent, bg: colors.accentLight },
  Revenue: { icon: "cash", color: colors.success, bg: "#d1fae5" },
  Innovations: { icon: "bulb", color: colors.primary, bg: "#fee2e2" },
  Research: { icon: "document-text", color: colors.purple, bg: "#ede9fe" },
  Orders: { icon: "cart", color: colors.warning, bg: "#fef3c7" },
};

const PIE_PALETTE = [
  "#dc2626", "#ea580c", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#64748b", "#84cc16",
];

const QUICK_ACTIONS = [
  { label: "Users", icon: "people", route: "UserManagement", color: colors.accent, bg: colors.accentLight },
  { label: "Reviews", icon: "bulb", route: "InnovationReview", color: colors.primary, bg: "#fee2e2" },
  { label: "Payments", icon: "wallet", route: "PaymentsRevenue", color: colors.success, bg: "#d1fae5" },
  { label: "Audit", icon: "lock-closed", route: "AuditLogs", color: colors.purple, bg: "#ede9fe" },
];

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  propsForBackgroundLines: { stroke: "#f3f4f6", strokeDasharray: "4" },
  propsForLabels: { fontSize: 10, fontWeight: "600" },
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#dc2626" },
  fillShadowGradient: "#dc2626",
  fillShadowGradientOpacity: 0.15,
};

function getMetric(stat) {
  const label = (stat.label || "").toLowerCase();
  if (label.includes("user")) return STAT_META.Users;
  if (label.includes("revenue") || label.includes("payment")) return STAT_META.Revenue;
  if (label.includes("innovation")) return STAT_META.Innovations;
  if (label.includes("research")) return STAT_META.Research;
  if (label.includes("order")) return STAT_META.Orders;
  return { icon: "stats-chart", color: colors.text, bg: colors.bg };
}

function StatCard({ stat }) {
  const meta = getMetric(stat);
  const isPositive = String(stat.change || "").startsWith("+");
  const isNegative = String(stat.change || "").startsWith("-");
  return (
    <View style={[styles.statCard, shadow.card]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIconBox, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>
        {stat.change ? (
          <View
            style={[
              styles.changeBadge,
              {
                backgroundColor: isPositive
                  ? colors.successLight
                  : isNegative
                  ? colors.dangerLight
                  : "#f3f4f6",
              },
            ]}
          >
            <Ionicons
              name={isPositive ? "trending-up" : isNegative ? "trending-down" : "remove"}
              size={10}
              color={isPositive ? colors.success : isNegative ? colors.danger : colors.textMuted}
            />
            <Text
              style={[
                styles.changeText,
                { color: isPositive ? colors.success : isNegative ? colors.danger : colors.textMuted },
              ]}
            >
              {stat.change}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>{stat.value}</Text>
    </View>
  );
}

function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <View style={styles.sectionTitleRow}>
          {icon ? <Ionicons name={icon} size={16} color={colors.primary} /> : null}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

function activityIconFor(type) {
  switch (type) {
    case "user": return { name: "person-add", color: colors.accent, bg: colors.accentLight };
    case "payment": return { name: "card", color: colors.success, bg: "#d1fae5" };
    case "content": return { name: "document-text", color: colors.purple, bg: "#ede9fe" };
    case "alert": return { name: "warning", color: colors.warning, bg: "#fef3c7" };
    default: return { name: "ellipse", color: colors.textMuted, bg: "#f3f4f6" };
  }
}

function buildChartData(arr, key) {
  const safe = Array.isArray(arr) ? arr : [];
  if (!safe.length) return null;
  const labels = safe.slice(-7).map((d) => String(d.month || d.day || d.date || "").slice(0, 3));
  const data = safe.slice(-7).map((d) => Number(d[key] || 0));
  if (data.every((v) => v === 0)) return null;
  return { labels, datasets: [{ data }] };
}

function buildPieData(arr) {
  const safe = Array.isArray(arr) ? arr : [];
  return safe.slice(0, 6).map((c, i) => ({
    name: String(c.category || "Other").slice(0, 14),
    population: Number(c.count || 0),
    color: PIE_PALETTE[i % PIE_PALETTE.length],
    legendFontColor: colors.textMuted,
    legendFontSize: 11,
  }));
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [range, setRange] = useState("7days");
  const [data, setData] = useState({
    stats: [],
    revenueData: [],
    userGrowth: [],
    contentTrend: [],
    categoryDist: { innovations: [], research: [] },
    topPerformers: { innovations: [], research: [] },
    engagementTrend: [],
    realtimeActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await dashboardApi.stats(range);
      if (res.data?.success) {
        setData((prev) => ({ ...prev, ...(res.data.data || {}) }));
      }
    } catch (e) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const userGrowthChart = useMemo(() => buildChartData(data.userGrowth, "users"), [data.userGrowth]);
  const innovationTrend = useMemo(() => buildChartData(data.contentTrend, "innovations"), [data.contentTrend]);
  const researchTrend = useMemo(() => buildChartData(data.contentTrend, "research"), [data.contentTrend]);
  const revenueChart = useMemo(() => buildChartData(data.revenueData, "revenue"), [data.revenueData]);
  const innoPie = useMemo(() => buildPieData(data.categoryDist?.innovations), [data.categoryDist]);
  const resPie = useMemo(() => buildPieData(data.categoryDist?.research), [data.categoryDist]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading insights…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Greeting */}
      <LinearGradient
        colors={["#dc2626", "#b91c1c", "#991b1b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroGreeting}>{greeting},</Text>
            <Text style={styles.heroName}>{user?.first_name || "Admin"} 👋</Text>
            <Text style={styles.heroSub}>Here's how your platform is performing</Text>
          </View>
          <View style={styles.heroLogo}>
            <Image source={LOGO} style={styles.heroLogoImg} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.rangePicker}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r.value}
              onPress={() => setRange(r.value)}
              style={[styles.rangeBtn, range === r.value && styles.rangeBtnActive]}
            >
              <Text style={[styles.rangeText, range === r.value && styles.rangeTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={styles.retry}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Quick Actions */}
        <SectionHeader icon="flash" title="Quick Actions" subtitle="Jump straight to common tasks" />
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.quickCard, shadow.card]}
              onPress={() => navigation.navigate(a.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={20} color={a.color} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats grid */}
        {data.stats?.length > 0 && (
          <>
            <SectionHeader icon="stats-chart" title="Key Metrics" subtitle={`Last ${range.replace("days", " days").replace("hours", " hours")}`} />
            <View style={styles.statGrid}>
              {data.stats.map((stat, i) => (
                <StatCard key={i} stat={stat} />
              ))}
            </View>
          </>
        )}

        {/* User Growth Chart */}
        {userGrowthChart ? (
          <View style={[styles.card, shadow.card]}>
            <SectionHeader icon="trending-up" title="User Growth" subtitle="New signups over time" />
            <LineChart
              data={userGrowthChart}
              width={CHART_W}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (o = 1) => `rgba(234, 88, 12, ${o})`,
                fillShadowGradient: "#ea580c",
                propsForDots: { r: "4", strokeWidth: "2", stroke: "#ea580c" },
              }}
              bezier
              withInnerLines
              withOuterLines={false}
              style={styles.chart}
            />
          </View>
        ) : null}

        {/* Content Trend - Innovations */}
        {innovationTrend ? (
          <View style={[styles.card, shadow.card]}>
            <SectionHeader icon="bulb" title="Innovation Uploads" subtitle="Submissions trend" />
            <BarChart
              data={innovationTrend}
              width={CHART_W}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (o = 1) => `rgba(220, 38, 38, ${o})`,
              }}
              fromZero
              showValuesOnTopOfBars={false}
              withInnerLines
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        ) : null}

        {/* Research Trend */}
        {researchTrend ? (
          <View style={[styles.card, shadow.card]}>
            <SectionHeader icon="document-text" title="Research Submissions" subtitle="Papers uploaded" />
            <BarChart
              data={researchTrend}
              width={CHART_W}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (o = 1) => `rgba(139, 92, 246, ${o})`,
              }}
              fromZero
              withInnerLines
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        ) : null}

        {/* Revenue Trend */}
        {revenueChart ? (
          <View style={[styles.card, shadow.card]}>
            <SectionHeader icon="cash" title="Revenue Trend" subtitle="Earnings over time" />
            <LineChart
              data={revenueChart}
              width={CHART_W}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (o = 1) => `rgba(16, 185, 129, ${o})`,
                fillShadowGradient: "#10b981",
                propsForDots: { r: "4", strokeWidth: "2", stroke: "#10b981" },
              }}
              bezier
              withInnerLines
              withOuterLines={false}
              style={styles.chart}
            />
          </View>
        ) : null}

        {/* Categories Pie - Innovations */}
        {innoPie.length > 0 && innoPie.some((p) => p.population > 0) ? (
          <View style={[styles.card, shadow.card]}>
            <SectionHeader icon="pie-chart" title="Innovation Categories" subtitle="Distribution by type" />
            <PieChart
              data={innoPie}
              width={CHART_W}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
            />
          </View>
        ) : null}

        {/* Categories Pie - Research */}
        {resPie.length > 0 && resPie.some((p) => p.population > 0) ? (
          <View style={[styles.card, shadow.card]}>
            <SectionHeader icon="library" title="Research Categories" subtitle="Distribution by field" />
            <PieChart
              data={resPie}
              width={CHART_W}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
            />
          </View>
        ) : null}

        {/* Top Innovations Leaderboard */}
        {data.topPerformers?.innovations?.length > 0 ? (
          <View style={[styles.card, shadow.card]}>
            <SectionHeader
              icon="flame"
              title="Top Innovations"
              subtitle="Most viewed this period"
            />
            {data.topPerformers.innovations.slice(0, 5).map((it, i) => (
              <View key={it.id || i} style={styles.leaderRow}>
                <View style={[styles.rankBadge, i < 3 && styles.rankBadgeTop]}>
                  <Text style={[styles.rankText, i < 3 && styles.rankTextTop]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaderTitle} numberOfLines={1}>{it.title}</Text>
                  <Text style={styles.leaderCategory}>{it.category || "—"}</Text>
                </View>
                <View style={styles.viewsBlock}>
                  <Ionicons name="eye" size={12} color={colors.textMuted} />
                  <Text style={styles.viewsText}>
                    {Number(it.views || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Top Research Papers */}
        {data.topPerformers?.research?.length > 0 ? (
          <View style={[styles.card, shadow.card]}>
            <SectionHeader
              icon="book"
              title="Top Research Papers"
              subtitle="Most viewed this period"
            />
            {data.topPerformers.research.slice(0, 5).map((it, i) => (
              <View key={it.id || i} style={styles.leaderRow}>
                <View style={[styles.rankBadge, i < 3 && { backgroundColor: colors.purpleLight }]}>
                  <Text style={[styles.rankText, i < 3 && { color: colors.purple }]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaderTitle} numberOfLines={1}>{it.title}</Text>
                  <Text style={styles.leaderCategory}>{it.category || "—"}</Text>
                </View>
                <View style={styles.viewsBlock}>
                  <Ionicons name="eye" size={12} color={colors.textMuted} />
                  <Text style={styles.viewsText}>
                    {Number(it.views || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Real-time Activity */}
        {data.realtimeActivity?.length > 0 ? (
          <View style={[styles.card, shadow.card]}>
            <SectionHeader
              icon="pulse"
              title="Live Activity"
              subtitle="Recent platform events"
              action={
                <View style={styles.liveDot}>
                  <View style={styles.liveDotInner} />
                  <Text style={styles.liveLabel}>LIVE</Text>
                </View>
              }
            />
            {data.realtimeActivity.slice(0, 8).map((a) => {
              const icon = activityIconFor(a.type);
              return (
                <View key={a.id} style={styles.actRow}>
                  <View style={[styles.actIcon, { backgroundColor: icon.bg }]}>
                    <Ionicons name={icon.name} size={14} color={icon.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actTitle} numberOfLines={1}>{a.action}</Text>
                    <Text style={styles.actSub} numberOfLines={1}>{a.user}</Text>
                  </View>
                  <Text style={styles.actTime}>{a.time}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={{ height: spacing.xxl }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  loadingText: { marginTop: spacing.sm, color: colors.textMuted, fontSize: 13, fontWeight: "600" },

  // Hero
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  heroGreeting: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  heroName: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 2 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4 },
  heroLogo: {
    backgroundColor: "#fff",
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 12,
  },
  heroLogoImg: { width: 80, height: 22 },

  rangePicker: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.18)",
    padding: 4,
    borderRadius: radius.md,
  },
  rangeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center",
  },
  rangeBtnActive: { backgroundColor: "#fff" },
  rangeText: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700" },
  rangeTextActive: { color: colors.primary },

  body: { padding: spacing.md },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.dangerLight,
    padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 12, fontWeight: "600" },
  retry: { color: colors.primary, fontSize: 12, fontWeight: "800" },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  sectionSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  // Quick actions
  quickRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  quickCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1, borderColor: colors.border,
  },
  quickIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    marginBottom: 6,
  },
  quickLabel: { fontSize: 11, fontWeight: "700", color: colors.text },

  // Stat grid
  statGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  statCard: {
    width: "50%",
    padding: 4,
  },
  statHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: spacing.sm,
  },
  statIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  changeBadge: {
    flexDirection: "row", alignItems: "center", gap: 2,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  changeText: { fontSize: 10, fontWeight: "800" },
  statLabel: {
    fontSize: 10, color: colors.textMuted,
    fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 2 },

  // Chart card
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    marginTop: spacing.md,
  },
  chart: { marginTop: spacing.sm, marginLeft: -8, borderRadius: radius.md },

  // Leaderboard rows
  leaderRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center", justifyContent: "center",
    marginRight: spacing.sm,
  },
  rankBadgeTop: { backgroundColor: colors.primaryLight },
  rankText: { fontSize: 12, fontWeight: "800", color: colors.textMuted },
  rankTextTop: { color: colors.primary },
  leaderTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
  leaderCategory: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  viewsBlock: { flexDirection: "row", alignItems: "center", gap: 3 },
  viewsText: { fontSize: 12, fontWeight: "700", color: colors.text },

  // Live activity
  liveDot: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
  },
  liveDotInner: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveLabel: { fontSize: 9, fontWeight: "800", color: colors.success, letterSpacing: 0.6 },

  actRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  actIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginRight: spacing.sm,
  },
  actTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
  actSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  actTime: { fontSize: 10, color: colors.textLight, marginLeft: 6, fontWeight: "600" },
});
