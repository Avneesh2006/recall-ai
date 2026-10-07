import { cn } from "@/lib/utils";

const CONTENT_TYPE_GLYPH: Record<string, string> = {
  video: "🎬",
  article: "📄",
  repo: "🧑‍💻",
  image: "🖼️",
  pdf: "📕",
  tutorial: "🎓",
  product: "🛍️",
  note: "📝",
  file: "📎",
};

export function ContentTypeGlyph({ contentType }: { contentType: string | null }) {
  if (!contentType || !CONTENT_TYPE_GLYPH[contentType]) return null;
  return (
    <span aria-hidden="true" className="text-base leading-none">
      {CONTENT_TYPE_GLYPH[contentType]}
    </span>
  );
}

export function SourceBadge({ domain }: { domain: string | null }) {
  if (!domain) return null;
  return <span className="text-xs text-text-muted">{domain}</span>;
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-text-secondary">
      {category}
    </span>
  );
}

export function Tag({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border border-border px-2 py-0.5 text-[11px] text-text-secondary",
        className,
      )}
    >
      {name}
    </span>
  );
}
