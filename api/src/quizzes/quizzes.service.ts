import { validateSelection } from './question-selection';
import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {CreateQuizDto} from './dto/create-quiz.dto';
import {UpdateQuizDto} from './dto/update-quiz.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Quiz} from "@/quizzes/entities/quiz.entity";
import {Question} from "@/questions/entities/question.entity";
import {Answer} from "@/answers/entities/answer.entity";
import {QuestionType} from "@/questions/entities/question.entity";

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
        dto.questions.forEach((question) => this.validateInteractiveQuestion(question));
        validateSelection(dto.questions, dto.questionSelection);
        const quiz = this.quizRepository.create({
            title: dto.title,
            questionSelection: dto.questionSelection || null,
            description: dto.description,
            topic: dto.topic?.trim() || 'Без теми',
            passThreshold: dto.passThreshold ?? 60, availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
            availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null, maxAttempts: dto.maxAttempts ?? 0,
            requireFullscreen: dto.requireFullscreen ?? false, trackTabSwitches: dto.trackTabSwitches ?? false,
            showQuestionLeaderboard: dto.showQuestionLeaderboard ?? false,
            feedbackMode: dto.feedbackMode,
            shuffleQuestions: dto.shuffleQuestions ?? false,
            shuffleAnswers: dto.shuffleAnswers ?? false,
            userId: userId,
            questions: dto.questions?.map((q, position) => this.questionRepository.create({
                text: q.text,
                difficulty: q.difficulty || 'medium',
                explanation: q.explanation || null,
                mediaUrl: q.mediaUrl || null,
                timeLimit: q.timeLimit,
                points: q.points,
                position,
                type: q.type,
                configuration: q.configuration ?? null,
                answers: q.answers?.map(a => this.answerRepository.create({
                    text: a.text,
                    mediaUrl: a.mediaUrl || null,
                    isCorrect: a.isCorrect,
                })),
            })),
        });


        return this.quizRepository.manager.transaction(async (manager) => {
            const saved = await manager.save(Quiz, quiz);
            await manager.query('INSERT INTO quiz_change_history ("quizId","actorId",action,details) VALUES ($1,$2,$3,$4)', [saved.id, userId, 'CREATED', JSON.stringify({ title: saved.title, questionCount: saved.questions.length })]);
            return { ...saved, accessRole: 'OWNER' };
        });
    }

    private validateInteractiveQuestion(question: CreateQuizDto['questions'][number]) {
        if (question.type === QuestionType.MATCHING) {
            const pairs = question.configuration?.pairs;
            if (!Array.isArray(pairs) || pairs.length < 2) {
                throw new BadRequestException('Matching question requires at least two pairs');
            }
        }
        if (question.type === QuestionType.ORDERING) {
            const items = question.configuration?.items;
            if (!Array.isArray(items) || items.length < 2) {
                throw new BadRequestException('Ordering question requires at least two items');
            }
        }
        if (question.type === QuestionType.OPEN_TEXT
            && !question.answers.some((answer) => answer.isCorrect && answer.text.trim())) {
            throw new BadRequestException('Text question requires a correct answer');
        }
        if (question.type === QuestionType.FILL_BLANK) {
            const blankCount = question.text.split('___').length - 1;
            const items = question.configuration?.items;
            if (!Array.isArray(items) || blankCount < 2 || blankCount > 8 || items.length !== blankCount) {
                throw new BadRequestException('Fill blank question requires 2-8 blanks and the same number of words');
            }
        }
        if (question.type === QuestionType.MULTIPLE_RESPONSE
            && question.answers.filter((answer) => answer.isCorrect).length < 2) {
            throw new BadRequestException('Multiple response question requires at least two correct answers');
        }
    }


    async findAll() {
        return await this.quizRepository.find();
    }

    async findOne(id: string) {
        const quiz = await this.quizRepository.findOne({
            where: { id },
            order: { questions: { position: 'ASC' } },
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


    async access(id: string, userId: number, edit = false) {
        const quiz = await this.findOne(id);
        if (quiz.userId === userId) return {...quiz, accessRole: 'OWNER'};
        const rows = await this.quizRepository.query('SELECT role FROM quiz_collaborators WHERE "quizId"=$1 AND "userId"=$2', [id,userId]);
        if (!rows.length || (edit && rows[0].role !== 'EDITOR')) throw new ForbiddenException('Недостатньо прав доступу');
        return {...quiz, accessRole: rows[0].role};
    }
    async collaborators(id: string, userId: number) {
        const quiz = await this.findOne(id);
        if (quiz.userId !== userId) throw new ForbiddenException();
        return this.quizRepository.query('SELECT c."userId",c.role,u.name,u.email FROM quiz_collaborators c JOIN "user" u ON u.id=c."userId" WHERE c."quizId"=$1',[id]);
    }
    async share(id: string, userId: number, dto: {email: string, role: string}) {
        await this.collaborators(id, userId);
        if (!['VIEWER', 'EDITOR'].includes(dto.role) || typeof dto.email !== 'string') throw new BadRequestException();
        const users = await this.quizRepository.query(`SELECT id,email FROM "user" WHERE lower(email)=lower($1) AND role IN ('TEACHER','ADMIN')`, [dto.email.trim()]);
        if (!users.length) throw new BadRequestException('Викладача з такою поштою не знайдено. Спочатку він має зареєструватися в Quizzy.');
        if (users[0].id === userId) throw new BadRequestException('Ви вже власник');
        await this.quizRepository.manager.transaction(async (manager) => {
            const previous = await manager.query('SELECT role FROM quiz_collaborators WHERE "quizId"=$1 AND "userId"=$2 FOR UPDATE', [id, users[0].id]);
            if (previous[0]?.role === dto.role) return;
            await manager.query('INSERT INTO quiz_collaborators ("quizId","userId",role) VALUES ($1,$2,$3) ON CONFLICT ("quizId","userId") DO UPDATE SET role=EXCLUDED.role', [id, users[0].id, dto.role]);
            await manager.query('INSERT INTO quiz_change_history ("quizId","actorId",action,details) VALUES ($1,$2,$3,$4)', [id, userId, previous.length ? 'ROLE_CHANGED' : 'SHARED', JSON.stringify({ member: users[0].email, role: dto.role, previousRole: previous[0]?.role })]);
        });
        return this.collaborators(id, userId);
    }
    async revoke(id: string, userId: number, member: number) {
        await this.collaborators(id, userId);
        await this.quizRepository.manager.transaction(async (manager) => {
            const removed = await manager.query('WITH removed AS (DELETE FROM quiz_collaborators WHERE "quizId"=$1 AND "userId"=$2 RETURNING "userId") SELECT * FROM removed', [id, member]);
            if (!removed.length) return;
            const users = await manager.query('SELECT email FROM "user" WHERE id=$1', [member]);
            await manager.query('INSERT INTO quiz_change_history ("quizId","actorId",action,details) VALUES ($1,$2,$3,$4)', [id, userId, 'REVOKED', JSON.stringify({ member: users[0]?.email })]);
        });
        return this.collaborators(id, userId);
    }
    async history(id: string, userId: number) {
        await this.access(id, userId);
        return this.quizRepository.query(`SELECT h.id,h.action,h.details,h."createdAt",u.name AS "actorName"
            FROM quiz_change_history h LEFT JOIN "user" u ON u.id=h."actorId"
            WHERE h."quizId"=$1 ORDER BY h.id DESC LIMIT 100`, [id]);
    }
    async findByUser(id: number) {
        const rows = await this.quizRepository.query('SELECT "quizId",role FROM quiz_collaborators WHERE "userId"=$1',[id]);
        const owned = await this.quizRepository.find({where:{userId:id}});
        const shared = await Promise.all(rows.map(async row => {
            const quiz = await this.quizRepository.findOne({where:{id:row.quizId}});
            return quiz ? {...quiz,accessRole:row.role} : null;
        }));
        return [...owned.map(q=>({...q,accessRole:'OWNER'})),...shared.filter(Boolean)];
    }

    async update(id: string, dto: UpdateQuizDto, userId: number) {
        const quiz = await this.access(id, userId, true);
        if (!dto.questions) throw new BadRequestException('Questions are required');
        const questions = dto.questions;
        questions.forEach((question) => this.validateInteractiveQuestion(question));
        const selection = dto.questionSelection === undefined ? quiz.questionSelection : dto.questionSelection;
        validateSelection(questions, selection);
        const previous = { title: quiz.title, questionCount: quiz.questions.length };
        return this.quizRepository.manager.transaction(async (manager) => {
            await manager.delete(Question, { quizId: id });
            Object.assign(quiz, {
                title: dto.title ?? quiz.title,
                questionSelection: selection,
                description: dto.description,
                topic: dto.topic?.trim() || quiz.topic,
                passThreshold: dto.passThreshold ?? quiz.passThreshold,
                availableFrom: dto.availableFrom === undefined ? quiz.availableFrom : dto.availableFrom ? new Date(dto.availableFrom) : null,
                availableUntil: dto.availableUntil === undefined ? quiz.availableUntil : dto.availableUntil ? new Date(dto.availableUntil) : null,
                maxAttempts: dto.maxAttempts ?? quiz.maxAttempts, requireFullscreen: dto.requireFullscreen ?? quiz.requireFullscreen,
                trackTabSwitches: dto.trackTabSwitches ?? quiz.trackTabSwitches,
                showQuestionLeaderboard: dto.showQuestionLeaderboard ?? quiz.showQuestionLeaderboard,
                feedbackMode: dto.feedbackMode ?? quiz.feedbackMode,
                shuffleQuestions: dto.shuffleQuestions ?? quiz.shuffleQuestions,
                shuffleAnswers: dto.shuffleAnswers ?? quiz.shuffleAnswers,
                questions: questions.map((question, position) => this.questionRepository.create({
                    ...question,
                    position,
                    answers: question.answers.map((answer) => this.answerRepository.create(answer)),
                })),
            });
            const saved = await manager.save(Quiz, quiz);
            await manager.query('INSERT INTO quiz_change_history ("quizId","actorId",action,details) VALUES ($1,$2,$3,$4)', [id, userId, 'EDITED', JSON.stringify({ title: saved.title, questionCount: saved.questions.length, previousTitle: previous.title, previousQuestionCount: previous.questionCount })]);
            return saved;
        });
    }

    async remove(id: string, userId: number) {
        const quiz = await this.quizRepository.findOne({ where: { id, userId } });
        if (!quiz) throw new NotFoundException(`Quiz with id ${id} not found`);
        await this.quizRepository.softRemove(quiz);
        return { id, deleted: true };
    }

    async duplicate(id: string, userId: number) {
        const source = await this.access(id, userId);
        if (!source) throw new NotFoundException(`Quiz with id ${id} not found`);
        return this.create({
            questionSelection: source.questionSelection,
            title: `${source.title} — копія`, description: source.description, topic: source.topic,
            passThreshold: source.passThreshold, availableFrom: source.availableFrom?.toISOString(), availableUntil: source.availableUntil?.toISOString(),
            maxAttempts: source.maxAttempts, requireFullscreen: source.requireFullscreen, trackTabSwitches: source.trackTabSwitches,
            showQuestionLeaderboard: source.showQuestionLeaderboard, feedbackMode: source.feedbackMode, shuffleQuestions: source.shuffleQuestions, shuffleAnswers: source.shuffleAnswers,
            questions: source.questions.map((q) => ({ text: q.text, difficulty: q.difficulty, explanation: q.explanation || undefined, mediaUrl: q.mediaUrl || undefined, timeLimit: q.timeLimit, points: q.points, type: q.type, configuration: q.configuration, answers: q.answers.map((a) => ({ text: a.text, mediaUrl: a.mediaUrl || undefined, isCorrect: a.isCorrect })) })),
        }, userId);
    }
}
