export interface TimeEntry {
  id: string;
  description?: string;
  projectId: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
  userId: string;
  userName?: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  billable: boolean;
  hourlyRate?: number;
  createdAt: Date;
  updatedAt: Date;
}
