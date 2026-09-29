import { CreateInvoicePayload, UpdateInvoicePayload } from '../../../stores/invoice.types';

type MaybePopulated<T> = T | { _id: T };

export function extractId<T>(value: MaybePopulated<T> | undefined | null): T | undefined {
  if (!value) return undefined;
  return typeof value === 'object' ? (value as { _id: T })._id : value;
}

export interface InvoiceFormLineItem {
  description?: string;
  quantity?: number;
  rate?: number;
  amount?: number;
}

export interface InvoiceFormExpense {
  description?: string;
  amount?: number;
  date?: string;
}

export interface InvoiceFormValue {
  projectId: string;
  taskId?: string;
  clientName: string;
  clientEmail: string;
  billingType: string;
  hourlyRate?: number;
  dailyRate?: number;
  totalHours?: number;
  totalDays?: number;
  manualHours?: number;
  manualDays?: number;
  workDayHours?: number;
  overtimeRate?: number;
  overtimeHours?: number;
  subtotal?: number;
  amount?: number;
  tax?: number;
  dueDate?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  lineItems?: InvoiceFormLineItem[];
  expenses?: InvoiceFormExpense[];
}

export interface InvoiceExpensePayload {
  description: string;
  amount: number;
  date?: string;
}

export type InvoicePayload = CreateInvoicePayload | UpdateInvoicePayload;

