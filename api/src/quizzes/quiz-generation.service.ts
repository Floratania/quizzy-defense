import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { randomUUID } from 'crypto';

type OpenRouterResponse = {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
};

@Injectable()
export class QuizGenerationService {
    async generate(dto: GenerateQuizDto) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new ServiceUnavailableException('OPENROUTER_API_KEY is not configured on the API server');
        }

        const allowedTypes = ['multiple_choice', 'multiple_response', 'true_false', 'open_text', 'matching', 'ordering', 'fill_blank'];
        const requestedCounts = dto.typeCounts
            ? Object.fromEntries(allowedTypes.map((type) => [type, Number(dto.typeCounts?.[type] || 0)]))
            : { multiple_choice: Number(dto.questionCount || 5) };
        if (Object.entries(requestedCounts).some(([, count]) => !Number.isInteger(count) || count < 0 || count > 20)) {
            throw new BadRequestException('Question type counts must be integers from 0 to 20');
        }
        const questionCount = Object.values(requestedCounts).reduce((sum, count) => sum + count, 0);
        if (questionCount < 3 || questionCount > 20) {
            throw new BadRequestException('Total question count must be from 3 to 20');
        }
        const requestedDescription = Object.entries(requestedCounts)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => `${type}: ${count}`)
            .join(', ');

        const schema = {
            type: 'object',
            additionalProperties: false,
            properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                questions: {
                    type: 'array',
                    minItems: questionCount,
                    maxItems: questionCount,
                    items: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            type: { type: 'string', enum: allowedTypes },
                            text: { type: 'string' },
                            answers: {
                                type: 'array',
                                minItems: 0,
                                maxItems: 6,
                                items: {
                                    type: 'object',
                                    additionalProperties: false,
                                    properties: {
                                        text: { type: 'string' },
                                        isCorrect: { type: 'boolean' },
                                    },
                                    required: ['text', 'isCorrect'],
                                },
                            },
                            configuration: {
                                type: 'object',
                                additionalProperties: false,
                                properties: {
                                    caseSensitive: { type: 'boolean' },
                                    pairs: {
                                        type: 'array', minItems: 0, maxItems: 8,
                                        items: {
                                            type: 'object', additionalProperties: false,
                                            properties: { left: { type: 'string' }, right: { type: 'string' } },
                                            required: ['left', 'right'],
                                        },
                                    },
                                    items: { type: 'array', minItems: 0, maxItems: 8, items: { type: 'string' } },
                                },
                                required: ['caseSensitive', 'pairs', 'items'],
                            },
                        },
                        required: ['type', 'text', 'answers', 'configuration'],
                    },
                },
            },
            required: ['title', 'description', 'questions'],
        };

        let response: Response;
        try {
            response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                    ...(process.env.FRONTEND_URL ? { 'HTTP-Referer': process.env.FRONTEND_URL } : {}),
                    'X-Title': 'Quizzy AI Quiz Generator',
                },
                body: JSON.stringify({
                    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: `Create an educational quiz strictly from the supplied source in ${dto.language || 'the source text language'}. Generate exactly these question counts: ${requestedDescription}. Rules: multiple_choice has 4 answers and exactly 1 correct; multiple_response has 4-6 answers and at least 2 correct; true_false has exactly 2 answers and 1 correct; open_text has one correct answer; matching has 2-8 pairs; ordering has 2-8 items already in correct order; fill_blank contains 2-8 occurrences of ___ and configuration.items contains exactly one word or phrase for each blank in correct order. For matching, ordering and fill_blank use an empty answers array. Use empty pairs/items for types that do not need them. Do not use facts absent from the source.`,
                        },
                        { role: 'user', content: dto.sourceText },
                    ],
                    temperature: 0.3,
                    max_tokens: Math.min(3500, 600 + questionCount * 170),
                    response_format: {
                        type: 'json_schema',
                        json_schema: { name: 'generated_quiz', strict: true, schema },
                    },
                    plugins: [{ id: 'response-healing' }],
                }),
            });
        } catch {
            throw new BadGatewayException('Could not connect to OpenRouter');
        }

        const body = await response.json() as OpenRouterResponse;
        if (!response.ok) {
            throw new BadGatewayException(body.error?.message || 'OpenRouter rejected the generation request');
        }

        const content = body.choices?.[0]?.message?.content;
        if (!content) throw new BadGatewayException('OpenRouter returned an empty response');

        try {
            const quiz = JSON.parse(content);
            if (!Array.isArray(quiz.questions) || quiz.questions.length !== questionCount) {
                throw new Error('Invalid quiz structure');
            }
            for (const [type, count] of Object.entries(requestedCounts)) {
                if (quiz.questions.filter((question: { type: string }) => question.type === type).length !== count) {
                    throw new Error(`Incorrect count for ${type}`);
                }
            }
            return {
                title: quiz.title,
                description: quiz.description,
                questions: quiz.questions.map((question: any) => this.normalizeQuestion(question)),
            };
        } catch {
            throw new BadGatewayException('OpenRouter returned an invalid quiz structure');
        }
    }

    private normalizeQuestion(question: any) {
        const base = { type: question.type, text: String(question.text).trim(), timeLimit: 30, points: 1000 };
        if (question.type === 'matching') {
            const pairs = question.configuration.pairs.map((pair: any) => ({
                leftId: randomUUID(), left: String(pair.left).trim(), rightId: randomUUID(), right: String(pair.right).trim(),
            }));
            if (pairs.length < 2) throw new Error('Matching requires pairs');
            return { ...base, answers: [], configuration: { pairs } };
        }
        if (question.type === 'ordering' || question.type === 'fill_blank') {
            const items = question.configuration.items.map((text: unknown, correctPosition: number) => ({ id: randomUUID(), text: String(text).trim(), correctPosition }));
            const blanks = (base.text.match(/___/g) || []).length;
            if (items.length < 2 || (question.type === 'fill_blank' && blanks !== items.length)) throw new Error('Invalid ordered items');
            return { ...base, answers: [], configuration: { items } };
        }
        const answers = question.answers.map((answer: any) => ({ text: String(answer.text).trim(), isCorrect: Boolean(answer.isCorrect) }));
        const correctCount = answers.filter((answer: any) => answer.isCorrect).length;
        if (!answers.length || (question.type === 'multiple_response' ? correctCount < 2 : correctCount !== 1)) throw new Error('Invalid answers');
        return { ...base, answers, configuration: question.type === 'open_text' ? { caseSensitive: false } : null };
    }
}
