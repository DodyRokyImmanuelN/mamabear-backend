import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { PinoLogger } from 'pino-nestjs';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('payment')
@Controller('payment')
@ApiBearerAuth('JwtAuthGuard')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly logger: PinoLogger,
  ) {}

  @ApiOperation({ summary: 'Creates a new payment transaction'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Created paymentRedirectUrl for order 67`,
        data: '{ payment details }',
      }
    }
  })
  @ApiResponse({status: 404, description: 'Order id not found'})
  @ApiResponse({status: 403, description: 'Mismatch user and order'})
  @ApiResponse({status: 400, description: 'Order already paid or Payment is still pending'})
  @UseGuards(JwtAuthGuard)
  @Post('create')
  createTransaction(@Req() req: any, @Body() dto: CreateTransactionDto) {
    return this.paymentService.createTransaction(req.user, dto);
  }
  
  @ApiOperation({ summary: 'Handles payment notification'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: 'ok',
        data: null,
      }
    }
  })
  @ApiResponse({status: 403, description: 'Mismatch key'})
  @Post('notification')
  handleNotification(@Body() notification: any) {
    this.logger.info(`Processing inbound notification: ${notification}`);
    return this.paymentService.handleNotification(notification);
  }

  @ApiOperation({ summary: 'Syncronizes order status with payment status'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: 'Order status synced',
        data: '{ synced order details }',
      }
    }
  })
  @ApiResponse({status: 403, description: 'Mismatch user and order'})
  @ApiResponse({status: 404, description: 'Order id does not exists'})
  @UseGuards(JwtAuthGuard)
  @Get('status/:orderId')
  syncStatus(@Req() req: any, @Param('orderId') orderId: string) {
    return this.paymentService.syncOrderStatus(req.user, orderId);
  }
}
