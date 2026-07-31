import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectStatus } from './schemas/project.schema';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto, tenantId: string, ownerId: string) {
    const project = await this.projectModel.create({
      ...createProjectDto,
      tenantId,
      ownerId,
    });

    return project;
  }

  async findAll(tenantId: string, status?: ProjectStatus) {
    const query: Record<string, unknown> = { tenantId };

    if (status) {
      query.status = status;
    }

    return this.projectModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, tenantId: string) {
    const project = await this.projectModel.findOne({ _id: id, tenantId }).exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, tenantId: string, updateProjectDto: UpdateProjectDto) {
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
