import { randomUUID } from 'crypto';

export function questionBankExamples() {
    const choice = (type: string, text: string, answers: string[], correctAnswers: number[]) => ({
        type, text, answers, correctAnswers, numberOfAnswers: answers.length,
    });
    const examples = [
        { topic: 'Математика', difficulty: 'easy', payload: choice('multiple_choice', 'Скільки буде 7 × 8?', ['54', '56', '64', '48'], [1]) },
        { topic: 'Математика', difficulty: 'medium', payload: choice('multiple_response', 'Оберіть усі прості числа.', ['2', '3', '4', '5', '9'], [0, 1, 3]) },
        { topic: 'Природознавство', difficulty: 'easy', payload: choice('true_false', 'Земля обертається навколо Сонця.', ['True', 'False'], [0]) },
        { topic: 'Географія', difficulty: 'easy', payload: choice('open_text', 'Яке місто є столицею України?', ['Київ'], [0]) },
        { topic: 'Інформатика', difficulty: 'medium', payload: {
            ...choice('matching', 'Установіть відповідність між технологією та її призначенням.', [], []),
            matchingPairs: [
                { leftId: randomUUID(), left: 'HTML', rightId: randomUUID(), right: 'Структура вебсторінки' },
                { leftId: randomUUID(), left: 'CSS', rightId: randomUUID(), right: 'Оформлення вебсторінки' },
                { leftId: randomUUID(), left: 'JavaScript', rightId: randomUUID(), right: 'Інтерактивна поведінка' },
            ],
        } },
        { topic: 'Математика', difficulty: 'easy', payload: {
            ...choice('ordering', 'Розташуйте числа за зростанням.', [], []),
            orderingItems: ['3', '7', '12', '20'].map((text) => ({ id: randomUUID(), text })),
        } },
        { topic: 'Природознавство', difficulty: 'medium', payload: {
            ...choice('fill_blank', 'Під дією сонячного тепла вода з поверхні водойм ___. Водяна пара піднімається вгору й охолоджується, утворюючи ___. Згодом вода повертається на землю у вигляді ___. Так відбувається кругообіг води в природі.', [], []),
            fillBlankItems: ['випаровується', 'хмари', 'опадів'].map((text) => ({ id: randomUUID(), text })),
        } },
    ];
    return examples.map((example) => ({
        topic: example.topic, folder: 'Приклади', tags: ['приклад', example.topic],
        difficulty: example.difficulty,
        text: example.payload.text,
        payload: { timeLimit: 60, points: 1000, imageUrl: null, answerImageUrls: [], ...example.payload },
    }));
}
