import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, tenantId: string) {
    const task = await this.taskModel.create({
      ...createTaskDto,
      tenantId,
    });

    return task;
  }

  async findAll(tenantId: string, status?: TaskStatus) {
    const query: any = { tenantId };

    if (status) {
      query.status = status;
    }

    return this.taskModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findByProject(projectId: string, tenantId: string, status?: TaskStatus) {
    const query: any = { projectId, tenantId };

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
    const task = await this.taskModel.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateTaskDto },
      { new: true },
    ).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async remove(id: string, tenantId: string) {
    const result = await this.taskModel.deleteOne({ _id: id, tenantId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Task not found');
    }

    return { success: true };
  }

  async updateStatus(id: string, tenantId: string, status: TaskStatus) {
    return this.update(id, tenantId, { status });
  }
}
