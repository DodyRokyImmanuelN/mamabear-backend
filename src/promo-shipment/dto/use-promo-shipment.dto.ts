import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class UsePromoShipmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}
