import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  { key: "good", label: "Healthy" },
];

const renderItem: ListRenderItem<Plant> = ({ item }) => (
  <PlantCard plant={item} />
);

const keyExtractor = (p: Plant) => p.id;

const FilterChip = memo(function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: active ? "#fff" : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          style={[
            styles.filterBadge,
            {
              backgroundColor: active ? "rgba(255,255,255,0.25)" : colors.muted,
            },
          ]}
        >
          <Text
            style={[
              styles.filterBadgeText,
              { color: active ? "#fff" : colors.mutedForeground },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plants, isLoaded } = usePlants();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const statusCounts = useMemo(() => {
    const counts: Record<WateringStatus, number> = {
      overdue: 0,
      "due-soon": 0,
      good: 0,
    };
    for (const p of plants) {
      counts[getWateringStatus(p)]++;
    }
    return counts;
  }, [plants]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plants.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.species.toLowerCase().includes(q);
      const matchesFilter =
        filter === "all" || getWateringStatus(p) === filter;
      return matchesSearch && matchesFilter;
    });
  }, [plants, search, filter]);

  const urgentCount = statusCounts.overdue + statusCounts["due-soon"];

  const handleClearSearch = useCallback(() => setSearch(""), []);
  const handleAddPlant = useCallback(() => router.push("/plant/add"), []);

  const listPadding = useMemo(
    () => [styles.list, { paddingBottom: bottomInset + 90 }],
    [bottomInset]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 20, backgroundColor: colors.background },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              My Garden
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {plants.length === 0
                ? "No plants yet"
                : `${plants.length} plant${plants.length !== 1 ? "s" : ""}${urgentCount > 0 ? ` · ${urgentCount} need attention` : ""}`}
            </Text>
          </View>
          <Pressable
            onPress={handleAddPlant}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>

        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or species..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && Platform.OS !== "ios" && (
            <Pressable onPress={handleClearSearch} hitSlop={8}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_OPTIONS.map((opt) => {
            const count =
              opt.key === "all"
                ? plants.length
                : statusCounts[opt.key as WateringStatus];
            return (
              <FilterChip
                key={opt.key}
                label={opt.label}
                count={count}
                active={filter === opt.key}
                onPress={() => setFilter(opt.key)}
              />
            );
          })}
        </ScrollView>
      </View>

      {!isLoaded ? null : filtered.length === 0 ? (
        <View style={styles.empty}>
          <View
            style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}
          >
            <Feather name="feather" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {plants.length === 0 ? "No plants yet" : "No results"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {plants.length === 0
              ? "Add your first plant to get started"
              : "Try adjusting your search or filter"}
          </Text>
          {plants.length === 0 && (
            <Pressable
              onPress={handleAddPlant}
              style={({ pressed }) => [
                styles.emptyBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Add Plant</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={listPadding}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={10}
          updateCellsBatchingPeriod={50}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 2,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 48,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
