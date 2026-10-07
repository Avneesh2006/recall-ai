"use client";

import { AnimatedButton } from "@/components/AnimatedButton";
import { useSaveDialog } from "@/components/SaveDialogProvider";
import { Plus } from "lucide-react";

export function SaveTriggerButton() {
  const { open } = useSaveDialog();
  return (
    <AnimatedButton size="sm" onClick={open} title="Save something (press S)">
      <Plus size={16} />
      Save something
    </AnimatedButton>
  );
}
