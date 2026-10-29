import { QuestionBankService } from './question-bank.service';
import { questionBankExamples } from './question-bank.examples';
import { quizErrors } from '../quizzes/quiz-quality';

describe('Question bank examples', () => {
    it('provides valid questions for all seven supported types', () => {
        const examples = questionBankExamples();
        expect(new Set(examples.map((item) => item.payload.type)).size).toBe(7);
        const questions = examples.map(({ payload: q }) => ({
            ...q,
            answers: q.answers.map((text, index) => ({ text, isCorrect: q.correctAnswers.includes(index) })),
            configuration: q.type === 'matching' ? { pairs: (q as any).matchingPairs }
                : ['ordering', 'fill_blank'].includes(q.type) ? {
                    items: ((q as any).orderingItems || (q as any).fillBlankItems).map((item, correctPosition) => ({ ...item, correctPosition })),
                } : null,
        }));
        expect(quizErrors(questions)).toEqual([]);
    });

    it('adds only missing examples to the authenticated user bank', async () => {
        const examples = questionBankExamples();
        const repository = {
            find: jest.fn().mockResolvedValue([{ text: examples[0].text }]),
            create: jest.fn((items) => items), save: jest.fn(),
        };
        const manager = { query: jest.fn(), getRepository: () => repository };
        const service = new QuestionBankService({ manager: { transaction: (run) => run(manager) } } as any, {} as any);
        expect(await service.addExamples(42)).toEqual({ added: 6 });
        expect(repository.find).toHaveBeenCalledWith({ where: { userId: 42 }, select: { text: true } });
        expect(repository.save.mock.calls[0][0]).toHaveLength(6);
        expect(repository.save.mock.calls[0][0].every((item) => item.userId === 42)).toBe(true);
        repository.find.mockResolvedValue(examples.map(({ text }) => ({ text })));
        repository.save.mockClear();
        expect(await service.addExamples(42)).toEqual({ added: 0 });
        expect(repository.save).not.toHaveBeenCalled();
    });
});

describe('Question bank folders', () => {
    it('filters questions by the exact folder within the owner bank', async () => {
        const repository = {find: jest.fn().mockResolvedValue([])};
        const service = new QuestionBankService(repository as any, {} as any);
        await service.findAll(42, undefined, undefined, '  Алгебра 7 клас  ');
        expect(repository.find.mock.calls[0][0].where).toEqual({userId:42,folder:'Алгебра 7 клас'});
    });

    it('does not disclose folders of a private bank', async () => {
        const repository = {query: jest.fn().mockResolvedValue([])};
        const service = new QuestionBankService(repository as any, {} as any);
        await expect(service.folders(42,99)).rejects.toThrow('Немає доступу');
        expect(repository.query).toHaveBeenCalledTimes(1);
        expect(repository.query.mock.calls[0][0]).toContain('question_bank_access');
    });

    it('allows a shared viewer to read folders but not create them', async () => {
        const repository = {query:jest.fn().mockResolvedValueOnce([{role:'VIEWER'}]).mockResolvedValueOnce([{name:'Фізика',count:2}]).mockResolvedValueOnce([{role:'VIEWER'}])};
        const service = new QuestionBankService(repository as any, {} as any);
        expect(await service.folders(42,99)).toEqual([{name:'Фізика',count:2}]);
        await expect(service.createFolder(42,'Нова',99)).rejects.toThrow('Немає доступу');
        expect(repository.query.mock.calls.some(([sql]) => sql.includes('INSERT'))).toBe(false);
    });

    it('creates a persistent empty folder and trims its name', async () => {
        const repository = {query:jest.fn().mockResolvedValue([])};
        const service = new QuestionBankService(repository as any, {} as any);
        expect(await service.createFolder(42,'  Геометрія  ')).toEqual({name:'Геометрія'});
        expect(repository.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'),[42,'Геометрія']);
        await expect(service.createFolder(42,'   ')).rejects.toThrow('Назва папки');
    });

    it('uses the folder for automatic selection and rejects invalid counts', async () => {
        const repository = {find:jest.fn().mockResolvedValue([{id:'q1',difficulty:'easy'}])};
        const service = new QuestionBankService(repository as any, {} as any);
        expect(await service.pick(42,'',1,0,0,'Геометрія')).toEqual([{id:'q1',difficulty:'easy'}]);
        expect(repository.find.mock.calls[0][0].where).toEqual({userId:42,folder:'Геометрія'});
        await expect(service.pick(42,'',-1)).rejects.toThrow('Кількість питань');
        await expect(service.pick(42,'',1.5)).rejects.toThrow('Кількість питань');
    });
});
