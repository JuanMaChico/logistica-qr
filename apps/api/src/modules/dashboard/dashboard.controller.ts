import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { DashboardStats, EquipmentByCategory, EventsByMonth, TopEquipment } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get('stats')
  async getStats(@CurrentUser() user: AuthenticatedUser): Promise<DashboardStats> {
    return this.service.getStats(user.orgId);
  }

  @Get('equipment-by-category')
  async getEquipmentByCategory(@CurrentUser() user: AuthenticatedUser): Promise<EquipmentByCategory[]> {
    return this.service.getEquipmentByCategory(user.orgId);
  }

  @Get('events-by-month')
  async getEventsByMonth(
    @CurrentUser() user: AuthenticatedUser,
    @Query('months') months: string = '6',
  ): Promise<EventsByMonth[]> {
    return this.service.getEventsByMonth(user.orgId, parseInt(months, 10) || 6);
  }

  @Get('top-equipment')
  async getTopEquipment(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit: string = '5',
  ): Promise<TopEquipment[]> {
    return this.service.getTopEquipment(user.orgId, parseInt(limit, 10) || 5);
  }
}
