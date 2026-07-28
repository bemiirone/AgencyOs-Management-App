import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Invoice, InvoiceStatus } from './schemas/invoice.schema';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoiceService {
  private isMockMode: boolean;

  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    private configService: ConfigService,
  ) {
    this.isMockMode = !this.configService.get<string>('stripe.secretKey') ||
      this.configService.get<string>('stripe.secretKey')?.includes('placeholder');
  }

  async create(createInvoiceDto: CreateInvoiceDto, tenantId: string) {
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    const tax = createInvoiceDto.tax || 0;
    const total = createInvoiceDto.amount + tax;

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
    const query: any = { tenantId };

    if (status) {
      query.status = status;
    }

    return this.invoiceModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, tenantId: string) {
    const invoice = await this.invoiceModel.findOne({ _id: id, tenantId }).exec();

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

  private async processMockPayment(invoice: Invoice) {
    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();
    invoice.stripePaymentIntentId = `mock_pi_${Date.now()}`;

    await invoice.save();

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
