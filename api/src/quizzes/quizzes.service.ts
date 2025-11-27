import {Injectable, NotFoundException} from '@nestjs/common';
import {CreateQuizDto} from './dto/create-quiz.dto';
import {UpdateQuizDto} from './dto/update-quiz.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Quiz} from "@/quizzes/entities/quiz.entity";
import {Question} from "@/questions/entities/question.entity";
import {Answer} from "@/answers/entities/answer.entity";

@Injectable()
export class QuizzesService {
    constructor(
        @InjectRepository(Quiz)
        private readonly quizRepository: Repository<Quiz>,
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,
        @InjectRepository(Answer)
        private readonly answerRepository: Repository<Answer>,
    ) {
    }

    async create(dto: CreateQuizDto, userId: number) {
        const quiz = this.quizRepository.create({
            title: dto.title,
            description: dto.description,
            userId: userId, // або userId: dto.userId
            questions: dto.questions?.map(q => this.questionRepository.create({
                text: q.text,
                mediaUrl: q.mediaUrl || null,
                timeLimit: q.timeLimit,
                points: q.points,
                answers: q.answers?.map(a => this.answerRepository.create({
                    text: a.text,
                    isCorrect: a.isCorrect,
                })),
            })),
        });


        return await this.quizRepository.save(quiz);
    }


    async findAll() {
        return await this.quizRepository.find();
    }

    async findOne(id: string) {
        const quiz = await this.quizRepository.findOne({
            where: { id },
            relations: {
                questions: {
                    answers: true
                }
            }
        });

        if (!quiz) {
            throw new NotFoundException(`Quiz with id ${id} not found`);
        }

        return quiz;
    }


    async findByUser(id: number) {
        console.log()
        const quiz = await this.quizRepository.find({
            where: { userId: id },
        });

        if (!quiz) {
            throw new NotFoundException(`Quiz for user ${id} not found`);
        }

        return quiz;
    }

    update(id: number, updateQuizDto: UpdateQuizDto) {
        return `This action updates a #${id} quiz`;
    }

    remove(id: number) {
        return `This action removes a #${id} quiz`;
    }
}
