import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
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

export default function AddLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addLog, plants } = usePlants();

  const plant = plants.find((p) => p.id === id);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const canSave = notes.trim().length > 0;

  const handleSave = useCallback(async () => {
    if (!canSave || !id) return;
    setSaving(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await addLog(id, {
      date: new Date().toISOString(),
      notes: notes.trim(),
      photo: photoUrl.trim() || undefined,
    });
    setSaving(false);
    router.back();
  }, [canSave, id, notes, photoUrl, addLog]);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
        <View
          style={[
            styles.dateBadge,
            {
              backgroundColor: colors.successLight,
              borderColor: colors.primary + "30",
            },
          ]}
        >
          <Feather name="calendar" size={13} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.primary }]}>
            {todayLabel}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            OBSERVATIONS
          </Text>
          <View
            style={[
              styles.notesWrap,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Describe how your plant looks — new leaves, color changes, pest signs, soil condition..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.notesInput, { color: colors.foreground }]}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            {notes.length > 0 && (
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                {notes.length} characters
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            PHOTO URL (OPTIONAL)
          </Text>
          <View
            style={[
              styles.fieldGroup,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.field}>
              <Feather name="link" size={14} color={colors.mutedForeground} />
              <TextInput
                value={photoUrl}
                onChangeText={setPhotoUrl}
                placeholder="https://..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.urlInput, { color: colors.foreground }]}
                autoCapitalize="none"
                keyboardType="url"
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        <View
          style={[
            styles.hint,
            {
              backgroundColor: colors.earthyLight,
              borderColor: colors.earthy + "30",
            },
          ]}
        >
          <Feather name="feather" size={14} color={colors.earthy} />
          <Text style={[styles.hintText, { color: colors.earthy }]}>
            Consistent observations help you catch problems early and celebrate milestones.
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
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginTop: 1,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20 },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.7,
  },
  notesWrap: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 150,
    gap: 8,
  },
  notesInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    minHeight: 120,
    padding: 0,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  fieldGroup: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  urlInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  hint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
