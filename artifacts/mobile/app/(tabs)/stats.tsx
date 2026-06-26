import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getWateringStatus, usePlants } from "@/context/PlantContext";
import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}

function StatCard({ icon, label, value, color, bg }: StatCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plants } = usePlants();

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let wateredThisWeek = 0;
    let longestStreak = 0;
    let totalLogs = 0;
    const statusCounts = { good: 0, "due-soon": 0, overdue: 0 };

    for (const plant of plants) {
      const status = getWateringStatus(plant);
      statusCounts[status]++;

      if (plant.lastWatered) {
        const lastW = new Date(plant.lastWatered);
        if (lastW >= weekAgo) wateredThisWeek++;
      }

      totalLogs += plant.logs.length;

      if (plant.lastWatered && plant.wateringFrequencyDays > 0) {
        const last = new Date(plant.lastWatered);
        const daysSinceStart = Math.floor(
          (now.getTime() - new Date(plant.dateAcquired).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const possibleWaterings = Math.floor(daysSinceStart / plant.wateringFrequencyDays);
        longestStreak = Math.max(longestStreak, possibleWaterings);
      }
    }

    return {
      total: plants.length,
      wateredThisWeek,
      longestStreak,
      totalLogs,
      statusCounts,
    };
  }, [plants]);

  const recentActivity = useMemo(() => {
    type Activity = { plantName: string; date: string; type: "watered" | "log"; notes?: string };
    const items: Activity[] = [];

    for (const plant of plants) {
      if (plant.lastWatered) {
        items.push({
          plantName: plant.name,
          date: plant.lastWatered,
          type: "watered",
        });
      }
      for (const log of plant.logs) {
        items.push({
          plantName: plant.name,
          date: log.date,
          type: "log",
          notes: log.notes,
        });
      }
    }

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [plants]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 16, paddingBottom: bottomInset + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Overview</Text>
      <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
        Your garden at a glance
      </Text>

      <View style={styles.statsGrid}>
        <StatCard
          icon="feather"
          label="Total Plants"
          value={stats.total}
          color={colors.primary}
          bg={colors.successLight}
        />
        <StatCard
          icon="droplet"
          label="Watered This Week"
          value={stats.wateredThisWeek}
          color={colors.earthy}
          bg={colors.earthyLight}
        />
        <StatCard
          icon="book-open"
          label="Growth Logs"
          value={stats.totalLogs}
          color="#7B68EE"
          bg="#F0EEFF"
        />
        <StatCard
          icon="award"
          label="Longest Streak"
          value={stats.longestStreak > 0 ? `${stats.longestStreak}x` : "—"}
          color={colors.warning}
          bg={colors.warningLight}
        />
      </View>

      <View
        style={[
          styles.healthCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Plant Health
        </Text>
        {[
          { label: "Healthy", count: stats.statusCounts.good, color: colors.success, bg: colors.successLight },
          { label: "Due Today", count: stats.statusCounts["due-soon"], color: colors.warning, bg: colors.warningLight },
          { label: "Overdue", count: stats.statusCounts.overdue, color: colors.overdue, bg: colors.overdueLight },
        ].map((item) => (
          <View key={item.label} style={styles.healthRow}>
            <View style={styles.healthLabelRow}>
              <View style={[styles.healthDot, { backgroundColor: item.color }]} />
              <Text style={[styles.healthLabel, { color: colors.foreground }]}>
                {item.label}
              </Text>
            </View>
            <View style={styles.healthBarContainer}>
              <View style={[styles.healthBarBg, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.healthBarFill,
                    {
                      backgroundColor: item.color,
                      width: stats.total > 0
                        ? `${Math.round((item.count / stats.total) * 100)}%`
                        : "0%",
                    },
                  ]}
                />
              </View>
              <Text style={[styles.healthCount, { color: colors.mutedForeground }]}>
                {item.count}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {recentActivity.length > 0 && (
        <View style={styles.activitySection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Activity
          </Text>
          {recentActivity.map((item, i) => (
            <View
              key={i}
              style={[
                styles.activityItem,
                { borderBottomColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.activityIcon,
                  {
                    backgroundColor:
                      item.type === "watered"
                        ? colors.successLight
                        : "#F0EEFF",
                  },
                ]}
              >
                <Feather
                  name={item.type === "watered" ? "droplet" : "edit-3"}
                  size={14}
                  color={item.type === "watered" ? colors.success : "#7B68EE"}
                />
              </View>
              <View style={styles.activityContent}>
                <Text
                  style={[styles.activityPlant, { color: colors.foreground }]}
                >
                  {item.plantName}
                </Text>
                <Text
                  style={[
                    styles.activityDesc,
                    { color: colors.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {item.type === "watered"
                    ? "Watered"
                    : item.notes || "Log entry"}
                </Text>
              </View>
              <Text
                style={[styles.activityDate, { color: colors.mutedForeground }]}
              >
                {formatDate(item.date)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  pageSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: -12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  healthCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  healthRow: { gap: 6 },
  healthLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  healthBarContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  healthBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  healthBarFill: { height: "100%", borderRadius: 3 },
  healthCount: { fontSize: 13, fontFamily: "Inter_500Medium", minWidth: 20, textAlign: "right" },
  activitySection: { gap: 12 },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: { flex: 1 },
  activityPlant: { fontSize: 14, fontFamily: "Inter_500Medium" },
  activityDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  activityDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
