// session-reports.controller.ts

import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { SessionReportsService } from './session-reports.service';

@Controller('session-reports')
export class SessionReportsController {
    constructor(private readonly reportsService: SessionReportsService) {}

    @Get(':sessionId')
    async getReportBySession(@Param('sessionId') sessionId: string) {
        const report = await this.reportsService.getReportBySessionId(sessionId);
        if (!report) throw new NotFoundException('Session report not found');
        return report;
    }

    @Get()
    async getAllSummaries() {
        return this.reportsService.getAllSummaries();
    }
}
