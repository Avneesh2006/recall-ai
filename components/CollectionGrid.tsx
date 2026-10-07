"use client";

import { CollectionCard } from "@/components/CollectionCard";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import type { Collection } from "@/types/database";
import { motion } from "framer-motion";

export function CollectionGrid({
  collections,
  itemCounts,
  onEdit,
  onDelete,
}: {
  collections: Collection[];
  itemCounts: Record<string, number>;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
}) {
  const reduced = useReducedMotionSafe();

  return (
    <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection, i) => (
        <motion.div
          key={collection.id}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduced ? 0.001 : 0.3,
            delay: reduced ? 0 : Math.min(i, 10) * 0.05,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <CollectionCard
            collection={collection}
            itemCount={itemCounts[collection.id] ?? 0}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </motion.div>
      ))}
    </div>
  );
}
