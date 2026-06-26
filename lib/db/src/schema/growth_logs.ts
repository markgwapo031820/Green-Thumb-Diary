import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { plantsTable } from "./plants";

export const growthLogsTable = pgTable("growth_logs", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull().references(() => plantsTable.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes").notNull(),
  photo: text("photo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGrowthLogSchema = createInsertSchema(growthLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGrowthLog = z.infer<typeof insertGrowthLogSchema>;
export type GrowthLog = typeof growthLogsTable.$inferSelect;
