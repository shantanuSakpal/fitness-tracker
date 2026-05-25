"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/common/Loader";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function textFromMessage(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is Extract<UIMessage["parts"][number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function hasSuccessfulSavePart(message: UIMessage): boolean {
  return message.parts.some(
    (part) =>
      part.type === "tool-saveFoodToDb" && part.state === "output-available",
  );
}

export function FoodAssistant({
  selectedDate,
  onSaved,
}: {
  selectedDate: string;
  onSaved?: () => void | Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const seenSaveMessageIds = useRef(new Set<string>());

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/food-assistant",
        body: { selectedDate },
      }),
    [selectedDate],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: `food-assistant-${selectedDate}`,
    transport,
    onError: (chatError) => {
      toast.error(chatError.message || "Food assistant failed");
    },
    onFinish: ({ message }) => {
      if (
        hasSuccessfulSavePart(message) &&
        !seenSaveMessageIds.current.has(message.id)
      ) {
        seenSaveMessageIds.current.add(message.id);
        toast.success("Food logged");
        void onSaved?.();
      }
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await sendMessage({ text });
  }

  const busy = status === "submitted" || status === "streaming";

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Log food with AI
          </h3>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/70">
        <div className="max-h-80 space-y-3 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white/80 p-3 text-sm text-zinc-500">
              Messages will appear here
            </div>
          ) : (
            messages.map((message) => {
              const text = textFromMessage(message);
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    isUser ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      isUser
                        ? "bg-zinc-900 text-white"
                        : "bg-white text-zinc-800",
                    )}
                  >
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">
                      {isUser ? "You" : "Assistant"}
                    </p>
                    {text ? (
                      <p className="whitespace-pre-wrap">{text}</p>
                    ) : message.role === "assistant" ? (
                      <p className="text-zinc-500">Working…</p>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
          {busy && <Loader label="Thinking…" className="py-4" />}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-zinc-200 bg-white p-3"
        >
          <label className="block text-xs font-medium text-zinc-600">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Try: “I ate 200g chicken breast and 150g rice” or “I had oats,
              80g, 310 calories, 11g protein, 6g fat, 8g fiber.”"
              className="mt-1 min-h-28 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              disabled={busy}
            />
          </label>
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMessages([])}
              disabled={busy || messages.length === 0}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
            >
              Clear chat
            </button>
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-600">{error.message}</p>
          )}
        </form>
      </div>
    </section>
  );
}
