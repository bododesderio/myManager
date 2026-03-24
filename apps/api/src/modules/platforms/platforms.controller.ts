import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PlatformsService } from './platforms.service';

@ApiTags('Platforms')
@Controller('platforms')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all supported platforms (public)' })
  async listPlatforms() {
    return this.platformsService.findAll();
  }
}
