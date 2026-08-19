export interface Invoice {
  _id: string;
  invoiceNumber: string;
  projectId: string;
  projectName?: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  billingType: 'budget' | 'hourly' | 'daily' | 'manual';
  lineItems: InvoiceLineItem[];
  expenses: InvoiceExpense[];
  taskId?: string;
  taskName?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  hourlyRate?: number;
  dailyRate?: number;
  totalHours?: number;
  totalDays?: number;
  subtotal: number;
  amount: number;
  tax: number;
  total: number;
  dueDate: Date;
  paidAt?: Date;
  timeEntryIds?: string[];
  taskIds?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceExpense {
  description: string;
  amount: number;
  date?: Date;
}

export interface TimeAggregationResult {
  totalSeconds: number;
  totalHours: number;
  totalDays: number;
  entryCount: number;
  amount: number;
  timeEntryIds: string[];
}
