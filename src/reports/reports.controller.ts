import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stats')
  async getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('activities')
  async getActivities(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('actionType') actionType?: string,
    @Query('userId') userId?: string,
    @Query('documentId') documentId?: string,
  ) {
    return this.reportsService.getActivities({ page, limit, actionType, userId, documentId });
  }
}
