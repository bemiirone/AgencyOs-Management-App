import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from '../task.service';

const mockModel = {
  create: vi.fn(),
  find: vi.fn(),
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  deleteOne: vi.fn(),
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

vi.mock('../schemas/task.schema', () => ({
  Task: 'Task',
  TaskStatus: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    IN_REVIEW: 'in_review',
    DONE: 'done',
  },
}));

describe('TaskService', () => {
  let service: TaskService;

  const tenantId = 'test-tenant-id';
  const TaskStatus = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    IN_REVIEW: 'in_review',
    DONE: 'done',
  };

  const mockTask = {
    _id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: TaskStatus.TODO,
    priority: 'medium',
    projectId: 'project-1',
    tenantId,
    assigneeIds: [],
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaskService(mockModel as any);
  });

  describe('create', () => {
    it('should create a task with tenantId', async () => {
      const createDto = {
        title: 'Test Task',
        description: 'Test description',
        projectId: 'project-1',
      };

      mockModel.create.mockResolvedValue(mockTask);

      const result = await service.create(createDto, tenantId);

      expect(mockModel.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId,
      });
      expect(result).toEqual(mockTask);
    });
  });

  describe('findAll', () => {
    it('should return all tasks for a tenant', async () => {
      const mockTasks = [mockTask];
      mockModel.find.mockReturnValue(createChainableMock(mockTasks));

      const result = await service.findAll(tenantId);

      expect(mockModel.find).toHaveBeenCalledWith({ tenantId });
      expect(result).toEqual(mockTasks);
    });

    it('should filter by status when provided', async () => {
      mockModel.find.mockReturnValue(createChainableMock([]));

      await service.findAll(tenantId, TaskStatus.TODO as any);

      expect(mockModel.find).toHaveBeenCalledWith({
        tenantId,
        status: TaskStatus.TODO,
      });
    });
  });

  describe('findByProject', () => {
    it('should return tasks for a specific project', async () => {
      const projectId = 'project-1';
      mockModel.find.mockReturnValue(createChainableMock([mockTask]));

      const result = await service.findByProject(projectId, tenantId);

      expect(mockModel.find).toHaveBeenCalledWith({
        projectId,
        tenantId,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      mockModel.findOne.mockReturnValue(createChainableMock(mockTask));

      const result = await service.findOne('task-1', tenantId);

      expect(mockModel.findOne).toHaveBeenCalledWith({
        _id: 'task-1',
        tenantId,
      });
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockModel.findOne.mockReturnValue(createChainableMock(null));

      await expect(service.findOne('nonexistent', tenantId)).rejects.toThrow(
        'Task not found',
      );
    });
  });

  describe('update', () => {
    it('should update and return the task', async () => {
      const updateDto = { title: 'Updated Title' };
      const updatedTask = { ...mockTask, ...updateDto };
      mockModel.findOneAndUpdate.mockReturnValue(createChainableMock(updatedTask));

      const result = await service.update('task-1', tenantId, updateDto);

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'task-1', tenantId },
        { $set: updateDto },
        { new: true },
      );
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockModel.findOneAndUpdate.mockReturnValue(createChainableMock(null));

      await expect(
        service.update('nonexistent', tenantId, { title: 'New' }),
      ).rejects.toThrow('Task not found');
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      mockModel.deleteOne.mockReturnValue(createChainableMock({ deletedCount: 1 }));

      const result = await service.remove('task-1', tenantId);

      expect(mockModel.deleteOne).toHaveBeenCalledWith({
        _id: 'task-1',
        tenantId,
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when task not found', async () => {
      mockModel.deleteOne.mockReturnValue(createChainableMock({ deletedCount: 0 }));

      await expect(service.remove('nonexistent', tenantId)).rejects.toThrow(
        'Task not found',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update task status', async () => {
      const updatedTask = { ...mockTask, status: TaskStatus.DONE };
      mockModel.findOneAndUpdate.mockReturnValue(createChainableMock(updatedTask));

      const result = await service.updateStatus(
        'task-1',
        tenantId,
        TaskStatus.DONE as any,
      );

      expect(result.status).toBe(TaskStatus.DONE);
    });
  });
});
