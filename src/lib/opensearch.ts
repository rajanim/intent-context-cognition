import { Client } from "@opensearch-project/opensearch";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

let _client: Client | null = null;

export function getOpenSearchClient(): Client {
  if (_client) return _client;

  const url = requireEnv("OPENSEARCH_URL");
  const username = requireEnv("OPENSEARCH_USERNAME");
  const password = requireEnv("OPENSEARCH_PASSWORD");

  // Inject credentials into URL: https://user:pass@host:port
  const parsed = new URL(url);
  parsed.username = encodeURIComponent(username);
  parsed.password = encodeURIComponent(password);

  _client = new Client({
    node: parsed.toString(),
    ssl: parsed.protocol === "https:" ? { rejectUnauthorized: true } : undefined,
  });

  return _client;
}
