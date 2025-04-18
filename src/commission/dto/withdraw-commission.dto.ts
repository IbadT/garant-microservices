import { IsNumber, IsNotEmpty, Min, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawCommissionDto {
  @ApiProperty({
    description: 'Amount to withdraw',
    example: 1000,
    minimum: 0
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsNotEmpty({ message: 'Amount cannot be empty' })
  @Min(0, { message: 'Amount must be greater than 0' })
  amount: number;
  
  @ApiProperty({
    description: 'ID of the admin performing the withdrawal',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty({ message: 'Admin ID cannot be empty' })
  @IsUUID('4', { message: 'Admin ID must be a valid UUID' })
  admin_id: string;
} 