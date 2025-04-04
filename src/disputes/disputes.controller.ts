import { Controller, Delete, Param } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Disputes')
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @ApiOperation({ summary: 'Delete dispute', description: 'Deletes a dispute by ID' })
  @ApiParam({ name: 'id', description: 'Dispute ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Dispute successfully deleted' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.disputesService.deleteDispute(id); // Изменено с remove на deleteDispute
  }
}