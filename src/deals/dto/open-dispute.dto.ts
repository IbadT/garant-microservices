import { IsString, IsNotEmpty, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenDisputeDto {
  @ApiProperty({
    description: 'ID of the deal to open a dispute for',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty({ message: 'Deal ID cannot be empty' })
  @IsUUID('4', { message: 'Deal ID must be a valid UUID' })
  dealId: string;
  
  @ApiProperty({
    description: 'ID of the user opening the dispute',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsString()
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;
  
  @ApiProperty({
    description: 'Reason for opening the dispute',
    example: 'The service was not provided as agreed'
  })
  @IsString()
  @IsNotEmpty({ message: 'Reason cannot be empty' })
  @MinLength(10, { message: 'Reason must be at least 10 characters long' })
  reason: string;
} 