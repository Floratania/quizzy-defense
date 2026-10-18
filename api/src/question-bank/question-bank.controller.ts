import {TeacherGuard} from '@/guards/teacher.guard';
import { Body, Controller, Delete, Get, Param, Post, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/guards/auth.guard';
import { CreateQuestionBankItemDto } from './dto/create-question-bank-item.dto';
import { QuestionBankService } from './question-bank.service';

@UseGuards(AuthGuard, TeacherGuard)
@Controller('question-bank')
export class QuestionBankController {
    constructor(private readonly service: QuestionBankService) {}

    @Get('shared-banks') banks(@Req()req) {return this.service.banks(req.user.id);}
    @Get('collaborators') members(@Req()req) {return this.service.collaborators(req.user.id);}
    @Post('collaborators') share(@Req()req,@Body()dto:{email:string,role:string}) {return this.service.share(req.user.id,dto.email,dto.role);}
    @Delete('collaborators/:memberId') revoke(@Req()req,@Param('memberId')member:string) {return this.service.revoke(req.user.id,Number(member));}
    @Patch(':id') update(@Req()req,@Param('id')id:string,@Body()dto:CreateQuestionBankItemDto) {return this.service.update(id,req.user.id,dto);}

    @Post()
    create(@Body() dto: CreateQuestionBankItemDto, @Req() req) {
        return this.service.create(dto, req.user.id);
    }

    @Post('examples')
    addExamples(@Req() req) {
        return this.service.addExamples(req.user.id);
    }

    @Get()
    findAll(@Req() req, @Query('search') search?: string, @Query('topic') topic?: string, @Query('ownerId') ownerId?: string) {
        return this.service.sharedItems(req.user.id, ownerId ? Number(ownerId) : req.user.id, search, topic);
    }

    @Get('pick/automatic')
    async pick(@Req() req, @Query('topic') topic = '', @Query('easy') easy = '0', @Query('medium') medium = '0', @Query('hard') hard = '0', @Query('ownerId') ownerId?:string) {
        const owner=ownerId?Number(ownerId):req.user.id;await this.service.bankRole(req.user.id,owner);
        return this.service.pick(owner, topic, Number(easy), Number(medium), Number(hard));
    }

    @Get(':id/usage')
    usage(@Param('id') id: string, @Req() req) { return this.service.usage(id, req.user.id); }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req) {
        return this.service.remove(id, req.user.id);
    }
}
