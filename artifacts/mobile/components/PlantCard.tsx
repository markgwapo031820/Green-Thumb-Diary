import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Plant,
  WateringStatus,
  getDaysUntilWatering,
  getNextWateringDate,
  getWateringStatus,
  usePlants,
} from "@/context/PlantContext";
import { useColors } from "@/hooks/useColors";

interface PlantCardProps {
  plant: Plant;
}

function StatusChip({ status }: { status: WateringStatus }) {
  const colors = useColors();

  const config = {
    good: {
      bg: colors.successLight,
      text: colors.success,
      label: "Good",
      icon: "check-circle" as const,
    },
    "due-soon": {
      bg: colors.warningLight,
      text: colors.warning,
      label: "Due today",
      icon: "alert-circle" as const,
    },
    overdue: {
      bg: colors.overdueLight,
      text: colors.overdue,
      label: "Overdue",
      icon: "alert-triangle" as const,
    },
  }[status];

  return (
    <View style={[styles.chip, { backgroundColor: config.bg }]}>
      <Feather name={config.icon} size={11} color={config.text} />
      <Text style={[styles.chipText, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
}

export default function PlantCard({ plant }: PlantCardProps) {
  const colors = useColors();
  const { waterPlant } = usePlants();
  const status = getWateringStatus(plant);
  const daysUntil = getDaysUntilWatering(plant);
  const nextDate = getNextWateringDate(plant);

  const handleWater = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await waterPlant(plant.id);
  };

  const wateringLabel = (() => {
    if (!plant.lastWatered) return "Never watered";
    if (daysUntil === null) return "Set a schedule";
    if (daysUntil <= 0) return "Water now!";
    if (daysUntil === 1) return "Due today";
    if (nextDate) {
      return `In ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
    }
    return "";
  })();

  const borderColor =
    status === "overdue"
      ? colors.overdue
      : status === "due-soon"
        ? colors.warning
        : colors.border;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/plant/${plant.id}`)}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor,
          borderLeftColor: borderColor,
          shadowColor: colors.foreground,
        },
      ]}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        <View style={styles.photoContainer}>
          {plant.photo ? (
            <Image
              source={{ uri: plant.photo }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.photoPlaceholder,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Feather name="feather" size={28} color={colors.primary} />
            </View>
          )}
          <StatusChip status={status} />
        </View>

        <View style={styles.info}>
          <Text
            style={[styles.name, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {plant.name}
          </Text>
          <Text
            style={[styles.species, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {plant.species}
          </Text>

          <View style={styles.waterRow}>
            <Feather name="droplet" size={13} color={colors.primary} />
            <Text style={[styles.waterText, { color: colors.mutedForeground }]}>
              {wateringLabel}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleWater}
          style={[styles.waterBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.7}
        >
          <Feather name="droplet" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 12,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  photoContainer: {
    position: "relative",
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    transform: [{ translateX: -24 }],
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  species: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  waterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  waterText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  waterBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
