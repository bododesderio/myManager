import { Controller, Post, Body, Req, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AiService } from './ai.service';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('caption/generate')
  @ApiOperation({ summary: 'Generate AI caption for a post' })
  async generateCaption(@Req() req: Request, @Body() body: {
    workspaceId: string; platform: string; topic: string; tone?: string;
    keywords?: string[]; maxLength?: number; language?: string;
  }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.aiService.generateCaption(userId, body);
  }

  @Post('caption/rewrite')
  @ApiOperation({ summary: 'Rewrite existing caption in a different tone' })
  async rewriteCaption(@Req() req: Request, @Body() body: {
    workspaceId: string; caption: string; targetTone: string; platform: string;
  }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.aiService.rewriteCaption(userId, body);
  }

  @Post('caption/translate')
  @ApiOperation({ summary: 'Translate a caption to another language' })
  async translateCaption(@Req() req: Request, @Body() body: {
    workspaceId: string; caption: string; targetLanguage: string;
  }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.aiService.translateCaption(userId, body);
  }

  @Post('hashtags/suggest')
  @ApiOperation({ summary: 'Suggest hashtags based on caption content' })
  async suggestHashtags(@Req() req: Request, @Body() body: {
    workspaceId: string; caption: string; platform: string; count?: number;
  }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.aiService.suggestHashtags(userId, body);
  }

  @Post('image/analyze')
  @ApiOperation({ summary: 'Analyze an image and suggest captions' })
  async analyzeImage(@Req() req: Request, @Body() body: {
    workspaceId: string; imageUrl: string; platform: string;
  }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.aiService.analyzeImage(userId, body);
  }

  @Post('image/generate')
  @ApiOperation({ summary: 'Generate an image from text prompt' })
  async generateImage(@Req() req: Request, @Body() body: {
    workspaceId: string; prompt: string; style?: string; aspectRatio?: string;
  }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.aiService.generateImage(userId, body);
  }

  @Get('credits')
  @ApiOperation({ summary: 'Get remaining AI credits' })
  async getCredits(@Req() req: Request, @Query('workspaceId') workspaceId: string) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.aiService.getCredits(userId, workspaceId);
  }
}
