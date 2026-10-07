"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { AnimatedButton } from "@/components/AnimatedButton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/FormError";
import { COLLECTION_ICONS, COLLECTION_ACCENTS } from "@/lib/collection-presets";
import { cn } from "@/lib/utils";
import type { Collection } from "@/types/database";
import { useEffect, useState } from "react";

// noUncheckedIndexedAccess means array[0] is typed T | undefined even for
// a known-non-empty const array — these give the rest of the file a real,
// guaranteed string to default to (both presets are hand-written non-empty
// arrays, so the fallback side only matters to the type checker).
const DEFAULT_ICON = COLLECTION_ICONS[0] ?? "📁";
const DEFAULT_ACCENT = COLLECTION_ACCENTS[0]?.value ?? "#E3A548";

export interface CollectionFormValues {
  name: string;
  description: string;
  icon: string;
  accent_color: string;
}

export function CollectionFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Collection | null;
  onSubmit: (values: CollectionFormValues) => Promise<string | void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setIcon(initial?.icon ?? DEFAULT_ICON);
      setAccent(initial?.accent_color ?? DEFAULT_ACCENT);
      setError(null);
    }
  }, [open, initial]);

  async function handleSubmit() {
    if (!name.trim()) return setError("Give it a name.");
    setSaving(true);
    setError(null);
    const err = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      icon,
      accent_color: accent,
    });
    setSaving(false);
    if (err) setError(err);
    else onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 sm:max-w-sm">
        <DialogTitle className="font-display text-xl text-text-primary">
          {initial ? "Edit collection" : "New collection"}
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-text-secondary">
          A named space to group saved items — think &quot;which folder is this in.&quot;
        </DialogDescription>

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="JIC Recruitment Reel"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div>
            <Label htmlFor="collection-description">Description (optional)</Label>
            <Input
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {COLLECTION_ICONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  aria-label={`Icon: ${opt}`}
                  aria-pressed={icon === opt}
                  onClick={() => setIcon(opt)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border text-base transition-colors",
                    icon === opt ? "bg-accent/15 border-accent" : "border-border hover:bg-bg-2",
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Accent color</Label>
            <div className="flex flex-wrap gap-1.5">
              {COLLECTION_ACCENTS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  aria-label={`Accent color: ${opt.label}`}
                  aria-pressed={accent === opt.value}
                  onClick={() => setAccent(opt.value)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    accent === opt.value ? "scale-110 border-text-primary" : "border-transparent",
                  )}
                  style={{ backgroundColor: opt.value }}
                />
              ))}
            </div>
          </div>

          <FormError message={error ?? undefined} />

          <AnimatedButton onClick={handleSubmit} disabled={saving} className="mt-1">
            {saving ? "Saving…" : initial ? "Save changes" : "Create collection"}
          </AnimatedButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
