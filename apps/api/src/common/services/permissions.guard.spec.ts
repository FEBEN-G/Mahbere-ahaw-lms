import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, Role } from '@prisma/client';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PermissionsService } from './permissions.service';

describe('PermissionsGuard (DB-backed)', () => {
  const permissionsService = {
    roleHasPermissions: jest.fn(),
  };
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const guard = new PermissionsGuard(
    reflector as unknown as Reflector,
    permissionsService as unknown as PermissionsService,
  );

  it('allows when DB permissions include required ones', async () => {
    reflector.getAllAndOverride.mockReturnValue([Permission.GRADE_CREATE]);
    permissionsService.roleHasPermissions.mockResolvedValue(true);

    const result = await guard.canActivate({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: '1', role: Role.INSTRUCTOR },
        }),
      }),
    } as never);

    expect(result).toBe(true);
    expect(permissionsService.roleHasPermissions).toHaveBeenCalledWith(
      Role.INSTRUCTOR,
      [Permission.GRADE_CREATE],
    );
  });

  it('forbids when DB permissions are missing', async () => {
    reflector.getAllAndOverride.mockReturnValue([Permission.GRADE_CREATE]);
    permissionsService.roleHasPermissions.mockResolvedValue(false);

    await expect(
      guard.canActivate({
        getHandler: () => undefined,
        getClass: () => undefined,
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: '1', role: Role.STUDENT },
          }),
        }),
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
