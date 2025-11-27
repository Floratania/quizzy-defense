import {Body, Controller, Post} from "@nestjs/common";
import {CreatePlayerAnswerDto} from "@/player-answers/dto/create-player-answer.dto";
import {PlayerAnswersService} from "@/player-answers/player-answers.service";

@Controller('player-answers')
export class PlayerAnswersController {
    constructor(private readonly service: PlayerAnswersService) {}
    //
    // @Post()
    // submit(@Body() dto: CreatePlayerAnswerDto) {
    //     return this.service.submit(dto);
    // }
}
