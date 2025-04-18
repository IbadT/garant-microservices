import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptDealDto {
  @ApiProperty({
    description: 'ID of the deal to accept',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty({ message: 'Deal ID cannot be empty' })
  @IsUUID('4', { message: 'Deal ID must be a valid UUID' })
  dealId: string;
  
  @ApiProperty({
    description: 'ID of the user accepting the deal',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsString()
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;
} 