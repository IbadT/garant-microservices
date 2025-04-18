import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmCompletionDto {
  @ApiProperty({
    description: 'ID of the deal to confirm completion',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty({ message: 'Deal ID cannot be empty' })
  @IsUUID('4', { message: 'Deal ID must be a valid UUID' })
  dealId: string;
} 