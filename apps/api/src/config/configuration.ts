import * as Joi from 'joi';

export default () => ({
  app: {
    port: parseInt(process.env.APP_PORT || '4000', 10),
    url: process.env.APP_URL || 'http://localhost:4000',
    webUrl: process.env.WEB_URL || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@example.com',
  },
  llm: {
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL || 'gpt-4o',
  },
});

export const validationSchema = Joi.object({
  // App
  APP_PORT: Joi.number().default(4000),
  APP_URL: Joi.string().default('http://localhost:4000'),
  WEB_URL: Joi.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  // SMTP
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM: Joi.string().default('noreply@example.com'),

  // LLM
  LLM_BASE_URL: Joi.string().default('https://api.openai.com/v1'),
  LLM_API_KEY: Joi.string().required(),
  LLM_MODEL: Joi.string().default('gpt-4o'),
});
