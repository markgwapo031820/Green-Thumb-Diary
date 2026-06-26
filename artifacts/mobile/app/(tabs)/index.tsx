import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PlantCard from "@/components/PlantCard";
import {
  Plant,
  WateringStatus,
  getWateringStatus,
  usePlants,
} from "@/context/PlantContext";
import { useColors } from "@/hooks/useColors";

type FilterType = "all" | "good" | "due-soon" | "overdue";

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "due-soon", label: "Due Today" },
  { key: "good", label: "Good" },
];

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plants, isLoaded } = usePlants();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const statusCounts = useMemo(() => {
    const counts = { overdue: 0, "due-soon": 0, good: 0 };
    for (const p of plants) {
      counts[getWateringStatus(p)]++;
    }
    return counts;
  }, [plants]);

  const filtered = useMemo(() => {
    let result = plants;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.species.toLowerCase().includes(q)
      );
    }
    if (filter !== "all") {
      result = result.filter((p) => getWateringStatus(p) === filter);
    }
    return result;
  }, [plants, search, filter]);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const urgentCount = statusCounts.overdue + statusCounts["due-soon"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 16, backgroundColor: colors.background },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              My Garden
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {plants.length} plant{plants.length !== 1 ? "s" : ""}
              {urgentCount > 0 ? ` · ${urgentCount} need attention` : ""}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/plant/add")}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search plants..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.key;
            const count =
              opt.key === "all"
                ? plants.length
                : statusCounts[opt.key as WateringStatus];
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setFilter(opt.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  {opt.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.filterCount,
                      {
                        backgroundColor: active
                          ? "rgba(255,255,255,0.25)"
                          : colors.muted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        { color: active ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {!isLoaded ? null : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="feather" size={56} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {plants.length === 0 ? "No plants yet" : "No results"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {plants.length === 0
              ? "Tap + to add your first plant"
              : "Try a different search or filter"}
          </Text>
          {plants.length === 0 && (
            <TouchableOpacity
              onPress={() => router.push("/plant/add")}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>Add Plant</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PlantCard plant={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomInset + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filtered.length}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  filterRow: {
    paddingBottom: 4,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterCountText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    padding: 20,
    paddingTop: 12,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
