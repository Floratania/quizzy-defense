import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseIntPipe} from '@nestjs/common';
import {ShareQuizDto} from './dto/share-quiz.dto';
import {QuizzesService} from './quizzes.service';
import {CreateQuizDto} from './dto/create-quiz.dto';
import {UpdateQuizDto} from './dto/update-quiz.dto';
import {AuthGuard} from "@/guards/auth.guard";
import * as authTypes from "@/auth/types/auth.types";
import {GenerateQuizDto} from './dto/generate-quiz.dto';
import {QuizGenerationService} from './quiz-generation.service';

@Controller('quizzes')
export class QuizzesController {
    constructor(private readonly quizzesService: QuizzesService, private readonly quizGenerationService: QuizGenerationService) {
    }

    @UseGuards(AuthGuard)
    @Post('generate')
    generate(@Body() dto: GenerateQuizDto) {
        return this.quizGenerationService.generate(dto);
    }

    @UseGuards(AuthGuard)
    @Post()
    create(@Body() createQuizDto: CreateQuizDto, @Req() req) {
        return this.quizzesService.create(createQuizDto, req.user.id);
    }

    @UseGuards(AuthGuard)
    @Post(':id/duplicate')
    duplicate(@Param('id') id: string, @Req() req) {
        return this.quizzesService.duplicate(id, req.user.id);
    }

    @UseGuards(AuthGuard)
    @Get()
    findAll(@Req() req) {
        return this.quizzesService.findByUser(req.user.id);
    }

    @UseGuards(AuthGuard)
    @Get('my')
    findMyBookings(@Req() req: authTypes.AuthenticatedRequest) {
        return this.quizzesService.findByUser(req.user.id);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @Req() req) {
        return this.quizzesService.access(id, req.user.id);
    }

    @UseGuards(AuthGuard)
    @Get(':id/collaborators')
    collaborators(@Param('id') id:string,@Req() req) {return this.quizzesService.collaborators(id,req.user.id);}
    @UseGuards(AuthGuard)
    @Post(':id/collaborators')
    share(@Param('id') id:string,@Req() req,@Body() dto:ShareQuizDto) {return this.quizzesService.share(id,req.user.id,dto);}
    @UseGuards(AuthGuard)
    @Delete(':id/collaborators/:member')
    revoke(@Param('id') id:string,@Param('member', ParseIntPipe) member:number,@Req() req) {return this.quizzesService.revoke(id,req.user.id,member);}

    @UseGuards(AuthGuard)
    @Get(':id/history')
    history(@Param('id') id: string, @Req() req) { return this.quizzesService.history(id, req.user.id); }

    @UseGuards(AuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto, @Req() req: authTypes.AuthenticatedRequest) {
        return this.quizzesService.update(id, updateQuizDto, req.user.id);
    }

    @UseGuards(AuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: authTypes.AuthenticatedRequest) {
        return this.quizzesService.remove(id, req.user.id);
    }
}
