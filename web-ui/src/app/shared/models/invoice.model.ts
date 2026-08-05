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
  paymentStages: PaymentStage[];
  expenses: InvoiceExpense[];
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

export interface PaymentStage {
  name: string;
  percentage: number;
  dueDate?: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paidAt?: Date;
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
