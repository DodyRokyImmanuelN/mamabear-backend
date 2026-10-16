import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CalculateShippingCostDto } from './dto/calculate-cost.dto';
import { GetUserId } from '@/common/decorators/get-user-id-decorator';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';

@ApiTags('shipping')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JwtAuthGuard')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @ApiOperation({summary:'Gets all provinces'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
          "Returned 34 provinces"
        ],
        "data": [
          {
            "id": 1,
            "name": "Neptunus"
          },
          {
            "id": 2,
            "name": "Jupiter"
          },
        ]
      }
    }
  })
  @Get('province')
  findAllProvince() {
    return this.shippingService.findAllProvince();
  }

  @ApiOperation({summary:'Gets all cities/kota/kabupaten in the province by province id'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
          "Returned 6 cities for province ID 4"
        ],
        "data": [
          {
            "id": 1,
            "name": "Mars"
          },
          {
            "id": 2,
            "name": "Venus"
          },
        ]
      }
    }
  })
  @Get('city/:provinceId')
  findCitiesByProvinceId(@Param('provinceId') provinceId: string) {
    return this.shippingService.findCitiesByProvinceId(provinceId);
  }

  @ApiOperation({summary:'Gets all kecamatan in the kota/kabupaten by city id'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
          "Returned 2 districts for city ID 4"
        ],
        "data": [
          {
            "id": 1,
            "name": "Pluto"
          },
          {
            "id": 2,
            "name": "Merkuri"
          },
        ]
      }
    }
  })
  @Get('district/:cityId')
  findDistrictsByCityId(@Param('cityId') cityId: string) {
    return this.shippingService.findDistrictsByCityId(cityId);
  }

  @ApiOperation({summary:'Gets all kelurahan in the kecamatan by district id'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
          "Returned 2 subdistricts for district ID 4"
        ],
        "data": [
          {
            "id": 1,
            "name": "Saturnus"
          },
          {
            "id": 2,
            "name": "Uranus"
          },
        ]
      }
    }
  })
  @Get('subdistrict/:districtId')
  findSubdistrictsByDistrictId(@Param('districtId') districtId: string) {
    return this.shippingService.findSubdistrictsByDistrictId(districtId);
  }

  @ApiOperation({summary:'Calculates shipping cost'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
          "Returned 2 subdistricts for district ID 4"
        ],
        "data": "{ shipping details }"
      }
    }
  })
  @Post('cost')
  calculateShippingCost(
    @GetUserId() userId: string | undefined,
    @Body() dto: CalculateShippingCostDto,
  ) {
    return this.shippingService.calculateShippingCost(userId, dto);
  }
}
