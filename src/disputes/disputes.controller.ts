import { Controller, Delete, Param } from '@nestjs/common';
import { DisputesService } from './disputes.service';

@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.disputesService.deleteDispute(id); // Изменено с remove на deleteDispute
  }
}