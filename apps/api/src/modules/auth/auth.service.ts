import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../../infrastructure/mail/mail.service';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthRepository } from './auth.repository';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const GENERIC_FORGOT_MESSAGE =
  'If an account exists for that email, a reset link has been sent.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async login(
    dto: LoginDto,
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    const user = await this.authRepository.findActiveUserByEmail(dto.email);
    if (!user) {
      this.logger.warn({
        msg: 'auth_login_failed',
        reason: 'user_not_found',
        email: dto.email.toLowerCase(),
        ipAddress: meta.ipAddress,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) {
      this.logger.warn({
        msg: 'auth_login_failed',
        reason: 'bad_password',
        userId: user.id,
        ipAddress: meta.ipAddress,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.completeLogin(user, meta);
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    meta: { ipAddress?: string },
  ): Promise<{ message: string }> {
    const user = await this.authRepository.findActiveUserByEmail(dto.email);
    if (!user) {
      return { message: GENERIC_FORGOT_MESSAGE };
    }

    await this.authRepository.invalidatePasswordResetTokens(user.id);

    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await this.authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash: this.hashToken(rawToken),
      expiresAt,
    });

    const webUrl =
      this.configService.get<string>('web.publicUrl') ?? 'http://localhost:3000';
    const resetUrl = `${webUrl}/reset-password?token=${rawToken}`;

    try {
      await this.mailService.sendMail({
        to: user.email,
        subject: 'Reset your Mahbere Ahaw LMS password',
        text: `Use this link within 1 hour to reset your password:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        html: `<p>Use this link within 1 hour to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, ignore this email.</p>`,
      });
    } catch (error) {
      this.logger.error({
        msg: 'auth_forgot_password_mail_failed',
        userId: user.id,
        error: String(error),
      });
    }

    await this.authRepository.createAuditLog({
      actorId: user.id,
      action: 'AUTH_FORGOT_PASSWORD',
      entityType: 'User',
      entityId: user.id,
      ipAddress: meta.ipAddress,
    });

    return { message: GENERIC_FORGOT_MESSAGE };
  }

  async resetPassword(
    dto: ResetPasswordDto,
    meta: { ipAddress?: string },
  ): Promise<{ ok: true }> {
    const stored = await this.authRepository.findValidPasswordResetToken(
      this.hashToken(dto.token),
    );
    if (!stored || !stored.user.isActive || stored.user.deletedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.authRepository.updatePasswordHash(stored.userId, passwordHash);
    await this.authRepository.markPasswordResetUsed(stored.id);
    await this.authRepository.invalidatePasswordResetTokens(stored.userId);
    await this.authRepository.revokeAllUserRefreshTokens(stored.userId);

    await this.authRepository.createAuditLog({
      actorId: stored.userId,
      action: 'AUTH_PASSWORD_RESET',
      entityType: 'User',
      entityId: stored.userId,
      ipAddress: meta.ipAddress,
    });

    return { ok: true };
  }

  async refresh(
    refreshToken: string,
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    const tokenHash = this.hashToken(refreshToken);
    const stored =
      await this.authRepository.findAnyRefreshTokenByHash(tokenHash);

    if (!stored) {
      this.logger.warn({
        msg: 'auth_refresh_failed',
        reason: 'token_not_found',
        ipAddress: meta.ipAddress,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      await this.authRepository.revokeAllUserRefreshTokens(stored.userId);
      await this.authRepository.createAuditLog({
        actorId: stored.userId,
        action: 'AUTH_REFRESH_REUSE',
        entityType: 'RefreshToken',
        entityId: stored.id,
        ipAddress: meta.ipAddress,
        metadata: { userAgent: meta.userAgent },
      });
      this.logger.warn({
        msg: 'auth_refresh_reuse',
        userId: stored.userId,
        tokenId: stored.id,
        ipAddress: meta.ipAddress,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!stored.user.isActive || stored.user.deletedAt) {
      throw new UnauthorizedException('User account is inactive');
    }

    await this.authRepository.revokeRefreshToken(stored.id);
    const tokens = await this.issueTokens(stored.user, meta);

    return {
      user: this.toAuthenticatedUser(stored.user),
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken?: string): Promise<{ ok: true }> {
    if (refreshToken) {
      const stored = await this.authRepository.findRefreshTokenByHash(
        this.hashToken(refreshToken),
      );
      if (stored && stored.userId === userId) {
        await this.authRepository.revokeRefreshToken(stored.id);
      }
    } else {
      await this.authRepository.revokeAllUserRefreshTokens(userId);
    }

    await this.authRepository.createAuditLog({
      actorId: userId,
      action: 'AUTH_LOGOUT',
      entityType: 'User',
      entityId: userId,
    });

    return { ok: true };
  }

  async getProfile(userId: string) {
    const user = await this.requireUser(userId);
    return this.toAuthenticatedUser(user);
  }

  private async completeLogin(
    user: User,
    meta: { userAgent?: string; ipAddress?: string },
    action = 'AUTH_LOGIN',
  ) {
    const tokens = await this.issueTokens(user, meta);
    await this.authRepository.createAuditLog({
      actorId: user.id,
      action,
      entityType: 'User',
      entityId: user.id,
      ipAddress: meta.ipAddress,
    });
    return {
      user: this.toAuthenticatedUser(user),
      ...tokens,
    };
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.authRepository.findActiveUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private async issueTokens(
    user: User,
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessExpiresIn =
      this.configService.get<string>('jwt.accessExpiresIn') ?? '15m';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const expiresAt = this.computeExpiryDate(refreshExpiresIn);

    await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn') ?? '15m',
    };
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private computeExpiryDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + amount * multipliers[unit]);
  }
}
