import { GameFlowService } from './game-gateway.service';

describe('Personalized synchronous round completion', () => {
    afterEach(() => jest.useRealTimers());
    it('records a missing personal answer on the server and closes the round once', async () => {
        jest.useFakeTimers();
        let saved = false;
        const session = { id: 's', status: 'RUNNING', mode: 'CLASSIC', currentQuestionIndex: 0, quiz: { shuffleQuestions: true }, players: [{ id: 'p', socketId: 'socket' }], settings: {} };
        const sessions = { getRoundState: async () => ({ session, playerQuestions: new Map([['p', { id: 'personal-q' }]]) }) };
        const answers = {
            hasPlayerAnswered: jest.fn(async () => saved),
            recordTimeout: jest.fn(async () => { saved = true; return { correct: false }; }),
            getRoundStats: jest.fn(async () => ({ totalAnswers: 1 })),
        };
        const emit = jest.fn();
        const flow = new GameFlowService({} as any, {} as any, sessions as any, answers as any, {} as any, {} as any, { server: { to: () => ({ emit }) } } as any);
        await Promise.all([flow.finishQuestion('s', 'host-q'), flow.finishQuestion('s', 'personal-q')]);
        expect(answers.recordTimeout).toHaveBeenCalledTimes(1);
        expect(answers.recordTimeout).toHaveBeenCalledWith('p', 'personal-q');
        expect(answers.getRoundStats).toHaveBeenCalledWith('s', ['personal-q'], { p: 'personal-q' });
        expect(emit.mock.calls.filter(([name]) => name === 'question_results')).toHaveLength(1);
        expect(emit).toHaveBeenCalledWith('question_closed', { questionId: 'personal-q' });
        jest.clearAllTimers();
    });
});
