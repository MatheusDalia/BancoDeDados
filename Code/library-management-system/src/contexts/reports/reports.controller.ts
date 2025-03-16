import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overdue')
  @ApiOperation({ summary: 'Get report of overdue loans' })
  @ApiResponse({ status: 200, description: 'Overdue loans report.' })
  async getOverdueLoans() {
    return await this.reportsService.getOverdueLoansReport();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary report' })
  @ApiResponse({ status: 200, description: 'Summary report of library data.' })
  async getSummary() {
    return await this.reportsService.getSummaryReport();
  }
}
