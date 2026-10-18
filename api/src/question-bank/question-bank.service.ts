import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateQuestionBankItemDto } from './dto/create-question-bank-item.dto';
import { QuestionBankItem } from './entities/question-bank-item.entity';
import { Question } from '@/questions/entities/question.entity';
import { questionBankExamples } from './question-bank.examples';

@Injectable()
export class QuestionBankService {
    constructor(@InjectRepository(QuestionBankItem) private readonly repository: Repository<QuestionBankItem>, @InjectRepository(Question) private readonly questions: Repository<Question>) {}

    async bankRole(userId:number, ownerId:number, edit=false) {
        if(userId===ownerId)return 'OWNER';
        const rows=await this.repository.query(`SELECT a.role FROM question_bank_access a JOIN "user" u ON u.id=a.owner_id WHERE a.owner_id=$1 AND a.member_id=$2 AND u.role IN ('TEACHER','ADMIN')`,[ownerId,userId]);
        if(!rows.length || (edit && rows[0].role!=='EDITOR'))throw new ForbiddenException('Немає доступу до цього приватного банку');
        return rows[0].role;
    }
    async banks(userId:number) { return this.repository.query(`SELECT u.id,u.name,a.role FROM question_bank_access a JOIN "user" u ON u.id=a.owner_id WHERE a.member_id=$1 AND u.role IN ('TEACHER','ADMIN')`,[userId]); }
    async collaborators(userId:number) { return this.repository.query(`SELECT u.id,u.name,u.email,a.role FROM question_bank_access a JOIN "user" u ON u.id=a.member_id WHERE a.owner_id=$1`,[userId]); }
    async share(userId:number,email:string,role:string) {
        if(typeof email!=='string'||!['VIEWER','EDITOR'].includes(role))throw new BadRequestException('Невірні дані доступу');
        const users=await this.repository.query(`SELECT id FROM "user" WHERE lower(email)=lower($1) AND role IN ('TEACHER','ADMIN')`,[email.trim()]);
        if(!users.length||users[0].id===userId)throw new BadRequestException('Оберіть іншого підтвердженого викладача');
        await this.repository.query(`INSERT INTO question_bank_access(owner_id,member_id,role) VALUES($1,$2,$3) ON CONFLICT(owner_id,member_id) DO UPDATE SET role=EXCLUDED.role`,[userId,users[0].id,role]);
        return this.collaborators(userId);
    }
    async revoke(userId:number,memberId:number) { await this.repository.query('DELETE FROM question_bank_access WHERE owner_id=$1 AND member_id=$2',[userId,memberId]);return this.collaborators(userId); }
    async sharedItems(userId:number,ownerId:number,search?:string,topic?:string) { const accessRole=await this.bankRole(userId,ownerId);return (await this.findAll(ownerId,search,topic)).map(item=>({...item,accessRole})); }
    async update(id:string,userId:number,dto:CreateQuestionBankItemDto) { const item=await this.repository.findOneBy({id});if(!item)throw new NotFoundException();await this.bankRole(userId,item.userId,true);Object.assign(item,{topic:dto.topic,folder:dto.folder,tags:dto.tags,difficulty:dto.difficulty,text:dto.text.trim(),payload:{...dto.payload,text:dto.text.trim()}});return this.repository.save(item); }

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
        const item = await this.repository.findOneBy({ id });
        if (!item) throw new NotFoundException('Question bank item not found');
        await this.bankRole(userId,item.userId,true);
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
