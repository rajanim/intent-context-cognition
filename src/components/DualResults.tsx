import type { ImageResult } from "@/app/api/search/route";
import ImageCard from "./ImageCard";

interface Props {
  legacy: ImageResult[];
  discovery: ImageResult[];
  loading: boolean;
}

function Skeleton() {
  return (
    <div className="rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 animate-pulse">
      <div className="w-full aspect-[4/3] bg-zinc-800" />
      <div className="px-2 py-1.5 space-y-1">
        <div className="h-2.5 bg-zinc-700 rounded w-3/4" />
        <div className="h-2 bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  );
}

function Panel({
  label,
  sublabel,
  results,
  loading,
  accent,
}: {
  label: string;
  sublabel: string;
  results: ImageResult[];
  loading: boolean;
  accent: "red" | "green";
}) {
  const borderColor = accent === "green" ? "border-green-800" : "border-red-900";
  const headerColor = accent === "green" ? "text-green-400" : "text-red-400";
  const subColor = accent === "green" ? "text-green-700" : "text-red-900";

  return (
    <div className={`flex-1 min-w-0 rounded-lg border ${borderColor} bg-zinc-950 p-3 flex flex-col gap-3`}>
      <div>
        <h2 className={`text-sm font-semibold tracking-wide uppercase ${headerColor}`}>{label}</h2>
        <p className={`text-[10px] ${subColor} mt-0.5`}>{sublabel}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
          : results.length > 0
          ? results.map((img) => <ImageCard key={img.image_id} image={img} />)
          : (
            <p className="col-span-3 text-zinc-600 text-xs text-center py-8">
              {accent === "red" ? "No keyword matches" : "No vector results"}
            </p>
          )}
      </div>
    </div>
  );
}

export default function DualResults({ legacy, discovery, loading }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Panel
        label="Legacy Search"
        sublabel="BM25 keyword match"
        results={legacy}
        loading={loading}
        accent="red"
      />
      <Panel
        label="Reveal Discovery"
        sublabel="Semantic · vector · session"
        results={discovery}
        loading={loading}
        accent="green"
      />
    </div>
  );
}
