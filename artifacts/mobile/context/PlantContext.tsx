import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  const next = new Date(plant.lastWatered);
  next.setDate(next.getDate() + plant.wateringFrequencyDays);
  const diffDays = (next.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 0) return "overdue";
  if (diffDays <= 1) return "due-soon";
  return "good";
}

export function getNextWateringDate(plant: Plant): Date | null {
  if (!plant.lastWatered) return null;
  const next = new Date(plant.lastWatered);
  next.setDate(next.getDate() + plant.wateringFrequencyDays);
  return next;
}

export function getDaysUntilWatering(plant: Plant): number | null {
  const next = getNextWateringDate(plant);
  if (!next) return null;
  return Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface PlantContextValue {
  plants: Plant[];
  isLoaded: boolean;
  addPlant: (plant: Omit<Plant, "id" | "logs">) => Promise<void>;
  updatePlant: (id: string, updates: Partial<Omit<Plant, "id" | "logs">>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  waterPlant: (id: string) => Promise<void>;
  addLog: (plantId: string, log: Omit<PlantLog, "id">) => Promise<void>;
  deleteLog: (plantId: string, logId: string) => Promise<void>;
}

const PlantContext = createContext<PlantContextValue | null>(null);

const STORAGE_KEY = "@plantcare_plants_v2";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const plantsRef = useRef(plants);
  plantsRef.current = plants;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPlants(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const save = useCallback(async (next: Plant[]) => {
    setPlants(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addPlant = useCallback(
    async (data: Omit<Plant, "id" | "logs">) => {
      const plant: Plant = { ...data, id: uid(), logs: [] };
      await save([...plantsRef.current, plant]);
    },
    [save]
  );

  const updatePlant = useCallback(
    async (id: string, updates: Partial<Omit<Plant, "id" | "logs">>) => {
      await save(
        plantsRef.current.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    [save]
  );

  const deletePlant = useCallback(
    async (id: string) => {
      await save(plantsRef.current.filter((p) => p.id !== id));
    },
    [save]
  );

  const waterPlant = useCallback(
    async (id: string) => {
      await save(
        plantsRef.current.map((p) =>
          p.id === id ? { ...p, lastWatered: new Date().toISOString() } : p
        )
      );
    },
    [save]
  );

  const addLog = useCallback(
    async (plantId: string, log: Omit<PlantLog, "id">) => {
      const entry: PlantLog = { ...log, id: uid() };
      await save(
        plantsRef.current.map((p) =>
          p.id === plantId ? { ...p, logs: [entry, ...p.logs] } : p
        )
      );
    },
    [save]
  );

  const deleteLog = useCallback(
    async (plantId: string, logId: string) => {
      await save(
        plantsRef.current.map((p) =>
          p.id === plantId
            ? { ...p, logs: p.logs.filter((l) => l.id !== logId) }
            : p
        )
      );
    },
    [save]
  );

  return (
    <PlantContext.Provider
      value={{
        plants,
        isLoaded,
        addPlant,
        updatePlant,
        deletePlant,
        waterPlant,
        addLog,
        deleteLog,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
}

export function usePlants() {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error("usePlants must be called inside PlantProvider");
  return ctx;
}
