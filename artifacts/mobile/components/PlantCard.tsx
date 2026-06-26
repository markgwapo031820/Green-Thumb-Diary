import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { memo, useCallback, useMemo } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Plant,
  getDaysUntilWatering,
  getWateringStatus,
  usePlants,
} from "@/context/PlantContext";
import { useColors } from "@/hooks/useColors";

interface PlantCardProps {
  plant: Plant;
}

function PlantCardComponent({ plant }: PlantCardProps) {
  const colors = useColors();
  const { waterPlant } = usePlants();

  const status = useMemo(() => getWateringStatus(plant), [plant]);
  const daysUntil = useMemo(() => getDaysUntilWatering(plant), [plant]);

  const statusMeta = useMemo(() => {
    switch (status) {
      case "overdue":
        return { color: colors.overdue, bg: colors.overdueLight, label: "Overdue" };
      case "due-soon":
        return { color: colors.warning, bg: colors.warningLight, label: "Due today" };
      default:
        return { color: colors.success, bg: colors.successLight, label: "Healthy" };
    }
  }, [status, colors]);

  const wateringLabel = useMemo(() => {
    if (!plant.lastWatered) return "Never watered";
    if (daysUntil === null || daysUntil <= 0) return "Water now";
    if (daysUntil === 1) return "Due today";
    return `In ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
  }, [plant.lastWatered, daysUntil]);

  const progress = useMemo(() => {
    if (!plant.lastWatered || daysUntil === null) return 0;
    const pct = Math.max(0, Math.min(1, daysUntil / plant.wateringFrequencyDays));
    return pct;
  }, [plant.lastWatered, plant.wateringFrequencyDays, daysUntil]);

  const handlePress = useCallback(() => {
    router.push(`/plant/${plant.id}`);
  }, [plant.id]);

  const handleWater = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await waterPlant(plant.id);
  }, [plant.id, waterPlant]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.photoWrap}>
          {plant.photo ? (
            <Image
              source={{ uri: plant.photo }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.secondary }]}>
              <Feather name="feather" size={26} color={colors.primary} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {plant.name}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
              <Text style={[styles.statusText, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <Text style={[styles.species, { color: colors.mutedForeground }]} numberOfLines={1}>
            {plant.species}
          </Text>

          <View style={styles.waterInfo}>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: statusMeta.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.waterLabel, { color: colors.mutedForeground }]}>
              {wateringLabel}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleWater}
          style={({ pressed }) => [
            styles.waterBtn,
            {
              backgroundColor: pressed ? colors.primary + "CC" : colors.primary,
            },
          ]}
          hitSlop={8}
        >
          <Feather name="droplet" size={16} color="#fff" />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default memo(PlantCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  photoWrap: {
    borderRadius: 10,
    overflow: "hidden",
  },
  photo: {
    width: 68,
    height: 68,
  },
  photoPlaceholder: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  species: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  waterInfo: {
    gap: 4,
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  waterLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  waterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
