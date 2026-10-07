"use client";

import { AIInsightBadge } from "@/components/AIInsightBadge";
import { AnimatedButton } from "@/components/AnimatedButton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState, LoadingState } from "@/components/LoadingErrorStates";
import { MemoryCard } from "@/components/MemoryCard";
import { buttonStyles } from "@/lib/button-styles";
import { useSavedItemActions } from "@/hooks/useSavedItemActions";
import { MessageCircleQuestion, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const EXAMPLES = [
  "Find the editing video I saved for a cinematic reel",
  "That article about pricing I wanted to read later",
  "What did I save for the recruitment project?",
];

type Status = "idle" | "loading" | "done" | "unavailable";

export function AskRecallPanel({ initialQuestion }: { initialQuestion?: string }) {
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [asked, setAsked] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [whyById, setWhyById] = useState<Record<string, string>>({});
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const { items, setItems, toggleFavorite, toggleArchive, remove, editTitle, turnIntoTask, similarCounts } =
    useSavedItemActions([]);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    setAsked(trimmed);
    setStatus("loading");
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");

      const matches = (json.matches ?? []) as { item: (typeof items)[number]; why: string }[];
      setItems(matches.map((m) => m.item));
      setWhyById(Object.fromEntries(matches.map((m) => [m.item.id, m.why])));
      setAiUnavailable(Boolean(json.aiUnavailable));
      setStatus("done");
    } catch {
      setStatus("unavailable");
    }
  }

  // Arriving via /app/ask?q=... (e.g. from the command palette) asks straight away.
  const askedInitial = useRef(false);
  useEffect(() => {
    if (askedInitial.current) return; // StrictMode runs effects twice in dev; don't spend two AI calls
    askedInitial.current = true;
    if (initialQuestion && initialQuestion.trim().length >= 2) void ask(initialQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Ask Recall</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Describe what you remember, not what it was called. Recall looks through your saved
          items, your notes, and why you saved them.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <MessageCircleQuestion
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Find the editing video I saved for a cinematic reel…"
            maxLength={500}
            autoFocus
            className="h-11 w-full rounded-md border border-border bg-bg-1 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        <AnimatedButton type="submit" size="lg" disabled={status === "loading" || question.trim().length < 2}>
          {status === "loading" ? "Recalling…" : "Ask"}
        </AnimatedButton>
      </form>

      {status === "idle" && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuestion(example);
                void ask(example);
              }}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-accent hover:text-text-primary"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {status === "loading" && <LoadingState label="Searching your memory…" />}

      {status === "unavailable" && (
        <ErrorState message="Recall couldn't answer that right now — try a regular search instead.">
          <Link
            href={`/app/search?q=${encodeURIComponent(asked)}`}
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            <Search size={14} />
            Search for &ldquo;{asked}&rdquo;
          </Link>
        </ErrorState>
      )}

      {status === "done" && items.length === 0 && (
        <EmptyState
          icon={<MessageCircleQuestion size={40} />}
          title="We couldn't find that memory."
          subtitle="Nothing you've saved seems to match. Try describing it differently, or use a regular search."
          action={
            <Link
              href={`/app/search?q=${encodeURIComponent(asked)}`}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              Try a regular search
            </Link>
          }
        />
      )}

      {status === "done" && items.length > 0 && (
        <div>
          {aiUnavailable && (
            <p className="mb-3 text-xs text-text-muted">
              AI couldn&apos;t summarize why right now — showing your closest matches by search
              relevance instead.
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
              <MemoryCard
                item={item}
                similarCount={similarCounts.get(item.id) ?? 0}
                onToggleFavorite={toggleFavorite}
                onToggleArchive={toggleArchive}
                onDelete={remove}
                onEditTitle={editTitle}
                onTurnIntoTask={turnIntoTask}
              />
              {whyById[item.id] && (
                <AIInsightBadge label="Why it matched">{whyById[item.id]}</AIInsightBadge>
              )}
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
