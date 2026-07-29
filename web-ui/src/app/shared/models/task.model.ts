export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  assigneeIds?: string[];
  dueDate?: string | Date;
  parentTaskId?: string;
  order?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}
