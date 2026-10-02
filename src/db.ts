import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
import { CategorizedNote } from "./llm";

export const supabase = createClient(config.supabaseUrl, config.supabaseKey);

export interface NoteRow {
  id: string;
  content: string;
  category: string;
  summary: string | null;
  details: CategorizedNote["details"];
  created_at: string;
}

export async function saveNote(
  content: string,
  note: CategorizedNote,
): Promise<void> {
  const { error } = await supabase.from("notes").insert({
    content,
    category: note.category,
    summary: note.summary,
    details: note.details,
  });

  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }
}

export async function listNotes(
  opts: { limit?: number; category?: string } = {},
): Promise<NoteRow[]> {
  const limit = Math.min(opts.limit ?? 10, 50);
  let query = supabase
    .from("notes")
    .select("id, content, category, summary, details, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.category) {
    query = query.ilike("category", opts.category);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return (data ?? []) as NoteRow[];
}

export async function getNote(
  idPrefix: string,
): Promise<{ note?: NoteRow; reason?: string }> {
  if (!/^[0-9a-f-]{4,36}$/i.test(idPrefix)) {
    return { reason: "Invalid id." };
  }

  const { data: matches, error } = await supabase
    .from("notes")
    .select("id, content, category, summary, details, created_at")
    .ilike("id", `${idPrefix}%`)
    .limit(2);

  if (error) return { reason: error.message };
  if (!matches || matches.length === 0) return { reason: "Note not found." };
  if (matches.length > 1)
    return { reason: "Id is ambiguous — provide more characters." };
  return { note: matches[0] as NoteRow };
}

export async function deleteNote(
  idPrefix: string,
): Promise<{ ok: boolean; reason?: string }> {
  // Allow deleting by short id prefix (first 8 chars) for convenience
  if (!/^[0-9a-f-]{4,36}$/i.test(idPrefix)) {
    return { ok: false, reason: "Invalid id." };
  }

  const { data: matches, error: findError } = await supabase
    .from("notes")
    .select("id")
    .ilike("id", `${idPrefix}%`);

  if (findError) return { ok: false, reason: findError.message };
  if (!matches || matches.length === 0)
    return { ok: false, reason: "Note not found." };
  if (matches.length > 1)
    return { ok: false, reason: "Id is ambiguous — provide more characters." };

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", matches[0].id);
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function countNotes(): Promise<number> {
  const { count, error } = await supabase
    .from("notes")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`Supabase count failed: ${error.message}`);
  return count ?? 0;
}
