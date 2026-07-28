import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { Project, ProjectSchema } from './schemas/project.schema';
import { Task, TaskSchema } from './schemas/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [ProjectController, TaskController],
  providers: [ProjectService, TaskService],
  exports: [ProjectService, TaskService],
})
export class ProjectModule {}
