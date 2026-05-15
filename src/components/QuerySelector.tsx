"use client";

import type { Query, Pillar } from "@/lib/queries";

const PILLARS: { id: Pillar; label: string }[] = [
  { id: "intent", label: "Intent" },
  { id: "context", label: "Context" },
  { id: "cognition", label: "Cognition" },
];

interface Props {
  queries: Query[];
  activePillar: Pillar;
  activeQueryId: string | null;
  loading: boolean;
  onPillarChange: (p: Pillar) => void;
  onQuerySelect: (q: Query) => void;
}

export default function QuerySelector({
  queries,
  activePillar,
  activeQueryId,
  loading,
  onPillarChange,
  onQuerySelect,
}: Props) {
  const visible = queries.filter((q) => q.pillar === activePillar);

  return (
    <div className="flex flex-col gap-3">
      {/* pillar tabs */}
      <div className="flex gap-2">
        {PILLARS.map((p) => (
          <button
            key={p.id}
            onClick={() => onPillarChange(p.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activePillar === p.id
                ? "border-green-700 bg-green-900/30 text-green-300"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* query cards */}
      <div className="flex flex-wrap gap-2">
        {visible.map((q) => {
          const isActive = q.id === activeQueryId;
          return (
            <button
              key={q.id}
              onClick={() => !loading && onQuerySelect(q)}
              disabled={loading}
              className={`group text-left rounded-lg border px-3 py-2.5 text-sm transition-all max-w-[220px] ${
                isActive
                  ? "border-green-600 bg-green-900/20 text-green-200"
                  : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
              } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <p className="font-medium leading-snug">{q.label}</p>
              <p className="text-[11px] text-zinc-500 mt-1 leading-snug group-hover:text-zinc-400 transition-colors line-clamp-2">
                "{q.display_text}"
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
