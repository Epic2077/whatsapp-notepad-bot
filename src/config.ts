import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  supabaseUrl: required('SUPABASE_URL'),
  supabaseKey: required('SUPABASE_KEY'),
  llmApiKey: required('LLM_API_KEY'),
  llmBaseUrl: process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1',
  llmModel: process.env.LLM_MODEL ?? 'gpt-4o-mini',
};
