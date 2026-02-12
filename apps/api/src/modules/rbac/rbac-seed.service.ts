import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { ResourceType, Action, UserRole } from '../../common/enums';
import { User } from '../users/entities/user.entity';

const ALL_ACTIONS = [
  Action.Read,
  Action.Create,
  Action.Update,
  Action.Delete,
  Action.Export,
  Action.Manage,
];

const ALL_RESOURCE_TYPES = Object.values(ResourceType);

interface RoleSeed {
  name: string;
  slug: string;
  description: string;
  permissions: { resourceType: ResourceType; actions: Action[] }[];
}

const ROLE_SEEDS: RoleSeed[] = [
  {
    name: 'Security Admin',
    slug: UserRole.SecurityAdmin,
    description: 'Full system access — all resources, all actions',
    permissions: ALL_RESOURCE_TYPES.map((rt) => ({
      resourceType: rt,
      actions: ALL_ACTIONS,
    })),
  },
  {
    name: 'Security Manager',
    slug: UserRole.SecurityManager,
    description:
      'Manage projects, objects, checklists, tasks, evidence, incidents, reports, referentiels',
    permissions: [
      ResourceType.Project,
      ResourceType.Object,
      ResourceType.ObjectGroup,
      ResourceType.Checklist,
      ResourceType.ChecklistRun,
      ResourceType.Task,
      ResourceType.Evidence,
      ResourceType.Incident,
      ResourceType.Report,
      ResourceType.Referentiel,
      ResourceType.FrameworkControl,
      ResourceType.CartographyAsset,
      ResourceType.CartographyRelation,
      ResourceType.Integration,
      ResourceType.UserGroup,
    ].map((rt) => ({
      resourceType: rt,
      actions: [Action.Read, Action.Create, Action.Update, Action.Delete, Action.Export],
    })),
  },
  {
    name: 'Project Owner',
    slug: UserRole.ProjectOwner,
    description: 'Manage own projects/objects, create checklists/tasks',
    permissions: [
      {
        resourceType: ResourceType.Project,
        actions: [Action.Read, Action.Create, Action.Update, Action.Delete],
      },
      {
        resourceType: ResourceType.Object,
        actions: [Action.Read, Action.Create, Action.Update],
      },
      {
        resourceType: ResourceType.ObjectGroup,
        actions: [Action.Read, Action.Create, Action.Update],
      },
      {
        resourceType: ResourceType.Checklist,
        actions: [Action.Read, Action.Create, Action.Update],
      },
      {
        resourceType: ResourceType.ChecklistRun,
        actions: [Action.Read, Action.Create],
      },
      {
        resourceType: ResourceType.Task,
        actions: [Action.Read, Action.Create, Action.Update],
      },
      {
        resourceType: ResourceType.Evidence,
        actions: [Action.Read, Action.Create],
      },
      {
        resourceType: ResourceType.Incident,
        actions: [Action.Read, Action.Create, Action.Update],
      },
      {
        resourceType: ResourceType.Report,
        actions: [Action.Read],
      },
      {
        resourceType: ResourceType.Referentiel,
        actions: [Action.Read],
      },
      {
        resourceType: ResourceType.FrameworkControl,
        actions: [Action.Read],
      },
      {
        resourceType: ResourceType.CartographyAsset,
        actions: [Action.Read, Action.Create, Action.Update],
      },
      {
        resourceType: ResourceType.CartographyRelation,
        actions: [Action.Read, Action.Create, Action.Update],
      },
    ],
  },
  {
    name: 'Auditor',
    slug: UserRole.Auditor,
    description: 'Read-only + export capability on all resources',
    permissions: ALL_RESOURCE_TYPES.map((rt) => ({
      resourceType: rt,
      actions: [Action.Read, Action.Export],
    })),
  },
  {
    name: 'Developer',
    slug: UserRole.Developer,
    description: 'Read + respond to assigned checklists/tasks',
    permissions: [
      {
        resourceType: ResourceType.Object,
        actions: [Action.Read],
      },
      {
        resourceType: ResourceType.ObjectGroup,
        actions: [Action.Read],
      },
      {
        resourceType: ResourceType.Checklist,
        actions: [Action.Read],
      },
      {
        resourceType: ResourceType.ChecklistRun,
        actions: [Action.Read, Action.Create, Action.Update],
      },
      {
        resourceType: ResourceType.Task,
        actions: [Action.Read, Action.Update],
      },
      {
        resourceType: ResourceType.Evidence,
        actions: [Action.Read, Action.Create],
      },
      {
        resourceType: ResourceType.Incident,
        actions: [Action.Read],
      },
      {
        resourceType: ResourceType.Project,
        actions: [Action.Read],
      },
      {
        resourceType: ResourceType.Referentiel,
        actions: [Action.Read],
      },
      {
        resourceType: ResourceType.FrameworkControl,
        actions: [Action.Read],
      },
      {
        resourceType: ResourceType.CartographyAsset,
        actions: [Action.Read],
      },
      {
        resourceType: ResourceType.CartographyRelation,
        actions: [Action.Read],
      },
    ],
  },
  {
    name: 'Viewer',
    slug: UserRole.Viewer,
    description: 'Read-only access to all resources',
    permissions: [
      ResourceType.Project,
      ResourceType.Object,
      ResourceType.ObjectGroup,
      ResourceType.Checklist,
      ResourceType.ChecklistRun,
      ResourceType.Task,
      ResourceType.Evidence,
      ResourceType.Incident,
      ResourceType.Report,
      ResourceType.Referentiel,
      ResourceType.FrameworkControl,
      ResourceType.CartographyAsset,
      ResourceType.CartographyRelation,
    ].map((rt) => ({
      resourceType: rt,
      actions: [Action.Read],
    })),
  },
];

@Injectable()
export class RbacSeedService implements OnModuleInit {
  private readonly logger = new Logger(RbacSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(UserRoleAssignment)
    private readonly assignmentRepo: Repository<UserRoleAssignment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    for (const seed of ROLE_SEEDS) {
      let role = await this.roleRepo.findOne({ where: { slug: seed.slug } });

      if (!role) {
        this.logger.log(`Creating system role: ${seed.name}`);
        try {
          role = this.roleRepo.create({
            name: seed.name,
            slug: seed.slug,
            description: seed.description,
            isSystem: true,
          });
          role = await this.roleRepo.save(role);

          // Create permissions
          const permissions = seed.permissions.map((p) =>
            this.permissionRepo.create({
              roleId: role!.id,
              resourceType: p.resourceType,
              actions: p.actions,
            }),
          );
          await this.permissionRepo.save(permissions);
        } catch (err: any) {
          // Handle race condition on concurrent starts (unique constraint violation)
          if (err?.code === '23505') {
            this.logger.warn(
              `Role ${seed.slug} was created by another instance, skipping`,
            );
            role = await this.roleRepo.findOne({ where: { slug: seed.slug } });
          } else {
            throw err;
          }
        }
      }
    }

    // Seed the realm admin user from env vars
    await this.seedRealmAdmin();

    this.logger.log('RBAC seed complete');
  }

  /**
   * Create the default admin user from environment variables and assign SecurityAdmin.
   *
   * Env vars:
   *   KEYCLOAK_REALM_ADMIN_USER     — display name / firstName (e.g. "osci-admin")
   *   KEYCLOAK_REALM_ADMIN_EMAIL    — email (e.g. "osci-admin@localhost")
   *
   * If the user already exists (matched by email), we just ensure the role assignment.
   */
  private async seedRealmAdmin(): Promise<void> {
    const adminEmail = this.configService.get<string>(
      'KEYCLOAK_REALM_ADMIN_EMAIL',
    );
    if (!adminEmail) {
      this.logger.warn(
        'KEYCLOAK_REALM_ADMIN_EMAIL not set — skipping admin user seed',
      );
      return;
    }

    const adminName =
      this.configService.get<string>('KEYCLOAK_REALM_ADMIN_USER') ||
      'osci-admin';

    const adminRole = await this.roleRepo.findOne({
      where: { slug: UserRole.SecurityAdmin },
    });
    if (!adminRole) {
      this.logger.error('SecurityAdmin role not found — cannot seed admin user');
      return;
    }

    // Find or create the admin user by email
    let user = await this.userRepo.findOne({ where: { email: adminEmail } });
    if (!user) {
      this.logger.log(
        `Creating realm admin user: ${adminName} (${adminEmail})`,
      );
      user = this.userRepo.create({
        keycloakId: null,
        email: adminEmail,
        firstName: adminName,
        lastName: null,
        roles: [UserRole.SecurityAdmin],
      });
      user = await this.userRepo.save(user);
    }

    // Ensure SecurityAdmin assignment exists
    const existing = await this.assignmentRepo.findOne({
      where: { userId: user.id, roleId: adminRole.id },
    });
    if (!existing) {
      this.logger.log(
        `Assigning SecurityAdmin to realm admin: ${adminEmail}`,
      );
      const assignment = this.assignmentRepo.create({
        userId: user.id,
        roleId: adminRole.id,
        createdById: user.id,
      });
      await this.assignmentRepo.save(assignment);
    }
  }
}
