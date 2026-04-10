import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from '../dto/settings.dto';
import OpenAI from 'openai';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.appSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      settings = await this.prisma.appSettings.create({
        data: {
          id: 'singleton',
        },
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    return this.prisma.appSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        ...dto,
      },
      update: dto,
    });
  }

  async testLlm() {
    const settings = await this.getSettings();

    if (!settings.llmApiKey) {
      throw new Error('LLM API key not configured');
    }

    try {
      const client = new OpenAI({
        baseURL: settings.llmBaseUrl,
        apiKey: settings.llmApiKey,
      });

      const response = await client.chat.completions.create({
        model: settings.llmModel,
        messages: [
          {
            role: 'user',
            content: 'Reply with just "OK" if you can read this.',
          },
        ],
        max_tokens: 10,
        temperature: 0,
      });

      const reply = response.choices[0]?.message?.content || '';

      return {
        success: true,
        message: 'LLM connection successful',
        response: reply,
        model: settings.llmModel,
      };
    } catch (error) {
      return {
        success: false,
        message: 'LLM connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
