# WhatsApp AI Notepad Bot

An intelligent, self-hosted WhatsApp notepad bot built with **Node.js** and **TypeScript**. Send notes, ideas, links, or to-dos to your own WhatsApp account, and the bot will automatically categorize, summarize, and save them to a **Supabase** database.

---

## ✨ Features

- 🤖 **Automatic AI Categorization:** Analyzes raw incoming messages and tags them into categories like `Todo`, `Idea`, `Link`, `Finance`, or `Snippet`.
- 📝 **Smart Summarization:** Generates concise 3–5 word summaries for effortless note scanning.
- 📲 **Native WhatsApp Integration:** Built using `whatsapp-web.js`—no WhatsApp Business API key or approval needed.
- 🔒 **Self-Message Isolation:** Only listens and responds to messages sent _from you to yourself_, leaving your personal chats completely untouched.
- ⚡ **Visual Reactions:** Drops a ✅ emoji reaction on your message once successfully indexed into your database, or ❌ if an error occurs.
- 🗄️ **Persistent Cloud Database:** Stores structured JSON notes in a hosted Supabase PostgreSQL table.
- 🔐 **Persistent Authentication:** Uses `LocalAuth` to store session cookies, requiring a QR code scan only on initial startup.
- 🏷️ **Custom Categories:** Add/remove categories dynamically via `/add` and `/remove` commands.
- 🔍 **Rich Query Commands:** List, search, view full details, and delete notes by short ID prefix.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Language** | TypeScript 5.6+ | Type-safe development |
| **WhatsApp** | `whatsapp-web.js` 1.34+ | WhatsApp Web automation via Puppeteer |
| **Browser** | Puppeteer 19+ | Headless Chromium for WebSocket connection |
| **Database** | Supabase (PostgreSQL) | Cloud database with realtime & auth |
| **AI/ML** | OpenAI SDK 4.67+ | LLM integration (DeepSeek / GPT-4o-mini) |
| **Auth** | `LocalAuth` + Puppeteer | Persistent session storage |
| **QR Code** | `qrcode-terminal` | Terminal-based QR rendering |
| **Config** | `dotenv` | Environment variable management |
| **Dev Tools** | `tsx`, `typescript` | TypeScript execution & compilation |

### Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  WhatsApp   │────▶│  whatsapp-   │────▶│  Node.js    │
│  Web Client │     │  web.js      │     │  Process    │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌──────────────┐     ┌──────▼──────┐
                    │  Supabase    │◀────│  Database   │
                    │  (PostgreSQL)│     │  Operations │
                    └──────────────┘     └─────────────┘
                           ▲
                    ┌──────┴──────┐
                    │   OpenAI    │
                    │   / DeepSeek│
                    │   (LLM)     │
                    └─────────────┘
```

---

## 📋 Prerequisites

Before running the bot, ensure you have:

1. **Node.js** (v18 or higher) & **npm** installed.
2. A **Supabase** account with a project created.
3. An API key from **OpenAI** or **DeepSeek**.
4. A smartphone with WhatsApp installed.
5. **Google Chrome** installed (for Puppeteer).

---

## 🚀 Getting Started

### 1. Database Setup

Create the required tables in your Supabase SQL Editor:

```sql
create table notes (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  category text not null,
  summary text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed the default categories
insert into categories (name) values
  ('Finance'), ('Idea'), ('Link'), ('Other'), ('Snippet'), ('Todo');
```

If the `notes` table already exists, add the structured extraction column once:

```sql
alter table notes
add column if not exists details jsonb not null default '{}'::jsonb;
```

### 2. Installation

Clone your project repository and install dependencies:

```bash
# Install dependencies
npm install

# Build the TypeScript project
npm run build
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-role-key
LLM_API_KEY=your-openai-or-deepseek-api-key

# Optional: Use DeepSeek instead of OpenAI
# LLM_BASE_URL=https://api.deepseek.com/v1
# LLM_MODEL=deepseek-chat

# Optional: Use a different OpenAI model
# LLM_MODEL=gpt-4o-mini
```

---

## 🏃 Usage

### Start the Bot

```bash
# Development mode (with hot reload via tsx)
npm run dev

# Production mode (compiled JS)
npm run build && npm start
```

### First Run - QR Code Authentication

1. **Scan the QR Code:** On the first launch, a QR code will render in your terminal. Open WhatsApp on your phone, go to **Settings > Linked Devices**, and scan it.
2. **Session Persistence:** Authentication cookies are saved to `.wwebjs_auth/` — you won't need to re-scan unless this folder is deleted.

### Saving Notes

Open your "Message Yourself" chat on WhatsApp and send any text:

> _"Remember to pay electricity bill by Friday"_

The bot will:
1. Process the note with AI
2. Insert it into Supabase
3. Reply with a confirmation message
4. React to your message with **✅** (success) or **❌** (failure)

---

## 🤖 Bot Commands

Send these commands in your self-chat to manage notes and categories:

| Command | Description | Example |
|---------|-------------|---------|
| `/help` \| `/start` | Show all available commands | `/help` |
| `/list [category]` | Show last 10 notes (optionally filtered) | `/list Todo` |
| `/message <id>` | Show full original message + extracted details | `/message a1b2c3d4` |
| `/categories` | List all active categories | `/categories` |
| `/add <name>` | Add a new category | `/add Travel` |
| `/remove <name>` | Remove a category (except `Other`) | `/remove Travel` |
| `/delete <id>` | Delete a note by short ID prefix | `/delete a1b2c3d4` |
| `/count` | Show total number of saved notes | `/count` |

### Command Output Examples

**`/list`**
```
📋 Your notes (10):

`a1b2c3d4` [Todo] — Pay electricity bill
Remember to pay electricity bill by Friday
Need: Pay electricity bill | Description: Electricity bill due Friday
_Apr 15_

`e5f6g7h8` [Idea] — Build a habit tracker
Idea: Build a habit tracker app with streak counting
Description: Habit tracker with streak counting
_Apr 14_
```

**`/message a1b2c3d4`**
```
🆔 a1b2c3d4-e5f6-7890-abcd-ef1234567890
📂 Todo
📝 Pay electricity bill
Need: Pay electricity bill
Description: Electricity bill due Friday
Username: null
Phone: null

💬 Message:
Remember to pay electricity bill by Friday
```

---

## 📂 Database Schema

### `notes` table

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Unique note identifier |
| `content` | `TEXT` | Raw text of the WhatsApp message |
| `category` | `TEXT` | AI-generated category tag |
| `summary` | `TEXT` | AI-generated 3–5 word summary |
| `details` | `JSONB` | Extracted: need, description, username, phone, attributes |
| `created_at` | `TIMESTAMPTZ` | UTC timestamp of when the note was saved |

### `details` JSONB Structure

```json
{
  "need": "Pay electricity bill",
  "description": "Electricity bill due Friday",
  "username": null,
  "phone_number": null,
  "attributes": {
    "amount": 120,
    "currency": "USD",
    "due_date": "2026-04-18"
  }
}
```

### `categories` table

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Unique category identifier |
| `name` | `TEXT` | Category name (unique) |
| `created_at` | `TIMESTAMPTZ` | Creation timestamp |

---

## 🧠 AI Categorization Details

The bot uses an LLM (OpenAI GPT-4o-mini or DeepSeek) to analyze each message and extract:

1. **Category** — One of your defined categories (default: `Todo`, `Idea`, `Link`, `Finance`, `Snippet`, `Other`)
2. **Summary** — 3-5 word headline
3. **Details** — Structured extraction:
   - `need` — What is wanted/offered
   - `description` — Concise factual summary
   - `username` — Mentioned usernames
   - `phone_number` — Phone numbers in message
   - `attributes` — Domain-specific facts (price, brand, model, location, etc.)

### System Prompt (Simplified)

```text
You categorize and extract facts from personal notes.
Reply with ONLY JSON:
{
  "category": "<Todo|Idea|Link|Finance|Snippet|Other>",
  "summary": "<3-5 words>",
  "details": {
    "need": "<what is wanted, or null>",
    "description": "<factual description, or null>",
    "username": "<username, or null>",
    "phone_number": "<phone, or null>",
    "attributes": {"<fact>": "<value>"}
  }
}
```

---

## ☁️ Deployment Notes

Because `whatsapp-web.js` runs a headless Chromium browser (Puppeteer) to keep the WebSocket alive, **it cannot be hosted on serverless platforms like Vercel or Netlify**.

### Recommended Hosts

| Platform | Notes |
|----------|-------|
| **Render** | Free tier available, persistent disk support |
| **Railway** | Easy Docker deploy, persistent volumes |
| **Liara** | Iranian cloud provider, good for local users |
| **Docker** | Full control, runs anywhere |
| **Linux VPS** | DigitalOcean, AWS EC2, Hetzner, etc. |

### Docker Example

```dockerfile
FROM node:20-alpine

# Install Chrome dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY .env .env

# Persistent auth volume
VOLUME ["/app/.wwebjs_auth"]

CMD ["node", "dist/index.js"]
```

### Session Persistence

Ensure your deployment host attaches a persistent disk/volume mounted to `.wwebjs_auth` so you don't have to re-scan the QR code every time the server restarts.

---

## 🔧 Configuration Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_KEY` | ✅ | — | Supabase anon/service role key |
| `LLM_API_KEY` | ✅ | — | OpenAI or DeepSeek API key |
| `LLM_BASE_URL` | ❌ | `https://api.openai.com/v1` | LLM API base URL |
| `LLM_MODEL` | ❌ | `gpt-4o-mini` | Model to use |

---

## 📦 Project Structure

```
whatsapp-notepad-bot/
├── src/
│   ├── index.ts          # Entry point
│   ├── bot.ts            # WhatsApp client & event handlers
│   ├── llm.ts            # AI categorization & extraction
│   ├── db.ts             # Supabase database operations
│   ├── commands.ts       # Bot command handlers
│   ├── categories.ts     # Category management
│   ├── config.ts         # Environment config
│   └── messages.ts       # Response templates
├── dist/                 # Compiled output (after build)
├── .wwebjs_auth/         # WhatsApp session (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find Chrome" | Set `PUPPETEER_EXECUTABLE_PATH` in bot.ts or install Chrome |
| QR code not scanning | Ensure phone has internet; try regenerating with Ctrl+C restart |
| "Auth failure" | Delete `.wwebjs_auth/` folder and re-scan |
| Notes not saving | Check Supabase credentials & table permissions |
| LLM errors | Verify API key, base URL, and model name |

---

## 📄 License

MIT License — feel free to use, modify, and distribute.