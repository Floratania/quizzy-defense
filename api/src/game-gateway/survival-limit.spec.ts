import { GameFlowService } from './game-gateway.service';
import { PlayerAnswersService } from '../player-answers/player-answers.service';

describe('Survival mistake limit', () => {
    afterEach(() => jest.useRealTimers());

    it.each([
        ['CLASSIC', false, false],
        ['SURVIVAL', true, true],
    ])('finishes %s without showing an intermediate leaderboard', async (mode, hasNext, oneSurvivor) => {
        jest.useFakeTimers();
        const session = { mode, currentQuestionIndex: 1, settings: {}, quiz: {}, players: [{ id: 'p' }, { id: 'other', eliminatedAt: oneSurvivor ? new Date() : null }] };
        const sessions = { getRoundState: async () => ({ session, playerQuestions: new Map([['p', { id: 'q' }]]) }), getById: async () => session, peekNextQuestion: async () => hasNext ? { id: 'next' } : null };
        const emit = jest.fn();
        const flow = new GameFlowService({} as any, { getBySocket: async () => null, getLeaderboard: async () => [], eliminate: jest.fn() } as any, sessions as any, { hasPlayerAnswered: async () => true, getAnswersForRound: async () => [{ player: { id: 'p' } }], getQuestionStats: async () => ({}) } as any, {} as any, {} as any, { server: { to: () => ({ emit }) } } as any);
        const finish = jest.spyOn(flow, 'finishGame').mockResolvedValue(undefined);
        await flow.finishQuestion('s', 'q');
        await jest.advanceTimersByTimeAsync(3000);
        expect(finish).toHaveBeenCalledWith('s', []);
        expect(emit.mock.calls.some(([event]) => event === 'leaderboard')).toBe(false);
    });

    it.each([2, 3])('eliminates only at the configured threshold (mistakes=%i)', async (mistakes) => {
        const session = { mode: 'SURVIVAL', currentQuestionIndex: 2, settings: { survivalMistakeLimit: 3 }, quiz: {}, players: [{ id: 'p' }, { id: 'other' }] };
        const players = { getBySocket: async () => null, eliminate: jest.fn() };
        const answers = { submitAnswer: async () => ({ playerId: 'p', sessionId: 's', correct: false }), getSurvivalMistakes: async () => mistakes, getAnswersForRound: async () => [] };
        const sessions = { getById: async () => session, getRoundState: async () => ({ session, playerQuestions: new Map([['p', { id: 'q' }]]) }) };
        const flow = new GameFlowService({} as any, players as any, sessions as any, answers as any, {} as any, {} as any, { server: { to: () => ({ emit: jest.fn() }) } } as any);
        await flow.submitAnswer('socket', { questionId: 'q' } as any);
        expect(players.eliminate).toHaveBeenCalledTimes(mistakes === 3 ? 1 : 0);
    });

    it.each([2, 3])('applies the same limit to timeouts (mistakes=%i)', async (mistakes) => {
        jest.useFakeTimers();
        const session = { mode: 'SURVIVAL', currentQuestionIndex: 2, settings: { survivalMistakeLimit: 3 }, quiz: {}, players: [{ id: 'p', socketId: 'socket' }] };
        const players = { getBySocket: async () => null, eliminate: jest.fn() };
        const answers = { hasPlayerAnswered: async () => true, getSurvivalMistakes: async () => mistakes, getAnswersForRound: async () => [], getQuestionStats: async () => ({}) };
        const sessions = { getRoundState: async () => ({ session, playerQuestions: new Map([['p', { id: 'q' }]]) }) };
        const flow = new GameFlowService({} as any, players as any, sessions as any, answers as any, {} as any, {} as any, { server: { to: () => ({ emit: jest.fn() }) } } as any);
        await flow.finishQuestion('s', 'q');
        expect(players.eliminate).toHaveBeenCalledTimes(mistakes === 3 ? 1 : 0);
        jest.clearAllTimers();
    });

    it('counts unanswered rounds as mistakes and keeps correct answers', async () => {
        const repo = { count: jest.fn().mockResolvedValue(1) };
        const service = new PlayerAnswersService(repo as any, {} as any, {} as any, {} as any);
        expect(await service.getSurvivalMistakes('p', 2)).toBe(2);
        expect(repo.count).toHaveBeenCalledWith({ where: { player_id: 'p', isCorrect: true } });
    });
});
