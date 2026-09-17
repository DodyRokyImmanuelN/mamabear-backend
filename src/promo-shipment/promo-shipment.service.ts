import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePromoShipmentDto } from './dto/create-promo-shipment.dto';
import { UpdatePromoShipmentDto } from './dto/update-promo-shipment.dto';
import { PromoShipmentRepository } from './promo-shipment.repository';
import { PinoLogger } from 'pino-nestjs';

@Injectable()
export class PromoShipmentService {
  constructor(
    private readonly repo: PromoShipmentRepository,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(PromoShipmentService.name)
  }

  // admin functions
  async create(dto: CreatePromoShipmentDto) {
    try {
      const result = await this.repo.create(dto);

      if (!result) throw new BadRequestException('Cannot create promo.');

      this.logger.info({
        message: 'Promo created successfully',
        endpoint: 'POST /admin/promo-shipment',
        promo: dto,
        status: 'success'
      });

      return {
        success: true,
        message: `Promo ${dto.name} has successfully created`,
        data: result
      };  
    } catch (error: any) {
      this.logger.error({
        message: 'Cannot create promo',
        endpoint: 'POST /admin/promo-shipment',
        promo: dto,
        status: 'error',
        error: error.message,
        code: error.code,
        meta: error.meta
      });
      throw error
    }
  }

  async findAll() {
    try {
      const result = await this.repo.findAll();

      this.logger.info({
        message: 'Fetched all promos',
        endpoint: 'GET /admin/promo-shipment',
        count: result.length,
        status: 'success',
      });

      return {
        success: true,
        message: `Fetched ${result.length} promos`,
        data: result
      };

    } catch (error: any) {
      this.logger.error({
        message: 'Failed to retrieve promos',
        endpoint: 'GET /admin/promo-shipment',
        status: 'error',
        error: error.message,
        code: error.code,
        meta: error.meta
      });
      throw error
    }
  }

  async findOne(code: string) {
    try {
      const result = await this.repo.findOneByCode(code);
      
      if (!result) throw new NotFoundException(`Not found promo with code ${code}`);

      this.logger.info({
        message: 'Fetched all promos',
        endpoint: `GET /admin/promo-shipment/${code}`,
        promo: result,
        status: 'success',
      });

      return {
        success: true,
        message: `Fetched promo with code ${result.code} `,
        data: result
      };

    } catch (error: any) {
      this.logger.error({
        message: 'Failed to retrieve promo',
        endpoint: `GET /admin/promo-shipment/${code}`,
        status: 'error',
        error: error.message
      });
      throw error
    }
  }

  async update(code: string, dto: UpdatePromoShipmentDto) {
    try {
      const result = await this.repo.update(code, dto)
      
      if (!result) throw new BadRequestException(`Cannot update promo with code ${code}`)

      this.logger.info({
        message: 'Promo updated',
        endpoint: `PATCH /admin/promo-shipment/${code}`,
        update: dto,
        status: 'success',
      });

      return {
        success: true,
        message: `Updated promo with code ${result.code}`,
        data: result
      };

    } catch (error: any) {
      this.logger.error({
        message: 'Failed to update promo',
        endpoint: `PATCH /admin/promo-shipment/${code}`,
        status: 'error',
        error: error.message,
        code: error.code,
        meta: error.meta
      })
      throw error
    }
  }

  async remove(code: string) {
    try {
      const result = await this.repo.remove(code)
      
      if (!result) throw new BadRequestException(`Cannot delete promo with code ${code}`)

      this.logger.info({
        message: 'Promo deleted',
        endpoint: `DELETE /admin/promo-shipment/${code}`,
        promo: result,
        status: 'success',
      });

      return {
        success: true,
        message: `Deleted promo with code ${result.code} `,
        data: result
      };

    } catch (error: any) {
      this.logger.error({
        message: 'Failed to delete promo',
        endpoint: `DELETE /admin/promo-shipment/${code}`,
        status: 'error',
        error: error.message,
        code: error.code,
        meta: error.meta
      })
      throw error
    }
  }

  // user functions
  async checkPromoUsage(userId: string, code: string) {
    try {
      const promo = await this.repo.findOneByCode(code)

      if (!promo) throw new NotFoundException('Promo not found')

      const used = await this.repo.checkPromoUsage(userId, promo.id)

      if (used) throw new ConflictException('Promo code has already been used')
      
      return {
        message: 'Promo is ready to use',
        promo: promo
      };  
    } catch (error) {
      throw error
    }
  }
  
  async usePromo(userId: string, promoCode: string) {
    try {
      const promo = await this.checkPromoUsage(userId, promoCode)

      if (!promo.promo) throw new BadRequestException('Cannot find promo usage')

      const result = await this.repo.usePromo(userId, promo.promo.id)

      if (!result) throw new BadRequestException('Cannot use promo.');

      this.logger.info({
        message: 'Promo used successfully',
        endpoint: 'POST /promo-shipment',
        name: promo.name,
        code: promo.code,
        user: userId,
        status: 'success'
      })

      return {
        success: true,
        message: `Promo ${promo.name} with code ${promo.code} has successfully used`,
        data: result
      };
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to use promo',
        endpoint: `POST /promo-shipment/${promoCode}`,
        status: 'error',
        error: error.message,
        code: error.code,
        meta: error.meta
      })
      throw error
    }
  }
}
