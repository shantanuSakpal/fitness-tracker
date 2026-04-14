import { INPUT_TARGETS } from "@/lib/inputTargets";
import type {
  CreateFoodPayload,
  CreateUniqueFoodPayload,
  DashboardSummary,
  FoodEntry,
  InputRecord,
  OutputRecord,
  SaveInputsPayload,
  SaveOutputsPayload,
  UniqueFoodEntry,
  UpdateUniqueFoodPayload,
} from "@/lib/types";
import { addDays } from "@/lib/utils";
import { and, asc, desc, eq, gte, isNotNull, lte, ne, sql, sum } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "./client";
import { foods, inputs, outputs, uniqueFoods } from "./schema";
import type { FoodRow, InputRow, OutputRow, UniqueFoodRow } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
}

function isIsoDate(s: string): boolean {
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s);
}

/** Store macros exactly as entered; fruit grams come from total weight when flagged as fruit. */
function normalizeFoodRow(input: {
  calories: number;
  protein: number;
  fat: number;
  fiber: number;
  weightGrams: number;
  unitCount: number;
  isFruit: boolean;
}): {
  calories: number;
  protein: number;
  fat: number;
  fiber: number;
  fruitGrams: number;
  weightGrams: number;
  unitCount: number;
} {
  const w = Math.max(0, Number(input.weightGrams) || 0);
  const uc = Math.max(0, Number(input.unitCount) || 0);
  return {
    weightGrams: w,
    unitCount: uc,
    calories: Math.round(Number(input.calories) || 0),
    protein: Number(input.protein) || 0,
    fat: Number(input.fat) || 0,
    fiber: Number(input.fiber) || 0,
    fruitGrams: input.isFruit && w > 0 ? w : 0,
  };
}

// --- mappers

export function rowToUniqueFoodEntry(row: UniqueFoodRow): UniqueFoodEntry {
  return {
    id: row.id,
    nameKey: row.nameKey,
    foodName: row.foodName,
    caloriesPer100g: Number(row.caloriesPer100g) || 0,
    proteinPer100g: Number(row.proteinPer100g) || 0,
    fatPer100g: Number(row.fatPer100g) || 0,
    fiberPer100g: Number(row.fiberPer100g) || 0,
    isFruit: row.isFruit ?? false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function rowToFoodEntry(row: FoodRow): FoodEntry {
  return {
    id: row.id,
    date: row.logDate ?? "",
    foodName: row.foodName,
    weightGrams: Number(row.weightGrams) || 0,
    unitCount: Number(row.unitCount) || 0,
    calories: row.calories ?? 0,
    protein: row.protein ?? 0,
    fat: row.fat ?? 0,
    fiber: row.fiber ?? 0,
    isFruit: row.isFruit ?? false,
    fruitGrams: Number(row.fruitGrams) || 0,
    notes: row.notes ?? "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToInputRecord(row: InputRow): InputRecord {
  return {
    id: row.id,
    date: row.date,
    caloriesTarget: row.caloriesTarget ?? 0,
    caloriesConsumed: row.caloriesConsumed ?? 0,
    proteinTarget: row.proteinTarget ?? 0,
    proteinConsumed: row.proteinConsumed ?? 0,
    trainingDone: row.trainingDone ?? false,
    trainingNotes: row.trainingNotes ?? "",
    sleepHours: row.sleepHours ?? 0,
    stepCount: row.stepCount ?? 0,
    walkAfterLunch: row.walkAfterLunch ?? false,
    walkAfterDinner: row.walkAfterDinner ?? false,
    zone2Done: row.zone2Done ?? false,
    waterIntake: row.waterIntake ?? "",
    notes: row.notes ?? "",
    fiberConsumed: row.fiberConsumed ?? 0,
    fruitsConsumed: row.fruitsConsumed ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToOutputRecord(row: OutputRow): OutputRecord {
  return {
    id: row.id,
    date: row.date,
    bodyWeight: row.bodyWeight ?? 0,
    waist: row.waist ?? 0,
    chest: row.chest ?? 0,
    arm: row.arm ?? 0,
    thigh: row.thigh ?? 0,
    progressPhotoUrl: row.progressPhotoUrl ?? "",
    energyLevel: row.energyLevel ?? "",
    mood: row.mood ?? "",
    recovery: row.recovery ?? "",
    notes: row.notes ?? "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Sort: newest log date first; null/legacy dates last; then food name. */
function sortFoodEntries(entries: FoodEntry[]): FoodEntry[] {
  return [...entries].sort((a, b) => {
    const da = a.date || "";
    const db = b.date || "";
    if (da !== db) {
      if (!da) return 1;
      if (!db) return -1;
      return db.localeCompare(da);
    }
    return a.foodName.localeCompare(b.foodName, undefined, {
      sensitivity: "base",
    });
  });
}

// --- food + input macro sync

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- transaction client matches db
async function sumFoodMacrosForDate(tx: any, dateIso: string): Promise<{
  calories: number;
  protein: number;
  fiber: number;
  fruitGrams: number;
}> {
  const [agg] = await tx
    .select({
      calories: sum(foods.calories),
      protein: sum(foods.protein),
      fiber: sum(foods.fiber),
      fruitGrams: sql<number>`coalesce(sum(case when ${foods.isFruit} then ${foods.fruitGrams} else 0 end), 0)`,
    })
    .from(foods)
    .where(and(eq(foods.logDate, dateIso), isNotNull(foods.logDate)));

  return {
    calories: Number(agg?.calories ?? 0) || 0,
    protein: Number(agg?.protein ?? 0) || 0,
    fiber: Number(agg?.fiber ?? 0) || 0,
    fruitGrams: Number(agg?.fruitGrams ?? 0) || 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncInputMacrosFromFoodForDate(tx: any, dateIso: string): Promise<void> {
  if (!isIsoDate(dateIso)) return;

  const sums = await sumFoodMacrosForDate(tx, dateIso);
  const t = nowIso();

  const [existing] = await tx
    .select()
    .from(inputs)
    .where(eq(inputs.date, dateIso))
    .limit(1);

  if (!existing) {
    await tx.insert(inputs).values({
      date: dateIso,
      caloriesTarget: INPUT_TARGETS.CALORIES,
      caloriesConsumed: sums.calories,
      proteinTarget: INPUT_TARGETS.PROTEIN_G,
      proteinConsumed: sums.protein,
      trainingDone: false,
      trainingNotes: "",
      sleepHours: 0,
      stepCount: 0,
      walkAfterLunch: false,
      walkAfterDinner: false,
      zone2Done: false,
      waterIntake: "",
      notes: "",
      fiberConsumed: sums.fiber,
      fruitsConsumed: sums.fruitGrams,
      createdAt: t,
      updatedAt: t,
    });
    return;
  }

  await tx
    .update(inputs)
    .set({
      caloriesConsumed: sums.calories,
      proteinConsumed: sums.protein,
      fiberConsumed: sums.fiber,
      fruitsConsumed: sums.fruitGrams,
      updatedAt: t,
    })
    .where(eq(inputs.date, dateIso));
}

// --- unique foods (per100 g, from sync)

function foodNameToKey(raw: string): string {
  return String(raw ?? "").trim().toLowerCase();
}

type UniqueFoodGroup = {
  nameKey: string;
  displayName: string;
  latestUpdated: string;
  sumW: number;
  sumCal: number;
  sumPro: number;
  sumFat: number;
  sumFib: number;
  isFruit: boolean;
};

/**
 * If there is no diet-book row yet for this name, insert one from logs (per-100 g =
 * sum(macro)/sum(weight)*100 over log lines with weight &gt; 0). Never deletes or
 * overwrites an existing `unique_foods` row (edits / sync handle updates).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureUniqueFoodFromLogsTx(tx: any, nameKey: string): Promise<void> {
  if (!nameKey) return;

  const [already] = await tx
    .select({ id: uniqueFoods.id })
    .from(uniqueFoods)
    .where(eq(uniqueFoods.nameKey, nameKey))
    .limit(1);
  if (already) return;

  const rows = await tx
    .select()
    .from(foods)
    .where(sql`lower(trim(${foods.foodName})) = ${nameKey}`);

  let g: UniqueFoodGroup | null = null;
  for (const row of rows) {
    const rawName = String(row.foodName ?? "").trim();
    if (!rawName) continue;
    if (rawName.toLowerCase() !== nameKey) continue;
    const w = Math.max(0, Number(row.weightGrams) || 0);
    const updatedAt = String(row.updatedAt ?? "");

    if (!g) {
      g = {
        nameKey,
        displayName: rawName,
        latestUpdated: updatedAt,
        sumW: 0,
        sumCal: 0,
        sumPro: 0,
        sumFat: 0,
        sumFib: 0,
        isFruit: false,
      };
    }

    if (row.isFruit) g.isFruit = true;
    if (updatedAt >= g.latestUpdated) {
      g.latestUpdated = updatedAt;
      g.displayName = rawName;
    }

    if (w > 0) {
      g.sumW += w;
      g.sumCal += Number(row.calories) || 0;
      g.sumPro += Number(row.protein) || 0;
      g.sumFat += Number(row.fat) || 0;
      g.sumFib += Number(row.fiber) || 0;
    }
  }

  if (!g || g.sumW <= 0) {
    return;
  }

  const scale = 100 / g.sumW;
  const t = nowIso();
  await tx
    .insert(uniqueFoods)
    .values({
      nameKey: g.nameKey,
      foodName: g.displayName,
      caloriesPer100g: g.sumCal * scale,
      proteinPer100g: g.sumPro * scale,
      fatPer100g: g.sumFat * scale,
      fiberPer100g: g.sumFib * scale,
      isFruit: g.isFruit,
      createdAt: t,
      updatedAt: t,
    })
    .onConflictDoNothing({ target: uniqueFoods.nameKey });
}

export async function listUniqueFoods(): Promise<UniqueFoodEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(uniqueFoods)
    .orderBy(asc(uniqueFoods.foodName));
  return rows.map(rowToUniqueFoodEntry);
}

export async function createUniqueFood(
  payload: CreateUniqueFoodPayload
): Promise<UniqueFoodEntry> {
  const name = String(payload.foodName ?? "").trim();
  if (!name) {
    throw new Error("Food name is required");
  }
  const nameKey = name.toLowerCase();
  const db = getDb();
  const [existing] = await db
    .select({ id: uniqueFoods.id })
    .from(uniqueFoods)
    .where(eq(uniqueFoods.nameKey, nameKey))
    .limit(1);
  if (existing) {
    throw new Error("A saved food with this name already exists");
  }
  const t = nowIso();
  const [row] = await db
    .insert(uniqueFoods)
    .values({
      nameKey,
      foodName: name,
      caloriesPer100g: Number(payload.caloriesPer100g) || 0,
      proteinPer100g: Number(payload.proteinPer100g) || 0,
      fatPer100g: Number(payload.fatPer100g) || 0,
      fiberPer100g: Number(payload.fiberPer100g) || 0,
      isFruit: Boolean(payload.isFruit),
      createdAt: t,
      updatedAt: t,
    })
    .returning();
  return rowToUniqueFoodEntry(row!);
}

export async function updateUniqueFood(
  payload: UpdateUniqueFoodPayload
): Promise<UniqueFoodEntry> {
  const db = getDb();
  const t = nowIso();
  const [cur] = await db
    .select()
    .from(uniqueFoods)
    .where(eq(uniqueFoods.id, payload.id))
    .limit(1);
  if (!cur) {
    throw new Error("Saved food not found: " + payload.id);
  }

  let foodName = cur.foodName;
  let nameKey = cur.nameKey;
  if (payload.foodName !== undefined) {
    const n = String(payload.foodName).trim();
    if (!n) {
      throw new Error("Food name is required");
    }
    foodName = n;
    nameKey = n.toLowerCase();
  }

  if (nameKey !== cur.nameKey) {
    const [dup] = await db
      .select({ id: uniqueFoods.id })
      .from(uniqueFoods)
      .where(and(eq(uniqueFoods.nameKey, nameKey), ne(uniqueFoods.id, payload.id)))
      .limit(1);
    if (dup) {
      throw new Error("A saved food with this name already exists");
    }
  }

  const [row] = await db
    .update(uniqueFoods)
    .set({
      nameKey,
      foodName,
      caloriesPer100g:
        payload.caloriesPer100g !== undefined
          ? Number(payload.caloriesPer100g) || 0
          : cur.caloriesPer100g,
      proteinPer100g:
        payload.proteinPer100g !== undefined
          ? Number(payload.proteinPer100g) || 0
          : cur.proteinPer100g,
      fatPer100g:
        payload.fatPer100g !== undefined
          ? Number(payload.fatPer100g) || 0
          : cur.fatPer100g,
      fiberPer100g:
        payload.fiberPer100g !== undefined
          ? Number(payload.fiberPer100g) || 0
          : cur.fiberPer100g,
      isFruit:
        payload.isFruit !== undefined ? Boolean(payload.isFruit) : cur.isFruit,
      updatedAt: t,
    })
    .where(eq(uniqueFoods.id, payload.id))
    .returning();

  return rowToUniqueFoodEntry(row!);
}

export async function deleteUniqueFood(id: string): Promise<{ deleted: boolean }> {
  const db = getDb();
  const [cur] = await db
    .select({ id: uniqueFoods.id })
    .from(uniqueFoods)
    .where(eq(uniqueFoods.id, id))
    .limit(1);
  if (!cur) {
    throw new Error("Saved food not found: " + id);
  }
  await db.delete(uniqueFoods).where(eq(uniqueFoods.id, id));
  return { deleted: true };
}

/**
 * Rebuild `unique_foods` from `foods`: one row per trimmed name (case-insensitive).
 * Macros are totals over rows with weight &gt; 0, scaled to per 100 g: sum(macro)/sum(weight)*100.
 */
export async function syncUniqueFoodsFromFoods(): Promise<{ upserted: number }> {
  const db = getDb();
  const all = await db.select().from(foods);
  const t = nowIso();

  type Group = {
    nameKey: string;
    displayName: string;
    latestUpdated: string;
    sumW: number;
    sumCal: number;
    sumPro: number;
    sumFat: number;
    sumFib: number;
    isFruit: boolean;
  };

  const map = new Map<string, Group>();

  for (const row of all) {
    const rawName = String(row.foodName ?? "").trim();
    if (!rawName) continue;
    const nameKey = rawName.toLowerCase();
    const w = Math.max(0, Number(row.weightGrams) || 0);
    const updatedAt = String(row.updatedAt ?? "");

    let g = map.get(nameKey);
    if (!g) {
      g = {
        nameKey,
        displayName: rawName,
        latestUpdated: updatedAt,
        sumW: 0,
        sumCal: 0,
        sumPro: 0,
        sumFat: 0,
        sumFib: 0,
        isFruit: false,
      };
      map.set(nameKey, g);
    }

    if (row.isFruit) g.isFruit = true;
    if (updatedAt >= g.latestUpdated) {
      g.latestUpdated = updatedAt;
      g.displayName = rawName;
    }

    if (w > 0) {
      g.sumW += w;
      g.sumCal += Number(row.calories) || 0;
      g.sumPro += Number(row.protein) || 0;
      g.sumFat += Number(row.fat) || 0;
      g.sumFib += Number(row.fiber) || 0;
    }
  }

  let upserted = 0;
  for (const g of map.values()) {
    if (g.sumW <= 0) continue;

    const scale = 100 / g.sumW;
    const caloriesPer100g = g.sumCal * scale;
    const proteinPer100g = g.sumPro * scale;
    const fatPer100g = g.sumFat * scale;
    const fiberPer100g = g.sumFib * scale;

    await db
      .insert(uniqueFoods)
      .values({
        nameKey: g.nameKey,
        foodName: g.displayName,
        caloriesPer100g,
        proteinPer100g,
        fatPer100g,
        fiberPer100g,
        isFruit: g.isFruit,
        createdAt: t,
        updatedAt: t,
      })
      .onConflictDoUpdate({
        target: uniqueFoods.nameKey,
        set: {
          foodName: g.displayName,
          caloriesPer100g,
          proteinPer100g,
          fatPer100g,
          fiberPer100g,
          isFruit: g.isFruit,
          updatedAt: t,
        },
      });
    upserted++;
  }

  return { upserted };
}

// --- CRUD: foods

export async function listAllFood(): Promise<FoodEntry[]> {
  const db = getDb();
  const rows = await db.select().from(foods);
  return sortFoodEntries(rows.map(rowToFoodEntry));
}

export async function listFoodByDate(dateIso: string): Promise<FoodEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(foods)
    .where(and(eq(foods.logDate, dateIso), isNotNull(foods.logDate)));
  return sortFoodEntries(rows.map(rowToFoodEntry));
}

export async function createFood(
  payload: CreateFoodPayload
): Promise<FoodEntry> {
  const d = String(payload.date || "").trim().slice(0, 10);
  if (!isIsoDate(d)) {
    throw new Error("Food log requires date (YYYY-MM-DD)");
  }
  const db = getDb();
  const t = nowIso();
  const [row] = await db.transaction(async (tx) => {
    const stored = normalizeFoodRow({
      calories: Number(payload.calories) || 0,
      protein: Number(payload.protein) || 0,
      fat: Number(payload.fat) || 0,
      fiber: Number(payload.fiber) || 0,
      weightGrams: Number(payload.weightGrams) || 0,
      unitCount: Number(payload.unitCount) || 0,
      isFruit: Boolean(payload.isFruit),
    });
    const [inserted] = await tx
      .insert(foods)
      .values({
        logDate: d,
        foodName: payload.foodName,
        weightGrams: stored.weightGrams,
        unitCount: stored.unitCount,
        calories: stored.calories,
        protein: stored.protein,
        fat: stored.fat,
        fiber: stored.fiber,
        isFruit: Boolean(payload.isFruit),
        fruitGrams: stored.fruitGrams,
        notes: payload.notes ?? "",
        createdAt: t,
        updatedAt: t,
      })
      .returning();
    await syncInputMacrosFromFoodForDate(tx, d);
    await ensureUniqueFoodFromLogsTx(tx, foodNameToKey(String(payload.foodName)));
    return [inserted];
  });
  return rowToFoodEntry(row!);
}

export async function updateFood(
  payload: Partial<Omit<FoodEntry, "createdAt" | "updatedAt">> & {
    id: string;
  }
): Promise<FoodEntry> {
  const db = getDb();
  const t = nowIso();

  const updated = await db.transaction(async (tx) => {
    const [cur] = await tx
      .select()
      .from(foods)
      .where(eq(foods.id, payload.id))
      .limit(1);
    if (!cur) throw new Error("Food not found: " + payload.id);

    const before = rowToFoodEntry(cur);
    const oldDate = before.date;

    const nextDate =
      payload.date !== undefined
        ? String(payload.date).trim().slice(0, 10)
        : oldDate;
    if (!isIsoDate(nextDate)) {
      throw new Error("Food log requires date (YYYY-MM-DD)");
    }

    const nextUc =
      payload.unitCount !== undefined
        ? Math.max(0, Number(payload.unitCount) || 0)
        : Number(cur.unitCount) || 0;
    const nextWeight =
      payload.weightGrams !== undefined
        ? Math.max(0, Number(payload.weightGrams) || 0)
        : Number(cur.weightGrams) || 0;
    const nextIsFruit =
      payload.isFruit !== undefined ? Boolean(payload.isFruit) : cur.isFruit;

    const nextCal =
      payload.calories !== undefined
        ? Number(payload.calories) || 0
        : Number(cur.calories) || 0;
    const nextPro =
      payload.protein !== undefined
        ? Number(payload.protein) || 0
        : Number(cur.protein) || 0;
    const nextFat =
      payload.fat !== undefined ? Number(payload.fat) || 0 : Number(cur.fat) || 0;
    const nextFib =
      payload.fiber !== undefined
        ? Number(payload.fiber) || 0
        : Number(cur.fiber) || 0;

    const stored = normalizeFoodRow({
      calories: nextCal,
      protein: nextPro,
      fat: nextFat,
      fiber: nextFib,
      weightGrams: nextWeight,
      unitCount: nextUc,
      isFruit: nextIsFruit,
    });

    const [row] = await tx
      .update(foods)
      .set({
        logDate: nextDate,
        foodName:
          payload.foodName !== undefined ? payload.foodName : cur.foodName,
        weightGrams: stored.weightGrams,
        unitCount: stored.unitCount,
        calories: stored.calories,
        protein: stored.protein,
        fat: stored.fat,
        fiber: stored.fiber,
        isFruit: nextIsFruit,
        fruitGrams: stored.fruitGrams,
        notes: payload.notes !== undefined ? payload.notes : cur.notes,
        updatedAt: t,
      })
      .where(eq(foods.id, payload.id))
      .returning();

    if (oldDate && isIsoDate(oldDate) && oldDate !== nextDate) {
      await syncInputMacrosFromFoodForDate(tx, oldDate);
    }
    await syncInputMacrosFromFoodForDate(tx, nextDate);

    const nextFoodName =
      payload.foodName !== undefined ? String(payload.foodName) : String(cur.foodName);
    const newNameKey = foodNameToKey(nextFoodName);
    await ensureUniqueFoodFromLogsTx(tx, newNameKey);

    return row;
  });

  return rowToFoodEntry(updated!);
}

export async function deleteFood(id: string): Promise<{ deleted: boolean }> {
  const db = getDb();
  await db.transaction(async (tx) => {
    const [cur] = await tx.select().from(foods).where(eq(foods.id, id)).limit(1);
    if (!cur) throw new Error("Food not found: " + id);
    const syncDate = cur.logDate;
    await tx.delete(foods).where(eq(foods.id, id));
    if (syncDate && isIsoDate(syncDate)) {
      await syncInputMacrosFromFoodForDate(tx, syncDate);
    }
  });
  return { deleted: true };
}

// --- CRUD: inputs

export async function getInputByDate(dateIso: string): Promise<InputRecord | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(inputs)
    .where(eq(inputs.date, dateIso))
    .limit(1);
  return row ? rowToInputRecord(row) : null;
}

export async function saveInput(payload: SaveInputsPayload): Promise<InputRecord> {
  const db = getDb();
  const dateIso = String(payload.date);
  const t = nowIso();

  let existing: InputRow | undefined;
  if (payload.id) {
    const [byId] = await db
      .select()
      .from(inputs)
      .where(eq(inputs.id, payload.id))
      .limit(1);
    if (byId) existing = byId;
  }
  if (!existing) {
    const [byDate] = await db
      .select()
      .from(inputs)
      .where(eq(inputs.date, dateIso))
      .limit(1);
    existing = byDate;
  }

  const created = existing?.createdAt ?? t;
  const id = existing?.id ?? randomUUID();

  const rec = {
    id,
    date: dateIso,
    caloriesTarget: Number(payload.caloriesTarget) || 0,
    caloriesConsumed: Number(payload.caloriesConsumed) || 0,
    proteinTarget: Number(payload.proteinTarget) || 0,
    proteinConsumed: Number(payload.proteinConsumed) || 0,
    trainingDone: !!payload.trainingDone,
    trainingNotes: String(payload.trainingNotes ?? ""),
    sleepHours: Number(payload.sleepHours) || 0,
    stepCount: Number(payload.stepCount) || 0,
    walkAfterLunch: !!payload.walkAfterLunch,
    walkAfterDinner: !!payload.walkAfterDinner,
    zone2Done: !!payload.zone2Done,
    waterIntake: String(payload.waterIntake ?? ""),
    notes: String(payload.notes ?? ""),
    fiberConsumed: Number(payload.fiberConsumed) || 0,
    fruitsConsumed: Number(payload.fruitsConsumed) || 0,
    updatedAt: t,
  };

  if (existing) {
    const [row] = await db
      .update(inputs)
      .set({
        ...rec,
        createdAt: created,
      })
      .where(eq(inputs.id, id))
      .returning();
    return rowToInputRecord(row!);
  }

  const [row] = await db
    .insert(inputs)
    .values({
      ...rec,
      createdAt: created,
    })
    .returning();
  return rowToInputRecord(row!);
}

// --- CRUD: outputs

export async function getOutputByDate(dateIso: string): Promise<OutputRecord | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(outputs)
    .where(eq(outputs.date, dateIso))
    .limit(1);
  return row ? rowToOutputRecord(row) : null;
}

export async function saveOutput(
  payload: SaveOutputsPayload
): Promise<OutputRecord> {
  const db = getDb();
  const dateIso = String(payload.date);
  const t = nowIso();

  let existing: OutputRow | undefined;
  if (payload.id) {
    const [byId] = await db
      .select()
      .from(outputs)
      .where(eq(outputs.id, payload.id))
      .limit(1);
    if (byId) existing = byId;
  }
  if (!existing) {
    const [byDate] = await db
      .select()
      .from(outputs)
      .where(eq(outputs.date, dateIso))
      .limit(1);
    existing = byDate;
  }

  const created = existing?.createdAt ?? t;
  const id = existing?.id ?? randomUUID();

  const rec = {
    id,
    date: dateIso,
    bodyWeight: Number(payload.bodyWeight) || 0,
    waist: Number(payload.waist) || 0,
    chest: Number(payload.chest) || 0,
    arm: Number(payload.arm) || 0,
    thigh: Number(payload.thigh) || 0,
    progressPhotoUrl: String(payload.progressPhotoUrl ?? ""),
    energyLevel: String(payload.energyLevel ?? ""),
    mood: String(payload.mood ?? ""),
    recovery: String(payload.recovery ?? ""),
    notes: String(payload.notes ?? ""),
    updatedAt: t,
  };

  if (existing) {
    const [row] = await db
      .update(outputs)
      .set({ ...rec, createdAt: created })
      .where(eq(outputs.id, id))
      .returning();
    return rowToOutputRecord(row!);
  }

  const [row] = await db
    .insert(outputs)
    .values({
      ...rec,
      createdAt: created,
    })
    .returning();
  return rowToOutputRecord(row!);
}

// --- dashboard + trends

export async function latestOutputOnOrBefore(dateIso: string): Promise<{
  date: string;
  bodyWeight: number;
} | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(outputs)
    .where(and(lte(outputs.date, dateIso), sql`${outputs.bodyWeight} > 0`))
    .orderBy(desc(outputs.date))
    .limit(1);
  if (!row) return null;
  return { date: row.date, bodyWeight: row.bodyWeight };
}

/** Consecutive days with training, walking backward from `endDate` (inclusive). */
export async function computeStreakEndingAt(endDate: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ date: inputs.date, trainingDone: inputs.trainingDone })
    .from(inputs)
    .where(and(lte(inputs.date, endDate), eq(inputs.trainingDone, true)));

  const trainingDays = new Set(
    rows.filter((r) => r.trainingDone).map((r) => r.date)
  );

  let d = endDate;
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    if (!trainingDays.has(d)) break;
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

export async function getDashboardSummary(dateIso: string): Promise<DashboardSummary> {
  const [input, outputRow, latest, streakDays] = await Promise.all([
    getInputByDate(dateIso),
    getOutputByDate(dateIso),
    latestOutputOnOrBefore(dateIso),
    computeStreakEndingAt(
      new Date().toISOString().slice(0, 10)
    ),
  ]);

  return {
    date: dateIso,
    proteinConsumed: input?.proteinConsumed ?? null,
    caloriesTarget: input?.caloriesTarget ?? null,
    caloriesConsumed: input?.caloriesConsumed ?? null,
    fiberConsumed: input?.fiberConsumed ?? null,
    fruitsConsumed: input?.fruitsConsumed ?? null,
    trainingDone: input ? input.trainingDone : null,
    sleepHours: input?.sleepHours ?? null,
    stepCount: input?.stepCount ?? null,
    waterIntake: input ? input.waterIntake.trim() || null : null,
    zone2Done: input ? input.zone2Done : null,
    latestBodyWeight: latest?.bodyWeight ?? null,
    latestBodyWeightDate: latest?.date ?? null,
    inputNotes: input?.notes ?? null,
    outputNotes: outputRow?.notes ?? null,
    streakDays,
  };
}

export async function getTrendData(days: number): Promise<
  {
    date: string;
    bodyWeight: number | null;
    caloriesConsumed: number | null;
    proteinConsumed: number | null;
  }[]
> {
  const db = getDb();
  const [inMax] = await db
    .select({ d: sql<string | null>`max(${inputs.date})` })
    .from(inputs);
  const [outMax] = await db
    .select({ d: sql<string | null>`max(${outputs.date})` })
    .from(outputs);

  const candidates = [inMax?.d, outMax?.d].filter(Boolean) as string[];
  if (candidates.length === 0) return [];

  const cutoff = candidates.reduce((a, b) => (a > b ? a : b));
  const minStr = addDays(cutoff, -(Math.max(1, days) - 1));

  const inRows = await db
    .select({
      date: inputs.date,
      caloriesConsumed: inputs.caloriesConsumed,
      proteinConsumed: inputs.proteinConsumed,
    })
    .from(inputs)
    .where(gte(inputs.date, minStr));

  const outRows = await db
    .select({
      date: outputs.date,
      bodyWeight: outputs.bodyWeight,
    })
    .from(outputs)
    .where(gte(outputs.date, minStr));

  type Merged = {
    date: string;
    bodyWeight: number | null;
    caloriesConsumed: number | null;
    proteinConsumed: number | null;
  };

  const map: Record<string, Merged> = {};

  for (const r of inRows) {
    const key = r.date;
    if (!map[key]) map[key] = { date: key, bodyWeight: null, caloriesConsumed: null, proteinConsumed: null };
    map[key].caloriesConsumed = r.caloriesConsumed;
    map[key].proteinConsumed = r.proteinConsumed;
  }
  for (const r of outRows) {
    const key = r.date;
    if (!map[key]) map[key] = { date: key, bodyWeight: null, caloriesConsumed: null, proteinConsumed: null };
    const bw = Number(r.bodyWeight) || 0;
    map[key].bodyWeight = bw > 0 ? bw : null;
  }

  return Object.keys(map)
    .sort()
    .filter((k) => k >= minStr)
    .map((k) => map[k]);
}
