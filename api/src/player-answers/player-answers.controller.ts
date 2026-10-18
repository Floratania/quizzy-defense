import {Body, Controller, Param, Patch, Req, UseGuards} from "@nestjs/common";
import {CreatePlayerAnswerDto} from "@/player-answers/dto/create-player-answer.dto";
import {PlayerAnswersService} from "@/player-answers/player-answers.service";
import {AuthGuard} from '@/guards/auth.guard';

@Controller('player-answers')
export class PlayerAnswersController {
    constructor(private readonly service: PlayerAnswersService) {}
    @UseGuards(AuthGuard)
    @Patch(':id/grade')
    grade(@Param('id') id:string,@Body() dto:{earnedPoints:number,isCorrect:boolean},@Req() req){return this.service.grade(id,req.user.id,dto);}
    //
    // @Post()
    // submit(@Body() dto: CreatePlayerAnswerDto) {
    //     return this.service.submit(dto);
    // }
}
