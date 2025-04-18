import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateDealRequest {
  @ApiProperty({ description: 'ID of the deal initiator', example: 'user123' })
  @IsString()
  initiator_id: string;
  
  @ApiProperty({ description: 'ID of the deal target', example: 'user456' })
  @IsString()
  target_id: string;
  
  @ApiProperty({ description: 'Amount of the deal', example: 1000 })
  @IsNumber()
  amount: number;
  
  @ApiProperty({ description: 'Description of the deal', example: 'Payment for services' })
  @IsString()
  description: string;
  
  @ApiProperty({ description: 'Whether the initiator is the customer', example: true })
  @IsBoolean()
  is_customer_initiator: boolean;
}

export class DealResponse {
  @ApiProperty({ description: 'ID of the deal', example: 'deal123' })
  @IsString()
  id: string;
  
  @ApiProperty({ description: 'Status of the deal', example: 'CREATED' })
  @IsString()
  status: string;
  
  @ApiProperty({ description: 'Message about the deal operation', example: 'Deal created successfully', required: false })
  @IsString()
  message?: string;
}