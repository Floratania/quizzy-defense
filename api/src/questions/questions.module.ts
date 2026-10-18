import {Module} from '@nestjs/common';
import {QuestionsService} from './questions.service';
import {QuestionsController} from './questions.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Question} from "@/questions/entities/question.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Question])],
    controllers: [],
    providers: [QuestionsService],
})
export class QuestionsModule {
}
