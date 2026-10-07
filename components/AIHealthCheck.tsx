"use client";

import { AnimatedButton } from "@/components/AnimatedButton";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Health =
  | { state: "loading" }
  | { state: "ok"; model: string; reply: string }
  | { state: "fail"; keyPresent: boolean; reason: string; hint: string }
  | { state: "error" };

export function AIHealthCheck() {
  const [health, setHealth] = useState<Health>({ state: "loading" });

  async function check() {
    setHealth({ state: "loading" });
    try {
      const res = await fetch("/api/ai/health");
      const json = await res.json();
      setHealth(
        json.ok
          ? { state: "ok", model: json.model, reply: json.reply }
          : { state: "fail", keyPresent: json.keyPresent, reason: json.reason, hint: json.hint },
      );
    } catch {
      setHealth({ state: "error" });
    }
  }

  useEffect(() => {
    void check();
  }, []);

  return (
    <div className="rounded-lg border border-border bg-bg-2 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {health.state === "loading" && <Loader2 size={18} className="mt-0.5 animate-spin text-text-muted" />}
          {health.state === "ok" && <CheckCircle2 size={18} className="mt-0.5 text-success" />}
          {(health.state === "fail" || health.state === "error") && (
            <XCircle size={18} className="mt-0.5 text-danger" />
          )}
          <div>
            <p className="text-sm font-medium text-text-primary">
              {health.state === "loading" && "Checking OpenRouter…"}
              {health.state === "ok" && "AI is working"}
              {health.state === "fail" && "AI isn't working yet"}
              {health.state === "error" && "Couldn't reach the server"}
            </p>
            {health.state === "ok" && (
              <p className="mt-1 text-xs text-text-muted">
                Model responded: <code className="text-text-secondary">{health.model}</code>
              </p>
            )}
            {health.state === "fail" && (
              <>
                <p className="mt-1 text-xs text-text-muted">
                  {health.keyPresent ? "A key is set, but: " : "No API key found. "}
                  <code className="text-text-secondary">{health.reason}</code>
                </p>
                <p className="mt-2 max-w-md text-sm text-text-secondary">{health.hint}</p>
              </>
            )}
          </div>
        </div>
        <AnimatedButton variant="secondary" size="sm" onClick={check} disabled={health.state === "loading"}>
          Test again
        </AnimatedButton>
      </div>
    </div>
  );
}
