import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimeEntry } from './schemas/time-entry.schema';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './dto/time-entry.dto';

@Injectable()
export class TimeEntryService {
  constructor(
    @InjectModel(TimeEntry.name) private timeEntryModel: Model<TimeEntry>,
  ) {}

  async create(createTimeEntryDto: CreateTimeEntryDto, tenantId: string, userId: string) {
    const runningEntry = await this.getRunningEntry(tenantId, userId);
    if (runningEntry) {
      await this.stop(runningEntry._id.toString(), tenantId, userId);
    }

    const timeEntry = await this.timeEntryModel.create({
      ...createTimeEntryDto,
      tenantId,
      userId,
      isRunning: true,
      startTime: new Date(),
    });

    return timeEntry;
  }

  async stop(id: string, tenantId: string, userId: string) {
    const timeEntry = await this.timeEntryModel.findOne({ _id: id, tenantId, userId }).exec();

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - timeEntry.startTime.getTime()) / 1000);

    timeEntry.isRunning = false;
    timeEntry.endTime = endTime;
    timeEntry.duration = duration;

    await timeEntry.save();

    return timeEntry;
  }

  async findAll(tenantId: string, userId?: string) {
    const query: any = { tenantId };

    if (userId) {
      query.userId = userId;
    }

    return this.timeEntryModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, tenantId: string) {
    const timeEntry = await this.timeEntryModel.findOne({ _id: id, tenantId }).exec();

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    return timeEntry;
  }

  async update(id: string, tenantId: string, userId: string, updateTimeEntryDto: UpdateTimeEntryDto) {
    const timeEntry = await this.timeEntryModel.findOneAndUpdate(
      { _id: id, tenantId, userId },
      { $set: updateTimeEntryDto },
      { new: true },
    ).exec();

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    return timeEntry;
  }

  async remove(id: string, tenantId: string, userId: string) {
    const result = await this.timeEntryModel.deleteOne({ _id: id, tenantId, userId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Time entry not found');
    }

    return { success: true };
  }

  async getRunningEntry(tenantId: string, userId: string) {
    return this.timeEntryModel.findOne({ tenantId, userId, isRunning: true }).exec();
  }

  async cleanupOrphanedTimers(tenantId: string, userId: string) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.timeEntryModel.updateMany(
      { tenantId, isRunning: true, startTime: { $lt: twentyFourHoursAgo } },
      {
        $set: {
          isRunning: false,
          endTime: new Date(),
        },
      },
    ).exec();

    if (result.modifiedCount > 0) {
      const entries = await this.timeEntryModel.find({
        tenantId,
        isRunning: false,
        endTime: { $gte: twentyFourHoursAgo },
      }).exec();

      for (const entry of entries) {
        if (entry.startTime && entry.endTime) {
          entry.duration = Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000);
          await entry.save();
        }
      }
    }

    return result.modifiedCount;
  }

  async cleanupAllOrphanedTimers(tenantId: string) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.timeEntryModel.updateMany(
      { tenantId, isRunning: true, startTime: { $lt: twentyFourHoursAgo } },
      {
        $set: {
          isRunning: false,
          endTime: new Date(),
        },
      },
    ).exec();

    if (result.modifiedCount > 0) {
      const entries = await this.timeEntryModel.find({
        tenantId,
        isRunning: false,
        endTime: { $gte: twentyFourHoursAgo },
      }).exec();

      for (const entry of entries) {
        if (entry.startTime && entry.endTime) {
          entry.duration = Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000);
          await entry.save();
        }
      }
    }

    return result.modifiedCount;
  }
}
