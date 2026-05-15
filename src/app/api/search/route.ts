import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getQueryById, validateQueryId } from "@/lib/queries";
import { getOpenSearchClient } from "@/lib/opensearch";

const INDEX = "reveal_images";

const RequestSchema = z.object({
  query_id: z.string(),
  session_vector: z.array(z.number()).optional(),
});

export interface ImageResult {
  image_id: string;
  title: string;
  description: string;
  tags: string;
  photographer: string;
  pexels_url: string;
  thumbnail_url: string;
  medium_url: string;
  width: number;
  height: number;
  score: number;
}

function parseHits(hits: Record<string, unknown>[]): ImageResult[] {
  return hits.map((h) => {
    const src = h._source as Record<string, unknown>;
    return {
      image_id: src.image_id as string,
      title: src.title as string,
      description: src.description as string,
      tags: src.tags as string,
      photographer: src.photographer as string,
      pexels_url: src.pexels_url as string,
      thumbnail_url: src.thumbnail_url as string,
      medium_url: src.medium_url as string,
      width: src.width as number,
      height: src.height as number,
      score: h._score as number,
    };
  });
}

async function bm25Search(keywords: string): Promise<ImageResult[]> {
  if (!keywords.trim()) return [];
  const client = getOpenSearchClient();
  const resp = await client.search({
    index: INDEX,
    body: {
      query: {
        multi_match: {
          query: keywords,
          fields: ["title^2", "description", "tags"],
          type: "best_fields",
        },
      },
      size: 6,
    },
  });
  return parseHits(resp.body.hits.hits as Record<string, unknown>[]);
}

async function knnSearch(vector: number[]): Promise<ImageResult[]> {
  const client = getOpenSearchClient();
  const resp = await client.search({
    index: INDEX,
    body: {
      size: 6,
      query: {
        knn: {
          dense_vector: {
            vector,
            k: 6,
          },
        },
      },
    },
  });
  return parseHits(resp.body.hits.hits as Record<string, unknown>[]);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { query_id, session_vector } = parsed.data;

  if (!validateQueryId(query_id)) {
    return NextResponse.json({ error: `Unknown query_id: ${query_id}` }, { status: 400 });
  }

  const query = getQueryById(query_id)!;
  const searchVector = session_vector ?? query.embedding;

  const [legacy, discovery] = await Promise.all([
    bm25Search(query.bm25_keywords),
    searchVector.length > 0 ? knnSearch(searchVector) : Promise.resolve([]),
  ]);

  return NextResponse.json({ legacy, discovery });
}
