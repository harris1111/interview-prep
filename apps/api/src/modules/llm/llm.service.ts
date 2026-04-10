import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmOptions {
  temperature?: number;
  maxTokens?: number;
}

interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  systemPrompt: string;
}

@Injectable()
export class LlmService {
  private configCache: { config: LlmConfig; expires: number } | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  clearCache() {
    this.configCache = null;
  }

  async getConfig(): Promise<LlmConfig> {
    const now = Date.now();

    if (this.configCache && this.configCache.expires > now) {
      return this.configCache.config;
    }

    const settings = await this.prisma.appSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      throw new InternalServerErrorException('App settings not configured');
    }

    if (!settings.llmApiKey) {
      throw new InternalServerErrorException('LLM API key not configured');
    }

    const config: LlmConfig = {
      baseUrl: settings.llmBaseUrl,
      apiKey: settings.llmApiKey,
      model: settings.llmModel,
      temperature: settings.llmTemperature,
      systemPrompt: settings.systemPrompt,
    };

    this.configCache = {
      config,
      expires: now + this.CACHE_TTL,
    };

    return config;
  }

  async chatCompletion(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): Promise<string> {
    const config = await this.getConfig();
    const client = new OpenAI({
      baseURL: config.baseUrl,
      apiKey: config.apiKey,
      timeout: 120_000, // 2 minutes
    });

    try {
      const response = await client.chat.completions.create({
        model: config.model,
        messages,
        temperature: options?.temperature ?? config.temperature,
        max_tokens: options?.maxTokens,
      });

      return response.choices[0]?.message?.content || '';
    } catch (err) {
      const error = err as Error;
      throw new InternalServerErrorException(
        `LLM API error: ${error.message}`,
      );
    }
  }

  async *streamChatCompletion(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): AsyncGenerator<string> {
    const config = await this.getConfig();
    const client = new OpenAI({
      baseURL: config.baseUrl,
      apiKey: config.apiKey,
      timeout: 120_000, // 2 minutes
    });

    try {
      const stream = await client.chat.completions.create({
        model: config.model,
        messages,
        temperature: options?.temperature ?? config.temperature,
        max_tokens: options?.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (err) {
      const error = err as Error;
      throw new InternalServerErrorException(
        `LLM streaming error: ${error.message}`,
      );
    }
  }

  /**
   * Extract JSON from a response that may be wrapped in markdown code blocks
   */
  private extractJson(text: string): string {
    // Try to extract from ```json ... ``` or ``` ... ```
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    // Try to find JSON object/array directly
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    return text.trim();
  }

  async parseJsonResponse<T = any>(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): Promise<T> {
    let response = await this.chatCompletion(messages, options);

    try {
      return JSON.parse(this.extractJson(response));
    } catch (error) {
      // Retry with explicit JSON instruction
      const retryMessages = [
        ...messages,
        {
          role: 'user' as const,
          content:
            'Please respond ONLY with valid JSON, no markdown code blocks or additional text.',
        },
      ];

      response = await this.chatCompletion(retryMessages, options);

      try {
        return JSON.parse(this.extractJson(response));
      } catch (retryError) {
        throw new InternalServerErrorException(
          'Failed to parse LLM response as JSON',
        );
      }
    }
  }
}
