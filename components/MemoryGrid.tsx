"use client";

import { MemoryCard } from "@/components/MemoryCard";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import type { Collection, Project, SavedItem } from "@/types/database";
import { motion } from "framer-motion";

export function MemoryGrid({
  items,
  similarCounts,
  collections,
  projects,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
  onEditTitle,
  onFindSimilar,
  onMoveToCollection,
  onMoveToProject,
  onTurnIntoTask,
}: {
  items: SavedItem[];
  similarCounts?: Map<string, number>;
  collections?: Collection[];
  projects?: Project[];
  onToggleFavorite: (item: SavedItem) => void;
  onToggleArchive: (item: SavedItem) => void;
  onDelete: (item: SavedItem) => void;
  onEditTitle: (item: SavedItem, newTitle: string) => void;
  onFindSimilar?: (item: SavedItem) => void;
  onMoveToCollection?: (item: SavedItem, collectionId: string | null) => void;
  onMoveToProject?: (item: SavedItem, projectId: string | null) => void;
  onTurnIntoTask?: (item: SavedItem) => void;
}) {
  const reduced = useReducedMotionSafe();

  return (
    <motion.div
      layout={!reduced}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          layout={!reduced}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduced ? 0.001 : 0.3,
            delay: reduced ? 0 : Math.min(i, 10) * 0.04,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <MemoryCard
            item={item}
            similarCount={similarCounts?.get(item.id) ?? 0}
            collections={collections}
            projects={projects}
            onToggleFavorite={onToggleFavorite}
            onToggleArchive={onToggleArchive}
            onDelete={onDelete}
            onEditTitle={onEditTitle}
            onFindSimilar={onFindSimilar}
            onMoveToCollection={onMoveToCollection}
            onMoveToProject={onMoveToProject}
            onTurnIntoTask={onTurnIntoTask}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
