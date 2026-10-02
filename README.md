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

---

## 🛠️ Tech Stack

- **Language:** TypeScript / Node.js
- **WhatsApp Automation:** [`whatsapp-web.js`](https://www.google.com/search?q=https://github.com/pedroslopez/whatsapp-web.js)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **AI Engine:** OpenAI SDK (configured for DeepSeek or OpenAI GPT-4o-mini)
- **Authentication & Session:** Puppeteer + LocalAuth

---

## 📋 Prerequisites

Before running the bot, ensure you have:

1. **Node.js** (v18 or higher) & **npm** installed.
2. A **Supabase** account with a project created.
3. An API key from **OpenAI** or **DeepSeek**.
4. A smartphone with WhatsApp installed.

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

```

---

## 🏃 Usage

Start the bot development server:

```bash
npm run dev

```

1. **Scan the QR Code:** On the first launch, a QR code will render in your terminal. Open WhatsApp on your phone, go to **Settings > Linked Devices**, and scan it.
2. **Send a Note:** Open your "Message Yourself" chat on WhatsApp and send any text:

   > _"Remember to pay electricity bill by Friday"_

3. **Receive Confirmation:** The bot will process the note with AI, insert it into Supabase, and react to your message with a **✅**.

### 🤖 Bot Commands

Send these commands in your self-chat to manage notes and categories:

| Command            | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `/help`            | Show all available commands                          |
| `/list [category]` | Show last 10 notes (optionally filtered by category) |
| `/message <id>`    | Show the full original message and extracted details |
| `/categories`      | List all active categories                           |
| `/add <name>`      | Add a new category                                   |
| `/remove <name>`   | Remove a category (except `Other`)                   |
| `/delete <id>`     | Delete a note by its short ID prefix                 |
| `/count`           | Show total number of saved notes                     |

---

## 📂 Database Schema Overview

| Field        | Type        | Description                                              |
| ------------ | ----------- | -------------------------------------------------------- |
| `id`         | `UUID`      | Unique note identifier                                   |
| `content`    | `TEXT`      | Raw text of the WhatsApp message                         |
| `category`   | `TEXT`      | AI-generated category tag (`Todo`, `Idea`, `Link`, etc.) |
| `summary`    | `TEXT`      | AI-generated 3–5 word summary                            |
| `details`    | `JSONB`     | Extracted need, description, username, phone, and facts  |
| `created_at` | `TIMESTAMP` | UTC timestamp of when the note was saved                 |

---

## ☁️ Deployment Notes

Because `whatsapp-web.js` runs a headless Chromium browser (Puppeteer) to keep the web socket alive, **it cannot be hosted on serverless platforms like Vercel or Netlify**.

- **Recommended Hosts:** Render, Railway, Liara, Docker, or any Linux VPS (DigitalOcean, AWS EC2).
- **Session Storage:** Ensure your deployment host attaches a persistent disk/volume mounted to `.wwebjs_auth` so you don't have to re-scan the QR code every time the server restarts.
