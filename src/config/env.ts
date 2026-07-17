import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log("ENV FILE PATH:", path.resolve(process.cwd(), '.env'));
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("MONGO_URI:", process.env.MONGO_URI);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/weventurehub'),
  JWT_ACCESS_SECRET: z.string().default('default-super-secure-access-secret-minimum-32-chars-long'),
  JWT_REFRESH_SECRET: z.string().default('default-super-secure-refresh-secret-minimum-32-chars-long'),
  JWT_ACCESS_EXaPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  GEMINI_API_KEY: z.string().optional(),
  APP_URL: z.string().default('http://localhost:3000'),
  CHAPA_SECRET_KEY: z.string().default('CHAPA_SEC_KEY_MOCK_SECRET_12345'),
  CHAPA_WEBHOOK_SECRET: z.string().default('mock_webhook_secret_key_67890'),
  SMTP_HOST: z.string().default('smtp.mailtrap.io'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('WeVentureHub <noreply@weventurehub.com>'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variable configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
