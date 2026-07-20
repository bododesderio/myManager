import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { MediaService } from './media.service';
import {
  GetPresignedUploadUrlDto,
  ConfirmUploadDto,
  BulkDeleteMediaDto,
  ListMediaQueryDto,
} from './dto/media.dto';
import { getRequestWorkspaceId } from '../../common/http/request-context';

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'List media assets in workspace' })
  async listMedia(@Query() query: ListMediaQueryDto) {
    return this.mediaService.list(
      query.workspaceId,
      query.type,
      query.page ?? 1,
      query.limit ?? 30,
    );
  }

  @Post('upload')
  @ApiOperation({ summary: 'Get a presigned upload URL' })
  async getUploadUrl(
    @Req() req: Request,
    @Body() body: GetPresignedUploadUrlDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.mediaService.getPresignedUploadUrl(userId, body);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm upload and trigger processing' })
  async confirmUpload(@Body() body: ConfirmUploadDto, @Req() req: Request) {
    return this.mediaService.confirmUpload(body.mediaId, getRequestWorkspaceId(req), body.r2Key);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media asset details' })
  async getMedia(@Param('id') id: string, @Req() req: Request) {
    return this.mediaService.getById(id, getRequestWorkspaceId(req));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media asset' })
  async deleteMedia(@Param('id') id: string, @Req() req: Request) {
    return this.mediaService.delete(id, getRequestWorkspaceId(req));
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete media assets' })
  async bulkDelete(@Body() body: BulkDeleteMediaDto, @Req() req: Request) {
    return this.mediaService.bulkDelete(body.mediaIds, getRequestWorkspaceId(req));
  }

  @Get(':id/variants')
  @ApiOperation({ summary: 'Get all processed variants of a media asset' })
  async getVariants(@Param('id') id: string, @Req() req: Request) {
    return this.mediaService.getVariants(id, getRequestWorkspaceId(req));
  }

  @Get('storage/usage')
  @ApiOperation({ summary: 'Get storage usage for workspace' })
  async getStorageUsage(@Query('workspaceId') workspaceId: string) {
    return this.mediaService.getStorageUsage(workspaceId);
  }
}
