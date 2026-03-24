import type { Player, MapData, GameAge, GameSpeed, Difficulty } from '@/game/entities/types';
import type { AIAction } from './AIRandomStrategy';

export interface AIContext {
  player: Player;
  map: MapData;
  difficulty: Difficulty;
  age: GameAge;
  gameSpeed: GameSpeed;
  turn: number;
  recentActions: string[];
  gameState: string;
}

export interface AIDecision {
  action: AIAction;
  reasoning: string;
  confidence: number;
}

export interface AIConfig {
  player: Player;
  map: MapData;
  difficulty: Difficulty;
  age: GameAge;
  gameSpeed: GameSpeed;
  turn: number;
  apiKey?: string;
  model?: string;
}

export type AIErrorType = 'invalid_key' | 'rate_limit' | 'server_error' | 'timeout' | 'empty_response' | 'offline';

export interface AIError {
  type: AIErrorType;
  message: string;
  retryable: boolean;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-3-haiku';

const SYSTEM_PROMPT = `You are an expert AI player for Civilization VII-style 4X strategy game. Analyze the game state and provide the best action.

Game Rules:
- Maximize your victory chances through domination, science, culture, religion, diplomacy, or age victory
- Balance military, economic, and technological development
- Consider map position, resources, and opponent actions
- Manage city growth and production efficiently
- Use terrain advantages in combat

Respond with JSON:
{
  "action": {
    "type": "move|attack|build_city|build_unit|build_building|research|found_religion|spread_religion|end_turn",
    "target": {"x": number, "y": number},
    "unitId": "string",
    "cityId": "string",
    "buildTarget": "string",
    "techId": "string"
  },
  "reasoning": "brief explanation",
  "confidence": 0.0-1.0
}`;

export class OpenRouterAI {
  private apiKey: string;
  private model: string;
  private isOnline: boolean = true;
  private errorCount: number = 0;
  private maxErrors: number = 3;

  constructor(config: AIConfig) {
    void config;
    this.apiKey = config.apiKey || this.loadApiKey() || '';
    this.model = config.model || DEFAULT_MODEL;
    this.checkOnlineStatus();
  }

  private loadApiKey(): string | null {
    try {
      const encoded = localStorage.getItem('civlite_openrouter_key');
      if (encoded) {
        return atob(encoded);
      }
    } catch {
      return null;
    }
    return null;
  }

  setApiKey(key: string): void {
    try {
      this.apiKey = key;
      localStorage.setItem('civlite_openrouter_key', btoa(key));
    } catch {
      console.error('Failed to save API key');
    }
  }

  hasApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  private async checkOnlineStatus(): Promise<void> {
    try {
      await fetch('https://www.google.com', {
        method: 'HEAD',
        mode: 'no-cors',
      });
      this.isOnline = true;
    } catch {
      this.isOnline = false;
    }
  }

  isOffline(): boolean {
    return !this.isOnline;
  }

  async testConnection(): Promise<{ success: boolean; error?: AIError }> {
    if (!this.hasApiKey()) {
      return { success: false, error: { type: 'invalid_key', message: 'No API key set', retryable: false } };
    }

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CivLite',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        }),
      });

      if (response.status === 401) {
        return { success: false, error: { type: 'invalid_key', message: 'Invalid API key', retryable: false } };
      }

      if (response.status === 429) {
        return { success: false, error: { type: 'rate_limit', message: 'Rate limited', retryable: true } };
      }

      if (response.status >= 500) {
        return { success: false, error: { type: 'server_error', message: 'Server error', retryable: true } };
      }

      if (!response.ok) {
        return { success: false, error: { type: 'server_error', message: `HTTP ${response.status}`, retryable: true } };
      }

      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        return { success: false, error: { type: 'timeout', message: 'Request timed out', retryable: true } };
      }
      this.isOnline = false;
      return { success: false, error: { type: 'offline', message: 'Offline', retryable: false } };
    }
  }

  async getDecision(context: AIContext): Promise<AIDecision | AIError> {
    if (!this.hasApiKey() || !this.isOnline) {
      return this.getFallbackDecision(context);
    }

    const prompt = this.buildPrompt(context);

    try {
      const response = await this.makeRequest(prompt);
      
      if (this.isAIError(response)) {
        this.errorCount++;
        if (this.errorCount >= this.maxErrors) {
          return this.getFallbackDecision(context);
        }
        return response;
      }

      this.errorCount = 0;
      return this.parseResponse(response);
    } catch (error) {
      this.errorCount++;
      if (error instanceof Error && error.name === 'TimeoutError') {
        return { type: 'timeout', message: 'Request timed out', retryable: true };
      }
      return this.getFallbackDecision(context);
    }
  }

  private isAIError(obj: unknown): obj is AIError {
    return typeof obj === 'object' && obj !== null && 'type' in obj && 'message' in obj;
  }

  private async makeRequest(prompt: string): Promise<string | AIError> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CivLite',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        return { type: 'invalid_key', message: 'Invalid API key', retryable: false };
      }

      if (response.status === 429) {
        return { type: 'rate_limit', message: 'Rate limited', retryable: true };
      }

      if (response.status >= 500) {
        return { type: 'server_error', message: 'Server error', retryable: true };
      }

      if (!response.ok) {
        return { type: 'server_error', message: `HTTP ${response.status}`, retryable: true };
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]?.message?.content) {
        return { type: 'empty_response', message: 'Empty response', retryable: true };
      }

      return data.choices[0].message.content;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { type: 'timeout', message: 'Request timed out', retryable: true };
        }
      }
      return { type: 'offline', message: 'Network error', retryable: false };
    }
  }

  private parseResponse(response: string): AIDecision {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.action || !parsed.action.type) {
        throw new Error('Invalid action format');
      }

      return {
        action: parsed.action,
        reasoning: parsed.reasoning || 'No reasoning provided',
        confidence: parsed.confidence || 0.5,
      };
    } catch {
      return {
        action: { type: 'end_turn' },
        reasoning: 'Failed to parse AI response, ending turn',
        confidence: 0,
      };
    }
  }

  private buildPrompt(context: AIContext): string {
    const { player, map, difficulty, age, turn } = context;

    const cityInfo = player.cities.map(c => 
      `- ${c.name}: pop ${c.population}, prod ${c.currentProduction?.name || 'none'}`
    ).join('\n');

    const unitInfo = player.units.map(u => 
      `- ${u.type} at (${u.x},${u.y}), HP ${u.health}, moved ${u.hasActed}`
    ).join('\n');

    const playerStats = `
Turn: ${turn}
Age: ${age}
Difficulty: ${difficulty}
Gold: ${player.gold}
Era Score: ${player.eraScore}
Cities: ${player.cities.length}
Units: ${player.units.length}
Current Research: ${player.currentResearch?.techId || 'none'}
Technologies: ${player.technologies.size}

Cities:
${cityInfo}

Units:
${unitInfo}
`;

    const recentActionsInfo = context.recentActions.length > 0 
      ? `Recent Actions:\n${context.recentActions.slice(-5).map(a => `- ${a}`).join('\n')}`
      : 'No recent actions';

    return `${playerStats}

${recentActionsInfo}

Map: ${map.width}x${map.height}

Provide your decision in JSON format.`;
  }

  private getFallbackDecision(context: AIContext): AIDecision {
    const { player } = context;

    if (player.cities.length === 0) {
      return {
        action: { type: 'end_turn' },
        reasoning: 'No cities, waiting for settler',
        confidence: 1.0,
      };
    }

    if (player.units.some(u => u.type === 'settler' && !u.hasActed)) {
      const settler = player.units.find(u => u.type === 'settler');
      if (settler) {
        return {
          action: { type: 'build_city', unitId: settler.id },
          reasoning: 'Building city with settler',
          confidence: 0.8,
        };
      }
    }

    if (player.units.some(u => !u.hasActed && u.type !== 'settler')) {
      const unit = player.units.find(u => !u.hasActed && u.type !== 'settler');
      if (unit) {
        return {
          action: { type: 'move', unitId: unit.id, target: { x: unit.x + 1, y: unit.y } },
          reasoning: 'Moving unit',
          confidence: 0.6,
        };
      }
    }

    return {
      action: { type: 'end_turn' },
      reasoning: 'Fallback: ending turn',
      confidence: 0.5,
    };
  }

  resetErrorCount(): void {
    this.errorCount = 0;
  }
}

export function createOpenRouterAI(config: AIConfig): OpenRouterAI {
  return new OpenRouterAI(config);
}
