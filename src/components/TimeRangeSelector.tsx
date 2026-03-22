"use client";

import type { TimeRange } from "@/lib/spotify-api";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: "short_term", label: "Last 4 Weeks" },
  { value: "medium_term", label: "Last 6 Months" },
  { value: "long_term", label: "All Time" },
];

export default function TimeRangeSelector({
  value,
  onChange,
}: TimeRangeSelectorProps) {
  return (
    <div
      className="flex gap-1 p-1 rounded-full w-fit"
      style={{ backgroundColor: "var(--surface-card)" }}
    >
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-4 py-2 rounded-full text-sm transition-all ${
            value === range.value
              ? "shadow-sm font-medium"
              : "text-themed-secondary hover:text-themed-text"
          }`}
          style={
            value === range.value
              ? { backgroundColor: "var(--surface-elevated)" }
              : undefined
          }
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
