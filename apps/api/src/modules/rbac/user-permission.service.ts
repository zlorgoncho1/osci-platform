import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPermission } from './entities/user-permission.entity';
import { ResourceType, Action } from '../../common/enums';

@Injectable()
export class UserPermissionService {
  constructor(
    @InjectRepository(UserPermission)
    private readonly repo: Repository<UserPermission>,
  ) {}

  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async setUserPermissions(
    userId: string,
    permissions: { resourceType: ResourceType; actions: Action[] }[],
    grantedById: string,
  ): Promise<UserPermission[]> {
    // Deduplicate by resourceType — merge actions if same resourceType appears twice
    const deduped = new Map<ResourceType, Action[]>();
    for (const p of permissions) {
      const existing = deduped.get(p.resourceType);
      if (existing) {
        const merged = new Set([...existing, ...p.actions]);
        deduped.set(p.resourceType, Array.from(merged));
      } else {
        deduped.set(p.resourceType, [...p.actions]);
      }
    }

    // Atomic delete + recreate inside a transaction
    return this.repo.manager.transaction(async (em) => {
      await em.delete(UserPermission, { userId });

      if (deduped.size === 0) {
        return [];
      }

      const entities = Array.from(deduped.entries()).map(([resourceType, actions]) =>
        em.create(UserPermission, {
          userId,
          resourceType,
          actions,
          grantedById,
        }),
      );

      return em.save(entities);
    });
  }
}
