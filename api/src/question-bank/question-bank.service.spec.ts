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
