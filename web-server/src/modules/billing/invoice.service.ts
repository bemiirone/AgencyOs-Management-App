import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Invoice, InvoiceStatus } from './schemas/invoice.schema';
import { CreateInvoiceDto, UpdateInvoiceDto, TimeAggregationQueryDto, CalculateTimeEntriesDto } from './dto/invoice.dto';
import { TimeEntry } from '../time/schemas/time-entry.schema';
import { Project } from '../project/schemas/project.schema';
import { EmailService } from '../email/email.service';

interface TimeEntryCalculationDetail {
  timeEntryId: string;
  description: string;
  date: string;
  totalHours: number;
  billableHours: number;
  overtimeHours: number;
  calculationMode: 'automatic' | 'manual';
}

interface TimeCalculationResult {
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

@Injectable()
export class InvoiceService {
  private isMockMode: boolean;

  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(TimeEntry.name) private timeEntryModel: Model<TimeEntry>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    this.isMockMode = !secretKey || secretKey.includes('placeholder');
  }

  async create(createInvoiceDto: CreateInvoiceDto, tenantId: string) {
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    const tax = createInvoiceDto.tax || 0;
    const subtotal = createInvoiceDto.subtotal || createInvoiceDto.amount;
    const total = subtotal + tax;

    const invoice = await this.invoiceModel.create({
      ...createInvoiceDto,
      tenantId,
      invoiceNumber,
      tax,
      total,
    });

    return invoice;
  }

  async findAll(tenantId: string, status?: InvoiceStatus) {
    const query: Record<string, unknown> = { tenantId };

    if (status) {
      query.status = status;
    }

    return this.invoiceModel
      .find(query)
      .populate('projectId', 'name')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, tenantId: string) {
    const invoice = await this.invoiceModel
      .findOne({ _id: id, tenantId })
      .populate('projectId', 'name')
      .populate('taskId', 'title')
      .exec();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(id: string, tenantId: string, updateInvoiceDto: UpdateInvoiceDto) {
    const invoice = await this.invoiceModel.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateInvoiceDto },
      { new: true },
    ).exec();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async remove(id: string, tenantId: string) {
    const result = await this.invoiceModel.deleteOne({ _id: id, tenantId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Invoice not found');
    }

    return { success: true };
  }

  async sendInvoice(id: string, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be sent');
    }

    const project = await this.projectModel.findById(invoice.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    try {
      await this.emailService.sendInvoiceEmail(invoice, project);
    } catch (error) {
      throw new BadRequestException(
        `Failed to send invoice email: ${error.message}. Invoice remains in draft status.`,
      );
    }

    invoice.status = InvoiceStatus.SENT;
    await invoice.save();

    return invoice;
  }

  async processPayment(id: string, tenantId: string, paymentMethodId: string) {
    const invoice = await this.findOne(id, tenantId);

    if (invoice.status !== InvoiceStatus.SENT) {
      throw new BadRequestException('Only sent invoices can be paid');
    }

    if (this.isMockMode) {
      return this.processMockPayment(invoice);
    }

    return this.processStripePayment(invoice, paymentMethodId);
  }

  async aggregateTime(query: TimeAggregationQueryDto, tenantId: string) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);

    const timeEntries = await this.timeEntryModel
      .find({
        tenantId,
        projectId: query.projectId,
        isBillable: true,
        isRunning: false,
        startTime: { $gte: startDate, $lte: endDate },
      })
      .exec();

    const totalSeconds = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalHours = totalSeconds / 3600;
    const totalDays = totalHours / 8;

    let amount = 0;
    if (query.rateType === 'hourly') {
      amount = totalHours * query.rate;
    } else {
      amount = totalDays * query.rate;
    }

    return {
      totalSeconds,
      totalHours: Math.round(totalHours * 100) / 100,
      totalDays: Math.round(totalDays * 100) / 100,
      entryCount: timeEntries.length,
      amount: Math.round(amount * 100) / 100,
      timeEntryIds: timeEntries.map((e) => e._id.toString()),
    };
  }

  private extractDaysFromHours(hours: number, workDayHours: number): { days: number; billableHours: number; overtimeHours: number } {
    if (hours <= 0) {
      return { days: 0, billableHours: 0, overtimeHours: 0 };
    }

    const fullPeriods = Math.floor(hours / 24);
    const remainder = hours - (fullPeriods * 24);

    let extraDays = 0;
    if (remainder >= workDayHours) {
      extraDays = 1;
    } else if (remainder >= workDayHours / 2) {
      extraDays = 0.5;
    } else if (remainder > 0) {
      extraDays = 0.25;
    }

    const totalDays = fullPeriods + extraDays;
    const billableHours = totalDays * workDayHours;
    const overtimeHours = Math.max(0, hours - billableHours);

    return { days: totalDays, billableHours, overtimeHours };
  }

  async calculateTimeEntries(query: CalculateTimeEntriesDto, tenantId: string): Promise<TimeCalculationResult> {
    const timeEntries = await this.timeEntryModel
      .find({
        tenantId,
        _id: { $in: query.timeEntryIds },
        isBillable: true,
        isRunning: false,
      })
      .exec();

    if (timeEntries.length === 0) {
      return {
        totalSeconds: 0,
        totalHours: 0,
        totalBillableHours: 0,
        totalOvertimeHours: 0,
        totalDays: 0,
        entryCount: 0,
        amount: 0,
        timeEntryIds: [],
        entries: [],
      };
    }

    const workDayHours = query.calculationOptions?.workDayHours ?? 8;
    const overtimeRate = query.calculationOptions?.overtimeRate ?? 1.5;
    const rate = query.rateType === 'hourly' ? (query.hourlyRate ?? 0) : (query.dailyRate ?? 0);

    const entries: TimeEntryCalculationDetail[] = [];
    const automaticEntries: TimeEntry[] = [];
    let totalAutomaticHours = 0;
    let totalManualHours = 0;

    for (const entry of timeEntries) {
      const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
      const entryHours = entry.duration / 3600;

      if (entry.calculationMode === 'automatic') {
        totalAutomaticHours += entryHours;
        automaticEntries.push(entry);
      } else {
        totalManualHours += entryHours;
        entries.push({
          timeEntryId: entry._id.toString(),
          description: entry.description || '',
          date: entryDate,
          totalHours: Math.round(entryHours * 100) / 100,
          billableHours: Math.round(entryHours * 100) / 100,
          overtimeHours: 0,
          calculationMode: 'manual',
        });
      }
    }

    let automaticDays = 0;
    let automaticBillableHours = 0;
    let automaticOvertimeHours = 0;

    if (totalAutomaticHours > 0) {
      const extraction = this.extractDaysFromHours(totalAutomaticHours, workDayHours);
      automaticDays = extraction.days;
      automaticBillableHours = extraction.billableHours;
      automaticOvertimeHours = extraction.overtimeHours;

      const totalAutoH = totalAutomaticHours;
      for (const entry of automaticEntries) {
        const entryHours = entry.duration / 3600;
        const proportion = entryHours / totalAutoH;
        const entryBillable = proportion * automaticBillableHours;
        const entryOvertime = proportion * automaticOvertimeHours;
        const entryDate = new Date(entry.startTime).toISOString().split('T')[0];

        entries.push({
          timeEntryId: entry._id.toString(),
          description: entry.description || '',
          date: entryDate,
          totalHours: Math.round(entryHours * 100) / 100,
          billableHours: Math.round(entryBillable * 100) / 100,
          overtimeHours: Math.round(entryOvertime * 100) / 100,
          calculationMode: 'automatic',
        });
      }
    }

    const totalSeconds = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalHours = totalSeconds / 3600;
    const totalBillableHours = entries.reduce((sum, e) => sum + e.billableHours, 0);
    const totalOvertimeHours = entries.reduce((sum, e) => sum + e.overtimeHours, 0);

    let amount = 0;
    let totalDays = automaticDays;

    if (query.rateType === 'hourly') {
      const regularAmount = totalBillableHours * rate;
      const overtimeAmount = totalOvertimeHours * rate * overtimeRate;
      amount = regularAmount + overtimeAmount;
    } else {
      const manualEntry = this.extractDaysFromHours(totalManualHours, workDayHours);
      totalDays += manualEntry.days;
      amount = totalDays * rate;

      entries.forEach((e) => {
        e.overtimeHours = 0;
      });
    }

    return {
      totalSeconds,
      totalHours: Math.round(totalHours * 100) / 100,
      totalBillableHours: Math.round(totalBillableHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      totalDays: Math.round(totalDays * 100) / 100,
      entryCount: timeEntries.length,
      amount: Math.round(amount * 100) / 100,
      timeEntryIds: timeEntries.map((e) => e._id.toString()),
      entries,
    };
  }

  private async processMockPayment(invoice: Invoice) {
    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();
    invoice.stripePaymentIntentId = `mock_pi_${Date.now()}`;

    await invoice.save();

    try {
      await this.emailService.sendPaymentConfirmationEmail(invoice);
    } catch (error) {
      console.error('Failed to send payment confirmation:', error);
    }

    return invoice;
  }

  private async processStripePayment(invoice: Invoice, paymentMethodId: string) {
    const stripe = require('stripe')(this.configService.get<string>('stripe.secretKey'));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoice.total * 100),
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        invoiceId: invoice._id.toString(),
        tenantId: invoice.tenantId,
      },
    });

    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();
    invoice.stripePaymentIntentId = paymentIntent.id;

    await invoice.save();

    return invoice;
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await this.invoiceModel.countDocuments({ tenantId }).exec();
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
