import {
  boolean,
  date,
  integer,
  pgTable,
  real,
  text,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * One row per distinct food name (case-insensitive key), macros per 100 g. Filled by sync from logs, diet book edits, or both.
 */
export const uniqueFoods = pgTable("unique_foods", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** lower(trim(name)) — dedupe key */
  nameKey: text("name_key").notNull().unique(),
  /** Display label (e.g. from most recently updated log) */
  foodName: text("food_name").notNull(),
  caloriesPer100g: real("calories_per_100g").notNull().default(0),
  proteinPer100g: real("protein_per_100g").notNull().default(0),
  fatPer100g: real("fat_per_100g").notNull().default(0),
  fiberPer100g: real("fiber_per_100g").notNull().default(0),
  isFruit: boolean("is_fruit").notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const foods = pgTable("foods", {
  id: uuid("id").primaryKey().defaultRandom(),
  logDate: date("log_date", { mode: "string" }),
  foodName: text("food_name").notNull(),
  weightGrams: real("weight_grams").notNull().default(0),
  unitCount: real("unit_count").notNull().default(0),
  calories: integer("calories").notNull().default(0),
  protein: real("protein").notNull().default(0),
  fat: real("fat").notNull().default(0),
  fiber: real("fiber").notNull().default(0),
  isFruit: boolean("is_fruit").notNull().default(false),
  /** Grams counted toward daily fruit when isFruit; 0 otherwise */
  fruitGrams: real("fruit_grams").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const inputs = pgTable("inputs", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "string" }).notNull().unique(),
  caloriesTarget: integer("calories_target").notNull().default(0),
  caloriesConsumed: integer("calories_consumed").notNull().default(0),
  proteinTarget: integer("protein_target").notNull().default(0),
  proteinConsumed: real("protein_consumed").notNull().default(0),
  trainingDone: boolean("training_done").notNull().default(false),
  trainingNotes: text("training_notes").notNull().default(""),
  sleepHours: real("sleep_hours").notNull().default(0),
  stepCount: integer("step_count").notNull().default(0),
  walkAfterLunch: boolean("walk_after_lunch").notNull().default(false),
  walkAfterDinner: boolean("walk_after_dinner").notNull().default(false),
  zone2Done: boolean("zone2_done").notNull().default(false),
  waterIntake: text("water_intake").notNull().default(""),
  notes: text("notes").notNull().default(""),
  fiberConsumed: real("fiber_consumed").notNull().default(0),
  fruitsConsumed: real("fruits_consumed").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const outputs = pgTable("outputs", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "string" }).notNull().unique(),
  bodyWeight: real("body_weight").notNull().default(0),
  waist: real("waist").notNull().default(0),
  chest: real("chest").notNull().default(0),
  arm: real("arm").notNull().default(0),
  thigh: real("thigh").notNull().default(0),
  progressPhotoUrl: text("progress_photo_url").notNull().default(""),
  energyLevel: text("energy_level").notNull().default(""),
  mood: text("mood").notNull().default(""),
  recovery: text("recovery").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type UniqueFoodRow = typeof uniqueFoods.$inferSelect;
export type FoodRow = typeof foods.$inferSelect;
export type InputRow = typeof inputs.$inferSelect;
export type OutputRow = typeof outputs.$inferSelect;
