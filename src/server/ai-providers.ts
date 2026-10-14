export type ProviderId = "groq" | "gemini" | "cerebras" | "openrouter" | "cloudflare" | "huggingface";

export type ProviderCatalogEntry = {
  id: ProviderId;
  name: string;
  baseUrl: string;
  keyEnv: string;
  accountIdEnv?: string;
  specialties: string[];
  access: "free-tier" | "mixed" | "local-or-hosted";
  integration: "openai-compatible" | "cloudflare-openai-compatible";
  notes: string;
};

const CATALOG: ProviderCatalogEntry[] = [
  {
    id: "groq",
    name: "GroqCloud",
    baseUrl: "https://api.groq.com/openai/v1",
    keyEnv: "AI_API_KEY",
    specialties: ["general-reasoning", "coding", "fast-inference", "audio-transcription"],
    access: "free-tier",
    integration: "openai-compatible",
    notes: "Provider principal atual; modelo e chave vêm de AI_MODEL e AI_API_KEY."
  },
  {
    id: "gemini",
    name: "Google Gemini API",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    keyEnv: "GEMINI_API_KEY",
    specialties: ["general-reasoning", "multimodal", "documents", "vision"],
    access: "free-tier",
    integration: "openai-compatible",
    notes: "Usar apenas modelos e cotas disponíveis no projeto Google configurado."
  },
  {
    id: "cerebras",
    name: "Cerebras Inference",
    baseUrl: "https://api.cerebras.ai/v1",
    keyEnv: "CEREBRAS_API_KEY",
    specialties: ["general-reasoning", "coding", "fast-inference"],
    access: "free-tier",
    integration: "openai-compatible",
    notes: "Disponibilidade e limites dependem do modelo e da conta."
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    keyEnv: "OPENROUTER_API_KEY",
    specialties: ["model-discovery", "general-reasoning", "coding", "fallback"],
    access: "mixed",
    integration: "openai-compatible",
    notes: "Modelos gratuitos e pagos; a seleção deve filtrar explicitamente modelos gratuitos."
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    baseUrl: "https://api.cloudflare.com/client/v4/accounts",
    keyEnv: "CLOUDFLARE_API_TOKEN",
    accountIdEnv: "CLOUDFLARE_ACCOUNT_ID",
    specialties: ["open-models", "embeddings", "classification", "vision"],
    access: "free-tier",
    integration: "cloudflare-openai-compatible",
    notes: "Requer ID da conta e token com permissões mínimas; o endpoint é montado pelo adaptador."
  },
  {
    id: "huggingface",
    name: "Hugging Face Inference Providers",
    baseUrl: "https://router.huggingface.co/v1",
    keyEnv: "HF_TOKEN",
    specialties: ["model-discovery", "open-models", "vision", "embeddings", "classification"],
    access: "mixed",
    integration: "openai-compatible",
    notes: "Cota gratuita limitada; conferir suporte e disponibilidade do modelo escolhido."
  }
];

function isConfigured(entry: ProviderCatalogEntry): boolean {
  const keyPresent = Boolean(process.env[entry.keyEnv]?.trim());
  const accountPresent = !entry.accountIdEnv || Boolean(process.env[entry.accountIdEnv]?.trim());
  const endpoint = (process.env.AI_BASE_URL || "").toLowerCase();
  const groqEndpointMatches = entry.id !== "groq" || endpoint.includes("api.groq.com");
  return keyPresent && accountPresent && groqEndpointMatches;
}

/** Returns safe provider metadata only. Never returns API keys or other secret values. */
export function getProviderCatalog() {
  return CATALOG.map((entry) => ({
    id: entry.id,
    name: entry.name,
    baseUrl: entry.baseUrl,
    specialties: [...entry.specialties],
    access: entry.access,
    integration: entry.integration,
    configured: isConfigured(entry),
    missingConfiguration: [
      ...(!process.env[entry.keyEnv]?.trim() ? [entry.keyEnv] : []),
      ...(entry.accountIdEnv && !process.env[entry.accountIdEnv]?.trim() ? [entry.accountIdEnv] : [])
    ],
    notes: entry.notes
  }));
}
