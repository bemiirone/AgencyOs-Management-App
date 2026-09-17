import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from '../task.service';

vi.mock('../schemas/task.schema', () => ({
  Task: 'Task',
  TaskStatus: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    IN_REVIEW: 'in_review',
    DONE: 'done',
  },
}));

vi.mock('../schemas/project.schema', () => ({
  Project: 'Project',
  ProjectStatus: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    ON_HOLD: 'on_hold',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
  },
}));

vi.mock('@nestjs/mongoose', () => ({
  InjectModel: () => () => {},
  getModelToken: (name: string) => `${name}Model`,
  Prop: () => () => {},
  Schema: () => () => {},
  SchemaFactory: { createForClass: () => ({ index: () => ({}) }) },
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

const mockTaskModel = {
  create: vi.fn(),
  find: vi.fn(),
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  deleteOne: vi.fn(),
  countDocuments: vi.fn().mockResolvedValue(0),
};

const createProjectFindOneMock = (result: any) => ({
  exec: vi.fn().mockResolvedValue(result),
});

const mockProjectModel = {
  findOne: vi.fn().mockReturnValue(createProjectFindOneMock(null)),
  updateOne: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(undefined) }),
};

const createQueryChain = (result: any) => ({
  sort: vi.fn().mockReturnValue({
    skip: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(result),
      }),
    }),
  }),
  skip: vi.fn().mockReturnValue({
    limit: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(result),
    }),
  }),
  limit: vi.fn().mockReturnValue({
    exec: vi.fn().mockResolvedValue(result),
  }),
  exec: vi.fn().mockResolvedValue(result),
});

const createUpdateChain = (result: any) => ({
  exec: vi.fn().mockResolvedValue(result),
});

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
    mockTaskModel.countDocuments.mockResolvedValue(0);
    service = new TaskService(mockTaskModel as any, mockProjectModel as any);
  });

  describe('create', () => {
    it('should create a task with tenantId', async () => {
      const createDto = {
        title: 'Test Task',
        description: 'Test description',
        projectId: 'project-1',
      };

      mockTaskModel.create.mockResolvedValue(mockTask);

      const result = await service.create(createDto, tenantId);

      expect(mockTaskModel.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId,
      });
      expect(result).toEqual(mockTask);
    });
  });

  describe('findAll', () => {
    it('should return all tasks for a tenant with pagination', async () => {
      const mockTasks = [mockTask];
      mockTaskModel.countDocuments.mockResolvedValue(1);
      mockTaskModel.find.mockReturnValue(createQueryChain(mockTasks));

      const result = await service.findAll(tenantId);

      expect(mockTaskModel.countDocuments).toHaveBeenCalledWith({ tenantId });
      expect(result.data).toEqual(mockTasks);
      expect(result.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      mockTaskModel.countDocuments.mockResolvedValue(0);
      mockTaskModel.find.mockReturnValue(createQueryChain([]));

      await service.findAll(tenantId, TaskStatus.TODO as any);

      expect(mockTaskModel.countDocuments).toHaveBeenCalledWith({
        tenantId,
        status: TaskStatus.TODO,
      });
    });
  });

  describe('findByProject', () => {
    it('should return tasks for a specific project', async () => {
      const projectId = 'project-1';
      const findChain = {
        sort: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([mockTask]),
        }),
      };
      mockTaskModel.find.mockReturnValue(findChain);

      const result = await service.findByProject(projectId, tenantId);

      expect(mockTaskModel.find).toHaveBeenCalledWith({
        projectId,
        tenantId,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      mockTaskModel.findOne.mockReturnValue(createQueryChain(mockTask));

      const result = await service.findOne('task-1', tenantId);

      expect(mockTaskModel.findOne).toHaveBeenCalledWith({
        _id: 'task-1',
        tenantId,
      });
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTaskModel.findOne.mockReturnValue(createQueryChain(null));

      await expect(service.findOne('nonexistent', tenantId)).rejects.toThrow(
        'Task not found',
      );
    });
  });

  describe('update', () => {
    it('should update and return the task', async () => {
      const updateDto = { title: 'Updated Title' };
      const updatedTask = { ...mockTask, ...updateDto };
      mockTaskModel.findOne.mockReturnValue(createQueryChain(mockTask));
      mockTaskModel.findOneAndUpdate.mockReturnValue(createUpdateChain(updatedTask));
      mockTaskModel.countDocuments.mockResolvedValue(5);

      const result = await service.update('task-1', tenantId, updateDto);

      expect(mockTaskModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'task-1', tenantId },
        { $set: updateDto },
        { new: true },
      );
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTaskModel.findOne.mockReturnValue(createQueryChain(null));

      await expect(
        service.update('nonexistent', tenantId, { title: 'New' }),
      ).rejects.toThrow('Task not found');
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      mockTaskModel.findOne.mockReturnValue(createQueryChain(mockTask));
      mockTaskModel.deleteOne.mockReturnValue(createUpdateChain({ deletedCount: 1 }));
      mockTaskModel.countDocuments.mockResolvedValue(2);

      const result = await service.remove('task-1', tenantId);

      expect(mockTaskModel.deleteOne).toHaveBeenCalledWith({
        _id: 'task-1',
        tenantId,
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTaskModel.findOne.mockReturnValue(createQueryChain(null));

      await expect(service.remove('nonexistent', tenantId)).rejects.toThrow(
        'Task not found',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update task status', async () => {
      mockTaskModel.findOne.mockReturnValue(createQueryChain(mockTask));
      mockTaskModel.findOneAndUpdate.mockReturnValue(createUpdateChain({ ...mockTask, status: TaskStatus.DONE }));
      mockTaskModel.countDocuments.mockResolvedValue(0);
      mockProjectModel.findOne.mockReturnValue(createProjectFindOneMock(null));

      const result = await service.updateStatus(
        'task-1',
        tenantId,
        TaskStatus.DONE as any,
      );

      expect(result.status).toBe(TaskStatus.DONE);
    });
  });
});
