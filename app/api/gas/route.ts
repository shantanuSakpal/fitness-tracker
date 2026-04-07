import * as queries from "@/lib/db/queries";
import { NextResponse } from "next/server";

/**
 * JSON RPC-style API previously backed by Google Apps Script.
 * Same contract as before: POST { action, ... } → { ok, data? } | { ok: false, error }.
 */
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Server misconfiguration: set DATABASE_URL or POSTGRES_URL (Neon connection string).",
      },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const action = String(body.action ?? "");
  try {
    switch (action) {
      case "getAllFood":
        return NextResponse.json({
          ok: true,
          data: await queries.listAllFood(),
        });
      case "getFoodByDate":
        return NextResponse.json({
          ok: true,
          data: await queries.listFoodByDate(String(body.date)),
        });
      case "addFood":
        return NextResponse.json({
          ok: true,
          data: await queries.createFood({
            date: String(body.date ?? ""),
            foodName: String(body.foodName ?? ""),
            weightGrams: Number(body.weightGrams) || 0,
            unitCount: Number(body.unitCount) || 0,
            calories: Number(body.calories) || 0,
            protein: Number(body.protein) || 0,
            fat: Number(body.fat) || 0,
            fiber: Number(body.fiber) || 0,
            isFruit: Boolean(body.isFruit),
            notes: String(body.notes ?? ""),
          }),
        });
      case "updateFood":
        return NextResponse.json({
          ok: true,
          data: await queries.updateFood({
            id: String(body.id),
            ...(body.date !== undefined ? { date: String(body.date) } : {}),
            ...(body.foodName !== undefined
              ? { foodName: String(body.foodName) }
              : {}),
            ...(body.weightGrams !== undefined
              ? { weightGrams: Number(body.weightGrams) }
              : {}),
            ...(body.unitCount !== undefined
              ? { unitCount: Number(body.unitCount) }
              : {}),
            ...(body.calories !== undefined
              ? { calories: Number(body.calories) }
              : {}),
            ...(body.protein !== undefined
              ? { protein: Number(body.protein) }
              : {}),
            ...(body.fat !== undefined ? { fat: Number(body.fat) } : {}),
            ...(body.fiber !== undefined ? { fiber: Number(body.fiber) } : {}),
            ...(body.isFruit !== undefined
              ? { isFruit: Boolean(body.isFruit) }
              : {}),
            ...(body.notes !== undefined ? { notes: String(body.notes) } : {}),
          }),
        });
      case "deleteFood":
        return NextResponse.json({
          ok: true,
          data: await queries.deleteFood(String(body.id)),
        });
      case "getInputsByDate":
        return NextResponse.json({
          ok: true,
          data: await queries.getInputByDate(String(body.date)),
        });
      case "saveInputs":
        return NextResponse.json({
          ok: true,
          data: await queries.saveInput({
            id: body.id !== undefined ? String(body.id) : undefined,
            date: String(body.date),
            caloriesTarget: Number(body.caloriesTarget) || 0,
            caloriesConsumed: Number(body.caloriesConsumed) || 0,
            proteinTarget: Number(body.proteinTarget) || 0,
            proteinConsumed: Number(body.proteinConsumed) || 0,
            trainingDone: Boolean(body.trainingDone),
            trainingNotes: String(body.trainingNotes ?? ""),
            sleepHours: Number(body.sleepHours) || 0,
            stepCount: Number(body.stepCount) || 0,
            walkAfterLunch: Boolean(body.walkAfterLunch),
            walkAfterDinner: Boolean(body.walkAfterDinner),
            zone2Done: Boolean(body.zone2Done),
            waterIntake: String(body.waterIntake ?? ""),
            notes: String(body.notes ?? ""),
            fiberConsumed: Number(body.fiberConsumed) || 0,
            fruitsConsumed: Number(body.fruitsConsumed) || 0,
          }),
        });
      case "getOutputsByDate":
        return NextResponse.json({
          ok: true,
          data: await queries.getOutputByDate(String(body.date)),
        });
      case "saveOutputs":
        return NextResponse.json({
          ok: true,
          data: await queries.saveOutput({
            id: body.id !== undefined ? String(body.id) : undefined,
            date: String(body.date),
            bodyWeight: Number(body.bodyWeight) || 0,
            waist: Number(body.waist) || 0,
            chest: Number(body.chest) || 0,
            arm: Number(body.arm) || 0,
            thigh: Number(body.thigh) || 0,
            progressPhotoUrl: String(body.progressPhotoUrl ?? ""),
            energyLevel: String(body.energyLevel ?? ""),
            mood: String(body.mood ?? ""),
            recovery: String(body.recovery ?? ""),
            notes: String(body.notes ?? ""),
          }),
        });
      case "getDashboardSummary":
        return NextResponse.json({
          ok: true,
          data: await queries.getDashboardSummary(String(body.date)),
        });
      case "getTrendData":
        return NextResponse.json({
          ok: true,
          data: await queries.getTrendData(
            parseInt(String(body.days), 10) || 90
          ),
        });
      default:
        return NextResponse.json(
          { ok: false, error: "Unknown action: " + action },
          { status: 400 }
        );
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
