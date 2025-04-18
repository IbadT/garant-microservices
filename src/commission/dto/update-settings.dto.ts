import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommissionSettingsDto {
  @ApiProperty({
    description: 'Commission percentage',
    example: 5.0,
    minimum: 0,
    maximum: 100
  })
  @IsNumber({}, { message: 'Percentage must be a number' })
  @IsNotEmpty({ message: 'Percentage cannot be empty' })
  @Min(0, { message: 'Percentage must be greater than or equal to 0' })
  @Max(100, { message: 'Percentage must be less than or equal to 100' })
  percentage: number;
  
  @ApiProperty({
    description: 'Minimum commission amount',
    example: 100,
    minimum: 0
  })
  @IsNumber({}, { message: 'Minimum amount must be a number' })
  @IsNotEmpty({ message: 'Minimum amount cannot be empty' })
  @Min(0, { message: 'Minimum amount must be greater than or equal to 0' })
  min_amount: number;
} 