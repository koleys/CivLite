/**
 * OpenRouter LLM AI opponent (SPEC §5.5).
 *
 * Calls the OpenRouter chat-completions API with a compact game-state prompt,
 * parses the JSON action list, and validates it against actual unit ownership.
 * Falls back automatically through the user's model priority list; callers
 * catch the final rejection and fall back to RandomAI.
 */

import type { AIAction } from '@/game/engine/AIRandomStrategy';
import type { Player, GameState } from '@/game/entities/types';
import { getModelPriority } from '@/utils/aiModels';

const TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT =
  'You are an AI player in a Civilization-style strategy game. ' +
  'Respond ONLY with a valid JSON array of action objects — no explanation, no markdown.';

// ─── Public API ───────────────────────────────────────────────────────────────

export class OpenRouterAI {
  /**
   * Process one AI turn. Tries each model in priority order.
   * Throws if all models fail (caller should fall back to RandomAI).
   */
  static async processTurn(
    player: Player,
    state: GameState,
    apiKey: string,
  ): Promise<AIAction[]> {
    const prompt = buildPrompt(player, state);
    const models = getModelPriority();

    for (const model of models) {
      try {
        const raw     = await callAPI(prompt, model, apiKey);
        const actions = parseActions(raw, player);
        if (actions.length > 0) return actions;
      } catch (err) {
        console.warn(`[OpenRouterAI] model ${model} failed:`, err);
      }
    }
    throw new Error('All OpenRouter models failed');
  }
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(player: Player, state: GameState): string {
  const cities = player.cities.length
    ? player.cities.map(c => `${c.name}(pop:${c.population})`).join(', ')
    : 'none';

  const units = player.units
    .map(u => `${u.id}=${u.type}@(${u.x},${u.y}) mv:${u.movement} hp:${u.health}`)
    .join('; ') || 'none';

  const enemies = (state.players ?? [])
    .filter(p => p.id !== player.id && p.id !== -1 && !p.isHuman)
    .map(p => `${p.name}:${p.cities.length}cities,${p.units.length}units`)
    .join(' | ') || 'none';

  return (
    `Turn:${state.turn} Age:${state.age}\n` +
    `Player:${player.name} Gold:${player.gold} Score:${player.score}\n` +
    `Cities:[${cities}]\nUnits:[${units}]\nEnemies:[${enemies}]\n\n` +
    `Return a JSON array of up to 5 actions. Valid action shapes:\n` +
    `{"type":"move","unitId":"<id>","target":{"x":<n>,"y":<n>}}\n` +
    `{"type":"build_city","unitId":"<settler-id>"}\n` +
    `{"type":"research","techId":"<tech-id>"}\n` +
    `{"type":"end_turn"}\n\n` +
    `Rules: no ocean/mountain movement. Settlers found cities. Warriors attack enemies.\n` +
    `Respond with ONLY the JSON array.`
  );
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseActions(raw: string, player: Player): AIAction[] {
  try {
    const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
    const match   = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];

    const valid: AIAction[] = [];

    for (const a of parsed) {
      if (typeof a?.type !== 'string') continue;

      if (
        a.type === 'move' &&
        typeof a.unitId === 'string' &&
        typeof a.target?.x === 'number' &&
        typeof a.target?.y === 'number'
      ) {
        if (!player.units.find(u => u.id === a.unitId)) continue;
        valid.push({ type: 'move', unitId: a.unitId, target: { x: a.target.x, y: a.target.y } });
      } else if (a.type === 'build_city' && typeof a.unitId === 'string') {
        if (!player.units.find(u => u.id === a.unitId && u.type === 'settler')) continue;
        valid.push({ type: 'build_city', unitId: a.unitId });
      } else if (a.type === 'research' && typeof a.techId === 'string') {
        valid.push({ type: 'research', techId: a.techId });
      } else if (a.type === 'end_turn') {
        valid.push({ type: 'end_turn' });
        break;
      }
    }
    return valid;
  } catch {
    return [];
  }
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function callAPI(prompt: string, model: string, apiKey: string): Promise<string> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'https://civlite.app',
        'X-Title':      'CivLite',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: prompt },
        ],
        max_tokens:  500,
        temperature: 0.7,
      }),
      signal: ctrl.signal,
    });

    if (res.status === 401) throw new Error('invalid_key');
    if (res.status === 429) throw new Error('rate_limited');
    if (!res.ok)            throw new Error(`http_${res.status}`);

    const data = await res.json();
    return (data.choices?.[0]?.message?.content as string) ?? '';
  } finally {
    clearTimeout(timer);
  }
}
