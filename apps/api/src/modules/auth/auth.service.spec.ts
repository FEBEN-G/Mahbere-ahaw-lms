import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

describe('AuthService refresh reuse detection', () => {
  const user = {
    id: 'user-1',
    email: 'student@example.com',
    role: Role.STUDENT,
    firstName: 'A',
    lastName: 'B',
    isActive: true,
    deletedAt: null,
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  let authRepository: jest.Mocked<
    Pick<
      AuthRepository,
      | 'findAnyRefreshTokenByHash'
      | 'revokeAllUserRefreshTokens'
      | 'revokeRefreshToken'
      | 'createRefreshToken'
      | 'createAuditLog'
    >
  >;
  let service: AuthService;

  beforeEach(() => {
    authRepository = {
      findAnyRefreshTokenByHash: jest.fn(),
      revokeAllUserRefreshTokens: jest.fn(),
      revokeRefreshToken: jest.fn(),
      createRefreshToken: jest.fn(),
      createAuditLog: jest.fn(),
    };

    service = new AuthService(
      authRepository as unknown as AuthRepository,
      {
        signAsync: jest.fn().mockResolvedValue('access'),
      } as unknown as JwtService,
      {
        get: jest.fn((key: string) => {
          if (key === 'jwt.accessExpiresIn') return '15m';
          if (key === 'jwt.refreshExpiresIn') return '7d';
          return undefined;
        }),
        getOrThrow: jest.fn().mockReturnValue('secret-secret-secret-secret-1234'),
      } as unknown as ConfigService,
      { sendMail: jest.fn() } as never,
    );
  });

  it('revokes all refresh tokens when a revoked token is reused', async () => {
    authRepository.findAnyRefreshTokenByHash.mockResolvedValue({
      id: 'rt-1',
      userId: user.id,
      tokenHash: 'abc',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user,
    });

    await expect(
      service.refresh('old-refresh-token', { ipAddress: '127.0.0.1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(authRepository.revokeAllUserRefreshTokens).toHaveBeenCalledWith(
      user.id,
    );
    expect(authRepository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'AUTH_REFRESH_REUSE' }),
    );
  });
});
