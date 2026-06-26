import { Feather } from "@expo/vector-icons";
import React, { memo, useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getWateringStatus, usePlants } from "@/context/PlantContext";
import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string | number;
  iconColor: string;
  iconBg: string;
}

const StatCard = memo(function StatCard({
  icon,
  label,
  value,
  iconColor,
  iconBg,
}: StatCardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
});

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plants } = usePlants();

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let wateredThisWeek = 0;
    let totalLogs = 0;
    let longestCareStreak = 0;
    const statusCounts = { good: 0, "due-soon": 0, overdue: 0 };

    for (const plant of plants) {
      const st = getWateringStatus(plant);
      statusCounts[st]++;
      totalLogs += plant.logs.length;

      if (plant.lastWatered) {
        const lastW = new Date(plant.lastWatered);
        if (lastW >= weekAgo) wateredThisWeek++;

        if (plant.wateringFrequencyDays > 0) {
          const daysSince = Math.floor(
            (now.getTime() - new Date(plant.dateAcquired).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const streak = Math.max(
            0,
            Math.floor(daysSince / plant.wateringFrequencyDays)
          );
          longestCareStreak = Math.max(longestCareStreak, streak);
        }
      }
    }

    return { wateredThisWeek, totalLogs, longestCareStreak, statusCounts };
  }, [plants]);

  const recentActivity = useMemo(() => {
    type ActivityItem = {
      plantName: string;
      date: string;
      type: "watered" | "log";
      notes?: string;
    };
    const items: ActivityItem[] = [];

    for (const plant of plants) {
      if (plant.lastWatered) {
        items.push({ plantName: plant.name, date: plant.lastWatered, type: "watered" });
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
      .slice(0, 12);
  }, [plants]);

  const formatRelative = (iso: string) => {
    const d = new Date(iso);
    const diffDays = Math.floor(
      (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const healthBars = [
    {
      label: "Healthy",
      count: stats.statusCounts.good,
      color: colors.success,
      bg: colors.successLight,
    },
    {
      label: "Due Today",
      count: stats.statusCounts["due-soon"],
      color: colors.warning,
      bg: colors.warningLight,
    },
    {
      label: "Overdue",
      count: stats.statusCounts.overdue,
      color: colors.overdue,
      bg: colors.overdueLight,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 20, paddingBottom: bottomInset + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>
        Overview
      </Text>
      <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
        Your garden at a glance
      </Text>

      <View style={styles.statsGrid}>
        <StatCard
          icon="feather"
          label="Total Plants"
          value={plants.length}
          iconColor={colors.primary}
          iconBg={colors.successLight}
        />
        <StatCard
          icon="droplet"
          label="Watered This Week"
          value={stats.wateredThisWeek}
          iconColor={colors.earthy}
          iconBg={colors.earthyLight}
        />
        <StatCard
          icon="book-open"
          label="Growth Logs"
          value={stats.totalLogs}
          iconColor="#6C63FF"
          iconBg="#EEEEFF"
        />
        <StatCard
          icon="award"
          label="Care Streak"
          value={stats.longestCareStreak > 0 ? `${stats.longestCareStreak}x` : "—"}
          iconColor={colors.warning}
          iconBg={colors.warningLight}
        />
      </View>

      {plants.length > 0 && (
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Plant Health
          </Text>

          <View style={styles.healthBars}>
            {healthBars.map((bar) => (
              <View key={bar.label} style={styles.healthBarRow}>
                <View style={styles.healthBarLabelRow}>
                  <View
                    style={[styles.healthDot, { backgroundColor: bar.color }]}
                  />
                  <Text
                    style={[styles.healthBarLabel, { color: colors.foreground }]}
                  >
                    {bar.label}
                  </Text>
                  <Text
                    style={[
                      styles.healthBarCount,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {bar.count}
                  </Text>
                </View>
                <View
                  style={[
                    styles.healthTrack,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <View
                    style={[
                      styles.healthFill,
                      {
                        backgroundColor: bar.color,
                        width:
                          plants.length > 0
                            ? `${Math.round((bar.count / plants.length) * 100)}%`
                            : "0%",
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {recentActivity.length > 0 && (
        <View style={styles.activitySection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Activity
          </Text>

          <View
            style={[
              styles.activityCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {recentActivity.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.activityRow,
                  i < recentActivity.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.activityIcon,
                    {
                      backgroundColor:
                        item.type === "watered" ? colors.successLight : "#EEEEFF",
                    },
                  ]}
                >
                  <Feather
                    name={item.type === "watered" ? "droplet" : "edit-3"}
                    size={13}
                    color={item.type === "watered" ? colors.success : "#6C63FF"}
                  />
                </View>
                <View style={styles.activityMeta}>
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
                      : item.notes || "Log entry added"}
                  </Text>
                </View>
                <Text
                  style={[styles.activityDate, { color: colors.mutedForeground }]}
                >
                  {formatRelative(item.date)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {plants.length === 0 && (
        <View style={styles.emptyState}>
          <View
            style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}
          >
            <Feather name="bar-chart-2" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No data yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Add plants and start tracking to see your stats here.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  pageTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  pageSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: -12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47.5%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  healthBars: { gap: 12 },
  healthBarRow: { gap: 6 },
  healthBarLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  healthDot: { width: 7, height: 7, borderRadius: 4 },
  healthBarLabel: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  healthBarCount: { fontSize: 13, fontFamily: "Inter_500Medium" },
  healthTrack: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  healthFill: { height: "100%", borderRadius: 3 },
  activitySection: { gap: 12 },
  activityCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  activityMeta: { flex: 1 },
  activityPlant: { fontSize: 13, fontFamily: "Inter_500Medium" },
  activityDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  activityDate: { fontSize: 11, fontFamily: "Inter_400Regular", flexShrink: 0 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
