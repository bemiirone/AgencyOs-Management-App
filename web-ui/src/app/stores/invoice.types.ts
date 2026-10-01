export interface TimeEntryCalculationDetail {
  timeEntryId: string;
  description: string;
  date: string;
  totalHours: number;
  billableHours: number;
  overtimeHours: number;
  calculationMode: 'automatic' | 'manual';
}

export interface TimeAggregationResult {
  totalSeconds: number;
  totalHours: number;
  totalBillableHours: number;
  totalOvertimeHours: number;
  totalDays: number;
  entryCount: number;
  amount: number;
  timeEntryIds: string[];
  entries: TimeEntryCalculationDetail[];
}

export interface InvoiceBillingDetails {
  clientId?: string;
  lineItems?: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  expenses?: Array<{ description: string; amount: number; date?: string }>;
  taskId?: string;
  dateRange?: { startDate: string; endDate: string };
  hourlyRate?: number;
  dailyRate?: number;
  totalHours?: number;
  totalDays?: number;
  workDayHours?: number;
  overtimeRate?: number;
  overtimeHours?: number;
}

export interface CreateInvoicePayload extends InvoiceBillingDetails {
  projectId: string;
  clientName: string;
  clientEmail: string;
  billingType?: 'budget' | 'hourly' | 'daily' | 'manual';
  subtotal: number;
  amount: number;
  tax?: number;
  dueDate?: string;
  timeEntryIds?: string[];
  taskIds?: string[];
  notes?: string;
  manualHours?: number;
  manualDays?: number;
}

export interface UpdateInvoicePayload extends InvoiceBillingDetails {
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  billingType?: 'budget' | 'hourly' | 'daily' | 'manual';
  subtotal?: number;
  amount?: number;
  tax?: number;
  total?: number;
  dueDate?: string;
  timeEntryIds?: string[];
  notes?: string;
}

export interface CalculateTimePayload {
  timeEntryIds: string[];
  rateType: 'hourly' | 'daily';
  hourlyRate?: number;
  dailyRate?: number;
  calculationOptions?: {
    workDayHours?: number;
    overtimeRate?: number;
  };
}

export interface TimeCalculationResult {
  totalSeconds: number;
  totalHours: number;
  totalBillableHours: number;
  totalOvertimeHours: number;
  totalDays: number;
  entryCount: number;
  amount: number;
  timeEntryIds: string[];
  entries: TimeEntryCalculationDetail[];
}
