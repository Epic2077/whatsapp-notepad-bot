import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { categorizeNote } from "./llm";
import { saveNote } from "./db";
import { handleCommand } from "./commands";
import { MESSAGES } from "./messages";

export function createBot(): Client {
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    },
  });

  client.on("qr", (qr) => {
    console.log(
      "📱 Scan this QR code with WhatsApp (Settings > Linked Devices):",
    );
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log(
      "✅ WhatsApp bot is ready. Send yourself a message to save a note.",
    );
  });

  client.on("authenticated", () => console.log("🔐 Authenticated."));
  client.on("auth_failure", (msg) => console.error("❌ Auth failure:", msg));
  client.on("disconnected", (reason) =>
    console.warn("⚠️ Disconnected:", reason),
  );

  client.on("message_create", async (message: Message) => {
    console.log("[DEBUG] message_create:", {
      from: message.from,
      to: message.to,
      fromMe: message.fromMe,
      type: message.type,
      body: message.body?.slice(0, 60),
      wid: client.info?.wid?._serialized,
      fromSerialized: message.from,
    });

    const myWid = client.info?.wid?.user;
    const fromUser = message.from.split("@")[0];
    const toUser = message.to.split("@")[0];
    const toDomain = message.to.split("@")[1] ?? "";

    // WhatsApp may use a different LID for the self-chat recipient.
    const recipient = await client.getContactById(message.to).catch(() => null);
    const isSelfChat =
      message.fromMe &&
      (message.from === message.to || recipient?.isMe === true);

    if (!isSelfChat) {
      console.log("[DEBUG] Filtered out: not self message", {
        isSelfChat,
        fromUser,
        toUser,
        myWid,
        toDomain,
        recipientIsMe: recipient?.isMe,
      });
      return;
    }

    // Ignore bot's own replies (they start with loading/result emojis)
    const body = message.body ?? "";
    if (
      body.startsWith("⏳") ||
      body.startsWith("📝") ||
      body.startsWith("✅") ||
      body.startsWith("❌") ||
      body.startsWith("🤖")
    ) {
      console.log("[DEBUG] Filtered out: bot reply");
      return;
    }

    const content = message.body.trim();
    console.log("[DEBUG] Processing message:", { content, type: message.type });
    if (!content) return;

    const loadingMsg = await message.reply(MESSAGES.loading).catch(() => null);

    try {
      if (content.startsWith("/")) {
        console.log("[DEBUG] Handling command:", content);
        const reply = await handleCommand(content);
        if (loadingMsg) {
          await loadingMsg
            .edit(MESSAGES.commandExecuted(reply))
            .catch(() => message.reply(reply));
        } else {
          await message.reply(reply);
        }
        console.log(`💬 Command executed: ${content.slice(0, 40)}`);
        return;
      }

      console.log("[DEBUG] Saving as note");
      const note = await categorizeNote(content);
      await saveNote(content, note);
      const reply = MESSAGES.noteSaved(note.category, note.summary);
      if (loadingMsg) {
        await loadingMsg.edit(reply).catch(() => message.reply(reply));
      } else {
        await message.reply(reply);
      }
      console.log(`📝 Saved [${note.category}] ${note.summary}`);
    } catch (err) {
      console.error("❌ Failed to process note:", err);
      const errorMsg = MESSAGES.noteSaveFailed;
      if (loadingMsg) {
        await loadingMsg.edit(errorMsg).catch(() => message.reply(errorMsg));
      } else {
        await message.reply(errorMsg);
      }
    }
  });

  return client;
}
