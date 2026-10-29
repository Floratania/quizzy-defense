import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionBankItem } from './entities/question-bank-item.entity';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';
import { Question } from '@/questions/entities/question.entity';
import {QuestionBankFolder} from './entities/question-bank-folder.entity';

@Module({
    imports: [TypeOrmModule.forFeature([QuestionBankItem, Question, QuestionBankFolder])],
    controllers: [QuestionBankController],
    providers: [QuestionBankService],
})
export class QuestionBankModule {}
