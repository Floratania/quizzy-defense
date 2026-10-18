import {TeacherGuard} from '@/guards/teacher.guard';
// session-reports.controller.ts

import { Controller, Get, Param, NotFoundException, UseGuards, Req, Patch, Body } from '@nestjs/common';
import { AuthGuard } from '@/guards/auth.guard';
import { IsBoolean } from 'class-validator';
class ShareReportDto { @IsBoolean() shared: boolean; }
import { SessionReportsService } from './session-reports.service';

@Controller('session-reports')
@UseGuards(AuthGuard, TeacherGuard)
export class SessionReportsController {
    constructor(private readonly reportsService: SessionReportsService) {}

    @Get(':sessionId')
    async getReportBySession(@Param('sessionId') sessionId: string, @Req() req) {
        const report = await this.reportsService.getReportBySessionId(sessionId, req.user.id);
        if (!report) throw new NotFoundException('Session report not found');
        return report;
    }

    @Get()
    async getAllSummaries(@Req() req) {
        return this.reportsService.getAllSummaries(req.user.id);
    }

    @Patch(':sessionId/share-owner')
    shareWithOwner(@Param('sessionId') sessionId: string, @Req() req, @Body() dto: ShareReportDto) {
        return this.reportsService.shareWithOwner(sessionId, req.user.id, dto.shared);
    }
}
