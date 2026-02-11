import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityProject } from './entities/security-project.entity';
import { ProjectMilestone } from './entities/project-milestone.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SecurityProject, ProjectMilestone, Task])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
