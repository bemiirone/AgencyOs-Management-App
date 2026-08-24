export interface NotificationTypeConfig {
  enabled: boolean;
  titleTemplate: string;
  messageTemplate: string;
}

export interface NotificationSettings {
  _id: string;
  enabled: boolean;
  projectDueSoon: NotificationTypeConfig;
  projectOverdue: NotificationTypeConfig;
  taskDueSoon: NotificationTypeConfig;
  taskOverdue: NotificationTypeConfig;
  invoiceDueSoon: NotificationTypeConfig;
  invoiceOverdue: NotificationTypeConfig;
  lastRunAt?: string;
  lastRunStatus?: string;
  lastRunCount: number;
  createdAt: string;
  updatedAt: string;
}
