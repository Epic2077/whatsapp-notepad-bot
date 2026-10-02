import { addCategory, getCategories, removeCategory } from "./categories";
import { countNotes, deleteNote, getNote, listNotes, NoteRow } from "./db";
import { MESSAGES } from "./messages";

export async function handleCommand(message: string): Promise<string> {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "/help" || lower === "/start") {
    return MESSAGES.help;
  }

  if (lower === "/categories") {
    const categories = await getCategories();
    return MESSAGES.categoriesList(categories);
  }

  if (lower.startsWith("/add ")) {
    const name = trimmed.slice(5);
    const result = await addCategory(name);
    return result.ok
      ? MESSAGES.categoryAdded(name)
      : MESSAGES.categoryAddFailed(result.reason ?? "");
  }

  if (lower.startsWith("/remove ")) {
    const name = trimmed.slice(8);
    const result = await removeCategory(name);
    return result.ok
      ? MESSAGES.categoryRemoved(name)
      : MESSAGES.categoryRemoveFailed(result.reason ?? "");
  }

  if (lower === "/list" || lower.startsWith("/list ")) {
    const category = lower.startsWith("/list ")
      ? trimmed.slice(6).trim()
      : undefined;
    const notes = await listNotes({ limit: 10, category });
    if (notes.length === 0) {
      return MESSAGES.noNotes(category);
    }
    const lines = notes.map(formatNote);
    return `${MESSAGES.notesList(notes.length, category)}\n\n${lines.join("\n\n")}`;
  }

  if (lower === "/message" || lower.startsWith("/message ")) {
    const id = trimmed.slice("/message".length).trim();
    if (!id) return MESSAGES.messageUsage;

    const result = await getNote(id);
    return result.note
      ? formatFullNote(result.note)
      : MESSAGES.messageNotFound(result.reason ?? "");
  }

  if (lower.startsWith("/delete ")) {
    const id = trimmed.slice(8).trim();
    const result = await deleteNote(id);
    return result.ok
      ? MESSAGES.noteDeleted(id)
      : MESSAGES.noteDeleteFailed(result.reason ?? "");
  }

  if (lower === "/count") {
    const count = await countNotes();
    return MESSAGES.totalNotes(count);
  }

  return MESSAGES.unknownCommand;
}

function formatFullNote(note: NoteRow): string {
  const fields = [
    `🆔 ${note.id}`,
    `📂 ${note.category}`,
    note.summary && `📝 ${note.summary}`,
    note.details?.need && `Need: ${note.details.need}`,
    note.details?.description && `Description: ${note.details.description}`,
    note.details?.username && `Username: ${note.details.username}`,
    note.details?.phone_number && `Phone: ${note.details.phone_number}`,
    ...Object.entries(note.details?.attributes ?? {}).map(
      ([key, value]) => value != null && `${key}: ${value}`,
    ),
  ].filter(Boolean);

  return `${fields.join("\n")}\n\n💬 Message:\n${note.content}`;
}

function formatNote(note: NoteRow): string {
  const shortId = note.id.slice(0, 8);
  const date = new Date(note.created_at).toLocaleDateString("fa-IR", {
    month: "short",
    day: "numeric",
  });
  const summary = note.summary ? ` — ${note.summary}` : "";
  const details = [
    note.details?.need && `Need: ${note.details.need}`,
    note.details?.description && `Description: ${note.details.description}`,
    note.details?.username && `Username: ${note.details.username}`,
    note.details?.phone_number && `Phone: ${note.details.phone_number}`,
    ...Object.entries(note.details?.attributes ?? {}).map(
      ([key, value]) => value != null && `${key}: ${value}`,
    ),
  ].filter(Boolean);
  const detailsText = details.length > 0 ? `\n${details.join(" | ")}` : "";
  return `\`${shortId}\` [${note.category}]${summary}\n${note.content.slice(0, 80)}${note.content.length > 80 ? "…" : ""}${detailsText}\n_${date}_`;
}
