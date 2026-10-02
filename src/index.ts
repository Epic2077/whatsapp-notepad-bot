import { createBot } from './bot';

const client = createBot();

client.initialize().catch((err) => {
  console.error('Failed to initialize WhatsApp client:', err);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    console.log(`\nReceived ${signal}, shutting down...`);
    await client.destroy().catch(() => {});
    process.exit(0);
  });
}
