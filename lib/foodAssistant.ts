import * as queries from "@/lib/db/queries";
import type { FoodEntry, UniqueFoodEntry } from "@/lib/types";

const ISO_DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normalizeFoodNameKey(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

export interface NutritionLookupResult {
  found: boolean;
  foodName: string;
  quantityGrams: number;
  isFruit?: boolean;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  fiberPer100g?: number;
  calories?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  message: string;
}

export interface DietBookDataResult {
  count: number;
  foods: Array<{
    id: string;
    nameKey: string;
    foodName: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    fatPer100g: number;
    fiberPer100g: number;
    isFruit: boolean;
  }>;
  message: string;
}

export interface SaveFoodFromAssistantInput {
  date: string;
  foodName: string;
  weightGrams?: number;
  unitCount?: number;
  calories: number;
  protein: number;
  fat: number;
  fiber: number;
  isFruit?: boolean;
  notes?: string;
  nutritionMode?: "total" | "per100g";
  saveToDietBook?: boolean;
}

export interface SaveFoodFromAssistantResult {
  savedFood: FoodEntry;
  dietBookUpdated: boolean;
  dietBookMessage: string;
}

export async function getDataFromDietBook(): Promise<DietBookDataResult> {
  const catalog = await queries.listUniqueFoods();
  return {
    count: catalog.length,
    foods: catalog.map((row) => ({
      id: row.id,
      nameKey: row.nameKey,
      foodName: row.foodName,
      caloriesPer100g: roundTo(row.caloriesPer100g, 2),
      proteinPer100g: roundTo(row.proteinPer100g, 2),
      fatPer100g: roundTo(row.fatPer100g, 2),
      fiberPer100g: roundTo(row.fiberPer100g, 2),
      isFruit: row.isFruit,
    })),
    message:
      catalog.length === 0
        ? "The diet book is empty."
        : `Loaded ${catalog.length} food${catalog.length === 1 ? "" : "s"} from the diet book.`,
  };
}

async function upsertDietBookFood(input: {
  foodName: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  isFruit: boolean;
}): Promise<void> {
  const nameKey = normalizeFoodNameKey(input.foodName);
  const existing = (await queries.listUniqueFoods()).find(
    (row) => row.nameKey === nameKey,
  );

  const payload: Omit<
    UniqueFoodEntry,
    "id" | "nameKey" | "createdAt" | "updatedAt"
  > = {
    foodName: input.foodName.trim(),
    caloriesPer100g: roundTo(input.caloriesPer100g, 2),
    proteinPer100g: roundTo(input.proteinPer100g, 2),
    fatPer100g: roundTo(input.fatPer100g, 2),
    fiberPer100g: roundTo(input.fiberPer100g, 2),
    isFruit: input.isFruit,
  };

  if (existing) {
    await queries.updateUniqueFood({
      id: existing.id,
      ...payload,
    });
    return;
  }

  await queries.createUniqueFood(payload);
}

export async function saveFoodFromAssistant(
  input: SaveFoodFromAssistantInput,
): Promise<SaveFoodFromAssistantResult> {
  const date = String(input.date ?? "")
    .trim()
    .slice(0, 10);
  const foodName = String(input.foodName ?? "").trim();

  if (!ISO_DATE_RE.test(date)) {
    throw new Error("A valid date is required to save food.");
  }

  if (!foodName) {
    throw new Error("Food name is required.");
  }

  const weightGrams = Math.max(0, Number(input.weightGrams) || 0);
  const unitCount = Math.max(0, Number(input.unitCount) || 0);
  const isFruit = Boolean(input.isFruit);
  const nutritionMode = input.nutritionMode ?? "total";

  let calories = Number(input.calories) || 0;
  let protein = Number(input.protein) || 0;
  let fat = Number(input.fat) || 0;
  let fiber = Number(input.fiber) || 0;

  if (nutritionMode === "per100g") {
    if (weightGrams <= 0) {
      throw new Error(
        "Weight in grams is required when saving nutrition given per 100 g.",
      );
    }

    const scale = weightGrams / 100;
    calories = Math.round(calories * scale);
    protein = roundTo(protein * scale, 2);
    fat = roundTo(fat * scale, 2);
    fiber = roundTo(fiber * scale, 2);
  } else {
    calories = Math.round(calories);
    protein = roundTo(protein, 2);
    fat = roundTo(fat, 2);
    fiber = roundTo(fiber, 2);
  }

  const savedFood = await queries.createFood({
    date,
    foodName,
    weightGrams,
    unitCount,
    calories,
    protein,
    fat,
    fiber,
    isFruit,
    notes: String(input.notes ?? "").trim(),
  });

  let dietBookUpdated = false;
  let dietBookMessage = "Diet book unchanged.";

  if (input.saveToDietBook) {
    if (weightGrams > 0) {
      const scale = 100 / weightGrams;
      await upsertDietBookFood({
        foodName,
        caloriesPer100g: calories * scale,
        proteinPer100g: protein * scale,
        fatPer100g: fat * scale,
        fiberPer100g: fiber * scale,
        isFruit,
      });
      dietBookUpdated = true;
      dietBookMessage = "Saved to the diet book for future lookups.";
    } else {
      dietBookMessage =
        "Saved the food log, but skipped the diet book because weight in grams was not provided.";
    }
  }

  return {
    savedFood,
    dietBookUpdated,
    dietBookMessage,
  };
}
