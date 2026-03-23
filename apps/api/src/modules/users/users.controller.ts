import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import {
  UpdateProfileDto,
  UpdatePreferencesDto,
  ChangePasswordDto,
  RegisterPushTokenDto,
  UpdateUserRoleDto,
  UpdateUserSuspensionDto,
} from './dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.usersService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @Req() req: Request,
    @Body() body: UpdateProfileDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.usersService.updateProfile(userId, body);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  async getPreferences(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.usersService.getPreferences(userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  async updatePreferences(
    @Req() req: Request,
    @Body() body: UpdatePreferencesDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.usersService.updatePreferences(userId, body);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @Req() req: Request,
    @Body() body: ChangePasswordDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.usersService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @Delete('account')
  @ApiOperation({ summary: 'Request account deletion (GDPR)' })
  async requestDeletion(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.usersService.requestAccountDeletion(userId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Request data export (GDPR)' })
  async requestDataExport(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.usersService.requestDataExport(userId);
  }

  @Get('push-tokens')
  @ApiOperation({ summary: 'List push notification tokens for user' })
  async getPushTokens(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.usersService.getPushTokens(userId);
  }

  @Put('push-tokens')
  @ApiOperation({ summary: 'Register or update a push notification token' })
  async registerPushToken(
    @Req() req: Request,
    @Body() body: RegisterPushTokenDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.usersService.registerPushToken(userId, body);
  }

  @Delete('push-tokens/:deviceId')
  @ApiOperation({ summary: 'Remove a push notification token' })
  async removePushToken(
    @Req() req: Request,
    @Param('deviceId') deviceId: string,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.usersService.removePushToken(userId, deviceId);
  }

  @SuperAdmin()
  @Get('admin/list')
  @ApiOperation({ summary: 'List all users (superadmin only)' })
  async listUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('search') search?: string,
  ) {
    return this.usersService.listUsers(page, limit, search);
  }

  @SuperAdmin()
  @Get('admin/:id')
  @ApiOperation({ summary: 'Get user details (superadmin only)' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @SuperAdmin()
  @Put('admin/:id/role')
  @ApiOperation({ summary: 'Update user role (superadmin only)' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(id, body.is_superadmin);
  }

  @SuperAdmin()
  @Put('admin/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user (superadmin only)' })
  async suspendUser(
    @Param('id') id: string,
    @Body() body: UpdateUserSuspensionDto,
  ) {
    return this.usersService.suspendUser(id, body.suspended);
  }

  @SuperAdmin()
  @Put('admin/:id/2fa/disable')
  @ApiOperation({ summary: 'Disable 2FA for a user (superadmin only)' })
  async disableUserTwoFactor(@Param('id') id: string) {
    return this.usersService.disableUserTwoFactor(id);
  }
}
