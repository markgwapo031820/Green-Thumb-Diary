import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plantsTable = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species").notNull().default("Unknown species"),
  photo: text("photo"),
  dateAcquired: timestamp("date_acquired", { withTimezone: true }).notNull().defaultNow(),
  wateringFrequencyDays: integer("watering_frequency_days").notNull().default(7),
  lastWatered: timestamp("last_watered", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlantSchema = createInsertSchema(plantsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type Plant = typeof plantsTable.$inferSelect;
