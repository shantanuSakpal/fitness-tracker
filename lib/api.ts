/**
 * Client-side API layer. Posts to `/api/gas`, which runs CRUD against Neon (Drizzle).
 */

import type {
  ApiResponse,
  CreateFoodPayload,
  DashboardSummary,
  FoodEntry,
  InputRecord,
  OutputRecord,
  SaveInputsPayload,
  SaveOutputsPayload,
  TrendPoint,
  UpdateFoodPayload,
} from "./types";

const PROXY_PATH = "/api/gas";

function endpointUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${PROXY_PATH}`;
  }
  return PROXY_PATH;
}

export class GasApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "GasApiError";
  }
}

interface RetryOptions {
  retries?: number;
  delayMs?: number;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * POST JSON to the app API. Parses unified { ok, data?, error? } shape.
 */
export async function gasRequest<T>(
  body: Record<string, unknown>,
  retry: RetryOptions = {}
): Promise<T> {
  const { retries = 2, delayMs = 400 } = retry;
  const url = endpointUrl();

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        let msg = t || `Request failed (${res.status})`;
        try {
          const j = JSON.parse(t) as { error?: string };
          if (j?.error) msg = j.error;
        } catch {
          /* keep msg */
        }
        throw new GasApiError(msg, res.status);
      }

      const json = (await res.json()) as ApiResponse<T>;
      if (!json || typeof json !== "object") {
        throw new GasApiError("Invalid response");
      }
      if (!("ok" in json)) {
        throw new GasApiError("Malformed API response");
      }
      if (!json.ok) {
        throw new GasApiError(
          "error" in json && json.error ? json.error : "Unknown error"
        );
      }
      return json.data;
    } catch (e) {
      lastErr = e;
      if (attempt < retries && !(e instanceof GasApiError)) {
        await sleep(delayMs * (attempt + 1));
        continue;
      }
      if (attempt < retries && e instanceof GasApiError && e.status === 503) {
        await sleep(delayMs * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new GasApiError(String(lastErr));
}

function normalizeFoodEntry(e: FoodEntry): FoodEntry {
  const raw = e.date != null ? String(e.date).slice(0, 10) : "";
  const date =
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(raw) ? (raw as FoodEntry["date"]) : "";
  return {
    id: e.id,
    date,
    foodName: e.foodName,
    weightGrams: Number(e.weightGrams) || 0,
    unitCount: Number(e.unitCount) || 0,
    calories: Number(e.calories) || 0,
    protein: Number(e.protein) || 0,
    fat: Number(e.fat) || 0,
    fiber: Number(e.fiber) || 0,
    isFruit: Boolean(e.isFruit),
    fruitGrams: Number(e.fruitGrams) || 0,
    notes: e.notes ?? "",
    createdAt: e.createdAt ?? "",
    updatedAt: e.updatedAt ?? "",
  };
}

/** All food rows (client may filter by date). */
export async function fetchAllFood(): Promise<FoodEntry[]> {
  const data = await gasRequest<FoodEntry[]>({
    action: "getAllFood",
  });
  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeFoodEntry(row as FoodEntry));
}

export async function createFood(
  payload: CreateFoodPayload
): Promise<FoodEntry> {
  return gasRequest<FoodEntry>({ action: "addFood", ...payload });
}

export async function updateFood(
  payload: UpdateFoodPayload
): Promise<FoodEntry> {
  return gasRequest<FoodEntry>({ action: "updateFood", ...payload });
}

export async function removeFood(id: string): Promise<{ deleted: boolean }> {
  return gasRequest<{ deleted: boolean }>({ action: "deleteFood", id });
}

export async function fetchInputsByDate(
  date: string
): Promise<InputRecord | null> {
  const data = await gasRequest<InputRecord | null>({
    action: "getInputsByDate",
    date,
  });
  if (!data) return null;
  return {
    ...data,
    fiberConsumed: Number(data.fiberConsumed) || 0,
    fruitsConsumed: Number(data.fruitsConsumed) || 0,
  };
}

export async function saveInputs(
  payload: SaveInputsPayload
): Promise<InputRecord> {
  return gasRequest<InputRecord>({ action: "saveInputs", ...payload });
}

export async function fetchOutputsByDate(
  date: string
): Promise<OutputRecord | null> {
  return gasRequest<OutputRecord | null>({
    action: "getOutputsByDate",
    date,
  });
}

export async function saveOutputs(
  payload: SaveOutputsPayload
): Promise<OutputRecord> {
  return gasRequest<OutputRecord>({ action: "saveOutputs", ...payload });
}

export async function fetchDashboardSummary(
  date: string
): Promise<DashboardSummary> {
  return gasRequest<DashboardSummary>({
    action: "getDashboardSummary",
    date,
  });
}

export async function fetchTrendData(days = 90): Promise<TrendPoint[]> {
  const data = await gasRequest<TrendPoint[]>({
    action: "getTrendData",
    days,
  });
  return Array.isArray(data) ? data : [];
}
