"use client";

import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search your library…",
  autoFocus,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const [local, setLocal] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Keep in sync if the parent resets the value externally (e.g. clearing filters).
  useEffect(() => setLocal(value), [value]);

  function handleChange(next: string) {
    setLocal(next);
    clearTimeout(debounceRef.current);
    // ~300ms debounce before firing the actual search (Section 20).
    debounceRef.current = setTimeout(() => onChange(next), 300);
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      <Input
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pl-9"
      />
    </div>
  );
}
