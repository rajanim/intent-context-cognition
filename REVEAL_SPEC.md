# Reveal — Project Specification
## Generative Discovery on OpenSearch · Conference Demo App
### OpenSearchCon India 2026 · Rajani Maski, Shutterstock

---

## What this app is

Reveal is a controlled conference demo app that proves the difference between legacy keyword
search and Generative Discovery across three principles: Intent, Context, and Cognition.
Deployed on Vercel, backed by Aiven for OpenSearch, using a curated registry of 13 pre-defined
queries. No free-form text input. Every query, result, and agent trace is validated before the talk.

Audience accesses via QR code on their phones. They pick a query, see legacy BM25 results on
the left and Generative Discovery results on the right. Cognition queries show a live agent
reasoning trace streaming in real time.

---

## App name and branding

- App name: Reveal
- Tagline: Generative Discovery on OpenSearch
- Header line: "Search finds. Reveal discovers."
- Color theme: Dark background, green accent for Discovery panel, red/muted for legacy panel

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend + API routes | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Deployment | Vercel |
| Vector + search backend | Aiven for OpenSearch (Hobbyist tier, single node) |
| Image corpus | Pexels API (8000 images, pre-fetched offline) |
| Embeddings | OpenAI text-embedding-3-small via Python pipeline (one-time, offline) |
| Primary LLM (trace only) | NVIDIA NIM — meta/llama-3.1-8b-instruct |
| Fallback LLM (trace only) | OpenAI — gpt-4o-mini |
| Last-resort trace | Scripted trace streamed at 18ms/char — no LLM dependency |

---

## Environment variables (.env.local)

```
# OpenSearch (Aiven)
OPENSEARCH_URL=https://...aiven.com:PORT
OPENSEARCH_USERNAME=avnadmin
OPENSEARCH_PASSWORD=...

# Pexels (data pipeline only)
PEXELS_API_KEY=...

# Embeddings (data pipeline only)
OPENAI_EMBEDDING_API_KEY=...

# Primary LLM — NVIDIA NIM
NVIDIA_API_KEY=...
LLM_PRIMARY_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_PRIMARY_MODEL=meta/llama-3.1-8b-instruct
LLM_TIMEOUT_MS=120000
LLM_MAX_RETRIES=2

# Fallback LLM — OpenAI
OPENAI_API_KEY=...
LLM_FALLBACK_BASE_URL=https://api.openai.com/v1
LLM_FALLBACK_MODEL=gpt-4o-mini

# Trace mode: "live" = use LLM chain, "scripted" = stream pre-written trace
TRACE_MODE=live

NEXT_PUBLIC_APP_NAME=Reveal
```

---

## Project structure

```
reveal/
├── data-pipeline/
│   ├── requirements.txt
│   ├── 01_fetch_pexels.py
│   ├── 02_generate_embeddings.py
│   ├── 03_index_opensearch.py
│   └── pexels_images.jsonl           # intermediate output
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       ├── search/route.ts
│   │       ├── session/route.ts
│   │       └── trace/route.ts
│   ├── lib/
│   │   ├── opensearch.ts
│   │   ├── queries.ts
│   │   ├── llm.ts
│   │   └── session.ts
│   ├── components/
│   │   ├── QuerySelector.tsx
│   │   ├── DualResults.tsx
│   │   ├── ImageCard.tsx
│   │   ├── AgentTrace.tsx
│   │   └── SessionFlow.tsx
│   └── data/
│       └── queries.json
│
├── .env.example
├── vercel.json
└── package.json
```

---

## OpenSearch index: reveal_images

```json
{
  "settings": {
    "index": { "knn": true, "knn.algo_param.ef_search": 100 }
  },
  "mappings": {
    "properties": {
      "image_id":      { "type": "keyword" },
      "title":         { "type": "text", "analyzer": "english" },
      "description":   { "type": "text", "analyzer": "english" },
      "tags":          { "type": "text", "analyzer": "english" },
      "photographer":  { "type": "keyword" },
      "pexels_url":    { "type": "keyword", "index": false },
      "thumbnail_url": { "type": "keyword", "index": false },
      "medium_url":    { "type": "keyword", "index": false },
      "width":         { "type": "integer" },
      "height":        { "type": "integer" },
      "dense_vector": {
        "type": "knn_vector",
        "dimension": 1536,
        "method": {
          "name": "hnsw",
          "space_type": "cosinesimil",
          "engine": "nmslib",
          "parameters": { "ef_construction": 128, "m": 16 }
        }
      }
    }
  }
}
```

---

## queries.json — full registry

All 13 queries. embedding arrays populated by data pipeline.
API rejects any query_id not present in this file with HTTP 400.

```json
{
  "queries": [
    {
      "id": "intent_01",
      "pillar": "intent",
      "label": "Melancholy but hopeful",
      "display_text": "something melancholy but hopeful, late afternoon light",
      "bm25_keywords": "afternoon light",
      "embedding": [],
      "session_chain": null,
      "trace_template": null
    },
    {
      "id": "intent_02",
      "pillar": "intent",
      "label": "Courage, not strength",
      "display_text": "courage that doesn't look like strength",
      "bm25_keywords": "courage strength",
      "embedding": [],
      "session_chain": null,
      "trace_template": null
    },
    {
      "id": "intent_03",
      "pillar": "intent",
      "label": "Before something changes",
      "display_text": "the moment before something changes",
      "bm25_keywords": "moment change",
      "embedding": [],
      "session_chain": null,
      "trace_template": null
    },
    {
      "id": "intent_04",
      "pillar": "intent",
      "label": "Sunday morning textures",
      "display_text": "textures that feel like Sunday morning",
      "bm25_keywords": "texture morning light",
      "embedding": [],
      "session_chain": null,
      "trace_template": null
    },
    {
      "id": "intent_05",
      "pillar": "intent",
      "label": "Unspoken understanding",
      "display_text": "two people who don't need to talk to understand each other",
      "bm25_keywords": "two people together",
      "embedding": [],
      "session_chain": null,
      "trace_template": null
    },
    {
      "id": "context_01",
      "pillar": "context",
      "label": "Developer in flow",
      "display_text": "developer in flow state",
      "bm25_keywords": "developer working laptop",
      "embedding": [],
      "session_chain": {
        "session_id": "session_a",
        "prior_queries": ["clean workspace", "late night focus"],
        "prior_embeddings": [],
        "step": 3
      },
      "trace_template": null
    },
    {
      "id": "context_02",
      "pillar": "context",
      "label": "Human scale",
      "display_text": "human scale",
      "bm25_keywords": "architecture scale",
      "embedding": [],
      "session_chain": {
        "session_id": "session_b",
        "prior_queries": ["urban architecture", "people in the city"],
        "prior_embeddings": [],
        "step": 3
      },
      "trace_template": null
    },
    {
      "id": "context_03",
      "pillar": "context",
      "label": "Something aspirational",
      "display_text": "something aspirational",
      "bm25_keywords": "aspirational lifestyle",
      "embedding": [],
      "session_chain": {
        "session_id": "session_c",
        "prior_queries": ["natural materials", "slow living"],
        "prior_embeddings": [],
        "step": 3
      },
      "trace_template": null
    },
    {
      "id": "context_04",
      "pillar": "context",
      "label": "The pivot — colder",
      "display_text": "actually, I want something colder",
      "bm25_keywords": "cold minimal",
      "embedding": [],
      "session_chain": {
        "session_id": "session_d",
        "prior_queries": ["warm beach tones"],
        "prior_embeddings": [],
        "step": 2,
        "pivot": true,
        "pivot_direction": -1
      },
      "trace_template": null
    },
    {
      "id": "cognition_01",
      "pillar": "cognition",
      "label": "Tech startup, feels human",
      "display_text": "something for a tech startup that feels human",
      "bm25_keywords": "startup team office",
      "embedding": [],
      "session_chain": null,
      "trace_template": {
        "steps": [
          "Analysing query for ambiguous modifier combinations...",
          "Detected tension: [tech context] vs [human warmth] — conflicting visual registers.",
          "Decomposing into sub-queries:",
          "  Sub-query 1: candid team interactions, warm natural light",
          "  Sub-query 2: product close-ups with visible human hands",
          "  Sub-query 3: NOT polished corporate, NOT server racks, NOT staged poses",
          "Routing sub-query 1 to k-NN retrieval...",
          "Routing sub-query 2 to k-NN retrieval...",
          "Applying negative signal filter for sub-query 3...",
          "Merging ranked result lists with composite score...",
          "Re-ranking by human presence score...",
          "Returning top 6 results. Confidence: high."
        ]
      }
    },
    {
      "id": "cognition_02",
      "pillar": "cognition",
      "label": "Mental health app hero",
      "display_text": "hero image for a mental health app targeting young adults",
      "bm25_keywords": "mental health wellness young",
      "embedding": [],
      "session_chain": null,
      "trace_template": {
        "steps": [
          "Multi-constraint query detected. Parsing constraints...",
          "Domain flag: mental health — activating safe imagery filter.",
          "Audience signal: young adults (18-25) — adjusting visual style register.",
          "Format constraint: hero image — filtering by landscape orientation.",
          "Tone requirement: hopeful, non-clinical, non-stigmatising.",
          "Routing to editorial-grounded RAG pipeline...",
          "Applying domain-appropriate content filter...",
          "Filtering by aspect ratio: landscape (width > height * 1.5)...",
          "Scoring by emotional tone: positive, open, outdoor-weighted...",
          "Returning top 6 results. All pass safe imagery threshold."
        ]
      }
    },
    {
      "id": "cognition_03",
      "pillar": "cognition",
      "label": "Innovation, not a lightbulb",
      "display_text": "innovation that doesn't look like a lightbulb",
      "bm25_keywords": "innovation technology creative",
      "embedding": [],
      "session_chain": null,
      "trace_template": {
        "steps": [
          "Negation + abstraction pattern detected.",
          "Core concept: innovation",
          "Building visual cliche exclusion list: lightbulb, gear, circuit board, rocket...",
          "Expanding concept to unexpected representations of novelty:",
          "  Process imagery: the moment of discovery",
          "  Reaction imagery: human response to a new result",
          "  First-use moments: hands on a new object",
          "Running 3 parallel k-NN queries with concept expansions...",
          "Filtering out cliche cluster matches (cosine sim > 0.85 to exclusion embeddings)...",
          "Scoring remaining results by visual novelty...",
          "Returning top 6 results. Innovation as human moment, not symbol."
        ]
      }
    },
    {
      "id": "cognition_04",
      "pillar": "cognition",
      "label": "Cannot describe it",
      "display_text": "something I cannot describe but will know when I see it",
      "bm25_keywords": "",
      "embedding": [],
      "session_chain": null,
      "trace_template": {
        "steps": [
          "Query received. Parsing for semantic signal...",
          "Signal strength: minimal. No domain, tone, or subject anchor detected.",
          "Checking session context for prior signal...",
          "No active session found.",
          "Cannot decompose without domain anchor.",
          "Confidence: low. Insufficient signal for directed retrieval.",
          "Falling back to session-neutral semantic centre of corpus...",
          "Retrieving highest-variance, highest-engagement images across corpus...",
          "This is not a failure — it is honest reasoning.",
          "Returning 6 diverse, high-resonance images as a starting signal.",
          "The system knows what it does not know. That is cognition."
        ]
      }
    }
  ]
}
```

---

## LLM fallback chain — /api/trace/route.ts

```
if TRACE_MODE === "scripted":
  stream scripted trace immediately, skip all LLM calls

else:
  attempt 1: NVIDIA NIM, 2-min timeout
    success → stream
    fail/timeout →
  attempt 2: NVIDIA NIM retry, 2-min timeout
    success → stream
    fail/timeout →
  attempt 3: OpenAI gpt-4o-mini, 2-min timeout  ← user billed here
    success → stream, log "openai_fallback_used"
    fail →
  final: stream scripted trace, log "all_llms_failed"
```

Scripted trace streams each step character by character at 18ms intervals.
Visually identical to a live LLM stream. Never shows an error state.

---

## Dual search — /api/search/route.ts

Two parallel OpenSearch calls per query:

BM25 (legacy):
```json
{
  "query": {
    "multi_match": {
      "query": "<bm25_keywords>",
      "fields": ["title^2", "description", "tags"],
      "type": "best_fields"
    }
  },
  "size": 6
}
```

k-NN (discovery):
```json
{
  "size": 6,
  "query": {
    "knn": {
      "dense_vector": {
        "vector": [<pre-computed embedding from registry>],
        "k": 6
      }
    }
  }
}
```

Context queries: k-NN uses session_vector instead of raw query embedding.

---

## Session vector logic — /api/session/route.ts

```
session_vector = weighted_average(prior_embeddings + current_embedding)
  weight[i] = 0.7^(n - i)   // recency-weighted

pivot queries (pivot === true):
  session_vector = session_vector - (0.6 * prior_embeddings[0])
```

Sessions stored in reveal_sessions OpenSearch index.
TTL: 4 hours via index.lifecycle or document-level expiry field.

---

## UI layout (ASCII)

```
┌─────────────────────────────────────────────┐
│  REVEAL          Generative Discovery on    │
│                  OpenSearch                 │
├─────────────────────────────────────────────┤
│  [ Intent ]  [ Context ]  [ Cognition ]     │
├─────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ...      │
│  │ Query card  │  │ Query card  │           │
│  └─────────────┘  └─────────────┘           │
│          ↑ click to execute                 │
├─────────────────────┬───────────────────────┤
│  Legacy search      │  Reveal Discovery     │
│  BM25 keywords      │  Semantic / session   │
│  ┌──┐ ┌──┐ ┌──┐    │  ┌──┐ ┌──┐ ┌──┐      │
│  └──┘ └──┘ └──┘    │  └──┘ └──┘ └──┘      │
│  ┌──┐ ┌──┐ ┌──┐    │  ┌──┐ ┌──┐ ┌──┐      │
│  └──┘ └──┘ └──┘    │  └──┘ └──┘ └──┘      │
├─────────────────────┴───────────────────────┤
│  > Agent trace (cognition queries only)     │
│  > Analysing query...                       │
│  > Detected tension: tech vs human warmth   │
└─────────────────────────────────────────────┘
```

Mobile: panels stack vertically. Trace panel hidden for intent/context queries.

---

## Build sequence

### Phase 1 — Scaffold
- npx create-next-app@latest reveal --typescript --tailwind --app
- npm install opensearch-js openai zod
- Create src/data/queries.json (full registry above, embeddings as empty arrays)
- Create src/lib/queries.ts — Query type, loadQueries(), getQueryById(), validateQueryId()
- Create .env.example

### Phase 2 — Data pipeline (Python, run offline before deploy)
- data-pipeline/requirements.txt: requests openai opensearch-py python-dotenv tqdm
- 01_fetch_pexels.py: paginate Pexels /v1/photos/curated and /v1/search across categories
  (nature, architecture, people, workspace, urban, abstract, technology, lifestyle)
  target 8000 unique images, save to pexels_images.jsonl
- 02_generate_embeddings.py:
  - embed each image: concatenate title + description + tags, call text-embedding-3-small
  - embed all 13 query display_text values
  - embed all session_chain.prior_queries
  - write populated queries_embedded.json (copy to src/data/queries.json)
- 03_index_opensearch.py:
  - delete and recreate reveal_images index with mapping above
  - bulk index all 8000 images in batches of 500

### Phase 3 — API routes
- src/lib/opensearch.ts: singleton Client, connection from env, error on missing vars
- src/lib/llm.ts:
  - callLLM(config, query, signal): OpenAI SDK call with AbortSignal for timeout
  - streamScriptedTrace(steps): ReadableStream, 18ms/char delay
  - streamTrace(queryId): full fallback chain as described above
- src/app/api/search/route.ts:
  - POST { query_id }
  - validate query_id, load query from registry
  - parallel Promise.all([bm25Search, knnSearch])
  - return { legacy: ImageResult[], discovery: ImageResult[] }
- src/app/api/session/route.ts:
  - POST { session_id, query_id, step }
  - compute session vector from prior_embeddings + current embedding
  - upsert to reveal_sessions index
  - return { session_vector: number[] }
- src/app/api/trace/route.ts:
  - POST { query_id }, returns SSE stream
  - validate query_id has trace_template
  - run full LLM fallback chain
  - stream as text/event-stream

### Phase 4 — UI components
- QuerySelector.tsx: pillar tabs (Intent/Context/Cognition), query cards grid
  click fires POST /api/search, sets active query, shows results
- ImageCard.tsx: thumbnail, title, photographer, link to pexels_url
- DualResults.tsx: two-column grid, loading skeletons, "Legacy" vs "Discovery" headers
  left panel: red/muted border; right panel: green border
- SessionFlow.tsx: shown for context pillar queries only
  displays prior query chain with arrows, highlights active step
- AgentTrace.tsx: shown for cognition queries only
  monospace font, streams via EventSource from /api/trace
  shows blinking cursor while streaming
- page.tsx: composes all components, manages selected query state

### Phase 5 — Vercel deploy
- vercel.json:
  { "functions": { "src/app/api/**": { "maxDuration": 130 } } }
- Push to GitHub, connect to Vercel
- Add all env vars in Vercel dashboard
- Run data pipeline locally first, verify 8000 docs indexed
- Test with TRACE_MODE=scripted (all 13 queries)
- Test with TRACE_MODE=live (cognition queries, NVIDIA NIM)
- Set TRACE_MODE=scripted for day-of safety, flip to live if confident

---

## Critical constraints — never violate

1. API validates every query_id against registry. Returns 400 for unknown ids.
2. No free-form text input in UI or API.
3. Dual panel always shows both BM25 and k-NN side by side.
4. Scripted trace is always the final fallback. Never surface an error state on stage.
5. Session vectors computed from pre-computed embeddings in queries.json, not live calls.
6. Every image links to its Pexels page (Pexels API terms of service).
7. Vercel function maxDuration >= 130 seconds.

---

## Definition of done

An attendee opens Reveal on their phone via QR code.
They tap Intent, pick a query, and immediately see the contrast between
a mediocre BM25 left panel and a semantically resonant Discovery right panel.

They tap Cognition, pick a query, and watch an agent trace stream
explaining how the system decomposed ambiguous intent before retrieval.

The message is clear without a single word of explanation from the speaker.
