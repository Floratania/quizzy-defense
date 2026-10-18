import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateQuestionBankItemDto } from './dto/create-question-bank-item.dto';
import { QuestionBankItem } from './entities/question-bank-item.entity';
import { Question } from '@/questions/entities/question.entity';
import { questionBankExamples } from './question-bank.examples';

@Injectable()
export class QuestionBankService {
    constructor(@InjectRepository(QuestionBankItem) private readonly repository: Repository<QuestionBankItem>, @InjectRepository(Question) private readonly questions: Repository<Question>) {}

    create(dto: CreateQuestionBankItemDto, userId: number) {
        return this.repository.save(this.repository.create({
            userId,
            topic: dto.topic?.trim() || 'Без теми',
            folder: dto.folder?.trim() || 'Загальна',
            tags: (dto.tags || []).map((tag) => tag.trim()).filter(Boolean),
            difficulty: dto.difficulty || 'medium',
            text: dto.text.trim(),
            payload: dto.payload,
        }));
    }

    async addExamples(userId: number) {
        return this.repository.manager.transaction(async (manager) => {
            // Serialize repeated requests for the same user's example collection.
            await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [7241, userId]);
            const repository = manager.getRepository(QuestionBankItem);
            const existing = await repository.find({ where: { userId }, select: { text: true } });
            const texts = new Set(existing.map((item) => item.text));
            const examples = questionBankExamples().filter((item) => !texts.has(item.text));
            if (examples.length) await repository.save(repository.create(examples.map((item) => ({ ...item, userId }))));
            return { added: examples.length };
        });
    }

    async pick(userId: number, topic: string, easy = 0, medium = 0, hard = 0) {
        const all = await this.findAll(userId, undefined, topic);
        const take = (level: string, count: number) => all.filter((item) => item.difficulty === level).sort(() => Math.random() - .5).slice(0, count);
        return [...take('easy', easy), ...take('medium', medium), ...take('hard', hard)];
    }

    findAll(userId: number, search?: string, topic?: string) {
        const term = search?.trim();
        return this.repository.find({
            where: {
                userId,
                ...(term ? { text: ILike(`%${term}%`) } : {}),
                ...(topic?.trim() ? { topic: ILike(topic.trim()) } : {}),
            },
            order: { topic: 'ASC', createdAt: 'DESC' },
        });
    }

    async remove(id: string, userId: number) {
        const item = await this.repository.findOneBy({ id, userId });
        if (!item) throw new NotFoundException('Question bank item not found');
        await this.repository.remove(item);
        return { id, deleted: true };
    }

    async usage(id: string, userId: number) {
        const item = await this.repository.findOneBy({ id, userId });
        if (!item) throw new NotFoundException('Question bank item not found');
        const matches = await this.questions.find({ where: { text: item.text, quiz: { userId } }, relations: { quiz: true } });
        return matches.map((q) => ({ quizId: q.quizId, title: q.quiz.title }));
    }
}
