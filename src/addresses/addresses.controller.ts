import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { GetUserId } from '@/common/decorators/get-user-id-decorator';

@ApiTags('addresses')
@ApiBearerAuth('JwtAuthGuard')
@UseGuards(JwtAuthGuard)
@Controller('me/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @ApiOperation({ summary: 'Menambahkan alamat baru user' })
  @ApiResponse({
    status: 201,
    description: 'Buat alamat baru untuk user',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: [
            "No message specified"
        ],
        data: {
            "id": 12,
            "userId": "5a8057dc-f967-45bc-8f03-b13e65bcb36b",
            "name": "John Doe",
            "phone": "081234567890",
            "provinceId": 11,
            "provinceName": "Jawa Timur",
            "cityId": 444,
            "cityName": "Surabaya",
            "districtId": 5678,
            "districtName": "Sambikerep",
            "subdistrictId": 69298,
            "subdistrictName": "Lontar",
            "postalCode": "60216",
            "road": "Jl. Raya Lontar No. 123",
            "completeAddress": "Jl. Raya Lontar No. 123, Lontar, Sambikerep, Surabaya, 60216 - Jawa Timur | Note: Sebelah minimarket",
            "detail": "Sebelah minimarket",
            "usedFor": "Rumah"
        },
        "timestamp": "2026-10-14T12:21:57.705Z"
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Gagal buat alamat baru',
    schema: {
      example: {
        status: 400,
        message: 'Address not created'
      }
    }
  })
  @Post()
  addMyAddress(
    @GetUserId() userId: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressesService.addMyAddress(userId, createAddressDto);
  }

  @ApiOperation({ summary: 'Ambil semua alamat user' })
  @ApiResponse({
    status: 201,
    description: 'Sukses',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
            "No message specified"
        ],
        "data": [
            {
                "id": 7,
                "userId": "5a8057dc-f967-45bc-8f03-b13e65bcb36b",
                "name": "admin mamabear",
                "phone": "0856123456",
                "provinceId": 1,
                "provinceName": "NUSA TENGGARA BARAT (NTB)",
                "cityId": 1,
                "cityName": "MATARAM",
                "districtId": 3,
                "districtName": "CAKRANEGARA",
                "subdistrictId": 20,
                "subdistrictName": "CAKRANEGARA BARAT",
                "postalCode": "83239",
                "road": "Jl. Abu Dhabi Sejahtera Selamanya",
                "completeAddress": "Jl. Abu Dhabi Sejahtera Selamanya, CAKRANEGARA BARAT, CAKRANEGARA, MATARAM, NUSA TENGGARA BARAT (NTB) 83239",
                "detail": "Sebelah rumah pak Bari",
                "usedFor": "RUMAHAN"
            },
            {
                "id": 12,
                "userId": "5a8057dc-f967-45bc-8f03-b13e65bcb36b",
                "name": "John Doe",
                "phone": "081234567890",
                "provinceId": 11,
                "provinceName": "Jawa Timur",
                "cityId": 444,
                "cityName": "Surabaya",
                "districtId": 5678,
                "districtName": "Sambikerep",
                "subdistrictId": 69298,
                "subdistrictName": "Lontar",
                "postalCode": "60216",
                "road": "Jl. Raya Lontar No. 123",
                "completeAddress": "Jl. Raya Lontar No. 123, Lontar, Sambikerep, Surabaya, 60216 - Jawa Timur | Note: Sebelah minimarket",
                "detail": "Sebelah minimarket",
                "usedFor": "Rumah"
            }
        ],
        "timestamp": "2026-10-14T13:15:15.753Z"
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Mismatch user and address',
  })
  @Get()
  findMyAddresses(@GetUserId() userId: string) {
    return this.addressesService.findMyAddresses(userId);
  }

  @ApiOperation({ summary: 'Ambil salah satu alamat user' })
  @ApiResponse({
    status: 201,
    description: 'Sukses',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
            "No message specified"
        ],
        "data": [
            {
                "id": 12,
                "userId": "5a8057dc-f967-45bc-8f03-b13e65bcb36b",
                "name": "John Doe",
                "phone": "081234567890",
                "provinceId": 11,
                "provinceName": "Jawa Timur",
                "cityId": 444,
                "cityName": "Surabaya",
                "districtId": 5678,
                "districtName": "Sambikerep",
                "subdistrictId": 69298,
                "subdistrictName": "Lontar",
                "postalCode": "60216",
                "road": "Jl. Raya Lontar No. 123",
                "completeAddress": "Jl. Raya Lontar No. 123, Lontar, Sambikerep, Surabaya, 60216 - Jawa Timur | Note: Sebelah minimarket",
                "detail": "Sebelah minimarket",
                "usedFor": "Rumah"
            }
        ],
        "timestamp": "2026-10-14T13:15:15.753Z"
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Mismatch user and address',
  })
  @Get(':id')
  findMyAddress(@GetUserId() userId: string, @Param('id') id: string) {
    return this.addressesService.findMyAddress(userId, +id);
  }

  @ApiOperation({ summary: 'Update salah satu alamat user' })
  @ApiResponse({
    status: 201,
    description: 'Sukses',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
            "No message specified"
        ],
        "data": [
            {
                "id": 12,
                "userId": "5a8057dc-f967-45bc-8f03-b13e65bcb36b",
                "name": "Ahmad Mulyadi",
                "phone": "081234567890",
                "provinceId": 11,
                "provinceName": "Jawa Timur",
                "cityId": 444,
                "cityName": "Surabaya",
                "districtId": 5678,
                "districtName": "Sambikerep",
                "subdistrictId": 69298,
                "subdistrictName": "Lontar",
                "postalCode": "60216",
                "road": "Jl. Raya Lontar No. 123",
                "completeAddress": "Jl. Raya Lontar No. 123, Lontar, Sambikerep, Surabaya, 60216 - Jawa Timur | Note: Sebelah minimarket",
                "detail": "Sebelah minimarket",
                "usedFor": "Rumah"
            }
        ],
        "timestamp": "2026-10-14T13:15:15.753Z"
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Mismatch user and address',
  })
  @Put(':id')
  updateMyAddress(
    @GetUserId() userId: string,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.updateMyAddress(userId, +id, updateAddressDto);
  }

  @ApiOperation({ summary: 'Hapus salah satu alamat user' })
  @ApiResponse({
    status: 201,
    description: 'Sukses',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
            "Address deleted successfully"
        ],
        "data": [
            {
                "id": 12,
                "userId": "5a8057dc-f967-45bc-8f03-b13e65bcb36b",
                "name": "John Doe",
                "phone": "081234567890",
                "provinceId": 11,
                "provinceName": "Jawa Timur",
                "cityId": 444,
                "cityName": "Surabaya",
                "districtId": 5678,
                "districtName": "Sambikerep",
                "subdistrictId": 69298,
                "subdistrictName": "Lontar",
                "postalCode": "60216",
                "road": "Jl. Raya Lontar No. 123",
                "completeAddress": "Jl. Raya Lontar No. 123, Lontar, Sambikerep, Surabaya, 60216 - Jawa Timur | Note: Sebelah minimarket",
                "detail": "Sebelah minimarket",
                "usedFor": "Rumah"
            }
        ],
        "timestamp": "2026-10-14T13:15:15.753Z"
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Mismatch user and address',
  })
  @ApiResponse({
    status: 400,
    description: 'Delete address failed',
  })
  @Delete(':id')
  deleteMyAddress(@GetUserId() userId: string, @Param('id') id: string) {
    return this.addressesService.deleteMyAddress(userId, +id);
  }
}
