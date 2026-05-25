import {
  getDataFromDietBook,
  saveFoodFromAssistant,
} from "@/lib/foodAssistant";
import { todayISODate } from "@/lib/utils";
import { groq } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";

export const maxDuration = 30;

const ISO_DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

function safeSelectedDate(raw: unknown): string {
  const date = String(raw ?? "")
    .trim()
    .slice(0, 10);
  return ISO_DATE_RE.test(date) ? date : todayISODate();
}

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(
      "Server misconfiguration: set GOOGLE_GENERATIVE_AI_API_KEY to enable the food assistant.",
      { status: 503 },
    );
  }

  const body = (await req.json()) as {
    messages?: UIMessage[];
    selectedDate?: string;
  };

  const selectedDate = safeSelectedDate(body.selectedDate);
  const messages = Array.isArray(body.messages) ? body.messages : [];

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    temperature: 0.2,
    stopWhen: stepCountIs(8),
    system: [
      "You are a food logging assistant inside a fitness tracker app.",
      `The active log date is ${selectedDate}.`,
      "Your job is to help the user turn natural-language food descriptions into saved food entries.",
      "Always use the getDataFromDietBook tool before saving when the user is trying to log a food that might already exist in the diet book.",
      "The tool returns the full diet-book catalog with per-100 g nutrition data. Search within it for the best matching food.",
      "If the diet book does not contain the food, ask the user for the nutrition details instead of inventing values.",
      "If the user has not provided enough information to save safely, ask a concise follow-up question.",
      "Do not estimate nutrition on your own.",
      "Use saveFoodToDb only when you have enough values to save a complete log row.",
      "When the user provides nutrition for a food that was not found in the diet book and the user also provides grams, set saveToDietBook=true so future lookups can reuse it.",
      "If the user gives nutrition per 100 g, use nutritionMode=per100g. If the user gives totals for the eaten quantity, use nutritionMode=total.",
      "After saving, confirm what was logged and mention whether the diet book was updated.",
    ].join(" "),
    messages: await convertToModelMessages(messages),
    tools: {
      getDataFromDietBook: {
        description:
          "Load all current diet-book foods with per-100 g nutrition so the model can find a matching food.",
        inputSchema: z.object({}),
        execute: async () => getDataFromDietBook(),
      },
      saveFoodToDb: {
        description:
          "Save a food log entry for the selected date. Optionally also store the food in the diet book for future lookups.",
        inputSchema: z.object({
          foodName: z.string().min(1),
          weightGrams: z.number().min(0).optional(),
          unitCount: z.number().min(0).optional(),
          calories: z.number().min(0),
          protein: z.number().min(0),
          fat: z.number().min(0),
          fiber: z.number().min(0),
          isFruit: z.boolean().optional(),
          notes: z.string().optional(),
          nutritionMode: z.enum(["total", "per100g"]).optional(),
          saveToDietBook: z.boolean().optional(),
        }),
        execute: async ({
          foodName,
          weightGrams,
          unitCount,
          calories,
          protein,
          fat,
          fiber,
          isFruit,
          notes,
          nutritionMode,
          saveToDietBook,
        }) =>
          saveFoodFromAssistant({
            date: selectedDate,
            foodName,
            weightGrams,
            unitCount,
            calories,
            protein,
            fat,
            fiber,
            isFruit,
            notes,
            nutritionMode,
            saveToDietBook,
          }),
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
