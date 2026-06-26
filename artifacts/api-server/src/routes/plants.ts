import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, plantsTable, growthLogsTable } from "@workspace/db";
import {
  ListPlantsResponse,
  CreatePlantBody,
  CreatePlantResponse,
  GetPlantParams,
  GetPlantResponse,
  UpdatePlantParams,
  UpdatePlantBody,
  UpdatePlantResponse,
  DeletePlantParams,
  WaterPlantParams,
  WaterPlantResponse,
  ListPlantLogsParams,
  ListPlantLogsResponse,
  CreatePlantLogParams,
  CreatePlantLogBody,
  CreatePlantLogResponse,
  DeletePlantLogParams,
  GetStatsResponse,
  GetActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getWateringStatus(lastWatered: Date | null, frequencyDays: number): "good" | "due-soon" | "overdue" {
  if (!lastWatered) return "overdue";
  const next = new Date(lastWatered);
  next.setDate(next.getDate() + frequencyDays);
  const diffDays = (next.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 0) return "overdue";
  if (diffDays <= 1) return "due-soon";
  return "good";
}

function getDaysUntilWatering(lastWatered: Date | null, frequencyDays: number): number | null {
  if (!lastWatered) return null;
  const next = new Date(lastWatered);
  next.setDate(next.getDate() + frequencyDays);
  return Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

async function buildPlantResponse(plant: typeof plantsTable.$inferSelect) {
  const logs = await db
    .select()
    .from(growthLogsTable)
    .where(eq(growthLogsTable.plantId, plant.id))
    .orderBy(desc(growthLogsTable.date));

  return {
    id: plant.id,
    name: plant.name,
    species: plant.species,
    photo: plant.photo ?? null,
    dateAcquired: plant.dateAcquired.toISOString(),
    wateringFrequencyDays: plant.wateringFrequencyDays,
    lastWatered: plant.lastWatered?.toISOString() ?? null,
    logs: logs.map((l) => ({
      id: l.id,
      plantId: l.plantId,
      date: l.date.toISOString(),
      notes: l.notes,
      photo: l.photo ?? null,
    })),
  };
}

router.get("/plants", async (req, res): Promise<void> => {
  const plants = await db.select().from(plantsTable).orderBy(desc(plantsTable.createdAt));
  const result = await Promise.all(plants.map(buildPlantResponse));
  res.json(ListPlantsResponse.parse(result));
});

router.post("/plants", async (req, res): Promise<void> => {
  const parsed = CreatePlantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, species, photo, dateAcquired, wateringFrequencyDays, lastWatered } = parsed.data;
  const [plant] = await db.insert(plantsTable).values({
    name,
    species: species ?? "Unknown species",
    photo: photo ?? null,
    dateAcquired: dateAcquired ? new Date(dateAcquired) : new Date(),
    wateringFrequencyDays: wateringFrequencyDays ?? 7,
    lastWatered: lastWatered ? new Date(lastWatered) : null,
  }).returning();
  const full = await buildPlantResponse(plant);
  res.status(201).json(CreatePlantResponse.parse(full));
});

router.get("/plants/:id", async (req, res): Promise<void> => {
  const params = GetPlantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [plant] = await db.select().from(plantsTable).where(eq(plantsTable.id, params.data.id));
  if (!plant) {
    res.status(404).json({ error: "Plant not found" });
    return;
  }
  const full = await buildPlantResponse(plant);
  res.json(GetPlantResponse.parse(full));
});

router.patch("/plants/:id", async (req, res): Promise<void> => {
  const params = UpdatePlantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePlantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Partial<typeof plantsTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.species !== undefined) updates.species = parsed.data.species;
  if ("photo" in parsed.data) updates.photo = parsed.data.photo ?? null;
  if (parsed.data.dateAcquired !== undefined) updates.dateAcquired = new Date(parsed.data.dateAcquired);
  if (parsed.data.wateringFrequencyDays !== undefined) updates.wateringFrequencyDays = parsed.data.wateringFrequencyDays;

  const [plant] = await db.update(plantsTable).set(updates).where(eq(plantsTable.id, params.data.id)).returning();
  if (!plant) {
    res.status(404).json({ error: "Plant not found" });
    return;
  }
  const full = await buildPlantResponse(plant);
  res.json(UpdatePlantResponse.parse(full));
});

router.delete("/plants/:id", async (req, res): Promise<void> => {
  const params = DeletePlantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [plant] = await db.delete(plantsTable).where(eq(plantsTable.id, params.data.id)).returning();
  if (!plant) {
    res.status(404).json({ error: "Plant not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/plants/:id/water", async (req, res): Promise<void> => {
  const params = WaterPlantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [plant] = await db
    .update(plantsTable)
    .set({ lastWatered: new Date() })
    .where(eq(plantsTable.id, params.data.id))
    .returning();
  if (!plant) {
    res.status(404).json({ error: "Plant not found" });
    return;
  }
  const full = await buildPlantResponse(plant);
  res.json(WaterPlantResponse.parse(full));
});

router.get("/plants/:id/logs", async (req, res): Promise<void> => {
  const params = ListPlantLogsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const logs = await db
    .select()
    .from(growthLogsTable)
    .where(eq(growthLogsTable.plantId, params.data.id))
    .orderBy(desc(growthLogsTable.date));
  res.json(ListPlantLogsResponse.parse(logs.map((l) => ({
    id: l.id,
    plantId: l.plantId,
    date: l.date.toISOString(),
    notes: l.notes,
    photo: l.photo ?? null,
  }))));
});

router.post("/plants/:id/logs", async (req, res): Promise<void> => {
  const params = CreatePlantLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreatePlantLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [plant] = await db.select().from(plantsTable).where(eq(plantsTable.id, params.data.id));
  if (!plant) {
    res.status(404).json({ error: "Plant not found" });
    return;
  }
  const [log] = await db.insert(growthLogsTable).values({
    plantId: params.data.id,
    notes: parsed.data.notes,
    photo: parsed.data.photo ?? null,
    date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
  }).returning();
  res.status(201).json(CreatePlantLogResponse.parse({
    id: log.id,
    plantId: log.plantId,
    date: log.date.toISOString(),
    notes: log.notes,
    photo: log.photo ?? null,
  }));
});

router.delete("/plants/:plantId/logs/:logId", async (req, res): Promise<void> => {
  const params = DeletePlantLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [log] = await db
    .delete(growthLogsTable)
    .where(and(
      eq(growthLogsTable.id, params.data.logId),
      eq(growthLogsTable.plantId, params.data.plantId),
    ))
    .returning();
  if (!log) {
    res.status(404).json({ error: "Log not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/stats", async (_req, res): Promise<void> => {
  const plants = await db.select().from(plantsTable);
  const logs = await db.select().from(growthLogsTable);

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  let overdueCount = 0;
  let dueSoonCount = 0;
  let healthyCount = 0;
  let wateredThisWeek = 0;
  const plantHealth = [];

  for (const plant of plants) {
    const status = getWateringStatus(plant.lastWatered, plant.wateringFrequencyDays);
    const daysUntil = getDaysUntilWatering(plant.lastWatered, plant.wateringFrequencyDays);
    if (status === "overdue") overdueCount++;
    else if (status === "due-soon") dueSoonCount++;
    else healthyCount++;

    if (plant.lastWatered && plant.lastWatered.getTime() >= weekAgo) {
      wateredThisWeek++;
    }

    plantHealth.push({
      plantId: plant.id,
      name: plant.name,
      status,
      daysUntilWatering: daysUntil,
      wateringFrequencyDays: plant.wateringFrequencyDays,
    });
  }

  const totalLogs = logs.length;
  const careStreak = (() => {
    if (plants.length === 0) return 0;
    let streak = 0;
    const checkDay = new Date();
    checkDay.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const dayStart = checkDay.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const wateredOnDay = plants.some(
        (p) => p.lastWatered && p.lastWatered.getTime() >= dayStart && p.lastWatered.getTime() < dayEnd
      );
      if (wateredOnDay) streak++;
      else if (i > 0) break;
      checkDay.setDate(checkDay.getDate() - 1);
    }
    return streak;
  })();

  res.json(GetStatsResponse.parse({
    totalPlants: plants.length,
    overdueCount,
    dueSoonCount,
    healthyCount,
    totalLogs,
    wateredThisWeek,
    careStreak,
    plantHealth,
  }));
});

router.get("/activity", async (_req, res): Promise<void> => {
  const plants = await db.select().from(plantsTable).orderBy(desc(plantsTable.lastWatered));
  const logs = await db.select().from(growthLogsTable).orderBy(desc(growthLogsTable.date));

  const plantMap = new Map(plants.map((p) => [p.id, p.name]));

  const items: Array<{
    id: string;
    type: "watered" | "log";
    plantId: number;
    plantName: string;
    date: string;
    notes: string | null;
    photo: string | null;
  }> = [];

  for (const plant of plants) {
    if (plant.lastWatered) {
      items.push({
        id: `w-${plant.id}`,
        type: "watered",
        plantId: plant.id,
        plantName: plant.name,
        date: plant.lastWatered.toISOString(),
        notes: null,
        photo: null,
      });
    }
  }

  for (const log of logs) {
    items.push({
      id: `l-${log.id}`,
      type: "log",
      plantId: log.plantId,
      plantName: plantMap.get(log.plantId) ?? "Unknown",
      date: log.date.toISOString(),
      notes: log.notes,
      photo: log.photo ?? null,
    });
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json(GetActivityResponse.parse(items.slice(0, 30)));
});

export default router;
