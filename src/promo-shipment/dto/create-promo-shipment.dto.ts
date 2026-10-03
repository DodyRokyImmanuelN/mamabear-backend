import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePromoShipmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsNotEmpty()
  isPercentage: boolean;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
