import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

interface ServiceStatus {
  configured: boolean;
  reason?: string;
}

interface SystemCapabilities {
  ai: {
    captionGeneration: boolean;
    captionRewrite: boolean;
    captionTranslate: boolean;
    hashtagSuggest: boolean;
    imageAnalyze: boolean;
    imageGenerate: boolean;
    grammarCheck: boolean;
    videoCaptions: boolean;
  };
  storage: ServiceStatus;
  payments: ServiceStatus;
  email: ServiceStatus;
  metrics: ServiceStatus;
  social: {
    facebook: ServiceStatus;
    instagram: ServiceStatus;
    x: ServiceStatus;
    linkedin: ServiceStatus;
    tiktok: ServiceStatus;
    youtube: ServiceStatus;
    pinterest: ServiceStatus;
    threads: ServiceStatus;
    google_business: ServiceStatus;
    whatsapp: ServiceStatus;
  };
}

function check(envVar: string | string[]): ServiceStatus {
  const vars = Array.isArray(envVar) ? envVar : [envVar];
  for (const v of vars) {
    if (!process.env[v]) {
      return { configured: false, reason: `Missing ${v}` };
    }
  }
  return { configured: true };
}

@ApiTags('System')
@Controller('system')
export class SystemStatusController {
  @Get('capabilities')
  @Public()
  @ApiOperation({
    summary: 'Aggregate capabilities probe — UI uses this to hide features that are not configured',
  })
  getCapabilities(): SystemCapabilities {
    const anthropic = !!process.env.ANTHROPIC_API_KEY;
    const replicate = !!process.env.REPLICATE_API_KEY;
    const openai = !!process.env.OPENAI_API_KEY;
    const lt = !!process.env.LANGUAGETOOL_URL;

    return {
      ai: {
        captionGeneration: anthropic,
        captionRewrite: anthropic,
        captionTranslate: anthropic,
        hashtagSuggest: anthropic,
        imageAnalyze: anthropic,
        imageGenerate: replicate,
        grammarCheck: lt,
        videoCaptions: openai,
      },
      storage: check([
        'CLOUDFLARE_R2_ACCOUNT_ID',
        'CLOUDFLARE_R2_ACCESS_KEY',
        'CLOUDFLARE_R2_SECRET_KEY',
        'CLOUDFLARE_R2_BUCKET',
      ]),
      payments: check(['FLUTTERWAVE_SECRET_KEY']),
      email: check(['RESEND_API_KEY']),
      metrics: check(['METRICS_TOKEN']),
      social: {
        facebook: check(['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET']),
        instagram: check(['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET']),
        x: check(['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET']),
        linkedin: check(['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET']),
        tiktok: check(['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET']),
        youtube: check(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']),
        pinterest: check(['PINTEREST_APP_ID', 'PINTEREST_APP_SECRET']),
        threads: check(['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET']),
        google_business: check(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']),
        whatsapp: check(['WHATSAPP_SYSTEM_USER_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']),
      },
    };
  }
}
