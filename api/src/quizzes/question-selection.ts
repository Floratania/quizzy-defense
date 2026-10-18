import { BadRequestException } from '@nestjs/common';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionSelection = Record<Difficulty, number>;
export const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

export function selectionCount(selection: QuestionSelection): number {
    return difficulties.reduce((sum, level) => sum + selection[level], 0);
}

export function validateSelection(questions: Array<{ difficulty?: string }>, selection?: QuestionSelection | null) {
    if (!selection) return;
    if (difficulties.some((level) => !Number.isInteger(selection[level]) || selection[level] < 0) || selectionCount(selection) < 1) {
        throw new BadRequestException('Задайте кількість питань кожної складності; загалом має бути хоча б одне.');
    }
    const labels = { easy: 'легких', medium: 'середніх', hard: 'складних' };
    for (const level of difficulties) {
        const available = questions.filter((q) => (q.difficulty || 'medium') === level).length;
        if (selection[level] > available) throw new BadRequestException(`Недостатньо ${labels[level]} питань: потрібно ${selection[level]}, доступно ${available}.`);
    }
}

export function selectBalancedQuestions<T extends { id: string; difficulty?: string }>(questions: T[], selection: QuestionSelection, random = Math.random): string[] {
    validateSelection(questions, selection);
    // Identical difficulty slots for all players; independent sampling without replacement within each pool.
    return difficulties.flatMap((level) => {
        const pool = questions.filter((q) => (q.difficulty || 'medium') === level);
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, selection[level]).map((q) => q.id);
    });
}

export function sessionQuestionCount(session: { quiz: { questions: unknown[]; questionSelection?: QuestionSelection | null }; settings?: Record<string, unknown> }): number {
    const selection = session.settings?.questionSelection as QuestionSelection | undefined ?? session.quiz.questionSelection;
    if (selection) return selectionCount(selection);
    const legacy = Number(session.settings?.questionCount || 0);
    return legacy > 0 ? Math.min(legacy, session.quiz.questions.length) : session.quiz.questions.length;
}
