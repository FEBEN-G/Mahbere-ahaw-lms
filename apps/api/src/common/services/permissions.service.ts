import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Permission, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLE_PERMISSION_MAP } from '../constants/permissions';

const CACHE_TTL_MS = 60_000;

@Injectable()
export class PermissionsService implements OnModuleDestroy {
  private readonly logger = new Logger(PermissionsService.name);
  private cache = new Map<
    Role,
    { permissions: Set<Permission>; expiresAt: number }
  >();

  constructor(private readonly prisma: PrismaService) {}

  onModuleDestroy() {
    this.cache.clear();
  }

  invalidate() {
    this.cache.clear();
  }

  async getPermissionsForRole(role: Role): Promise<Set<Permission>> {
    const cached = this.cache.get(role);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    try {
      const rows = await this.prisma.rolePermission.findMany({
        where: { role },
        select: { permission: true },
      });

      const permissions =
        rows.length > 0
          ? new Set([
              ...rows.map((row) => row.permission),
              ...(ROLE_PERMISSION_MAP[role] ?? []),
            ])
          : new Set(ROLE_PERMISSION_MAP[role] ?? []);

      if (rows.length === 0) {
        this.logger.warn(
          `No RolePermission rows for ${role}; falling back to seed map`,
        );
      }

      this.cache.set(role, {
        permissions,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return permissions;
    } catch (error) {
      this.logger.error(
        `Failed loading RolePermission for ${role}: ${String(error)}`,
      );
      return new Set(ROLE_PERMISSION_MAP[role] ?? []);
    }
  }

  async roleHasPermissions(
    role: Role,
    required: Permission[],
  ): Promise<boolean> {
    if (required.length === 0) {
      return true;
    }
    const granted = await this.getPermissionsForRole(role);
    return required.every((permission) => granted.has(permission));
  }
}
