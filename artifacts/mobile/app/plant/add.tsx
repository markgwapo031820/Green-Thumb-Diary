import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

export default function AddPlantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addPlant } = usePlants();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [dateAcquired, setDateAcquired] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedFreq, setSelectedFreq] = useState(7);
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Plant name required", "Please enter a name for your plant.");
      return;
    }
    setSaving(true);
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await addPlant({
      name: name.trim(),
      species: species.trim() || "Unknown species",
      photo: photoUrl.trim() || undefined,
      dateAcquired: new Date(dateAcquired).toISOString(),
      wateringFrequencyDays: selectedFreq,
    });
    setSaving(false);
    router.back();
  };

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
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Add Plant
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.saveBtn,
            {
              backgroundColor: name.trim() ? colors.primary : colors.muted,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: name.trim() ? "#fff" : colors.mutedForeground },
            ]}
          >
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
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
            PLANT INFO
          </Text>
          <View
            style={[
              styles.fieldGroup,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Monstera"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.fieldInput, { color: colors.foreground }]}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Species
              </Text>
              <TextInput
                value={species}
                onChangeText={setSpecies}
                placeholder="e.g. Monstera deliciosa"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.fieldInput, { color: colors.foreground, fontStyle: "italic" }]}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Photo URL
              </Text>
              <TextInput
                value={photoUrl}
                onChangeText={setPhotoUrl}
                placeholder="https://..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.fieldInput, { color: colors.foreground }]}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Date Acquired
              </Text>
              <TextInput
                value={dateAcquired}
                onChangeText={setDateAcquired}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.fieldInput, { color: colors.foreground }]}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            WATERING SCHEDULE
          </Text>
          <View style={styles.freqGrid}>
            {FREQUENCY_OPTIONS.map((opt) => {
              const active = selectedFreq === opt.days;
              return (
                <TouchableOpacity
                  key={opt.days}
                  onPress={() => setSelectedFreq(opt.days)}
                  style={[
                    styles.freqChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Feather
                    name="droplet"
                    size={14}
                    color={active ? "#fff" : colors.primary}
                  />
                  <Text
                    style={[
                      styles.freqChipText,
                      { color: active ? "#fff" : colors.foreground },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.tipCard,
            { backgroundColor: colors.successLight, borderColor: colors.primary },
          ]}
        >
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.primary }]}>
            You can update all details and log your plant's growth after adding it.
          </Text>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  scrollView: { flex: 1 },
  content: { padding: 20, gap: 24 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  fieldGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  fieldInput: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  divider: { height: 1, marginHorizontal: 16 },
  freqGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  freqChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  freqChipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
