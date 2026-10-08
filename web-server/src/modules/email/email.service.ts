import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invoice, InvoiceStatus } from '../billing/schemas/invoice.schema';
import { Project } from '../project/schemas/project.schema';
import { buildInvoiceEmailHTML, InvoiceEmailVariables } from './templates/invoice-email.template';
import { buildPaymentConfirmationHTML, PaymentConfirmationVariables } from './templates/payment-confirmation.template';
import { buildOverdueReminderHTML, OverdueReminderVariables } from './templates/overdue-reminder.template';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private isMockMode: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('sendgrid.apiKey');
    this.isMockMode = !apiKey || apiKey.includes('placeholder');
  }

  async sendInvoiceEmail(invoice: Invoice, project: Project): Promise<void> {
    const clientPortalUrl = this.configService.get<string>('sendgrid.clientPortalUrl');
    const payLink = `${clientPortalUrl}/client-portal/invoices/${invoice._id}/pay`;

    const vars: InvoiceEmailVariables = {
      clientName: invoice.clientName,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      dueDate: invoice.dueDate?.toISOString() || new Date().toISOString(),
      projectName: project.name,
      payLink,
      notes: invoice.notes,
    };

    const html = buildInvoiceEmailHTML(vars);
    const pdfBuffer = await this.generateInvoicePDF(invoice, project);

    await this.sendEmail({
      to: invoice.clientEmail,
      subject: `Invoice ${invoice.invoiceNumber} from ${project.name}`,
      html,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: `${invoice.invoiceNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    });
  }

  async sendPaymentConfirmationEmail(invoice: Invoice): Promise<void> {
    const vars: PaymentConfirmationVariables = {
      clientName: invoice.clientName,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      paidAt: invoice.paidAt?.toISOString() || new Date().toISOString(),
    };

    const html = buildPaymentConfirmationHTML(vars);

    await this.sendEmail({
      to: invoice.clientEmail,
      subject: `Payment Received - Invoice ${invoice.invoiceNumber}`,
      html,
    });
  }

  async sendOverdueReminderEmail(invoice: Invoice): Promise<void> {
    const clientPortalUrl = this.configService.get<string>('sendgrid.clientPortalUrl');
    const payLink = `${clientPortalUrl}/client-portal/invoices/${invoice._id}/pay`;

    const dueDate = new Date(invoice.dueDate!);
    const now = new Date();
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    const vars: OverdueReminderVariables = {
      clientName: invoice.clientName,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      dueDate: invoice.dueDate!.toISOString(),
      daysOverdue,
      payLink,
    };

    const html = buildOverdueReminderHTML(vars);

    await this.sendEmail({
      to: invoice.clientEmail,
      subject: `Overdue: Invoice ${invoice.invoiceNumber}`,
      html,
    });
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
      content: string;
      filename: string;
      type: string;
      disposition: string;
    }>;
  }): Promise<void> {
    if (this.isMockMode) {
      this.logger.log(
        `[MOCK EMAIL] To: ${options.to}, Subject: ${options.subject}, Attachments: ${options.attachments?.length || 0}`,
      );
      return;
    }

    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.configService.get<string>('sendgrid.apiKey'));

      const msg: any = {
        to: options.to,
        from: {
          email: this.configService.get<string>('sendgrid.fromEmail'),
          name: this.configService.get<string>('sendgrid.fromName'),
        },
        subject: options.subject,
        html: options.html,
      };

      if (options.attachments && options.attachments.length > 0) {
        msg.attachments = options.attachments;
      }

      await sgMail.send(msg);
      this.logger.log(`Email sent to ${options.to}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${options.to}: ${errorMessage}`);
      throw error;
    }
  }

  private async generateInvoicePDF(invoice: Invoice, project: Project): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    const drawText = (text: string, x: number, y: number, size: number, f: any, color: any = rgb(0.1, 0.1, 0.1)) => {
      page.drawText(text, { x, y, size, font: f, color });
    };

    // Header
    page.drawRectangle({
      x: margin,
      y: y - 60,
      width: width - margin * 2,
      height: 60,
      color: rgb(0.388, 0.4, 0.945),
    });

    drawText('INVOICE', margin + 20, y - 25, 28, boldFont, rgb(1, 1, 1));
    drawText(invoice.invoiceNumber, margin + 20, y - 45, 14, font, rgb(0.9, 0.9, 1));

    y -= 80;

    // AgencyOS branding
    drawText('AgencyOS', margin, y, 16, boldFont, rgb(0.4, 0.4, 0.4));
    y -= 30;

    // Client details
    drawText('Bill To:', margin, y, 12, boldFont);
    y -= 20;
    drawText(invoice.clientName, margin, y, 11, font);
    y -= 15;
    drawText(invoice.clientEmail, margin, y, 11, font);
    y -= 15;
    drawText(`Project: ${project.name}`, margin, y, 11, font);

    // Invoice details on right side
    const rightX = width - margin - 150;
    let rightY = y;
    drawText('Invoice Date:', rightX, rightY, 10, boldFont);
    rightY -= 15;
    drawText(new Date(invoice.createdAt).toLocaleDateString(), rightX, rightY, 10, font);
    rightY -= 20;

    if (invoice.dueDate) {
      drawText('Due Date:', rightX, rightY, 10, boldFont);
      rightY -= 15;
      drawText(new Date(invoice.dueDate).toLocaleDateString(), rightX, rightY, 10, font);
      rightY -= 20;
    }

    drawText('Status:', rightX, rightY, 10, boldFont);
    rightY -= 15;
    drawText(invoice.status.toUpperCase(), rightX, rightY, 10, font);

    y -= 50;

    // Line Items
    if (invoice.lineItems && invoice.lineItems.length > 0) {
      drawText('Line Items', margin, y, 14, boldFont);
      y -= 25;

      // Table headers
      const col1 = margin;
      const col2 = width - margin - 280;
      const col3 = width - margin - 200;
      const col4 = width - margin - 120;
      const col5 = width - margin;

      drawText('Description', col1, y, 10, boldFont);
      drawText('Qty', col3, y, 10, boldFont);
      drawText('Rate', col4, y, 10, boldFont);
      drawText('Amount', col5, y, 10, boldFont);
      y -= 5;

      // Line under headers
      page.drawLine({
        start: { x: margin, y: y },
        end: { x: width - margin, y: y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 15;

      for (const item of invoice.lineItems) {
        drawText(item.description, col1, y, 10, font);
        drawText(item.quantity.toString(), col3, y, 10, font);
        drawText(`$${item.rate.toFixed(2)}`, col4, y, 10, font);
        drawText(`$${item.amount.toFixed(2)}`, col5, y, 10, font);
        y -= 18;
      }

      y -= 10;
    }

    // Expenses
    if (invoice.expenses && invoice.expenses.length > 0) {
      drawText('Expenses', margin, y, 14, boldFont);
      y -= 25;

      for (const expense of invoice.expenses) {
        drawText(expense.description, margin, y, 10, font);
        drawText(`$${expense.amount.toFixed(2)}`, width - margin, y, 10, font);
        y -= 18;
      }

      y -= 10;
    }

    // Totals
    const totalsX = width - margin - 200;
    
    page.drawRectangle({
      x: totalsX - 10,
      y: y - 60,
      width: 210,
      height: 70,
      color: rgb(0.96, 0.96, 0.98),
    });

    drawText('Subtotal:', totalsX, y, 11, font);
    drawText(`$${invoice.subtotal.toFixed(2)}`, width - margin, y, 11, font);
    y -= 20;

    if (invoice.tax && invoice.tax > 0) {
      drawText('Tax:', totalsX, y, 11, font);
      drawText(`$${invoice.tax.toFixed(2)}`, width - margin, y, 11, font);
      y -= 20;
    }

    drawText('Total:', totalsX, y, 14, boldFont);
    drawText(`$${invoice.total.toFixed(2)}`, width - margin, y, 14, boldFont, rgb(0.388, 0.4, 0.945));

    y -= 50;

    // Notes
    if (invoice.notes) {
      drawText('Notes:', margin, y, 12, boldFont);
      y -= 18;
      
      // Word wrap notes
      const words = invoice.notes.split(' ');
      let line = '';
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = font.widthOfTextAtSize(testLine, 10);
        if (testWidth > width - margin * 2) {
          drawText(line, margin, y, 10, font);
          line = word;
          y -= 15;
        } else {
          line = testLine;
        }
      }
      if (line) {
        drawText(line, margin, y, 10, font);
      }
    }

    // Footer
    const footerY = 30;
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height: footerY + 20,
      color: rgb(0.96, 0.96, 0.98),
    });
    drawText('Thank you for your business!', margin, footerY + 5, 10, font, rgb(0.5, 0.5, 0.5));

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
