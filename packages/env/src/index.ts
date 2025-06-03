import z from 'zod';

const NODE_ENV_ENUM = ['production', 'development', 'test'] as const;
const DEFAULT_NODE_ENV: typeof NODE_ENV_ENUM[number] = 'production';

const DEFAULT_HOST = '0.0.0.0';

const DEFAULT_API_HOST = DEFAULT_HOST;
const DEFAULT_API_PORT = 3000;

const DEFAULT_WEB_HOST = DEFAULT_HOST;
const DEFAULT_WEB_PORT = 8080;

/**
 * Schema to transform a 'true' or 'false' string into a boolean.
 *
 * NOTE: This schema is case sensitive, entries like 'True' are invalid.
 */
const booleanStringSchema = z.union([
  z.literal('true').transform(() => true),
  z.literal('false').transform(() => false),
]);

const env = z.object({
  NODE_ENV: z.enum(NODE_ENV_ENUM).default(DEFAULT_NODE_ENV),

  API_HOST: z.string().ip().or(z.string().url()).default(DEFAULT_API_HOST),
  API_PORT: z.number({ coerce: true }).min(1024).max(65535).default(DEFAULT_API_PORT),

  WEB_HOST: z.string().ip().or(z.string().url()).default(DEFAULT_WEB_HOST),
  WEB_PORT: z.number({ coerce: true }).min(1024).max(65535).default(DEFAULT_WEB_PORT),
}).parse(process.env);

const IS_DEV = env.NODE_ENV === 'development';
const PROXY_API = `http://${env.API_HOST}:${env.API_PORT}`;

export default {
  ...env,
  IS_DEV,
  PROXY_API,
};
