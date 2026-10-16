import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Req,
  Param,
  Inject,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart-dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { PinoLogger } from 'pino-nestjs';
import { OptionalJwtAuthGuard } from '@/auth/guard/optional-jwt-auth.guard';
import { GetUserId } from '@/common/decorators/get-user-id-decorator';
import { PatchCourierDto } from './dto/patch-courier.dto';

@ApiTags('cart')
@ApiBearerAuth('JwtAuthGuard')
@UseGuards(OptionalJwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CartController.name);
  }

  @ApiOperation({summary: 'Get cart details'})
  @ApiResponse({
    status: 201,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 201,
        "message": [
            "No message specified"
        ],
        "data": {
            "id": "01a13ac5-f3b0-7256-bb27-6acabd0bc5ba",
            "userId": null,
            "sessionId": "441a6138-3061-48d1-b3ec-dd4aee591aa5",
            "subtotalIdr": 0,
            "taxIdr": 0,
            "shippingCostIdr": 0,
            "courierName": null,
            "courierCode": null,
            "shippingMethod": null,
            "orderId": null,
            "createdAt": "2026-10-14T14:16:53.937Z",
            "updatedAt": "2026-10-14T14:16:53.937Z",
            "expiresAt": "2026-10-21T14:16:53.880Z",
            "items": [],
            "totalWeight": 0
        },
        "timestamp": "2026-10-14T14:16:53.963Z"
      }
    }
  })
  @Get()
  async getCart(
    @GetUserId() userId: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const sessionId = req.cookies?.sessionId;
      let result = await this.cartService.getCart(userId, sessionId);

      if (!result) {
        const data = await this.cartService.getOrCreateCart(userId, sessionId);
        if (data.createdSessionId) {
          res.cookie('sessionId', data.createdSessionId, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
          });
        }
        result = { ...data.cart, totalWeight: 0 };
          this.logger.info({
            message: 'Cart created successfully',
            endpoint: 'GET /cart',
            userId: userId || 'guest',
            sessionId: data.createdSessionId,
            status: 'success',
          });
      }
      else {
          this.logger.info({
            message: 'Cart retrieved successfully',
            endpoint: 'GET /cart',
            userId: userId || 'guest',
            status: 'success',
          });
      }
      return result;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to retrieve cart',
        endpoint: 'GET /cart',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @ApiOperation({summary: 'Get cart\'s items value'})
  @ApiResponse({
    status: 201,
    description: 'Success',
    schema: {
      example: {
        itemCount: 0,
        subtotal: 0,
        total: 0,
      }
    }
  })
  @Get('totals')
  async getCartTotals(
    @GetUserId() userId: string | undefined,
    @Req() req: Request,
  ) {
    try {
      const sessionId = req.cookies?.sessionId;

      const result = await this.cartService.getCartTotals(userId, sessionId);
      this.logger.info({
        message: 'Cart totals retrieved successfully',
        endpoint: 'GET /cart/totals',
        userId: userId || 'guest',
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to retrieve cart totals',
        endpoint: 'GET /cart/totals',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @ApiOperation({summary: 'Merge guest\'s cart into user\'s cart.'})
  @ApiResponse({
    status: 201,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 201,
        "message": [
            "No message specified"
        ],
        "data": {
            "id": "01a13ac5-f3b0-7256-bb27-6acabd0bc5ba",
            "userId": "some-uuid",
            "sessionId": "441a6138-3061-48d1-b3ec-dd4aee591aa5",
            "subtotalIdr": 0,
            "taxIdr": 0,
            "shippingCostIdr": 0,
            "courierName": null,
            "courierCode": null,
            "shippingMethod": null,
            "orderId": null,
            "createdAt": "2026-10-14T14:16:53.937Z",
            "updatedAt": "2026-10-14T14:16:53.937Z",
            "expiresAt": "2026-10-21T14:16:53.880Z",
            "items": [],
            "totalWeight": 0
        },
        "timestamp": "2026-10-14T14:16:53.963Z"
      }
    }
  })
  @Post('merge')
  async mergeCart(
    @GetUserId() userId: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const sessionId = req.cookies?.sessionId;

      if (!userId || !sessionId) {
        this.logger.warn({
          message: 'Merge cart requires userId and sessionId',
          endpoint: 'POST /cart/merge',
          status: 'failure',
        });
        return { message: 'No session cart to merge' };
      }

      const result = await this.cartService.mergeCart(userId, sessionId);
      res.clearCookie('sessionId', {
          httpOnly: true,
          sameSite: 'lax',
      })
      this.logger.info({
        message: `Cart merged successfully and sessionId cookie ${sessionId} deleted`,
        endpoint: 'POST /cart/merge',
        userId,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to merge cart',
        endpoint: 'POST /cart/merge',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @ApiOperation({summary: 'Validate cart for checkout.'})
  @ApiResponse({
    status: 201,
    description: 'Success',
    schema: {
      example: { valid: true }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    schema: {
      example: {
        message: 'Cart validation failed',
        issues: 'The issue',
      }
    }
  })
  @Post('validate')
  async validateCart(
    @GetUserId() userId: string | undefined,
    @Req() req: Request,
  ) {
    try {
      const sessionId = req.cookies?.sessionId;
      const result = await this.cartService.validateCartForCheckout(
        userId,
        sessionId,
      );
      this.logger.info({
        message: 'Cart validated successfully',
        endpoint: 'POST /cart/validate',
        userId: userId || 'guest',
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to validate cart',
        endpoint: 'POST /cart/validate',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @ApiOperation({summary: 'Add item to cart.'})
  @ApiResponse({
    status: 201,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 201,
        "message": [
            "No message specified"
        ],
        "data": {
            "id": "01a13ac5-f3b0-7256-bb27-6acabd0bc5ba",
            "userId": "some-uuid",
            "sessionId": "441a6138-3061-48d1-b3ec-dd4aee591aa5",
            "subtotalIdr": 0,
            "taxIdr": 0,
            "shippingCostIdr": 0,
            "courierName": null,
            "courierCode": null,
            "shippingMethod": null,
            "orderId": null,
            "createdAt": "2026-10-14T14:16:53.937Z",
            "updatedAt": "2026-10-14T14:16:53.937Z",
            "expiresAt": "2026-10-21T14:16:53.880Z",
            "items": [],
            "totalWeight": 0
        },
        "timestamp": "2026-10-14T14:16:53.963Z",
        createdSessionId: 'cart session id'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Variant not found'
  })
  @ApiResponse({
    status: 400,
    description: 'Product unavailable or Variant mismatch with product or Quantity at 0 or Insufficient stock'
  })
  @Post('items')
  async addToCart(
    @GetUserId() userId: string | undefined,
    @Body() dto: AddToCartDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const sessionId = req.cookies?.sessionId;
      const { result, createdSessionId } = await this.cartService.addToCart(
        dto,
        userId,
        sessionId,
      );

      if (createdSessionId) {
        res.cookie('sessionId', createdSessionId, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
        });
      }
      this.logger.info({
        message: 'Item added to cart successfully',
        endpoint: 'POST /cart/items',
        userId: userId || 'guest',
        variantId: dto.variantId,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to add item to cart',
        endpoint: 'POST /cart/items',
        variantId: dto.variantId,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @ApiOperation({summary: 'Updates item quantity in a cart.'})
  @ApiResponse({
    status: 201,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 201,
        "message": [
            "No message specified"
        ],
        "data": {
            "id": "01a13ac5-f3b0-7256-bb27-6acabd0bc5ba",
            "userId": "some-uuid",
            "sessionId": "441a6138-3061-48d1-b3ec-dd4aee591aa5",
            "subtotalIdr": 0,
            "taxIdr": 0,
            "shippingCostIdr": 0,
            "courierName": null,
            "courierCode": null,
            "shippingMethod": null,
            "orderId": null,
            "createdAt": "2026-10-14T14:16:53.937Z",
            "updatedAt": "2026-10-14T14:16:53.937Z",
            "expiresAt": "2026-10-21T14:16:53.880Z",
            "items": ['some items details'],
            "totalWeight": 0
        },
        "timestamp": "2026-10-14T14:16:53.963Z",
      }
    }
  })
  @ApiResponse({ status:404, description: 'Item not found'})
  @ApiResponse({ status:400, description: 'Bad Request'})
  @Patch('items/:id')
  async updateItem(
    @Param('id') itemId: string,
    @GetUserId() userId: string | undefined,
    @Body() dto: UpdateCartItemDto,
    @Req() req: Request,
  ) {
    try {
      const sessionId = req.cookies?.sessionId;
      const result = await this.cartService.updateItemQuantity(
        itemId,
        dto.quantity,
        userId,
        sessionId,
      );
      this.logger.info({
        message: 'Cart item updated successfully',
        endpoint: 'PATCH /cart/items/:id',
        itemId,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to update cart item',
        endpoint: 'PATCH /cart/items/:id',
        itemId,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @ApiOperation({summary: 'Removes an item from a cart.'})
  @ApiResponse({
    status: 201,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 201,
        "message": [
            "No message specified"
        ],
        "data": {
            "id": "01a13ac5-f3b0-7256-bb27-6acabd0bc5ba",
            "userId": "some-uuid",
            "sessionId": "441a6138-3061-48d1-b3ec-dd4aee591aa5",
            "subtotalIdr": 0,
            "taxIdr": 0,
            "shippingCostIdr": 0,
            "courierName": null,
            "courierCode": null,
            "shippingMethod": null,
            "orderId": null,
            "createdAt": "2026-10-14T14:16:53.937Z",
            "updatedAt": "2026-10-14T14:16:53.937Z",
            "expiresAt": "2026-10-21T14:16:53.880Z",
            "items": ['some items details'],
            "totalWeight": 0
        },
        "timestamp": "2026-10-14T14:16:53.963Z",
      }
    }
  })
  @ApiResponse({ status:404, description: 'Item not found'})
  @ApiResponse({ status:400, description: 'Bad Request'})
  @Delete('items/:id')
  async removeItem(
    @Param('id') itemId: string,
    @GetUserId() userId: string | undefined,
    @Req() req: Request,
  ) {
    try {
      const sessionId = req.cookies?.sessionId;
      const result = await this.cartService.removeItem(
        itemId,
        userId,
        sessionId,
      );
      this.logger.info({
        message: 'Cart item removed successfully',
        endpoint: 'DELETE /cart/items/:id',
        itemId,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to remove cart item',
        endpoint: 'DELETE /cart/items/:id',
        itemId,
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }

  @ApiOperation({summary: 'Clear a cart courier/shipment information.'})
  @ApiResponse({
    status: 201,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 201,
        "message": [
            "No message specified"
        ],
        "data": {
            "id": "01a13ac5-f3b0-7256-bb27-6acabd0bc5ba",
            "userId": "some-uuid",
            "sessionId": "441a6138-3061-48d1-b3ec-dd4aee591aa5",
            "subtotalIdr": 0,
            "taxIdr": 0,
            "shippingCostIdr": 0, // becomes 0
            "courierName": null, // becomes null
            "courierCode": null, // becomes null
            "shippingMethod": null, // becomes null
            "orderId": null,
            "createdAt": "2026-10-14T14:16:53.937Z",
            "updatedAt": "2026-10-14T14:16:53.937Z",
            "expiresAt": "2026-10-21T14:16:53.880Z",
            "items": ['some items details'],
            "totalWeight": 0
        },
        "timestamp": "2026-10-14T14:16:53.963Z",
      }
    }
  })
  @Delete(':id/courier')
  async clearCartCourierInformation(@Param('id') id: string) {
      return this.cartService.clearCourierInformation(id);
  }

  @ApiOperation({summary: 'Updates a cart courier/shipment information.'})
  @ApiResponse({
    status: 201,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 201,
        "message": [
            "No message specified"
        ],
        "data": {
            "id": "01a13ac5-f3b0-7256-bb27-6acabd0bc5ba",
            "userId": "some-uuid",
            "sessionId": "441a6138-3061-48d1-b3ec-dd4aee591aa5",
            "subtotalIdr": 0,
            "taxIdr": 0,
            "shippingCostIdr": 12000,
            "courierName": 'Tung Tung',
            "courierCode": '67',
            "shippingMethod": 'Telepati',
            "orderId": null,
            "createdAt": "2026-10-14T14:16:53.937Z",
            "updatedAt": "2026-10-14T14:16:53.937Z",
            "expiresAt": "2026-10-21T14:16:53.880Z",
            "items": ['some items details'],
            "totalWeight": 0
        },
        "timestamp": "2026-10-14T14:16:53.963Z",
      }
    }
  })
  @Patch(':id/courier')
  async updateCourierInformation(@Param('id') id: string, @Body() dto: PatchCourierDto) {
      return this.cartService.updateCourierInformation(id, dto);
  }

  @ApiOperation({summary: 'Clear items from a cart.'})
  @ApiResponse({
    status: 201,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 201,
        "message": [
            "No message specified"
        ],
        "data": {
            "id": "01a13ac5-f3b0-7256-bb27-6acabd0bc5ba",
            "userId": "some-uuid",
            "sessionId": "441a6138-3061-48d1-b3ec-dd4aee591aa5",
            "subtotalIdr": 0,
            "taxIdr": 0,
            "shippingCostIdr": 0,
            "courierName": null,
            "courierCode": null,
            "shippingMethod": null,
            "orderId": null,
            "createdAt": "2026-10-14T14:16:53.937Z",
            "updatedAt": "2026-10-14T14:16:53.937Z",
            "expiresAt": "2026-10-21T14:16:53.880Z",
            "items": [],
            "totalWeight": 0
        },
        "timestamp": "2026-10-14T14:16:53.963Z",
      }
    }
  })
  @Delete()
  async clearCart(
    @GetUserId() userId: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const sessionId = req.cookies?.sessionId;
      const { cart, createdSessionId } = await this.cartService.getOrCreateCart(
        userId,
        sessionId,
      );
      if (createdSessionId) {
        res.cookie('sessionId', createdSessionId, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
        });
      }
      const result = await this.cartService.clearCart(cart.id);
      this.logger.info({
        message: 'Cart cleared successfully',
        endpoint: 'DELETE /cart',
        cartId: cart.id,
        status: 'success',
      });
      return result;
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to clear cart',
        endpoint: 'DELETE /cart',
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  }
}
