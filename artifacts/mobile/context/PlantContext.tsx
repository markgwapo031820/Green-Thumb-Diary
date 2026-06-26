import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface PlantLog {
  id: string;
  date: string;
  notes: string;
  photo?: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  photo?: string;
  dateAcquired: string;
  wateringFrequencyDays: number;
  lastWatered?: string;
  logs: PlantLog[];
}

export type WateringStatus = "good" | "due-soon" | "overdue";

export function getWateringStatus(plant: Plant): WateringStatus {
  if (!plant.lastWatered) return "overdue";
  const last = new Date(plant.lastWatered);
  const next = new Date(last);
  next.setDate(next.getDate() + plant.wateringFrequencyDays);
  const now = new Date();
  const diffMs = next.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 0) return "overdue";
  if (diffDays <= 1) return "due-soon";
  return "good";
}

export function getNextWateringDate(plant: Plant): Date | null {
  if (!plant.lastWatered) return null;
  const last = new Date(plant.lastWatered);
  const next = new Date(last);
  next.setDate(next.getDate() + plant.wateringFrequencyDays);
  return next;
}

export function getDaysUntilWatering(plant: Plant): number | null {
  const next = getNextWateringDate(plant);
  if (!next) return null;
  const now = new Date();
  const diffMs = next.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

interface PlantContextValue {
  plants: Plant[];
  addPlant: (plant: Omit<Plant, "id" | "logs">) => Promise<void>;
  updatePlant: (id: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  waterPlant: (id: string) => Promise<void>;
  addLog: (plantId: string, log: Omit<PlantLog, "id">) => Promise<void>;
  deleteLog: (plantId: string, logId: string) => Promise<void>;
  isLoaded: boolean;
}

const PlantContext = createContext<PlantContextValue | null>(null);

const STORAGE_KEY = "@plantcare_plants";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) {
          setPlants(JSON.parse(data));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = useCallback(async (updated: Plant[]) => {
    setPlants(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addPlant = useCallback(
    async (plant: Omit<Plant, "id" | "logs">) => {
      const newPlant: Plant = { ...plant, id: generateId(), logs: [] };
      await persist([...plants, newPlant]);
    },
    [plants, persist]
  );

  const updatePlant = useCallback(
    async (id: string, updates: Partial<Plant>) => {
      const updated = plants.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      await persist(updated);
    },
    [plants, persist]
  );

  const deletePlant = useCallback(
    async (id: string) => {
      await persist(plants.filter((p) => p.id !== id));
    },
    [plants, persist]
  );

  const waterPlant = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();
      const updated = plants.map((p) =>
        p.id === id ? { ...p, lastWatered: now } : p
      );
      await persist(updated);
    },
    [plants, persist]
  );

  const addLog = useCallback(
    async (plantId: string, log: Omit<PlantLog, "id">) => {
      const newLog: PlantLog = { ...log, id: generateId() };
      const updated = plants.map((p) =>
        p.id === plantId ? { ...p, logs: [newLog, ...p.logs] } : p
      );
      await persist(updated);
    },
    [plants, persist]
  );

  const deleteLog = useCallback(
    async (plantId: string, logId: string) => {
      const updated = plants.map((p) =>
        p.id === plantId
          ? { ...p, logs: p.logs.filter((l) => l.id !== logId) }
          : p
      );
      await persist(updated);
    },
    [plants, persist]
  );

  return (
    <PlantContext.Provider
      value={{
        plants,
        addPlant,
        updatePlant,
        deletePlant,
        waterPlant,
        addLog,
        deleteLog,
        isLoaded,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
}

export function usePlants() {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error("usePlants must be used within PlantProvider");
  return ctx;
}
