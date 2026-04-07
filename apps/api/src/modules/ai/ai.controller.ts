import { Controller, Post, Body, Req, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { getRequestUserId, getRequestWorkspaceId } from '../../common/http/request-context';
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
    return this.aiService.generateCaption(getRequestUserId(req), {
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
  }

  @Post('caption/rewrite')
  @ApiOperation({ summary: 'Rewrite existing caption in a different tone' })
  async rewriteCaption(@Req() req: Request, @Body() body: {
    workspaceId: string; caption: string; targetTone: string; platform: string;
  }) {
    return this.aiService.rewriteCaption(getRequestUserId(req), {
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
  }

  @Post('grammar/check')
  @ApiOperation({ summary: 'Check text grammar via LanguageTool' })
  async checkGrammar(@Body() body: { text: string; language?: string }) {
    return this.aiService.checkGrammar(body.text, body.language);
  }

  @Post('caption/translate')
  @ApiOperation({ summary: 'Translate a caption to another language' })
  async translateCaption(@Req() req: Request, @Body() body: {
    workspaceId: string; caption: string; targetLanguage: string;
  }) {
    return this.aiService.translateCaption(getRequestUserId(req), {
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
  }

  @Post('hashtags/suggest')
  @ApiOperation({ summary: 'Suggest hashtags based on caption content' })
  async suggestHashtags(@Req() req: Request, @Body() body: {
    workspaceId: string; caption: string; platform: string; count?: number;
  }) {
    return this.aiService.suggestHashtags(getRequestUserId(req), {
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
  }

  @Post('image/analyze')
  @ApiOperation({ summary: 'Analyze an image and suggest captions' })
  async analyzeImage(@Req() req: Request, @Body() body: {
    workspaceId: string; imageUrl: string; platform: string;
  }) {
    return this.aiService.analyzeImage(getRequestUserId(req), {
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
  }

  @Post('image/generate')
  @ApiOperation({ summary: 'Generate an image from text prompt' })
  async generateImage(@Req() req: Request, @Body() body: {
    workspaceId: string; prompt: string; style?: string; aspectRatio?: string;
  }) {
    return this.aiService.generateImage(getRequestUserId(req), {
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
  }

  @Get('credits')
  @ApiOperation({ summary: 'Get remaining AI credits' })
  async getCredits(@Req() req: Request, @Query('workspaceId') workspaceId: string) {
    return this.aiService.getCredits(getRequestUserId(req), workspaceId);
  }

  @Get('capabilities')
  @ApiOperation({ summary: 'Probe which AI features are available (never throws)' })
  getCapabilities() {
    return this.aiService.getCapabilities();
  }
}
