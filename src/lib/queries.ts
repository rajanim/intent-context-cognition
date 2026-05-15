import queriesData from "@/data/queries.json";

export type Pillar = "intent" | "context" | "cognition";

export interface SessionChain {
  session_id: string;
  prior_queries: string[];
  prior_embeddings: number[][];
  step: number;
  pivot?: boolean;
  pivot_direction?: number;
}

export interface TraceTemplate {
  steps: string[];
}

export interface Query {
  id: string;
  pillar: Pillar;
  label: string;
  display_text: string;
  bm25_keywords: string;
  embedding: number[];
  session_chain: SessionChain | null;
  trace_template: TraceTemplate | null;
}

export interface QueryRegistry {
  queries: Query[];
}

export function loadQueries(): Query[] {
  return queriesData.queries as Query[];
}

export function getQueryById(id: string): Query | undefined {
  return loadQueries().find((q) => q.id === id);
}

export function validateQueryId(id: string): boolean {
  return loadQueries().some((q) => q.id === id);
}
