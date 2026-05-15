"use client";

import { useState } from "react";
import type { Pillar, Query } from "@/lib/queries";
import queriesData from "@/data/queries.json";
import type { ImageResult } from "@/app/api/search/route";
import QuerySelector from "@/components/QuerySelector";
import DualResults from "@/components/DualResults";
import SessionFlow from "@/components/SessionFlow";
import AgentTrace from "@/components/AgentTrace";

const allQueries = queriesData.queries as Query[];

export default function Home() {
  const [activePillar, setActivePillar] = useState<Pillar>("intent");
  const [activeQuery, setActiveQuery] = useState<Query | null>(null);
  const [legacy, setLegacy] = useState<ImageResult[]>([]);
  const [discovery, setDiscovery] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [traceActive, setTraceActive] = useState(false);
  const [traceKey, setTraceKey] = useState(0);

  const handlePillarChange = (p: Pillar) => {
    setActivePillar(p);
    setActiveQuery(null);
    setLegacy([]);
    setDiscovery([]);
    setTraceActive(false);
  };

  const handleQuerySelect = async (query: Query) => {
    setActiveQuery(query);
    setLoading(true);
    setLegacy([]);
    setDiscovery([]);
    setTraceActive(false);

    try {
      let searchVector: number[] | undefined;

      if (query.pillar === "context" && query.session_chain) {
        const sessionResp = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: query.session_chain.session_id,
            query_id: query.id,
            step: query.session_chain.step,
          }),
        });
        if (sessionResp.ok) {
          const sessionData = (await sessionResp.json()) as { session_vector: number[] };
          searchVector = sessionData.session_vector;
        }
      }

      const searchResp = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_id: query.id,
          ...(searchVector ? { session_vector: searchVector } : {}),
        }),
      });

      if (searchResp.ok) {
        const data = (await searchResp.json()) as {
          legacy: ImageResult[];
          discovery: ImageResult[];
        };
        setLegacy(data.legacy);
        setDiscovery(data.discovery);
      }
    } finally {
      setLoading(false);
      if (query.pillar === "cognition") {
        setTraceKey((k) => k + 1);
        setTraceActive(true);
      }
    }
  };

  const showResults = activeQuery !== null;
  const showSession = activeQuery?.pillar === "context";
  const showTrace = activeQuery?.pillar === "cognition";

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* header */}
      <header className="border-b border-zinc-800 px-4 py-4 flex items-start justify-between">
        <div>
          <span className="text-xl font-bold tracking-tight text-white">REVEAL</span>
          <span className="ml-3 text-xs text-zinc-500 uppercase tracking-widest hidden sm:inline">
            Search finds. Reveal discovers.
          </span>
        </div>
        <div className="text-right text-xs text-zinc-500 leading-snug">
          <div className="text-green-500 font-medium">Generative Discovery</div>
          <div>on OpenSearch</div>
        </div>
      </header>

      {/* main */}
      <main className="flex-1 px-4 py-5 flex flex-col gap-5 max-w-5xl w-full mx-auto">
        <QuerySelector
          queries={allQueries}
          activePillar={activePillar}
          activeQueryId={activeQuery?.id ?? null}
          loading={loading}
          onPillarChange={handlePillarChange}
          onQuerySelect={handleQuerySelect}
        />

        {showResults && (
          <>
            <div className="text-sm text-zinc-400 italic border-l-2 border-green-800 pl-3">
              &ldquo;{activeQuery!.display_text}&rdquo;
            </div>

            {showSession && <SessionFlow query={activeQuery!} />}

            <DualResults legacy={legacy} discovery={discovery} loading={loading} />

            {showTrace && (
              <AgentTrace
                key={traceKey}
                queryId={activeQuery!.id}
                active={traceActive}
              />
            )}
          </>
        )}

        {!showResults && (
          <div className="flex-1 flex items-center justify-center text-zinc-700 text-sm py-16">
            Select a query above to see the difference.
          </div>
        )}
      </main>
    </div>
  );
}
