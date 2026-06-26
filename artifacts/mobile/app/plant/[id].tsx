import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  WateringStatus,
  getDaysUntilWatering,
  getNextWateringDate,
  getWateringStatus,
  usePlants,
} from "@/context/PlantContext";
import { useColors } from "@/hooks/useColors";

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plants, waterPlant, deletePlant, deleteLog } = usePlants();
  const [watering, setWatering] = useState(false);

  const plant = plants.find((p) => p.id === id);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  if (!plant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
            Plant not found
          </Text>
        </View>
      </View>
    );
  }

  const status = getWateringStatus(plant);
  const daysUntil = getDaysUntilWatering(plant);
  const nextDate = getNextWateringDate(plant);

  const statusConfig: Record<
    WateringStatus,
    { color: string; bg: string; label: string; icon: keyof typeof Feather.glyphMap }
  > = {
    good: { color: colors.success, bg: colors.successLight, label: "Healthy", icon: "check-circle" },
    "due-soon": { color: colors.warning, bg: colors.warningLight, label: "Due Today", icon: "alert-circle" },
    overdue: { color: colors.overdue, bg: colors.overdueLight, label: "Overdue", icon: "alert-triangle" },
  };
  const sc = statusConfig[status];

  const handleWater = async () => {
    setWatering(true);
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await waterPlant(plant.id);
    setWatering(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Plant",
      `Are you sure you want to remove ${plant.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePlant(plant.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleDeleteLog = (logId: string) => {
    Alert.alert("Delete Entry", "Remove this growth log entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteLog(plant.id, logId),
      },
    ]);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const acquiredDate = new Date(plant.dateAcquired);
  const daysSinceAcquired = Math.floor(
    (Date.now() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 120 }}
      >
        <View style={styles.heroContainer}>
          {plant.photo ? (
            <Image
              source={{ uri: plant.photo }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[styles.heroPlaceholder, { backgroundColor: colors.secondary }]}
            >
              <Feather name="feather" size={64} color={colors.primary} />
            </View>
          )}
          <View
            style={[
              styles.heroOverlay,
              { paddingTop: topInset + 12 },
            ]}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: "rgba(0,0,0,0.35)" }]}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.backBtn, { backgroundColor: "rgba(0,0,0,0.35)" }]}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={18} color="#fff" />
            </TouchableOpacity>
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
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Feather name={sc.icon} size={14} color={sc.color} />
              <Text style={[styles.statusText, { color: sc.color }]}>
                {sc.label}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {daysSinceAcquired}d
              </Text>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                owned
              </Text>
            </View>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="droplet" size={16} color={colors.primary} />
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {plant.wateringFrequencyDays}d
              </Text>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                schedule
              </Text>
            </View>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="book-open" size={16} color={colors.primary} />
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {plant.logs.length}
              </Text>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                logs
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.waterCard,
              {
                backgroundColor: sc.bg,
                borderColor: sc.color,
              },
            ]}
          >
            <View style={styles.waterCardContent}>
              <Feather name="droplet" size={18} color={sc.color} />
              <View>
                <Text style={[styles.waterCardTitle, { color: sc.color }]}>
                  {status === "overdue"
                    ? "Needs watering now!"
                    : status === "due-soon"
                    ? "Water today"
                    : daysUntil !== null
                    ? `Next watering in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`
                    : "No schedule set"}
                </Text>
                {nextDate && (
                  <Text style={[styles.waterCardDate, { color: sc.color, opacity: 0.7 }]}>
                    {formatDate(nextDate.toISOString())}
                  </Text>
                )}
                {plant.lastWatered && (
                  <Text style={[styles.waterCardDate, { color: sc.color, opacity: 0.7 }]}>
                    Last watered: {formatDate(plant.lastWatered)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.logSection}>
            <View style={styles.logHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Growth Log
              </Text>
              <TouchableOpacity
                onPress={() => router.push(`/plant/${plant.id}/log`)}
                style={[styles.addLogBtn, { backgroundColor: colors.secondary }]}
                activeOpacity={0.75}
              >
                <Feather name="plus" size={16} color={colors.primary} />
                <Text style={[styles.addLogText, { color: colors.primary }]}>
                  Add Entry
                </Text>
              </TouchableOpacity>
            </View>

            {plant.logs.length === 0 ? (
              <View
                style={[
                  styles.emptyLog,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Feather name="edit-3" size={28} color={colors.border} />
                <Text style={[styles.emptyLogText, { color: colors.mutedForeground }]}>
                  No entries yet
                </Text>
                <Text style={[styles.emptyLogSub, { color: colors.mutedForeground }]}>
                  Track your plant's progress
                </Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {plant.logs.map((log, index) => (
                  <View key={log.id} style={styles.timelineItem}>
                    <View style={styles.timelineLine}>
                      <View
                        style={[styles.timelineDot, { backgroundColor: colors.primary }]}
                      />
                      {index < plant.logs.length - 1 && (
                        <View
                          style={[styles.timelineConnector, { backgroundColor: colors.border }]}
                        />
                      )}
                    </View>
                    <View
                      style={[
                        styles.logCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.logCardHeader}>
                        <Text style={[styles.logDate, { color: colors.mutedForeground }]}>
                          {formatDate(log.date)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteLog(log.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Feather
                            name="trash-2"
                            size={14}
                            color={colors.mutedForeground}
                          />
                        </TouchableOpacity>
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
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.waterBtnContainer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomInset + 16,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleWater}
          disabled={watering}
          style={[
            styles.waterBtnLarge,
            { backgroundColor: watering ? colors.muted : colors.primary },
          ]}
          activeOpacity={0.85}
        >
          <Feather
            name="droplet"
            size={20}
            color={watering ? colors.mutedForeground : "#fff"}
          />
          <Text
            style={[
              styles.waterBtnText,
              { color: watering ? colors.mutedForeground : "#fff" },
            ]}
          >
            {watering ? "Marking watered..." : "Mark as Watered Today"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  heroContainer: {
    height: 280,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 20,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleBlock: { flex: 1, gap: 2, marginRight: 12 },
  plantName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  plantSpecies: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
  },
  infoCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  infoValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  waterCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
  },
  waterCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  waterCardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  waterCardDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  logSection: { gap: 14 },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  addLogBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addLogText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  emptyLog: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 6,
  },
  emptyLogText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
  },
  emptyLogSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  timeline: { gap: 0 },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    minHeight: 80,
  },
  timelineLine: {
    width: 20,
    alignItems: "center",
    paddingTop: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    marginTop: 4,
  },
  logCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  logCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logDate: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  logNotes: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  logPhoto: {
    width: "100%",
    height: 160,
    borderRadius: 8,
  },
  waterBtnContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  waterBtnLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  waterBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
