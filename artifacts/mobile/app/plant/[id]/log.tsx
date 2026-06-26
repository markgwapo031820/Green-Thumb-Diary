import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlants } from "@/context/PlantContext";
import { useColors } from "@/hooks/useColors";

export default function AddLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addLog, plants } = usePlants();

  const plant = plants.find((p) => p.id === id);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = async () => {
    if (!notes.trim()) return;
    setSaving(true);
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await addLog(id!, {
      date: new Date().toISOString(),
      notes: notes.trim(),
      photo: photoUrl.trim() || undefined,
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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Growth Entry
          </Text>
          {plant && (
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {plant.name}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !notes.trim()}
          style={[
            styles.saveBtn,
            {
              backgroundColor: notes.trim() ? colors.primary : colors.muted,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: notes.trim() ? "#fff" : colors.mutedForeground },
            ]}
          >
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomInset + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.dateRow,
            { backgroundColor: colors.successLight, borderColor: colors.primary },
          ]}
        >
          <Feather name="calendar" size={14} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.primary }]}>
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            OBSERVATIONS
          </Text>
          <View
            style={[
              styles.notesContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="How is your plant doing? Note any new growth, changes in color, signs of pests, or anything interesting..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.notesInput, { color: colors.foreground }]}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            PHOTO (OPTIONAL)
          </Text>
          <View
            style={[
              styles.fieldGroup,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
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
          </View>
        </View>

        <View
          style={[
            styles.tipCard,
            { backgroundColor: colors.earthyLight, borderColor: colors.earthy },
          ]}
        >
          <Feather name="feather" size={15} color={colors.earthy} />
          <Text style={[styles.tipText, { color: colors.earthy }]}>
            Regular observations help you spot issues early and track growth milestones over time.
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>
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
  headerCenter: { alignItems: "center" },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginTop: 1,
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
  content: { padding: 20, gap: 20 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  notesContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    minHeight: 160,
  },
  notesInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    minHeight: 130,
    padding: 0,
  },
  fieldGroup: {
    borderRadius: 14,
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
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
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
