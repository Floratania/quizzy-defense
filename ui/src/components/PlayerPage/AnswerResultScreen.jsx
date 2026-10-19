
// AnswerResultScreen.js
import React from 'react';
import { Box, Container, Paper, Title, Text, Stack, ThemeIcon, Badge } from '@mantine/core';
import { IconCheck, IconX, IconStar } from '@tabler/icons-react';
import RichText from '../Question/RichText.jsx';

export const AnswerResultScreen = ({ answerResult }) => {
    if(answerResult.timedOut)return <Box mih="100vh" p="lg" style={{background:'linear-gradient(135deg, #dbeafe, #e9d5ff, #fce7f3)'}}><Paper maw={900} mx="auto" withBorder p="lg" radius="md"><Title order={2}>Час вийшов</Title><Text c="dimmed" mt="xs">Відповідь на це питання більше не приймається. Очікуємо наступне питання.</Text></Paper></Box>;
    if (answerResult.submitted && typeof answerResult.correct !== 'boolean') {
        return (
            <Box mih="100vh" style={{ display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #dbeafe, #e9d5ff)' }}>
                <Paper shadow="xl" radius="xl" p={50} ta="center">
                    <Title order={2}>{answerResult.timedOut ? 'Час на відповідь завершився' : answerResult.awaitingNext ? 'Раунд завершено' : 'Відповідь прийнято'}</Title>
                    <Text c="dimmed" mt="sm">{answerResult.awaitingNext || answerResult.timedOut ? 'Очікуємо наступне питання від ведучого.' : 'Очікуємо завершення раунду. Результат буде показано відповідно до налаштувань тесту.'}</Text>
                </Paper>
            </Box>
        );
    }
    const isCorrect = answerResult.correct;
    const correctness = Number(answerResult.correctness ?? (isCorrect ? 1 : 0));
    const isPartial = correctness > 0 && correctness < 1;
    const resultColor = isCorrect ? '#059669' : isPartial ? '#d97706' : '#dc2626';

    return (
        <Box
            style={{
                minHeight: "100vh",
                background: isCorrect
                    ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)"
                    : isPartial ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)" : "linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fca5a5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem"
            }}
        >
            <Container size="md">
                <Paper
                    shadow="xl"
                    radius="xl"
                    p={60}
                    style={{ background: "white", textAlign: "center" }}
                >
                    <Stack spacing="xl" align="center">
                        {answerResult.explanation && <Paper withBorder p="md" w="100%"><Text fw={600}>Пояснення</Text><RichText>{answerResult.explanation}</RichText></Paper>}
                        <ThemeIcon
                            size={120}
                            radius="xl"
                            variant="gradient"
                            gradient={
                                isCorrect
                                    ? { from: 'teal.4', to: 'green.5' }
                                    : isPartial ? { from: 'yellow.5', to: 'orange.6' } : { from: 'red.4', to: 'pink.5' }
                            }
                            style={{
                                animation: 'bounce 0.6s ease-in-out'
                            }}
                        >
                            {isCorrect ? <IconCheck size={60} /> : <IconX size={60} />}
                        </ThemeIcon>

                        <div>
                            <Title
                                order={1}
                                style={{
                                    fontSize: '3.5rem',
                                    color: resultColor,
                                    marginBottom: 8
                                }}
                            >
                                {isCorrect ? 'Правильно!' : isPartial ? 'Частково правильно' : 'Неправильно'}
                            </Title>
                            <Text size="lg" c="dimmed">
                                {isPartial ? `Правильність: ${Math.round(correctness * 100)}%` : isCorrect ? 'Чудова робота!' : 'Спробуйте наступного разу'}
                            </Text>
                        </div>

                        <Paper
                            p="xl"
                            radius="lg"
                            style={{
                                background: isCorrect
                                    ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                                    : isPartial ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                width: '100%',
                                maxWidth: 300
                            }}
                        >
                            <Stack spacing="xs" align="center">
                                <IconStar size={32} color={resultColor} />
                                <Text size="sm" c="dimmed">
                                    Нараховано балів
                                </Text>
                                <Title order={1} style={{ color: resultColor }}>
                                    +{answerResult.earnedPoints}
                                </Title>
                            </Stack>
                        </Paper>

                        {answerResult.correctAnswer && (
                            <Paper p="md" radius="lg" style={{ background: '#f3f4f6', width: '100%' }}>
                                <Text size="sm" c="dimmed" mb="xs">
                                    Correct Answer:
                                </Text>
                                <Text size="md" fw={600}>
                                    {answerResult.correctAnswer}
                                </Text>
                            </Paper>
                        )}
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};
