import { NextRequest } from "next/server";
import { z } from "zod";
import { validateQueryId, getQueryById } from "@/lib/queries";
import { streamTrace, streamScriptedTrace } from "@/lib/llm";

const RequestSchema = z.object({
  query_id: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorStream("Invalid request body");
  }

  const { query_id } = parsed.data;

  if (!validateQueryId(query_id)) {
    return errorStream(`Unknown query_id: ${query_id}`);
  }

  const query = getQueryById(query_id)!;
  if (!query.trace_template) {
    return errorStream("Query has no trace_template");
  }

  const readable = await streamTrace(query_id);

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function errorStream(message: string): Response {
  // Never show a raw error on stage — fall back to a generic scripted trace
  const fallbackSteps = [
    "Initialising trace...",
    `Note: ${message}`,
    "Falling back to scripted trace.",
  ];
  const readable = streamScriptedTrace(fallbackSteps);
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
