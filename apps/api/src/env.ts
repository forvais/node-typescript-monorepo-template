import * as zErr from 'zod-validation-error';
import z from 'zod';

const NODE_ENV = ['production', 'development'] as const;

const DEFAULT_NODE_ENV: typeof NODE_ENV[number] = 'production';

const DEFAULT_API_HOST = '0.0.0.0';
const DEFAULT_API_PORT = 3000;

const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENV).default(DEFAULT_NODE_ENV),

  API_HOST: z.string().url().or(z.string().ip()).default(DEFAULT_API_HOST),
  API_PORT: z.number({ coerce: true }).default(DEFAULT_API_PORT),
});

export const env = envSchema.parse(process.env);
