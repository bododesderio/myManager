import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { AiRepository } from './ai.repository';

@Injectable()
export class AiService {
  private readonly anthropic: Anthropic | null;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly repository: AiRepository,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    } else {
      this.anthropic = null;
      this.logger.warn('ANTHROPIC_API_KEY not set — AI features are disabled');
    }
  }

  private ensureAiConfigured(): void {
    if (!this.anthropic) {
      throw new BadRequestException('AI features are not configured. Set ANTHROPIC_API_KEY to enable.');
    }
  }

  async generateCaption(userId: string, data: {
    workspaceId: string; platform: string; topic: string; tone?: string;
    keywords?: string[]; maxLength?: number; language?: string;
  }) {
    this.ensureAiConfigured();
    await this.checkCredits(userId, data.workspaceId);

    const platformLimits: Record<string, number> = {
      facebook: 63206, instagram: 2200, x: 280, linkedin: 3000,
      tiktok: 2200, threads: 500, pinterest: 500,
    };
    const maxChars = data.maxLength || platformLimits[data.platform] || 2200;
    const tone = data.tone || 'professional';
    const language = data.language || 'English';

    const message = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Write a social media caption for ${data.platform}.
Topic: ${data.topic}
Tone: ${tone}
Language: ${language}
Max characters: ${maxChars}
${data.keywords?.length ? `Include keywords: ${data.keywords.join(', ')}` : ''}

Write only the caption text. Include relevant emojis. Do not include hashtags separately.`,
      }],
    });

    const caption = (message.content[0] as { type: string; text: string }).text;
    await this.repository.logCreditUsage(userId, data.workspaceId, 'caption_generate', 1);

    return { caption, creditsUsed: 1, platform: data.platform };
  }

  async rewriteCaption(userId: string, data: {
    workspaceId: string; caption: string; targetTone: string; platform: string;
  }) {
    this.ensureAiConfigured();
    await this.checkCredits(userId, data.workspaceId);

    const message = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Rewrite this ${data.platform} caption in a ${data.targetTone} tone. Keep the same meaning and key points. Only output the rewritten caption.

Original: ${data.caption}`,
      }],
    });

    const rewritten = (message.content[0] as { type: string; text: string }).text;
    await this.repository.logCreditUsage(userId, data.workspaceId, 'caption_rewrite', 1);

    return { caption: rewritten, creditsUsed: 1 };
  }

  async translateCaption(userId: string, data: {
    workspaceId: string; caption: string; targetLanguage: string;
  }) {
    this.ensureAiConfigured();
    await this.checkCredits(userId, data.workspaceId);

    const message = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Translate this social media caption to ${data.targetLanguage}. Preserve emojis, hashtags, and mentions. Only output the translation.

${data.caption}`,
      }],
    });

    const translated = (message.content[0] as { type: string; text: string }).text;
    await this.repository.logCreditUsage(userId, data.workspaceId, 'caption_translate', 1);

    return { caption: translated, creditsUsed: 1 };
  }

  async suggestHashtags(userId: string, data: {
    workspaceId: string; caption: string; platform: string; count?: number;
  }) {
    this.ensureAiConfigured();
    await this.checkCredits(userId, data.workspaceId);
    const count = data.count || 10;

    const message = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Suggest ${count} relevant hashtags for this ${data.platform} post. Return only hashtags separated by spaces, one per line. Mix popular and niche hashtags.

Caption: ${data.caption}`,
      }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    const hashtags = raw.split(/[\n\s]+/).filter((h: string) => h.startsWith('#'));
    await this.repository.logCreditUsage(userId, data.workspaceId, 'hashtag_suggest', 1);

    return { hashtags, creditsUsed: 1 };
  }

  async analyzeImage(userId: string, data: {
    workspaceId: string; imageUrl: string; platform: string;
  }) {
    this.ensureAiConfigured();
    await this.checkCredits(userId, data.workspaceId);

    const message = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image' as const, source: { type: 'url' as const, url: data.imageUrl } } as any,
          { type: 'text', text: `Analyze this image for a ${data.platform} post. Provide: 1) A brief description 2) Three caption suggestions 3) Relevant hashtags. Format as JSON with keys: description, captions (array), hashtags (array).` },
        ],
      }],
    });

    const analysis = (message.content[0] as { type: string; text: string }).text;
    await this.repository.logCreditUsage(userId, data.workspaceId, 'image_analyze', 2);

    try {
      return { analysis: JSON.parse(analysis), creditsUsed: 2 };
    } catch {
      return { analysis: { raw: analysis }, creditsUsed: 2 };
    }
  }

  async generateImage(userId: string, data: {
    workspaceId: string; prompt: string; style?: string; aspectRatio?: string;
  }) {
    await this.checkCredits(userId, data.workspaceId, 5);

    const replicateApiKey = this.configService.get('REPLICATE_API_KEY');
    if (!replicateApiKey) {
      throw new BadRequestException('Image generation is not configured. Set REPLICATE_API_KEY to enable.');
    }

    const response = await axios.post('https://api.replicate.com/v1/predictions', {
      version: 'stability-ai/stable-diffusion',
      input: {
        prompt: data.prompt,
        negative_prompt: 'blurry, low quality, distorted',
        width: data.aspectRatio === '9:16' ? 768 : 1024,
        height: data.aspectRatio === '9:16' ? 1344 : 1024,
      },
    }, {
      headers: { Authorization: `Token ${replicateApiKey}` },
    });

    await this.repository.logCreditUsage(userId, data.workspaceId, 'image_generate', 5);

    return { predictionId: response.data.id, status: response.data.status, creditsUsed: 5 };
  }

  async getCredits(userId: string, _workspaceId: string) {
    const used = await this.repository.getMonthlyUsage(userId);
    const limit = await this.repository.getCreditLimit(userId);
    return { used, limit, remaining: Math.max(0, limit - used) };
  }

  private async checkCredits(userId: string, workspaceId: string, required: number = 1) {
    const used = await this.repository.getMonthlyUsage(userId);
    const limit = await this.repository.getCreditLimit(userId);
    if (used + required > limit) {
      throw new BadRequestException('AI credit limit reached. Upgrade your plan for more credits.');
    }
  }
}
