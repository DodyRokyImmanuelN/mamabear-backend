import { PrismaService } from "@/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { CreatePromoShipmentDto } from "./dto/create-promo-shipment.dto";
import { UpdatePromoShipmentDto } from "./dto/update-promo-shipment.dto";
import { UsePromoShipmentDto } from "./dto/use-promo-shipment.dto";

@Injectable()
export class PromoShipmentRepository{
  constructor(private readonly prisma: PrismaService) {}

  // admin functions
  async create(newPromo: CreatePromoShipmentDto) {
    return await this.prisma.$transaction(async (tx) => {
      return tx.promoCode.create({
        data: newPromo
      })
    });
  }

  async update(code : string, newData: UpdatePromoShipmentDto) {
    return await this.prisma.$transaction(async (tx) => {
      return tx.promoCode.update({
        where: {
          code
        },
        data: {
          ...newData
        }
      })
    })
  }

  async remove(code : string) {
    return await this.prisma.$transaction(async (tx) => {
      return tx.promoCode.delete({
        where: {
          code
        }
      })
    })
  }

  async findAll() {
    return await this.prisma.$transaction(async (tx) => {
      return tx.promoCode.findMany()
    })
  }
  
  async findOneByCode(code : string) {
    return await this.prisma.$transaction(async (tx) => {
      return tx.promoCode.findUnique({
        where: {
          code
        }
      })
    })
  }

  // user functions
  async checkPromoUsage(userId: string, promoCodeId : number) {
    return await this.prisma.$transaction(async (tx) => {
      return tx.promoUsage.findUnique({
        where: {
          promoCodeId_userId: {
            promoCodeId,
            userId
          }
        }
      })
    })
  }

  async usePromo(userId: string, promoCodeId: number) {
    return await this.prisma.$transaction(async (tx) => {
      return tx.promoUsage.create({
        data:{
          userId,
          promoCodeId
        }
      })
    })
  }
}