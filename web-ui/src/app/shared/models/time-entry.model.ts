export interface TimeEntry {
  _id: string;
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
  isBillable: boolean;
  isRunning: boolean;
  hourlyRate?: number;
  calculationMode?: 'automatic' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}
