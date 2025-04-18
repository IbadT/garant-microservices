import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateDisputeDto {
  @ApiProperty({ description: 'ID of the deal associated with the dispute', example: 'deal123' })
  @IsString()
  dealId: string;
  
  @ApiProperty({ description: 'ID of the user who created the dispute', example: 'user123' })
  @IsString()
  userId: string;
  
  @ApiProperty({ description: 'Reason for the dispute', example: 'Service not provided as agreed' })
  @IsString()
  reason: string;
}
