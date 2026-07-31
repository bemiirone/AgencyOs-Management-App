import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimeEntryService } from '../time-entry.service';

const mockModel = {
  create: vi.fn(),
  find: vi.fn(),
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  deleteOne: vi.fn(),
  updateMany: vi.fn(),
};

const createChainableMock = (result: any) => ({
  sort: vi.fn().mockReturnValue({
    exec: vi.fn().mockResolvedValue(result),
  }),
  exec: vi.fn().mockResolvedValue(result),
});

vi.mock('@nestjs/mongoose', () => ({
  InjectModel: () => () => {},
  getModelToken: (name: string) => `${name}Model`,
}));

vi.mock('@nestjs/common', () => ({
  Injectable: () => () => {},
  NotFoundException: class NotFoundException extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundException';
    }
  },
}));

vi.mock('../schemas/time-entry.schema', () => ({
  TimeEntry: 'TimeEntry',
}));

describe('TimeEntryService', () => {
  let service: TimeEntryService;

  const tenantId = 'test-tenant-id';
  const userId = 'test-user-id';

  const mockTimeEntry = {
    _id: 'entry-1',
    userId,
    taskId: 'task-1',
    projectId: 'project-1',
    tenantId,
    isRunning: true,
    startTime: new Date(),
    duration: 0,
    description: 'Test entry',
    isBillable: false,
    isApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockModel.create.mockReset();
    mockModel.find.mockReset();
    mockModel.findOne.mockReset();
    mockModel.findOneAndUpdate.mockReset();
    mockModel.deleteOne.mockReset();
    mockModel.updateMany.mockReset();
    service = new TimeEntryService(mockModel as any);
  });

  describe('create', () => {
    it('should create a running time entry', async () => {
      const createDto = {
        projectId: 'project-1',
        taskId: 'task-1',
        description: 'Test entry',
        isBillable: false,
      };

      mockModel.findOne.mockReturnValue(createChainableMock(null));
      mockModel.create.mockResolvedValue(mockTimeEntry);

      const result = await service.create(createDto, tenantId, userId);

      expect(mockModel.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId,
        userId,
        isRunning: true,
        startTime: expect.any(Date),
      });
      expect(result.isRunning).toBe(true);
    });

    it('should stop existing running timer before creating new one', async () => {
      const existingEntry = {
        ...mockTimeEntry,
        _id: 'old-entry',
        startTime: new Date(Date.now() - 60000),
        save: vi.fn(),
      };
      mockModel.findOne
        .mockReturnValueOnce(createChainableMock(existingEntry))
        .mockReturnValueOnce(createChainableMock(existingEntry))
        .mockReturnValueOnce(createChainableMock(null));
      mockModel.create.mockResolvedValue(mockTimeEntry);

      await service.create(
        { projectId: 'project-1' },
        tenantId,
        userId,
      );

      expect(existingEntry.isRunning).toBe(false);
      expect(existingEntry.save).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop a running timer and calculate duration', async () => {
      const startTime = new Date(Date.now() - 60000);
      const entry = {
        ...mockTimeEntry,
        startTime,
        isRunning: true,
        save: vi.fn(),
      };
      mockModel.findOne.mockReturnValue(createChainableMock(entry));

      const result = await service.stop('entry-1', tenantId, userId);

      expect(mockModel.findOne).toHaveBeenCalledWith({
        _id: 'entry-1',
        tenantId,
        userId,
      });
      expect(result.isRunning).toBe(false);
      expect(result.endTime).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(60);
    });

    it('should throw NotFoundException when entry not found', async () => {
      mockModel.findOne.mockReturnValue(createChainableMock(null));

      await expect(
        service.stop('nonexistent', tenantId, userId),
      ).rejects.toThrow('Time entry not found');
    });
  });

  describe('findAll', () => {
    it('should return all time entries for a tenant', async () => {
      const mockEntries = [mockTimeEntry];
      mockModel.find.mockReturnValue(createChainableMock(mockEntries));

      const result = await service.findAll(tenantId);

      expect(mockModel.find).toHaveBeenCalledWith({ tenantId });
      expect(result).toEqual(mockEntries);
    });

    it('should filter by userId when provided', async () => {
      mockModel.find.mockReturnValue(createChainableMock([]));

      await service.findAll(tenantId, userId);

      expect(mockModel.find).toHaveBeenCalledWith({
        tenantId,
        userId,
      });
    });

    it('should filter by projectId when provided', async () => {
      mockModel.find.mockReturnValue(createChainableMock([]));

      await service.findAll(tenantId, undefined, 'project-1');

      expect(mockModel.find).toHaveBeenCalledWith({
        tenantId,
        projectId: 'project-1',
      });
    });

    it('should filter by taskId when provided', async () => {
      mockModel.find.mockReturnValue(createChainableMock([]));

      await service.findAll(tenantId, undefined, undefined, 'task-1');

      expect(mockModel.find).toHaveBeenCalledWith({
        tenantId,
        taskId: 'task-1',
      });
    });
  });

  describe('getRunningEntry', () => {
    it('should return the running entry for a user', async () => {
      mockModel.findOne.mockReturnValue(createChainableMock(mockTimeEntry));

      const result = await service.getRunningEntry(tenantId, userId);

      expect(mockModel.findOne).toHaveBeenCalledWith({
        tenantId,
        userId,
        isRunning: true,
      });
      expect(result).toEqual(mockTimeEntry);
    });

    it('should return null when no running entry exists', async () => {
      mockModel.findOne.mockReturnValue(createChainableMock(null));

      const result = await service.getRunningEntry(tenantId, userId);

      expect(result).toBeNull();
    });
  });

  describe('cleanupOrphanedTimers', () => {
    it('should stop timers older than 24 hours', async () => {
      mockModel.updateMany.mockReturnValue(createChainableMock({ modifiedCount: 1 }));
      mockModel.find.mockReturnValue(createChainableMock([]));

      const result = await service.cleanupOrphanedTimers(tenantId, userId);

      expect(mockModel.updateMany).toHaveBeenCalled();
      const callArgs = mockModel.updateMany.mock.calls[0];
      expect(callArgs[0]).toHaveProperty('tenantId', tenantId);
      expect(callArgs[0]).toHaveProperty('isRunning', true);
      expect(callArgs[0].startTime).toHaveProperty('$lt');
      expect(callArgs[1]).toHaveProperty('$set.isRunning', false);
      expect(callArgs[1]).toHaveProperty('$set.endTime');
      expect(result).toBe(1);
    });
  });

  describe('remove', () => {
    it('should delete a time entry', async () => {
      mockModel.deleteOne.mockReturnValue(createChainableMock({ deletedCount: 1 }));

      const result = await service.remove('entry-1', tenantId, userId);

      expect(mockModel.deleteOne).toHaveBeenCalledWith({
        _id: 'entry-1',
        tenantId,
        userId,
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when entry not found', async () => {
      mockModel.deleteOne.mockReturnValue(createChainableMock({ deletedCount: 0 }));

      await expect(
        service.remove('nonexistent', tenantId, userId),
      ).rejects.toThrow('Time entry not found');
    });
  });
});
