/** Shared types aligned with the `/api/gas` JSON contract and DB columns. */

/** ISO date string YYYY-MM-DD */
export type ISODate = string;

/** Canonical per-100 g macros for a food name (sync or manual in diet book). */
export interface UniqueFoodEntry {
  id: string;
  /** lower(trim(name)) */
  nameKey: string;
  foodName: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  isFruit: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Logged food for a calendar day (sums roll into InputTracker for that date). */
export interface FoodEntry {
  id: string;
  /** YYYY-MM-DD; empty string for legacy rows before date column existed */
  date: ISODate | "";
  foodName: string;
  /** Total weight (g) for this log; 0 if not specified */
  weightGrams: number;
  /** Optional count of units (e.g. 2 apples) for your notes; macros are stored as entered. */
  unitCount: number;
  calories: number;
  /** Grams */
  protein: number;
  /** Grams */
  fat: number;
  /** Grams (dietary fibre) */
  fiber: number;
  /** When true, fruitGrams roll into daily Inputs → fruit consumed */
  isFruit: boolean;
  /** Grams of fruit for this entry (used when isFruit) */
  fruitGrams: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InputRecord {
  id: string;
  date: ISODate;
  caloriesTarget: number;
  caloriesConsumed: number;
  proteinTarget: number;
  proteinConsumed: number;
  trainingDone: boolean;
  trainingNotes: string;
  sleepHours: number;
  stepCount: number;
  walkAfterLunch: boolean;
  walkAfterDinner: boolean;
  zone2Done: boolean;
  waterIntake: string;
  notes: string;
  /** Dietary fibre consumed (g) */
  fiberConsumed: number;
  /** Fruit consumed (g) */
  fruitsConsumed: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutputRecord {
  id: string;
  date: ISODate;
  bodyWeight: number;
  waist: number;
  chest: number;
  arm: number;
  thigh: number;
  progressPhotoUrl: string;
  energyLevel: string;
  mood: string;
  recovery: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  date: ISODate;
  proteinConsumed: number | null;
  caloriesTarget: number | null;
  caloriesConsumed: number | null;
  fiberConsumed: number | null;
  fruitsConsumed: number | null;
  trainingDone: boolean | null;
  sleepHours: number | null;
  stepCount: number | null;
  /** Free-text water intake from inputs (e.g. "3.5 L") for dashboard display */
  waterIntake: string | null;
  zone2Done: boolean | null;
  latestBodyWeight: number | null;
  latestBodyWeightDate: ISODate | null;
  inputNotes: string | null;
  outputNotes: string | null;
  streakDays: number;
}

export interface TrendPoint {
  date: ISODate;
  bodyWeight: number | null;
  caloriesConsumed: number | null;
  proteinConsumed: number | null;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** Payloads for mutations */
export type CreateFoodPayload = Omit<
  FoodEntry,
  "id" | "createdAt" | "updatedAt" | "fruitGrams"
> & { id?: string };

export type UpdateFoodPayload = Partial<
  Omit<FoodEntry, "createdAt" | "updatedAt">
> & { id: string };

export type CreateUniqueFoodPayload = Pick<
  UniqueFoodEntry,
  "foodName" | "caloriesPer100g" | "proteinPer100g" | "fatPer100g" | "fiberPer100g" | "isFruit"
>;

export type UpdateUniqueFoodPayload = Partial<
  Pick<
    UniqueFoodEntry,
    "foodName" | "caloriesPer100g" | "proteinPer100g" | "fatPer100g" | "fiberPer100g" | "isFruit"
  >
> & { id: string };

export type SaveInputsPayload = Omit<
  InputRecord,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

export type SaveOutputsPayload = Omit<
  OutputRecord,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };
