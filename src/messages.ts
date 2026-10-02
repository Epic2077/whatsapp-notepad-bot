export const MESSAGES = {
  loading: "⏳ در حال پردازش...",
  noteSaved: (category: string, summary: string) =>
    `📝 *ذخیره شد* [${category}]\n${summary}`,
  noteSaveFailed: "❌ خطا در ذخیره یادداشت. لطفاً لاگ‌ها را بررسی کنید.",
  commandExecuted: (reply: string) => reply,
  commandFailed: "❌ خطا در اجرای دستور. لطفاً لاگ‌ها را بررسی کنید.",
  help: `🤖 *دستورات نوت‌پد واتس‌اپ*

• /help — نمایش این پیام راهنما
• /list [دسته] — نمایش ۱۰ یادداشت اخیر (اختیاری: فیلتر بر اساس دسته)
• /message <id> — نمایش کامل پیام و اطلاعات استخراج‌شده
• /categories — لیست تمام دسته‌ها
• /add <نام> — اضافه کردن دسته جدید
• /remove <نام> — حذف یک دسته
• /delete <id> — حذف یادداشت با پیشوند شناسه
• /count — نمایش تعداد کل یادداشت‌ها

📝 برای ذخیره یادداشت، فقط  \dپیام بفرستید!`,
  categoriesList: (categories: string[]) =>
    `📂 *دسته‌ها (${categories.length})*\n\n${categories.map((c) => `• ${c}`).join("\n")}`,
  categoryAdded: (name: string) => `✅ دسته اضافه شد: *${name.trim()}*`,
  categoryAddFailed: (reason: string) => `❌ ${reason}`,
  categoryRemoved: (name: string) => `✅ دسته حذف شد: *${name.trim()}*`,
  categoryRemoveFailed: (reason: string) => `❌ ${reason}`,
  notesList: (count: number, category?: string) =>
    `📝 *آخرین ${count} یادداشت*${category ? ` در *${category}*` : ""}`,
  messageUsage: "فرمت استفاده: /message <id>",
  messageNotFound: (reason: string) => `❌ ${reason}`,
  noNotes: (category?: string) =>
    category
      ? `یادداشتی در *${category}* یافت نشد.`
      : "هنوز یادداشتی وجود ندارد. چیزی بفرستید!",
  noteDeleted: (id: string) => `✅ یادداشت \`${id}\` حذف شد.`,
  noteDeleteFailed: (reason: string) => `❌ ${reason}`,
  totalNotes: (count: number) => `📊 تعداد کل یادداشت‌ها: *${count}*`,
  unknownCommand: "دستور ناشناخته. برای دیدن لیست دستورات /help را بفرستید.",
} as const;
