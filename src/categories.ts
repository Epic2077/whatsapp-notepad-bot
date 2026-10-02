import { supabase } from './db';

export const DEFAULT_CATEGORIES = ['Todo', 'Idea', 'Link', 'Finance', 'Snippet', 'Other'];

const FALLBACK = [...DEFAULT_CATEGORIES];

/**
 * Fetch the user's category list from the `categories` table.
 * Falls back to defaults if the table is empty or unreachable.
 */
export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('name', { ascending: true });

  if (error || !data || data.length === 0) {
    return FALLBACK;
  }
  return data.map((row: { name: string }) => row.name);
}

export async function addCategory(name: string): Promise<{ ok: boolean; reason?: string }> {
  const cleaned = name.trim();
  if (!cleaned) return { ok: false, reason: 'Category name cannot be empty.' };
  if (!/^[\w\s-]{1,30}$/.test(cleaned)) {
    return { ok: false, reason: 'Use 1-30 letters, numbers, spaces, dashes or underscores.' };
  }

  const { error } = await supabase.from('categories').insert({ name: cleaned });
  if (error) {
    if (error.message.toLowerCase().includes('duplicate')) {
      return { ok: false, reason: `"${cleaned}" already exists.` };
    }
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

export async function removeCategory(name: string): Promise<{ ok: boolean; reason?: string }> {
  const cleaned = name.trim();
  if (cleaned.toLowerCase() === 'other') {
    return { ok: false, reason: '"Other" cannot be removed — it is the fallback category.' };
  }

  const { data, error } = await supabase
    .from('categories')
    .delete()
    .ilike('name', cleaned)
    .select();

  if (error) return { ok: false, reason: error.message };
  if (!data || data.length === 0) return { ok: false, reason: `"${cleaned}" not found.` };
  return { ok: true };
}
