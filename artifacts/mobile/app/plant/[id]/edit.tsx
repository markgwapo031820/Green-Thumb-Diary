import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlants } from "@/context/PlantContext";
import { useColors } from "@/hooks/useColors";

const FREQUENCY_OPTIONS = [
  { label: "Daily", days: 1 },
  { label: "Every 2 days", days: 2 },
  { label: "Every 3 days", days: 3 },
  { label: "Weekly", days: 7 },
  { label: "Every 2 weeks", days: 14 },
  { label: "Monthly", days: 30 },
];

function Field({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <>
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        {children}
      </View>
      {!last && (
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      )}
    </>
  );
}

export default function EditPlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plants, updatePlant } = usePlants();

  const plant = plants.find((p) => p.id === id);

  const [name, setName] = useState(plant?.name ?? "");
  const [species, setSpecies] = useState(plant?.species ?? "");
  const [photoUrl, setPhotoUrl] = useState(plant?.photo ?? "");
  const [dateAcquired, setDateAcquired] = useState(
    plant ? new Date(plant.dateAcquired).toISOString().split("T")[0] : ""
  );
  const [selectedFreq, setSelectedFreq] = useState(
    plant?.wateringFrequencyDays ?? 7
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!plant) {
      Alert.alert("Not found", "This plant no longer exists.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [plant]);

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const canSave = name.trim().length > 0;

  const handleSave = useCallback(async () => {
    if (!canSave || !id) return;
    setSaving(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await updatePlant(id, {
      name: name.trim(),
      species: species.trim() || "Unknown species",
      photo: photoUrl.trim() || undefined,
      dateAcquired: new Date(dateAcquired).toISOString(),
      wateringFrequencyDays: selectedFreq,
    });
    setSaving(false);
    router.back();
  }, [canSave, id, name, species, photoUrl, dateAcquired, selectedFreq, updatePlant]);

  if (!plant) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 16,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Feather name="x" size={21} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Edit Plant
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saving || !canSave}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: canSave ? colors.primary : colors.muted,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: canSave ? "#fff" : colors.mutedForeground },
            ]}
          >
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomInset + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            PLANT DETAILS
          </Text>
          <View
            style={[
              styles.fieldGroup,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Field label="Name *">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Monstera"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                returnKeyType="next"
              />
            </Field>
            <Field label="Scientific Name">
              <TextInput
                value={species}
                onChangeText={setSpecies}
                placeholder="e.g. Monstera deliciosa"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  { color: colors.foreground, fontStyle: "italic" },
                ]}
                returnKeyType="next"
              />
            </Field>
            <Field label="Photo URL">
              <TextInput
                value={photoUrl}
                onChangeText={setPhotoUrl}
                placeholder="https://..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                autoCapitalize="none"
                keyboardType="url"
                returnKeyType="next"
              />
            </Field>
            <Field label="Date Acquired" last>
              <TextInput
                value={dateAcquired}
                onChangeText={setDateAcquired}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
              />
            </Field>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            WATERING FREQUENCY
          </Text>
          <View style={styles.freqGrid}>
            {FREQUENCY_OPTIONS.map((opt) => {
              const active = selectedFreq === opt.days;
              return (
                <Pressable
                  key={opt.days}
                  onPress={() => setSelectedFreq(opt.days)}
                  style={({ pressed }) => [
                    styles.freqOption,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.freqDot,
                      {
                        backgroundColor: active
                          ? "rgba(255,255,255,0.6)"
                          : colors.primary,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.freqText,
                      { color: active ? "#fff" : colors.foreground },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            WATERING HISTORY
          </Text>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="droplet" size={15} color={colors.primary} />
            <View style={styles.infoCardText}>
              <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>
                Last watered
              </Text>
              <Text
                style={[styles.infoCardValue, { color: colors.mutedForeground }]}
              >
                {plant.lastWatered
                  ? new Date(plant.lastWatered).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Never"}
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 22 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.7,
  },
  fieldGroup: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  field: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 3,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.1,
  },
  input: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
    marginTop: 1,
  },
  divider: { height: 1, marginHorizontal: 14 },
  freqGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  freqOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  freqDot: { width: 6, height: 6, borderRadius: 3 },
  freqText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  infoCardText: { flex: 1 },
  infoCardTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoCardValue: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
});
