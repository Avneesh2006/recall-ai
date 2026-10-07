"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { AnimatedButton } from "@/components/AnimatedButton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ReasonSelector } from "@/components/ReasonSelector";
import { WhatWasIThinkingInput } from "@/components/WhatWasIThinking";
import { FormError } from "@/components/FormError";
import { useToast } from "@/components/ToastProvider";
import { createClient } from "@/lib/supabase/client";
import { uploadToStorage } from "@/lib/storage/upload";
import { captureVideoThumbnail } from "@/lib/storage/video-thumbnail";
import { cn } from "@/lib/utils";
import type { Collection, InputType, Project, ReasonTag, SavedItem } from "@/types/database";
import { AnimatePresence, motion } from "framer-motion";
import { CheckSquare, FileText, FolderInput, Image as ImageIcon, Link2, Paperclip, Plus, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TYPE_OPTIONS: { value: InputType; label: string; icon: typeof Link2 }[] = [
  { value: "url", label: "Link", icon: Link2 },
  { value: "note", label: "Note", icon: FileText },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "file", label: "File", icon: Paperclip },
];

type Step = "input" | "reason";

export function SaveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState<Step>("input");
  const [inputType, setInputType] = useState<InputType>("url");
  const [url, setUrl] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedItem, setSavedItem] = useState<SavedItem | null>(null);
  const [reasonTag, setReasonTag] = useState<ReasonTag | null>(null);
  const [note, setNote] = useState("");
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCreated, setTaskCreated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetch("/api/collections")
        .then((res) => res.json())
        .then((json) => setCollections(json.collections ?? []))
        .catch(() => {});
      fetch("/api/projects")
        .then((res) => res.json())
        .then((json) => setProjects(json.projects ?? []))
        .catch(() => {});
    }
  }, [open]);

  async function createCollectionInline() {
    const name = newCollectionName.trim();
    if (!name) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (res.ok && json.collection) {
      setCollections((prev) => [json.collection, ...prev]);
      setCollectionId(json.collection.id);
    }
    setNewCollectionName("");
    setCreatingCollection(false);
  }

  async function createProjectInline() {
    const name = newProjectName.trim();
    if (!name) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (res.ok && json.project) {
      setProjects((prev) => [json.project, ...prev]);
      setProjectId(json.project.id);
    }
    setNewProjectName("");
    setCreatingProject(false);
  }

  async function createTaskInline() {
    if (!savedItem) return;
    const title = taskTitle.trim() || savedItem.title || savedItem.url || "Untitled task";
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, saved_item_id: savedItem.id }),
    });
    if (res.ok) {
      setTaskCreated(true);
      setAddingTask(false);
    }
  }

  function reset() {
    setStep("input");
    setInputType("url");
    setUrl("");
    setNoteTitle("");
    setNoteBody("");
    setFile(null);
    setSaving(false);
    setError(null);
    setSavedItem(null);
    setReasonTag(null);
    setNote("");
    setCollectionId(null);
    setProjectId(null);
    setCreatingCollection(false);
    setNewCollectionName("");
    setCreatingProject(false);
    setNewProjectName("");
    setAddingTask(false);
    setTaskTitle("");
    setTaskCreated(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Dismissing at any point is zero-penalty — the item, if created,
      // is already saved (Section 5).
      onOpenChange(false);
      setTimeout(reset, 200);
    } else {
      onOpenChange(true);
    }
  }

  async function readTextFile(file: File): Promise<string | null> {
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    const textLike = type.startsWith("text/") || /\.(txt|md|markdown|csv|json|xml|html|htm|log)$/i.test(name);
    if (!textLike || file.size > 200_000) return null;
    try {
      return (await file.text()).slice(0, 20_000);
    } catch {
      return null;
    }
  }

  async function handleCreate() {
    setError(null);

    if (inputType === "url" && !url.trim()) return setError("Paste a link first.");
    if (inputType === "note" && !noteTitle.trim()) return setError("Give it a short title.");
    if ((inputType === "image" || inputType === "file") && !file) {
      return setError(`Choose ${inputType === "image" ? "an image" : "a file"} first.`);
    }

    setSaving(true);
    try {
      let body: Record<string, unknown>;

      if (inputType === "url") {
        body = { input_type: "url", url: url.trim() };
      } else if (inputType === "note") {
        body = { input_type: "note", title: noteTitle.trim(), description: noteBody.trim() };
      } else {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in.");
        const uploaded = await uploadToStorage(user.id, file!);
        if ("error" in uploaded) throw new Error(uploaded.error);
        // A "file" upload that's actually a video (e.g. a saved .mp4)
        // gets treated as content_type "video" so it gets the same
        // hover-to-play preview as a saved YouTube/Vimeo link.
        const isVideo = file!.type.startsWith("video/");
        const isImage = file!.type.startsWith("image/");

        // Unlike a saved URL, an uploaded video has no OG image to
        // scrape for a thumbnail — grab one from the video itself so it
        // isn't just a generic icon at rest.
        let thumbnailUrl: string | undefined = isImage ? uploaded.public_url : undefined;
        if (isVideo) {
          const frame = await captureVideoThumbnail(file!);
          if (frame) {
            const thumbUpload = await uploadToStorage(user.id, frame, "thumbnail.jpg");
            if (!("error" in thumbUpload)) thumbnailUrl = thumbUpload.public_url;
          }
        }

        const extractedText = await readTextFile(file!);
        body = {
          input_type: inputType,
          storage_path: uploaded.storage_path,
          title: file!.name,
          url: uploaded.public_url,
          thumbnail_url: thumbnailUrl,
          content_type: isVideo ? "video" : isImage ? "image" : file!.type || inputType,
          content_text: extractedText,
        };
      }

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't save that.");

      setSavedItem(json.item);
      setStep("reason");
      toast({ message: "Saved to your library", href: "/app/library", actionLabel: "View" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveContext() {
    if (!savedItem) return;
    setSaving(true);
    try {
      await fetch(`/api/items/${savedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason_tag: reasonTag,
          what_was_i_thinking: note.trim() || null,
          collection_id: collectionId,
          project_id: projectId,
        }),
      });
    } finally {
      setSaving(false);
      handleOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-6" onOpenAutoFocus={(e) => step === "reason" && e.preventDefault()}>
        <AnimatePresence mode="wait">
          {step === "input" ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogTitle className="font-display text-xl text-text-primary">
                Save something
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-text-secondary">
                Paste a link, jot a note, or attach a file.
              </DialogDescription>

              <div className="mt-4 flex gap-1 rounded-md bg-bg-1 p-1">
                {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setInputType(value)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors",
                      inputType === value
                        ? "bg-bg-3 text-text-primary"
                        : "text-text-muted hover:text-text-secondary",
                    )}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {inputType === "url" && (
                  <div>
                    <Label htmlFor="save-url">Link</Label>
                    <Input
                      id="save-url"
                      autoFocus
                      placeholder="https://…"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                  </div>
                )}
                {inputType === "note" && (
                  <>
                    <div>
                      <Label htmlFor="save-note-title">Title</Label>
                      <Input
                        id="save-note-title"
                        autoFocus
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="save-note-body">Note</Label>
                      <textarea
                        id="save-note-body"
                        rows={4}
                        value={noteBody}
                        onChange={(e) => setNoteBody(e.target.value)}
                        className="w-full resize-none rounded-md border border-border bg-bg-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
                      />
                    </div>
                  </>
                )}
                {(inputType === "image" || inputType === "file") && (
                  <div>
                    <Label>{inputType === "image" ? "Image" : "File"}</Label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center rounded-md border border-dashed border-border px-3 py-6 text-sm text-text-secondary transition-colors hover:border-border-accent hover:text-text-primary"
                    >
                      {file ? file.name : `Choose ${inputType === "image" ? "an image" : "a file"}…`}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={inputType === "image" ? "image/*" : undefined}
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                )}

                <FormError message={error ?? undefined} />

                <AnimatedButton onClick={handleCreate} disabled={saving} className="mt-1">
                  {saving ? "Saving…" : "Save"}
                </AnimatedButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reason"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <DialogTitle className="font-display text-xl text-text-primary">Saved.</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-text-secondary">
                Want to remember why? Totally optional.
              </DialogDescription>

              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-text-secondary">
                  Why are you saving this?
                </p>
                <ReasonSelector value={reasonTag} onChange={setReasonTag} />
              </div>

              <div className="mt-3 flex flex-wrap items-start gap-3">
                {/* Collection: select, or an inline name field when creating new */}
                <div className="flex items-center gap-1.5">
                  <FolderInput size={14} className="shrink-0 text-text-muted" />
                  {creatingCollection ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void createCollectionInline();
                          }
                          if (e.key === "Escape") setCreatingCollection(false);
                        }}
                        placeholder="Collection name"
                        className="w-32 rounded-md border border-accent bg-bg-1 px-2 py-1.5 text-sm text-text-primary focus-visible:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void createCollectionInline()}
                        className="rounded-md bg-accent px-2 py-1.5 text-xs font-medium text-text-onaccent"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreatingCollection(false)}
                        className="text-xs text-text-muted hover:text-text-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <select
                      value={collectionId ?? ""}
                      onChange={(e) => {
                        if (e.target.value === "__new__") setCreatingCollection(true);
                        else setCollectionId(e.target.value || null);
                      }}
                      className="rounded-md border border-border bg-bg-1 px-2 py-1.5 text-sm text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                    >
                      <option value="">No collection</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon || "📁"} {c.name}
                        </option>
                      ))}
                      <option value="__new__">+ New collection…</option>
                    </select>
                  )}
                </div>

                {/* Project: same pattern */}
                <div className="flex items-center gap-1.5">
                  <Target size={14} className="shrink-0 text-text-muted" />
                  {creatingProject ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void createProjectInline();
                          }
                          if (e.key === "Escape") setCreatingProject(false);
                        }}
                        placeholder="Project name"
                        className="w-32 rounded-md border border-accent bg-bg-1 px-2 py-1.5 text-sm text-text-primary focus-visible:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void createProjectInline()}
                        className="rounded-md bg-accent px-2 py-1.5 text-xs font-medium text-text-onaccent"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreatingProject(false)}
                        className="text-xs text-text-muted hover:text-text-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <select
                      value={projectId ?? ""}
                      onChange={(e) => {
                        if (e.target.value === "__new__") setCreatingProject(true);
                        else setProjectId(e.target.value || null);
                      }}
                      className="rounded-md border border-border bg-bg-1 px-2 py-1.5 text-sm text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                    >
                      <option value="">No project</option>
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.name}
                        </option>
                      ))}
                      <option value="__new__">+ New project…</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Task: creates a task linked back to this item (Section 5 Flow D) */}
              <div className="mt-3 flex items-center gap-1.5">
                <CheckSquare size={14} className="shrink-0 text-text-muted" />
                {taskCreated ? (
                  <span className="text-xs text-text-secondary">Task created ✓</span>
                ) : addingTask ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void createTaskInline();
                        }
                        if (e.key === "Escape") setAddingTask(false);
                      }}
                      placeholder={savedItem?.title || "Task title"}
                      className="w-40 rounded-md border border-accent bg-bg-1 px-2 py-1.5 text-sm text-text-primary focus-visible:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void createTaskInline()}
                      className="rounded-md bg-accent px-2 py-1.5 text-xs font-medium text-text-onaccent"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingTask(false)}
                      className="text-xs text-text-muted hover:text-text-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingTask(true)}
                    className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-secondary"
                  >
                    <Plus size={12} />
                    New task for this
                  </button>
                )}
              </div>

              <div className="mt-4">
                <WhatWasIThinkingInput
                  id="save-note-field"
                  placeholder="For the reel cut — that warm-shadow grade I keep meaning to try…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="mt-5 flex gap-2">
                <AnimatedButton variant="ghost" onClick={() => handleOpenChange(false)} className="flex-1">
                  Skip
                </AnimatedButton>
                <AnimatedButton onClick={handleSaveContext} disabled={saving} className="flex-1">
                  {saving ? "Saving…" : "Done"}
                </AnimatedButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
