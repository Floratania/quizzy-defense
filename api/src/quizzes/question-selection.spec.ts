import { selectBalancedQuestions, validateSelection, sessionQuestionCount } from './question-selection';
import { GameSessionsService } from '@/game-sessions/game-sessions.service';

describe('Balanced question sets', () => {
    const pool = ['easy', 'medium', 'hard'].flatMap((difficulty, level) =>
        Array.from({ length: level === 0 ? 18 : 16 }, (_, index) => ({ id: `${difficulty}-${index}`, difficulty, position: index })),
    );
    const selection = { easy: 8, medium: 8, hard: 8 };
    it('samples 24 unique questions with identical difficulty slots for every participant', () => {
        const orders = Array.from({ length: 100 }, () => selectBalancedQuestions(pool, selection));
        for (const ids of orders) {
            expect(ids).toHaveLength(24);
            expect(new Set(ids).size).toBe(24);
            expect(ids.map((id) => id.split('-')[0])).toEqual(['easy', 'medium', 'hard'].flatMap((level) => Array(8).fill(level)));
        }
        expect(new Set(orders.map((ids) => ids.join(','))).size).toBeGreaterThan(1);
        expect(pool).toHaveLength(50);
    });
    it('rejects a shortage and an empty or fractional quota', () => {
        expect(() => validateSelection(pool, { easy: 19, medium: 0, hard: 0 })).toThrow('Недостатньо');
        expect(() => validateSelection(pool, { easy: 0, medium: 0, hard: 0 })).toThrow();
        expect(() => validateSelection(pool, { easy: 0.5, medium: 1, hard: 1 })).toThrow();
    });
    it('keeps old quizzes unchanged and respects the session selection snapshot', () => {
        expect(sessionQuestionCount({ quiz: { questions: pool } })).toBe(50);
        expect(sessionQuestionCount({ quiz: { questions: pool, questionSelection: selection } })).toBe(24);
        expect(sessionQuestionCount({ quiz: { questions: pool, questionSelection: selection }, settings: { questionSelection: { easy: 1, medium: 1, hard: 1 } } })).toBe(3);
    });
    it('ends the synchronous game at the chosen count and never falls back to pool questions', async () => {
        const ids = selectBalancedQuestions(pool, selection);
        const session = { currentQuestionIndex: 24, quiz: { questions: pool, questionSelection: selection }, players: [{ id: 'p', questionOrder: ids }], settings: {} };
        const service = new GameSessionsService({ findOne: async () => session } as any, {} as any, {} as any);
        const state = await service.getRoundState('s');
        expect(state.totalQuestions).toBe(24);
        expect(state.canonicalQuestion).toBeNull();
        expect(state.playerQuestions.get('p')).toBeNull();
        expect(await service.getCurrentQuestion('s')).toBeNull();
        expect(await service.peekNextQuestion('s')).toBeNull();
    });
});
