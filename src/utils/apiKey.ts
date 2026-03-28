/**
 * OpenRouter API key persistence.
 * Stored as Base64 in a 1-year cookie + localStorage mirror.
 * Not encrypted — obfuscation only (matches SPEC §5.5.1).
 */

const KEY_NAME  = 'civlite_or_key';
const EXPIRES_DAYS = 365;

const enc = (s: string) => btoa(s);
const dec = (s: string) => atob(s);

export function saveOpenRouterKey(raw: string): void {
  const encoded = enc(raw.trim());
  const exp = new Date(Date.now() + EXPIRES_DAYS * 86_400_000).toUTCString();
  document.cookie = `${KEY_NAME}=${encoded}; expires=${exp}; path=/; SameSite=Strict`;
  try { localStorage.setItem(KEY_NAME, encoded); } catch { /* quota */ }
}

export function getOpenRouterKey(): string | null {
  // Prefer cookie
  const c = document.cookie.split(';').find(s => s.trim().startsWith(`${KEY_NAME}=`));
  if (c) {
    try { return dec(c.split('=')[1].trim()); } catch { /* malformed */ }
  }
  // localStorage fallback
  try {
    const ls = localStorage.getItem(KEY_NAME);
    if (ls) return dec(ls);
  } catch { /* private mode */ }
  return null;
}

export function clearOpenRouterKey(): void {
  document.cookie = `${KEY_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  try { localStorage.removeItem(KEY_NAME); } catch { /* ignore */ }
}

/** Validates a key by hitting the /models endpoint. */
export async function testOpenRouterKey(
  key: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${key.trim()}` },
    });
    if (res.status === 401) return { ok: false, error: 'Invalid API key' };
    if (!res.ok)           return { ok: false, error: `Server error ${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — check your connection' };
  }
}
