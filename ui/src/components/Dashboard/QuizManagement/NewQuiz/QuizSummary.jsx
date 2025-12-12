import React from 'react';
import { Card, Title, Stack, Paper, Group, Text, Badge, Divider } from '@mantine/core';
import {useQuizContext} from "../../../../context/QuizContext.jsx";

const questionTypes = {
    'quiz': 'Вибір з варіантів',
    'true-false': 'Правда/Неправда',
    'text-input': 'Текстова відповідь'
};

export const QuizSummary = () => {
    const { formData } = useQuizContext();

    return (
        <Card
            shadow="md"
            padding="xl"
            radius="lg"
            style={{
                background: 'white',
                border: '1px solid #e0e7ff',
                position: 'sticky',
                top: '2rem'
            }}
        >
            <Title order={3} mb="lg" style={{ color: '#1f2937' }}>
                Підсумок Вікторини
            </Title>
            <Stack gap="md">
                <Paper p="md" radius="md" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #e9d5ff 100%)' }}>
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Загальна кількість запитань</Text>
                        <Badge size="xl" variant="white">
                            {formData.questionsData.length}
                        </Badge>
                    </Group>
                </Paper>

                <Paper p="md" radius="md" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Загальна кількість балів</Text>
                        <Badge size="xl" variant="white">
                            {formData.questionsData.reduce((sum, q) => sum + q.points, 0)}
                        </Badge>
                    </Group>
                </Paper>

                <Paper p="md" radius="md" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #e9d5ff 100%)' }}>
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Орієнтовна тривалість</Text>
                        <Badge size="xl" variant="white">
                            {Math.ceil(formData.questionsData.reduce((sum, q) => sum + q.timeLimit, 0) / 60)}хв.
                        </Badge>
                    </Group>
                </Paper>

                {/*<Divider />*/}

                {/*<Stack gap="xs">*/}
                {/*    <Text size="sm" fw={500} c="dimmed">Типи Запитань</Text>*/}
                {/*    {['quiz', 'true-false', 'text-input'].map(type => {*/}
                {/*        const count = formData.questionsData.filter(q => q.type === type).length;*/}
                {/*        if (count === 0) return null;*/}
                {/*        return (*/}
                {/*            <Group key={type} justify="space-between">*/}
                {/*                <Text size="sm">{questionTypes[type]}</Text>*/}
                {/*                <Badge size="sm" variant="light">{count}</Badge>*/}
                {/*            </Group>*/}
                {/*        );*/}
                {/*    })}*/}
                {/*</Stack>*/}
            </Stack>
        </Card>
    );
};