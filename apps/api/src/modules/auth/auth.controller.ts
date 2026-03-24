import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  TwoFactorCodeDto,
  GoogleCallbackDto,
  AppleCallbackDto,
} from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('csrf-token')
  @Public()
  @ApiOperation({ summary: 'Get a CSRF token (double-submit cookie pattern)' })
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    const token = randomBytes(32).toString('hex');
    res.cookie('_csrf', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    return { csrfToken: token };
  }

  @Public()
  @Post('register')
  @Throttle({ long: { ttl: 3600000, limit: 10 } })
  @ApiOperation({ summary: 'Register a new user account' })
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
      workspaceId: result.workspaceId,
      requiresEmailVerification: true,
    };
  }

  @Public()
  @Post('login')
  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password, body.totp_code);
    if (result.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
    }
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const result = await this.authService.refreshTokens(refreshToken);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ long: { ttl: 900000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.sendPasswordResetEmail(body.email);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Public()
  @Post('resend-verification')
  @Throttle({ long: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  async resendVerification(@Body() body: ForgotPasswordDto) {
    await this.authService.resendVerificationEmail(body.email);
    return { message: 'If the email exists and is not yet verified, a verification link has been sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body.token, body.password);
    return { message: 'Password reset successfully' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with token' })
  async verifyEmail(@Body() body: VerifyEmailDto) {
    await this.authService.verifyEmail(body.token);
    return { message: 'Email verified successfully' };
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  async enableTwoFactor(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.authService.enableTwoFactor(userId);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify and confirm 2FA setup' })
  async verifyTwoFactor(
    @Req() req: Request,
    @Body() body: TwoFactorCodeDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.authService.verifyTwoFactor(userId, body.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  async disableTwoFactor(
    @Req() req: Request,
    @Body() body: TwoFactorCodeDto,
  ) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.authService.disableTwoFactor(userId, body.code);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.authService.getCurrentUser(userId);
  }

  @Public()
  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  async googleCallback(
    @Body() body: GoogleCallbackDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.handleGoogleAuth(body.code, body.redirectUri);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('apple/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Apple OAuth callback' })
  async appleCallback(
    @Body() body: AppleCallbackDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.handleAppleAuth(body.code, body.idToken);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Get('payment-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment/subscription status for the current user' })
  async getPaymentStatus(@Req() req: Request) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.authService.getPaymentStatus(userId);
  }

  @Public()
  @Post('validate-slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate workspace slug availability' })
  async validateSlug(@Body() body: { slug: string }) {
    return this.authService.validateSlug(body.slug);
  }

  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
