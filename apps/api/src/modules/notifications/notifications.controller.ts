import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Req,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  async list(
    @Req() req: Request,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('unreadOnly') unreadOnly: boolean = false,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.notificationsService.listForUser(userId, page, limit, unreadOnly);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.notificationsService.getPreferences(userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @Req() req: Request,
    @Body() body: { eventType: string; channels: Record<string, boolean> },
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    const results = [];
    for (const [channel, enabled] of Object.entries(body.channels)) {
      results.push(await this.notificationsService.updatePreferences(userId, body.eventType, channel, enabled));
    }
    return results;
  }
}
