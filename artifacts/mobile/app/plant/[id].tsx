import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { memo, useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  PlantLog,
  WateringStatus,
  getDaysUntilWatering,
  getNextWateringDate,
  getWateringStatus,
  usePlants,
} from "@/context/PlantContext";
import { useColors } from "@/hooks/useColors";

const LogEntry = memo(function LogEntry({
  log,
  onDelete,
}: {
  log: PlantLog;
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  const handleDelete = useCallback(() => onDelete(log.id), [log.id, onDelete]);

  const dateStr = useMemo(
    () =>
      new Date(log.date).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [log.date]
  );

  return (
    <View style={styles.logEntry}>
      <View style={[styles.logDot, { backgroundColor: colors.primary }]} />
      <View
        style={[
          styles.logCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.logCardTop}>
          <Text style={[styles.logDate, { color: colors.mutedForeground }]}>
            {dateStr}
          </Text>
          <Pressable
            onPress={handleDelete}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Feather name="trash-2" size={13} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <Text style={[styles.logNotes, { color: colors.foreground }]}>
          {log.notes}
        </Text>
        {log.photo && (
          <Image
            source={{ uri: log.photo }}
            style={styles.logPhoto}
            resizeMode="cover"
          />
        )}
      </View>
    </View>
  );
});

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plants, waterPlant, deletePlant, deleteLog } = usePlants();
  const [watering, setWatering] = useState(false);

  const plant = plants.find((p) => p.id === id);

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const status: WateringStatus = useMemo(
    () => (plant ? getWateringStatus(plant) : "good"),
    [plant]
  );
  const daysUntil = useMemo(
    () => (plant ? getDaysUntilWatering(plant) : null),
    [plant]
  );
  const nextDate = useMemo(
    () => (plant ? getNextWateringDate(plant) : null),
    [plant]
  );

  const sc = useMemo(() => {
    const map: Record<
      WateringStatus,
      { color: string; bg: string; label: string; icon: keyof typeof Feather.glyphMap }
    > = {
      good: {
        color: colors.success,
        bg: colors.successLight,
        label: "Healthy",
        icon: "check-circle",
      },
      "due-soon": {
        color: colors.warning,
        bg: colors.warningLight,
        label: "Due Today",
        icon: "alert-circle",
      },
      overdue: {
        color: colors.overdue,
        bg: colors.overdueLight,
        label: "Overdue",
        icon: "alert-triangle",
      },
    };
    return map[status];
  }, [status, colors]);

  const handleWater = useCallback(async () => {
    if (!plant) return;
    setWatering(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await waterPlant(plant.id);
    setWatering(false);
  }, [plant, waterPlant]);

  const handleDelete = useCallback(() => {
    if (!plant) return;
    Alert.alert(
      "Remove Plant",
      `Remove "${plant.name}" from your garden? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deletePlant(plant.id);
            router.back();
          },
        },
      ]
    );
  }, [plant, deletePlant]);

  const handleDeleteLog = useCallback(
    (logId: string) => {
      if (!plant) return;
      Alert.alert("Delete Entry", "Remove this growth log entry?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteLog(plant.id, logId),
        },
      ]);
    },
    [plant, deleteLog]
  );

  const handleAddLog = useCallback(() => {
    router.push(`/plant/${id}/log`);
  }, [id]);

  const daysSinceAcquired = useMemo(() => {
    if (!plant) return 0;
    return Math.floor(
      (Date.now() - new Date(plant.dateAcquired).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }, [plant]);

  const formatDate = useCallback((iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const wateringTitle = useMemo(() => {
    if (!plant) return "";
    if (status === "overdue") return "Needs watering";
    if (status === "due-soon") return "Water today";
    if (daysUntil !== null)
      return `Next watering in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
    return "No schedule set";
  }, [status, daysUntil, plant]);

  if (!plant) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.navBar, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
            Plant not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 110 }}
      >
        <View style={styles.heroWrap}>
          {plant.photo ? (
            <Image
              source={{ uri: plant.photo }}
              style={styles.hero}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[styles.heroFallback, { backgroundColor: colors.secondary }]}
            >
              <Feather name="feather" size={60} color={colors.primary} />
            </View>
          )}
          <View
            style={[styles.heroNav, { paddingTop: topInset + 12 }]}
          >
            <Pressable
              onPress={() => router.back()}
              style={[styles.navBtn, { backgroundColor: "rgba(0,0,0,0.38)" }]}
            >
              <Feather name="arrow-left" size={18} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={[styles.navBtn, { backgroundColor: "rgba(0,0,0,0.38)" }]}
            >
              <Feather name="trash-2" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={[styles.plantName, { color: colors.foreground }]}>
                {plant.name}
              </Text>
              <Text style={[styles.plantSpecies, { color: colors.mutedForeground }]}>
                {plant.species}
              </Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: sc.bg }]}>
              <Feather name={sc.icon} size={13} color={sc.color} />
              <Text style={[styles.statusTagText, { color: sc.color }]}>
                {sc.label}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {[
              {
                icon: "calendar" as const,
                value: `${daysSinceAcquired}d`,
                label: "Owned",
              },
              {
                icon: "droplet" as const,
                value: `Every ${plant.wateringFrequencyDays}d`,
                label: "Schedule",
              },
              {
                icon: "book-open" as const,
                value: String(plant.logs.length),
                label: "Entries",
              },
            ].map((m) => (
              <View
                key={m.label}
                style={[
                  styles.metaCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name={m.icon} size={14} color={colors.primary} />
                <Text style={[styles.metaValue, { color: colors.foreground }]}>
                  {m.value}
                </Text>
                <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
                  {m.label}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.waterBanner,
              { backgroundColor: sc.bg, borderColor: sc.color + "40" },
            ]}
          >
            <Feather name="droplet" size={17} color={sc.color} />
            <View style={styles.waterBannerText}>
              <Text style={[styles.waterBannerTitle, { color: sc.color }]}>
                {wateringTitle}
              </Text>
              <Text style={[styles.waterBannerSub, { color: sc.color + "AA" }]}>
                {plant.lastWatered
                  ? `Last watered ${formatDate(plant.lastWatered)}`
                  : "Never watered"}
                {nextDate ? `  ·  Next ${formatDate(nextDate.toISOString())}` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.logSection}>
            <View style={styles.logHeader}>
              <Text style={[styles.logSectionTitle, { color: colors.foreground }]}>
                Growth Log
              </Text>
              <Pressable
                onPress={handleAddLog}
                style={({ pressed }) => [
                  styles.addEntryBtn,
                  {
                    backgroundColor: colors.secondary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name="plus" size={14} color={colors.primary} />
                <Text style={[styles.addEntryText, { color: colors.primary }]}>
                  Add Entry
                </Text>
              </Pressable>
            </View>

            {plant.logs.length === 0 ? (
              <View
                style={[
                  styles.emptyLog,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="edit-3" size={24} color={colors.border} />
                <Text
                  style={[styles.emptyLogTitle, { color: colors.mutedForeground }]}
                >
                  No entries yet
                </Text>
                <Text
                  style={[styles.emptyLogSub, { color: colors.mutedForeground }]}
                >
                  Start documenting your plant's progress
                </Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                <View
                  style={[
                    styles.timelineLine,
                    { backgroundColor: colors.border },
                  ]}
                />
                {plant.logs.map((log) => (
                  <LogEntry key={log.id} log={log} onDelete={handleDeleteLog} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomInset + 12,
          },
        ]}
      >
        <Pressable
          onPress={handleWater}
          disabled={watering}
          style={({ pressed }) => [
            styles.waterBtn,
            {
              backgroundColor:
                watering ? colors.muted : pressed ? colors.primary + "DD" : colors.primary,
            },
          ]}
        >
          <Feather
            name="droplet"
            size={18}
            color={watering ? colors.mutedForeground : "#fff"}
          />
          <Text
            style={[
              styles.waterBtnText,
              { color: watering ? colors.mutedForeground : "#fff" },
            ]}
          >
            {watering ? "Saving..." : "Mark as Watered Today"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  heroWrap: { height: 260, position: "relative" },
  hero: { width: "100%", height: "100%" },
  heroFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 20, gap: 14 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleBlock: { flex: 1, gap: 3, marginRight: 10 },
  plantName: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  plantSpecies: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  statusTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  metaRow: { flexDirection: "row", gap: 8 },
  metaCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  metaValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  metaLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  waterBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  waterBannerText: { flex: 1 },
  waterBannerTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  waterBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  logSection: { gap: 14 },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logSectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  addEntryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addEntryText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyLog: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 6,
  },
  emptyLogTitle: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 4 },
  emptyLogSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  timeline: { position: "relative", paddingLeft: 24 },
  timelineLine: {
    position: "absolute",
    left: 6,
    top: 8,
    bottom: 8,
    width: 2,
    borderRadius: 1,
  },
  logEntry: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  logDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 14,
    marginLeft: -18,
    flexShrink: 0,
  },
  logCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  logCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logDate: { fontSize: 11, fontFamily: "Inter_500Medium" },
  logNotes: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  logPhoto: { width: "100%", height: 150, borderRadius: 8 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  waterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 12,
  },
  waterBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
