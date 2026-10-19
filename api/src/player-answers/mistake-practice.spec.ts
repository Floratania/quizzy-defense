import { PlayerAnswersService } from './player-answers.service';

describe('Personal mistake practice', () => {
    const question = (id: string) => ({ id, text: id, type: 'open_text', timeLimit: 30, configuration: null, explanation: 'Пояснення', answers: [{ id: `${id}-a`, text: 'Київ', isCorrect: true }] });
    const makeService = (allowMistakePractice = true) => new PlayerAnswersService(
        { find: async () => [] } as any,
        { findOne: async () => ({ totalScore: 0, questionOrder: ['assigned'], session: { quiz: { allowMistakePractice, passThreshold: 60, questions: [question('assigned'), question('not-assigned')] } } }) } as any,
        {} as any, {} as any,
    );
    it('returns retry material only for assigned questions when answer review is allowed', async () => {
        const result = await makeService().getPlayerFinalResult('p', true);
        expect(result.answers).toHaveLength(1);
        expect(result.answers![0].practiceQuestion!.id).toBe('assigned');
        expect(result.answers![0].practiceQuestion!.answers[0].isCorrect).toBe(true);
        expect(result.answers![0].submittedAnswer).toBe('Не відповів');
    });
    it('withholds retry material when practice is disabled but keeps permitted answer review', async () => {
        const result = await makeService(false).getPlayerFinalResult('p', true);
        expect(result.practiceAllowed).toBe(false);
        expect(result.answers![0]).not.toHaveProperty('practiceQuestion');
        expect(result.answers![0].correctAnswer).toBe('Київ');
    });
    it('does not disclose answers or retry material in score-only results', async () => {
        const result = await makeService().getPlayerFinalResult('p', false);
        expect(result).not.toHaveProperty('answers');
        expect(result).not.toHaveProperty('practiceQuestion');
        expect(result.totalAnswers).toBe(1);
    });
});
