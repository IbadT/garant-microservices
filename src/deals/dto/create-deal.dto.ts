import { IsString, IsNotEmpty, IsNumber, IsBoolean, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDealDto {
  @ApiProperty({
    description: 'ID of the deal initiator',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty({ message: 'Initiator ID cannot be empty' })
  @IsUUID('4', { message: 'Initiator ID must be a valid UUID' })
  initiatorId: string;
  
  @ApiProperty({
    description: 'ID of the deal target',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsString()
  @IsNotEmpty({ message: 'Target ID cannot be empty' })
  @IsUUID('4', { message: 'Target ID must be a valid UUID' })
  targetId: string;
  
  @ApiProperty({
    description: 'Amount of the deal',
    example: 1000,
    minimum: 0.01
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;
  
  @ApiProperty({
    description: 'Description of the deal',
    example: 'Payment for services'
  })
  @IsString()
  @IsNotEmpty({ message: 'Description cannot be empty' })
  description: string;
  
  @ApiProperty({
    description: 'Whether the initiator is the customer',
    example: true
  })
  @IsBoolean({ message: 'isCustomerInitiator must be a boolean' })
  isCustomerInitiator: boolean;
} 