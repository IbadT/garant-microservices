import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteDisputeDto {
  @IsNotEmpty()
  @IsUUID()
  disputeId: string;
} 