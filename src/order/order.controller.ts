import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { CancelOrderDto } from './dto/cancel-order-item.dto';
import { GetUserId } from '@/common/decorators/get-user-id-decorator';
import { PinoLogger } from 'pino-nestjs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('order')
@Controller('order')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JwtAuthGuard')
export class OrderController {
  constructor(
      private readonly orderService: OrderService,
      private readonly logger: PinoLogger,
  ) {}

  @Post(':id/cancel')
  cancelOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(
      req.user.role,
      req.user.sub,
      id,
      dto.reason,
    );
  }

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

  @ApiOperation({summary: 'Gets an order by id'})
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
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.orderService.getOrderById(req.user.sub, id);
  }

  @ApiOperation({summary: 'Gets all user\'s orders'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        data: '[{ orders details }]',
        pagination: { 
          limit: 10, 
          nextCursor : 2, 
          hasNextPage: null 
        },
      }
    }
  })
  @Get()
  findAll(@Req() req: any, @Query() paginationDto: OrderPaginationDto) {
    return this.orderService.getOrdersByUserId(req.user.sub, paginationDto);
  }

  @ApiOperation({summary: 'Create a new order'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Order 67 created successfully`,
        data: '{ order details }',
      }
    }
  })
  @ApiResponse({status: 404, description: 'User not found'})
  // refactor below
  @Post() // on checkout
  createOrderAfterCheckout(
    @Req() req: any,
    @Body() dto: CreateOrderDto,
  ) {
    this.logger.info(`Creating order for user with id ${req.user.sub}`);
    return this.orderService.createOrder(req.user.sub, dto); // orderId as param for everything below
  }
}
