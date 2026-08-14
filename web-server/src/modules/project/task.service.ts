import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskStatus } from './schemas/task.schema';
import { Project, ProjectStatus } from './schemas/project.schema';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  async create(createTaskDto: CreateTaskDto, tenantId: string) {
    const task = await this.taskModel.create({
      ...createTaskDto,
      tenantId,
    });

    return task;
  }

  async findAll(tenantId: string, status?: TaskStatus, page = 1, limit = 10) {
    const query: Record<string, unknown> = { tenantId };

    if (status) {
      query.status = status;
    }

    const total = await this.taskModel.countDocuments(query);
    const data = await this.taskModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByProject(projectId: string, tenantId: string, status?: TaskStatus) {
    const query: Record<string, unknown> = { projectId, tenantId };

    if (status) {
      query.status = status;
    }

    return this.taskModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, tenantId: string) {
    const task = await this.taskModel.findOne({ _id: id, tenantId }).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, tenantId: string, updateTaskDto: UpdateTaskDto) {
    const existingTask = await this.taskModel.findOne({ _id: id, tenantId }).exec();

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    const task = await this.taskModel.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateTaskDto },
      { new: true },
    ).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (updateTaskDto.status === TaskStatus.DONE) {
      await this.checkAndAutoCompleteProject(task.projectId, tenantId);
    }

    if (existingTask.status === TaskStatus.DONE && updateTaskDto.status !== TaskStatus.DONE) {
      await this.revertProjectToOnHold(task.projectId, tenantId);
    }

    return task;
  }

  async remove(id: string, tenantId: string) {
    const task = await this.taskModel.findOne({ _id: id, tenantId }).exec();
    
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const result = await this.taskModel.deleteOne({ _id: id, tenantId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Task not found');
    }

    await this.checkAndAutoCompleteProject(task.projectId, tenantId);

    return { success: true };
  }

  async updateStatus(id: string, tenantId: string, status: TaskStatus) {
    return this.update(id, tenantId, { status });
  }

  private async checkAndAutoCompleteProject(projectId: string, tenantId: string) {
    const remainingTasks = await this.taskModel.countDocuments({
      projectId,
      tenantId,
      status: { $ne: TaskStatus.DONE },
    });

    if (remainingTasks === 0) {
      const project = await this.projectModel.findOne({ _id: projectId, tenantId }).exec();
      
      if (project && project.status === ProjectStatus.ACTIVE) {
        await this.projectModel.updateOne(
          { _id: projectId, tenantId },
          { $set: { status: ProjectStatus.COMPLETED } },
        ).exec();
        
        console.log(`Project "${project.name}" auto-completed: all tasks are done`);
      }
    }
  }

  private async revertProjectToOnHold(projectId: string, tenantId: string) {
    const project = await this.projectModel.findOne({ _id: projectId, tenantId }).exec();
    
    if (project && project.status === ProjectStatus.COMPLETED) {
      await this.projectModel.updateOne(
        { _id: projectId, tenantId },
        { $set: { status: ProjectStatus.ON_HOLD } },
      ).exec();
      
      console.log(`Project "${project.name}" reverted to on_hold: task moved from done`);
    }
  }
}
