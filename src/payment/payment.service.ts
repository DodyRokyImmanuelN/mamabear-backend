import 'dotenv/config';
import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ServiceResult } from '@/common/ServiceResult';
import { QrisNotificationDto } from './dto/notifications.dto';
import { MidtransService } from './midtrans.service';
import { OrderRepository } from '@/order/order.repository';
import crypto from 'crypto';
import { OrderStatus } from '@/generated/prisma';
import { Response } from 'express';
import { NotFoundError } from 'rxjs';
import { TransactionCustomerDto } from './dto/customer.dto';
import { PinoLogger } from 'pino-nestjs';

@Injectable()
export class PaymentService {
  constructor(
    private readonly snap: MidtransService,
    private readonly orderRepository: OrderRepository,
    private readonly logger: PinoLogger,
  ) {}
  FRONTEND_URL = process.env.FRONTEND_URL!;
  SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
  // note: can only fit in transaction_details, customer_details does not work yet
  async createTransaction(
    user: any,
    dto: CreateTransactionDto,
  ): Promise<ServiceResult<any>> {
    const { orderId } = dto;
    const order = await this.orderRepository.findById(orderId);
    if (!order)
      throw new NotFoundException(
        `Order with orderId ${orderId} does not exist`,
      );
    if (order.userId != user.sub)
      throw new ForbiddenException(
        `Order ${orderId} does not belong to current user!`,
      );
    if (order.status === OrderStatus.PAYMENT_PAID)
      throw new BadRequestException(
        'Order sudah dibayar, tidak dapat membuat transaksi ulang',
      );
    if (
      order.status === OrderStatus.PAYMENT_PENDING &&
      order.paymentRedirectUrl
    )
      throw new BadRequestException(
        'Masih ada transaksi menunggu pembayaran. Selesaikan pembayaran atau tunggu transaksi expired sebelum membuat ulang.',
      );
    const customerDetails: TransactionCustomerDto = {
      firstName: user.name,
      email: user.email,
      phone: user.phone,
    };
    const transaction = await this.snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: order.grandTotalIdr,
      },
      customer_details: customerDetails,
      expiry: {
        unit: 'minutes',
        duration: Number(process.env.MIDTRANS_EXPIRY_MINUTES ?? 1440),
      },
      finish_redirect_url: `${this.FRONTEND_URL}/checkout/success/${orderId}`,
      callbacks: {
        pending: `${this.FRONTEND_URL}/checkout/payment/${orderId}`,
        error: `${this.FRONTEND_URL}/checkout/payment/${orderId}`,
      },
    } as any);
    const updatedOrder = await this.orderRepository.update(
      { id: orderId },
      { paymentRedirectUrl: transaction.redirect_url },
    );
    return {
      success: true,
      message: `Created paymentRedirectUrl for order ${orderId}`,
      data: updatedOrder,
    };
  }

  async syncOrderStatus(
    user: any,
    orderId: string,
  ): Promise<ServiceResult<any>> {
    const order = await this.orderRepository.findById(orderId);
    if (!order)
      throw new NotFoundException(
        `Order with orderId ${orderId} does not exist`,
      );
    if (order.userId != user.sub)
      throw new ForbiddenException(
        `Order ${orderId} does not belong to current user!`,
      );

    try {
      const status = await this.snap.getStatus(orderId);
      await this.applyMidtransStatus(
        orderId,
        status.transaction_status,
        status.fraud_status,
      );
    } catch (error: any) {
      // transaksi belum pernah dibuat (404): biarkan order apa adanya
      if (error?.httpStatusCode === 404 || error?.statusCode === '404') {
        return {
          success: true,
          message: 'Transaksi belum ditemukan',
          data: await this.orderRepository.findById(orderId),
        };
      }
      throw error;
    }

    return {
      success: true,
      message: 'Order status synced',
      data: await this.orderRepository.findById(orderId),
    };
  }

  private async applyMidtransStatus(
    orderId: string,
    transactionStatus: string,
    fraudStatus?: string,
  ) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      this.logger.warn(
        { orderId, transactionStatus },
        'Payment notification for unknown order, ignored',
      );
      return;
    }
    if (order.status === OrderStatus.PAYMENT_PAID) {
      this.logger.debug(
        { orderId },
        'Order already paid, ignore status change',
      );
      return;
    }

    switch (transactionStatus) {
      case 'capture':
        if (fraudStatus === 'accept')
          await this.orderRepository.handleCompleteOrder(orderId);
        break;
      case 'settlement':
        await this.orderRepository.handleCompleteOrder(orderId);
        break;
      case 'cancel':
      case 'deny':
      case 'expire':
        await this.orderRepository.update(
          { id: orderId },
          { status: OrderStatus.PAYMENT_FAILED },
        );
        break;
      case 'pending':
        await this.orderRepository.update(
          { id: orderId },
          { status: OrderStatus.PAYMENT_PENDING },
        );
        break;
      default:
        this.logger.error(
          `Cannot process transaction with status: ${transactionStatus}`,
        );
        throw new UnprocessableEntityException(
          `Cannot process transaction with status: ${transactionStatus}`,
        );
    }
  }

  async handleNotification(notification: any): Promise<ServiceResult<null>> {
    try {
      const orderId = notification.order_id;
      const statusCode = notification.status_code;
      const grossAmount = notification.gross_amount;
      const signatureKey = notification.signature_key;
      const transactionStatus = notification.transaction_status;
      const fraudStatus = notification.fraud_status;

      const hash = crypto
        .createHash('sha512')
        .update(orderId + statusCode + grossAmount + this.SERVER_KEY)
        .digest('hex');
      if (hash !== signatureKey) {
        throw new UnauthorizedException(
          'Signature key and hash does not match',
        );
      }
      await this.applyMidtransStatus(orderId, transactionStatus, fraudStatus);
      return {
        success: true,
        message: 'ok',
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }
}
