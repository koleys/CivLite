/**
 * OpenRouter free-model catalogue and user priority persistence.
 *
 * Source: https://openrouter.ai/collections/free-models
 * Last verified: March 2026 (27 models via costgoat.com / OpenRouter official)
 *
 * All models use the `:free` suffix — zero cost, rate-limited
 * (20 req/min, 200 req/day per free account).
 * Model availability rotates; use `openrouter/free` as an auto-routing fallback.
 */

export interface FreeModel {
  id: string;
  name: string;
  family: string;
  contextK: number;
  /** Rough speed/size indication — for display only */
  speed: 'fast' | 'medium' | 'slow';
}

/**
 * Current free-tier models on OpenRouter (March 2026).
 * Sorted roughly by capability (largest / best first).
 */
export const ALL_FREE_MODELS: FreeModel[] = [
  // ── Auto-router (OpenRouter picks best available free model) ─────────────
  { id: 'openrouter/free',                                    name: 'Auto (Best Free)',             family: 'OpenRouter',          contextK: 200,  speed: 'medium' },

  // ── NVIDIA Nemotron ──────────────────────────────────────────────────────
  { id: 'nvidia/nemotron-3-super-120b-a12b:free',             name: 'Nemotron 3 Super 120B',        family: 'NVIDIA',              contextK: 262,  speed: 'slow'   },
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free',                name: 'Nemotron 3 Nano 30B',          family: 'NVIDIA',              contextK: 256,  speed: 'medium' },
  { id: 'nvidia/nemotron-nano-12b-v2-vl:free',                name: 'Nemotron Nano 12B V2',         family: 'NVIDIA',              contextK: 128,  speed: 'fast'   },
  { id: 'nvidia/nemotron-nano-9b-v2:free',                    name: 'Nemotron Nano 9B V2',          family: 'NVIDIA',              contextK: 128,  speed: 'fast'   },

  // ── Qwen ─────────────────────────────────────────────────────────────────
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free',              name: 'Qwen3 Next 80B',               family: 'Qwen',                contextK: 262,  speed: 'slow'   },
  { id: 'qwen/qwen3-coder:free',                              name: 'Qwen3 Coder 480B',             family: 'Qwen',                contextK: 262,  speed: 'slow'   },
  { id: 'qwen/qwen3-4b:free',                                 name: 'Qwen3 4B',                     family: 'Qwen',                contextK: 41,   speed: 'fast'   },

  // ── StepFun ──────────────────────────────────────────────────────────────
  { id: 'stepfun/step-3.5-flash:free',                        name: 'Step 3.5 Flash',               family: 'StepFun',             contextK: 256,  speed: 'fast'   },

  // ── MiniMax ──────────────────────────────────────────────────────────────
  { id: 'minimax/minimax-m2.5:free',                          name: 'MiniMax M2.5',                 family: 'MiniMax',             contextK: 197,  speed: 'medium' },

  // ── Arcee AI ─────────────────────────────────────────────────────────────
  { id: 'arcee-ai/trinity-large-preview:free',                name: 'Trinity Large Preview',        family: 'Arcee AI',            contextK: 131,  speed: 'medium' },
  { id: 'arcee-ai/trinity-mini:free',                         name: 'Trinity Mini',                 family: 'Arcee AI',            contextK: 131,  speed: 'fast'   },

  // ── OpenAI (open-weight) ─────────────────────────────────────────────────
  { id: 'openai/gpt-oss-120b:free',                           name: 'GPT-OSS 120B',                 family: 'OpenAI',              contextK: 131,  speed: 'slow'   },
  { id: 'openai/gpt-oss-20b:free',                            name: 'GPT-OSS 20B',                  family: 'OpenAI',              contextK: 131,  speed: 'medium' },

  // ── Z.ai ─────────────────────────────────────────────────────────────────
  { id: 'z-ai/glm-4.5-air:free',                              name: 'GLM-4.5 Air',                  family: 'Z.ai',                contextK: 131,  speed: 'medium' },

  // ── Meta Llama ───────────────────────────────────────────────────────────
  { id: 'meta-llama/llama-3.3-70b-instruct:free',             name: 'Llama 3.3 70B',                family: 'Meta',                contextK: 66,   speed: 'medium' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free',              name: 'Llama 3.2 3B',                 family: 'Meta',                contextK: 131,  speed: 'fast'   },

  // ── Nous Research ────────────────────────────────────────────────────────
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',          name: 'Hermes 3 405B',                family: 'Nous Research',       contextK: 131,  speed: 'slow'   },

  // ── Mistral ──────────────────────────────────────────────────────────────
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free',      name: 'Mistral Small 3.1 24B',        family: 'Mistral',             contextK: 128,  speed: 'medium' },

  // ── Google Gemma ─────────────────────────────────────────────────────────
  { id: 'google/gemma-3-27b-it:free',                         name: 'Gemma 3 27B',                  family: 'Google',              contextK: 131,  speed: 'medium' },
  { id: 'google/gemma-3-12b-it:free',                         name: 'Gemma 3 12B',                  family: 'Google',              contextK: 33,   speed: 'medium' },
  { id: 'google/gemma-3-4b-it:free',                          name: 'Gemma 3 4B',                   family: 'Google',              contextK: 33,   speed: 'fast'   },
  { id: 'google/gemma-3n-e4b-it:free',                        name: 'Gemma 3n E4B',                 family: 'Google',              contextK: 8,    speed: 'fast'   },
  { id: 'google/gemma-3n-e2b-it:free',                        name: 'Gemma 3n E2B',                 family: 'Google',              contextK: 8,    speed: 'fast'   },

  // ── LiquidAI ─────────────────────────────────────────────────────────────
  { id: 'liquid/lfm-2.5-1.2b-thinking:free',                  name: 'LFM-2.5 1.2B (Thinking)',      family: 'LiquidAI',            contextK: 33,   speed: 'fast'   },
  { id: 'liquid/lfm-2.5-1.2b-instruct:free',                  name: 'LFM-2.5 1.2B (Instruct)',      family: 'LiquidAI',            contextK: 33,   speed: 'fast'   },

  // ── Venice / CogComp ─────────────────────────────────────────────────────
  { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Dolphin Mistral 24B', family: 'Venice',             contextK: 33,   speed: 'medium' },
];

/** Default priority list for the game AI (SPEC §5.5.3 + updated). */
export const DEFAULT_MODEL_PRIORITY: string[] = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'google/gemma-3-27b-it:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'openrouter/free',
];

const MODELS_KEY = 'civlite_or_models';

/** Save custom priority list to localStorage. */
export function saveModelPriority(list: string[]): void {
  try { localStorage.setItem(MODELS_KEY, JSON.stringify(list)); } catch { /* quota */ }
}

/**
 * Get the active priority list.
 * Returns the user's saved list if valid; falls back to the default.
 */
export function getModelPriority(): string[] {
  try {
    const raw = localStorage.getItem(MODELS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(s => typeof s === 'string')) {
        return parsed as string[];
      }
    }
  } catch { /* malformed */ }
  return [...DEFAULT_MODEL_PRIORITY];
}

/** Helper: look up display name for a model ID. */
export function getModelName(id: string): string {
  return ALL_FREE_MODELS.find(m => m.id === id)?.name ?? id;
}

/** Speed badge label. */
export function getSpeedLabel(id: string): string {
  const speed = ALL_FREE_MODELS.find(m => m.id === id)?.speed;
  if (speed === 'fast')   return '⚡ Fast';
  if (speed === 'medium') return '🔄 Med';
  if (speed === 'slow')   return '🧠 Slow';
  return '';
}

/** Context window in K tokens (for display). */
export function getContextLabel(id: string): string {
  const k = ALL_FREE_MODELS.find(m => m.id === id)?.contextK;
  return k ? `${k}K` : '';
}
