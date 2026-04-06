import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from '../auth.repository';
import { getSharedRedis } from '../../../common/redis/shared-redis';

interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy
  extends PassportStrategy(Strategy, 'jwt')
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  onModuleInit() {
    getSharedRedis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
      this.logger,
    );
  }

  async onModuleDestroy() {}

  async validate(payload: JwtPayload) {
    // Check if the user's password was changed after this token was issued
    const pwdChangedAt = await getSharedRedis().get(
      `auth:pwd_changed:${payload.sub}`,
    );
    if (pwdChangedAt && payload.iat * 1000 < parseInt(pwdChangedAt, 10)) {
      throw new UnauthorizedException(
        'Password was changed. Please log in again.',
      );
    }

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      is_superadmin: user.is_superadmin,
      email_verified: user.email_verified,
    };
  }
}
