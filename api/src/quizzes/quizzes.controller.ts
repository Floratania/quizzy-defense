import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req} from '@nestjs/common';
import {QuizzesService} from './quizzes.service';
import {CreateQuizDto} from './dto/create-quiz.dto';
import {UpdateQuizDto} from './dto/update-quiz.dto';
import {AuthGuard} from "@/guards/auth.guard";
import * as authTypes from "@/auth/types/auth.types";

@Controller('quizzes')
export class QuizzesController {
    constructor(private readonly quizzesService: QuizzesService) {
    }

    @UseGuards(AuthGuard)
    @Post()
    create(@Body() createQuizDto: CreateQuizDto, @Req() req) {
        return this.quizzesService.create(createQuizDto, req.user);
    }

    @Get()
    findAll() {
        return this.quizzesService.findAll();
    }

    @UseGuards(AuthGuard)
    @Get('my')
    findMyBookings(@Req() req: authTypes.AuthenticatedRequest) {
        return this.quizzesService.findByUser(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.quizzesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
        return this.quizzesService.update(+id, updateQuizDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.quizzesService.remove(+id);
    }
}
