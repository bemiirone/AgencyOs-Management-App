import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectStatus } from './schemas/project.schema';
import { Task, TaskStatus } from './schemas/task.schema';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { paginate } from '../../common/utils/paginate';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {}

  async create(createProjectDto: CreateProjectDto, tenantId: string, ownerId: string) {
    const project = await this.projectModel.create({
      ...createProjectDto,
      tenantId,
      ownerId,
    });

    return project;
  }

  async findAll(tenantId: string, status?: ProjectStatus, page = 1, limit = 10) {
    const query: Record<string, unknown> = { tenantId };
    if (status) {
      query.status = status;
    }
    return paginate(this.projectModel, query as any, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const project = await this.projectModel.findOne({ _id: id, tenantId }).exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, tenantId: string, updateProjectDto: UpdateProjectDto) {
    if (updateProjectDto.status === ProjectStatus.COMPLETED) {
      const incompleteTasks = await this.taskModel.countDocuments({
        projectId: id,
        tenantId,
        status: { $ne: TaskStatus.DONE },
      });

      if (incompleteTasks > 0) {
        throw new BadRequestException(
          `Cannot complete project: ${incompleteTasks} task(s) are still incomplete`,
        );
      }
    }

    const project = await this.projectModel.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateProjectDto },
      { new: true },
    ).exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async remove(id: string, tenantId: string) {
    const result = await this.projectModel.deleteOne({ _id: id, tenantId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Project not found');
    }

    return { success: true };
  }
}
