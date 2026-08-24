import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto, TimeAggregationQueryDto } from './dto/invoice.dto';
import { InvoiceStatus } from './schemas/invoice.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../modules/auth/enums/user-role.enum';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  async create(@Body() createInvoiceDto: CreateInvoiceDto, @TenantId() tenantId: string) {
    return this.invoiceService.create(createInvoiceDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  async findAll(@TenantId() tenantId: string, @Query('status') status?: InvoiceStatus) {
    const invoices = await this.invoiceService.findAll(tenantId, status);
    return invoices.map((invoice) => ({
      ...invoice.toObject(),
      projectName: invoice.projectId ? (invoice.projectId as any).name : null,
      taskName: invoice.taskId ? (invoice.taskId as any).title : null,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const invoice = await this.invoiceService.findOne(id, tenantId);
    return {
      ...invoice.toObject(),
      projectName: invoice.projectId ? (invoice.projectId as any).name : null,
      taskName: invoice.taskId ? (invoice.taskId as any).title : null,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoiceService.update(id, tenantId, updateInvoiceDto);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send invoice to client' })
  async send(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.invoiceService.sendInvoice(id, tenantId);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Process payment for invoice' })
  async pay(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('paymentMethodId') paymentMethodId: string,
  ) {
    return this.invoiceService.processPayment(id, tenantId, paymentMethodId);
  }

  @Post('aggregate-time')
  @ApiOperation({ summary: 'Aggregate billable time entries for invoice generation' })
  async aggregateTime(
    @Body() query: TimeAggregationQueryDto,
    @TenantId() tenantId: string,
  ) {
    return this.invoiceService.aggregateTime(query, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.invoiceService.remove(id, tenantId);
  }
}
