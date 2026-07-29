export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'email' | 'websocket' | 'both';
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
