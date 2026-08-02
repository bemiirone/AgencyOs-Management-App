import { Task } from '../../shared/models/task.model';

export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  assigneeIds?: string[];
  createdBy?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  assigneeIds?: string[];
}
