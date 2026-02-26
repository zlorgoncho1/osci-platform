import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ObjectsModule } from './modules/objects/objects.module';
import { ChecklistsModule } from './modules/checklists/checklists.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AuditModule } from './modules/audit/audit.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { CartographyModule } from './modules/cartography/cartography.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ObjectGroupsModule } from './modules/object-groups/object-groups.module';
import { ReferentielsModule } from './modules/referentiels/referentiels.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { KeycloakAdminModule } from './modules/keycloak-admin/keycloak-admin.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logLevel = (configService.get<string>('LOG_LEVEL') || '').toLowerCase();
        const enableTypeOrmLogging =
          logLevel.includes('debug') || logLevel.includes('verbose');
        return {
          type: 'postgres' as const,
          url: configService.get<string>('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize: true,
          logging: enableTypeOrmLogging,
        };
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 200 }],
    }),
    KeycloakAdminModule,
    RbacModule,
    AuthModule,
    ObjectsModule,
    ChecklistsModule,
    ScoringModule,
    TasksModule,
    AuditModule,
    EvidenceModule,
    IncidentsModule,
    CartographyModule,
    ReportingModule,
    IntegrationsModule,
    UsersModule,
    ProjectsModule,
    ObjectGroupsModule,
    ReferentielsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
  ],
})
export class AppModule {}
