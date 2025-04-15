import { Controller, Get, Post, Body, UseGuards, Param, Put } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateCommissionSettingsDto } from './dto/update-settings.dto';
import { WithdrawCommissionDto } from './dto/withdraw-commission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('commission')
@Controller('commission')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get commission settings' })
  @ApiResponse({ status: 200, description: 'Returns commission settings' })
  @Roles(UserRole.ADMIN)
  async getSettings() {
    return this.commissionService.getCommissionSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update commission settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @Roles(UserRole.ADMIN)
  async updateSettings(@Body() updateSettingsDto: UpdateCommissionSettingsDto) {
    return this.commissionService.updateCommissionSettings(
      updateSettingsDto.percentage,
      updateSettingsDto.min_amount
    );
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get commission balance' })
  @ApiResponse({ status: 200, description: 'Returns commission balance' })
  @Roles(UserRole.ADMIN)
  async getBalance() {
    return this.commissionService.getCommissionBalance();
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw commission' })
  @ApiResponse({ status: 200, description: 'Commission withdrawn successfully' })
  @Roles(UserRole.ADMIN)
  async withdrawCommission(@Body() withdrawDto: WithdrawCommissionDto) {
    return this.commissionService.withdrawCommission(
      withdrawDto.amount,
      withdrawDto.admin_id
    );
  }
} 