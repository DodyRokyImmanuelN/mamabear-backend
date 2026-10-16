import { OrderService } from './order.service';
import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CancelOrderDto } from './dto/cancel-order-item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { format } from '@fast-csv/format';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { Response } from 'express';
import { AdminActivityLogService } from '@/activity-log/admin-activity-log.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('order (admin)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
@Controller('admin/order')
@ApiBearerAuth('JwtAuthGuard')
export class OrderAdminController {
  constructor(
    private readonly orderService: OrderService,
    private readonly activityLogService: AdminActivityLogService,
  ) {}

  @ApiOperation({summary: 'Get invoice by order id'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
            invoiceNumber: `INV-SOMEDATE-SOMEORDERID`,
            issuedAt: 'SOMEDATE',
            OrderedItem: [{
              productName: 'product name',
              variantName: 'variant name',
              quantity: 10,
              price: '150000',
            }],
            ShippingAddress: 'Some Address',
            subtotalIdr: '1500000',
            shippingCostIdr: '75000',
            totalIdr: '1575000',
            PaymentMethod: 'Daun',
            InvoicePaymentStatus: 'UNPAID',
          }
    }
  })
  @ApiResponse({status: 404, description: 'Order id not found'})
  @ApiResponse({status: 400, description: 'Cannot generate invoice with invalid order status'})
  @Get(':id/invoice')
  getInvoice(@Req() req: any, @Param('id') id: string) {
    return this.orderService.getInvoice(req.user.sub, req.user.role, id);
  }

  @ApiOperation({summary: 'Gather orders to export'})
  @Get('export')
  async exportOrders(@Res() res: Response) {
    const result = await this.orderService.exportOrders();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');

    const csvStream = format({
      headers: [
        'Order ID',
        'Order Date',
        'Last Updated',
        'Order Status',
        'User ID',
        'User Name',
        'User Email',
        'User Phone Number',
        'Subtotal IDR',
        'Shipping Address',
        'Shipping Cost',
        'Courier Name',
        'Courier Code',
        'Shipping Method',
        'Tracking Number',
        'Payment Method',
      ],
    });

    csvStream.pipe(res);

    result.data.forEach((order) => {
      csvStream.write({
        'Order ID': order.OrderId,
        'Order Date': order.OrderDate,
        'Last Updated': order.LastUpdate,
        'Order Status': order.OrderStatus,
        'User ID': order.UserId,
        'User Name': order.UserName,
        'User Email': order.UserEmail,
        'User Phone Number': order.UserPhoneNumber,
        'Subtotal IDR': order.SubtotalIdr,
        'Shipping Address': order.ShippingAddress,
        'Shipping Cost': order.ShippingCostIdr,
        'Courier Name': order.CourierName,
        'Courier Code': order.CourierCode,
        'Shipping Method': order.shippingMethod,
        'Tracking Number': order.TrackingNumber,
        'Payment Method': order.PaymentMethod,
      });
    });

    csvStream.end();
  }

  @ApiOperation({summary: 'Gets all orders'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Returned 20 orders (page 1 of 6)`,
        data: '[{ orders details }]',
      }
    }
  })
  @Get()
  findAllOrders(@Query() query: AdminOrdersQueryDto) {
    return this.orderService.findAllOrders(query);
  }

  @ApiOperation({summary: 'Gets an order by id for Admin'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: 'Order found',
        data: '{ orders details }',
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Order with that id is not found'})
  @Get(':id')
  findOrderById(@Param('id') id: string) {
    return this.orderService.getOrderByIdForAdmin(id);
  }

  @ApiOperation({summary: 'Cancels an order'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Order 67 cancelled`,
        data: null,
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Order with that id is not found'})
  @ApiResponse({ status: 400, description: 'Unable to cancel order with the current status'})
  @Post(':id/cancel')
  async cancelOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    const result = await this.orderService.cancelOrder(
      req.user.role,
      req.user.sub,
      id,
      dto.reason,
    );
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'CANCEL', 'Order', id);
    }
    return result;
  }

  @ApiOperation({summary: 'Updates an order status'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Order 67 status updated to PAID`,
        data: '{ updated order details }',
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Order with that id is not found'})
  @Patch(':id/status')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    const result = await this.orderService.updateOrderStatus(
      req.user.sub,
      id,
      updateOrderDto,
    );
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'UPDATE_STATUS', 'Order', id);
    }
    return result;
  }

  @ApiOperation({summary: 'Updates an order tracking number'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 201,
        "message": [
            "No message specified"
        ],
        "data": '{ updated order details }',
        "timestamp": "2026-10-14T14:16:53.963Z"
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Order with that id is not found'})
  @Patch(':id/tracking')
  async updateTrackingNumber(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateTrackingDto: UpdateTrackingDto,
  ) {
    const result = await this.orderService.updateTrackingNumber(id, updateTrackingDto);
    this.activityLogService.log(req.user.sub, 'UPDATE_TRACKING', 'Order', id);
    return result;
  }
}
