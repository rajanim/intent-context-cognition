import type { Query } from "@/lib/queries";

export default function SessionFlow({ query }: { query: Query }) {
  const chain = query.session_chain;
  if (!chain) return null;

  const steps = [...chain.prior_queries, query.display_text];
  const activeIndex = steps.length - 1;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Session context</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((text, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                i === activeIndex
                  ? "border-green-600 bg-green-900/30 text-green-300 font-medium"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400"
              }`}
            >
              {text}
            </span>
            {i < steps.length - 1 && (
              <span className="text-zinc-600 text-xs">→</span>
            )}
          </span>
        ))}
      </div>
      {chain.pivot && (
        <p className="text-[10px] text-amber-600 mt-2">
          ↩ Pivot — direction adjusted by {Math.abs(chain.pivot_direction ?? 1) * 60}%
        </p>
      )}
    </div>
  );
}
