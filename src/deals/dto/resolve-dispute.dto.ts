import { IsString, IsNotEmpty, IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveDisputeDto {
  @ApiProperty({
    description: 'ID of the deal with the dispute',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty({ message: 'Deal ID cannot be empty' })
  @IsUUID('4', { message: 'Deal ID must be a valid UUID' })
  dealId: string;
  
  @ApiProperty({
    description: 'ID of the dispute to resolve',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsString()
  @IsNotEmpty({ message: 'Dispute ID cannot be empty' })
  @IsUUID('4', { message: 'Dispute ID must be a valid UUID' })
  disputeId: string;
  
  @ApiProperty({
    description: 'Resolution of the dispute',
    example: 'CUSTOMER_WON',
    enum: ['CUSTOMER_WON', 'VENDOR_WON']
  })
  @IsString()
  @IsNotEmpty({ message: 'Resolution cannot be empty' })
  @IsIn(['CUSTOMER_WON', 'VENDOR_WON'], { message: 'Resolution must be either CUSTOMER_WON or VENDOR_WON' })
  resolution: string;
  
  @ApiProperty({
    description: 'ID of the moderator resolving the dispute',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  @IsString()
  @IsNotEmpty({ message: 'Moderator ID cannot be empty' })
  @IsUUID('4', { message: 'Moderator ID must be a valid UUID' })
  moderatorId: string;
} 