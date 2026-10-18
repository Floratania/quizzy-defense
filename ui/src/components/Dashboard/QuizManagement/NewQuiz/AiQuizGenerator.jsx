import React, { useState } from 'react';
import { Button, Card, Group, NumberInput, SimpleGrid, Stack, Text, Textarea, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSparkles } from '@tabler/icons-react';
import { useQuizContext } from '../../../../context/QuizContext.jsx';

export const AiQuizGenerator = () => {
    const { isEdit, generateFromText } = useQuizContext();
    const [sourceText, setSourceText] = useState('');
    const [typeCounts, setTypeCounts] = useState({
        multiple_choice: 5,
        multiple_response: 0,
        true_false: 0,
        open_text: 0,
        matching: 0,
        ordering: 0,
        fill_blank: 0,
    });
    const [generating, setGenerating] = useState(false);

    const questionTypes = [
        ['multiple_choice', 'Одна правильна відповідь'],
        ['multiple_response', 'Кілька правильних відповідей'],
        ['true_false', 'Так / Ні'],
        ['open_text', 'Відкрита відповідь'],
        ['matching', 'Встановлення відповідності'],
        ['ordering', 'Правильна послідовність'],
        ['fill_blank', 'Заповнення пропусків'],
    ];
    const totalQuestions = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);

    if (isEdit) return null;

    const handleGenerate = async () => {
        if (sourceText.trim().length < 50) {
            notifications.show({ color: 'red', title: 'Замало тексту', message: 'Додайте щонайменше 50 символів.' });
            return;
        }
        if (totalQuestions < 3 || totalQuestions > 20) {
            notifications.show({ color: 'red', title: 'Неправильна кількість', message: 'Оберіть загалом від 3 до 20 питань.' });
            return;
        }

        try {
            setGenerating(true);
            await generateFromText({ sourceText: sourceText.trim(), typeCounts, language: 'Українська' });
            notifications.show({ color: 'green', title: 'Вікторину згенеровано', message: 'Перевірте питання та правильні відповіді перед збереженням.' });
        } catch (error) {
            notifications.show({ color: 'red', title: 'Помилка генерації', message: error.message });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Card shadow="md" padding="xl" radius="lg" withBorder>
            <Group mb="xs">
                <IconSparkles color="var(--mantine-color-violet-6)" />
                <Title order={3}>Створити вікторину за допомогою AI</Title>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
                Вставте навчальний матеріал. AI створить чернетку, яку можна відредагувати перед збереженням.
            </Text>
            <Stack>
                <Textarea
                    label="Текст для вікторини"
                    placeholder="Вставте конспект, статтю або навчальний текст…"
                    minRows={7}
                    autosize
                    maxRows={14}
                    maxLength={15000}
                    value={sourceText}
                    onChange={(event) => setSourceText(event.currentTarget.value)}
                />
                <div>
                    <Text fw={600} size="sm" mb="xs">Кількість питань кожного типу</Text>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                        {questionTypes.map(([type, label]) => (
                            <NumberInput
                                key={type}
                                label={label}
                                min={0}
                                max={20}
                                value={typeCounts[type]}
                                onChange={(value) => setTypeCounts((previous) => ({
                                    ...previous,
                                    [type]: Math.max(0, Number(value) || 0),
                                }))}
                            />
                        ))}
                    </SimpleGrid>
                    <Text mt="xs" size="sm" c={totalQuestions < 3 || totalQuestions > 20 ? 'red' : 'dimmed'}>
                        Усього: {totalQuestions} (дозволено від 3 до 20)
                    </Text>
                </div>
                <Group justify="flex-end">
                    <Button
                        leftSection={<IconSparkles size={18} />}
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'blue' }}
                        loading={generating}
                        disabled={totalQuestions < 3 || totalQuestions > 20}
                        onClick={handleGenerate}
                    >
                        Згенерувати
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
};
