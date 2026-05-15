import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateQueryId, getQueryById } from "@/lib/queries";
import { getOpenSearchClient } from "@/lib/opensearch";

const SESSION_INDEX = "reveal_sessions";
const SESSION_TTL_HOURS = 4;

const RequestSchema = z.object({
  session_id: z.string(),
  query_id: z.string(),
  step: z.number().int().min(1),
});

function weightedAverage(vectors: number[][], weights: number[]): number[] {
  const dim = vectors[0].length;
  const result = new Array<number>(dim).fill(0);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < vectors.length; i++) {
    for (let d = 0; d < dim; d++) {
      result[d] += (weights[i] / totalWeight) * vectors[i][d];
    }
  }
  return result;
}

function subtractScaled(base: number[], sub: number[], scale: number): number[] {
  return base.map((v, i) => v - scale * sub[i]);
}

function computeSessionVector(
  priorEmbeddings: number[][],
  currentEmbedding: number[],
  pivot: boolean,
  pivotDirection: number
): number[] {
  const allVectors = [...priorEmbeddings, currentEmbedding];
  const n = allVectors.length;
  // weight[i] = 0.7^(n - 1 - i) so most recent has weight 1
  const weights = allVectors.map((_, i) => Math.pow(0.7, n - 1 - i));
  let sessionVector = weightedAverage(allVectors, weights);

  if (pivot && priorEmbeddings.length > 0) {
    sessionVector = subtractScaled(sessionVector, priorEmbeddings[0], 0.6 * pivotDirection);
  }

  return sessionVector;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { session_id, query_id, step } = parsed.data;

  if (!validateQueryId(query_id)) {
    return NextResponse.json({ error: `Unknown query_id: ${query_id}` }, { status: 400 });
  }

  const query = getQueryById(query_id)!;

  if (!query.session_chain) {
    return NextResponse.json({ error: "Query has no session chain" }, { status: 400 });
  }

  if (query.embedding.length === 0) {
    return NextResponse.json({ error: "Query embedding not populated — run data pipeline first" }, { status: 500 });
  }

  const { prior_embeddings, pivot = false, pivot_direction = 1 } = query.session_chain;
  const sessionVector = computeSessionVector(
    prior_embeddings as number[][],
    query.embedding,
    pivot,
    pivot_direction
  );

  const client = getOpenSearchClient();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();

  await client.index({
    index: SESSION_INDEX,
    id: session_id,
    body: {
      session_id,
      query_id,
      step,
      session_vector: sessionVector,
      expires_at: expiresAt,
    },
    refresh: "wait_for",
  });

  return NextResponse.json({ session_vector: sessionVector });
}
