import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/guards/auth.guard';
import { CreateQuestionBankItemDto } from './dto/create-question-bank-item.dto';
import { QuestionBankService } from './question-bank.service';

@UseGuards(AuthGuard)
@Controller('question-bank')
export class QuestionBankController {
    constructor(private readonly service: QuestionBankService) {}

    @Post()
    create(@Body() dto: CreateQuestionBankItemDto, @Req() req) {
        return this.service.create(dto, req.user.id);
    }

    @Post('examples')
    addExamples(@Req() req) {
        return this.service.addExamples(req.user.id);
    }

    @Get()
    findAll(@Req() req, @Query('search') search?: string, @Query('topic') topic?: string) {
        return this.service.findAll(req.user.id, search, topic);
    }

    @Get('pick/automatic')
    pick(@Req() req, @Query('topic') topic = '', @Query('easy') easy = '0', @Query('medium') medium = '0', @Query('hard') hard = '0') {
        return this.service.pick(req.user.id, topic, Number(easy), Number(medium), Number(hard));
    }

    @Get(':id/usage')
    usage(@Param('id') id: string, @Req() req) { return this.service.usage(id, req.user.id); }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req) {
        return this.service.remove(id, req.user.id);
    }
}
