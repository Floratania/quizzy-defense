
// AnswerResultScreen.js
import React from 'react';
import { Box, Container, Paper, Title, Text, Stack, ThemeIcon, Badge } from '@mantine/core';
import { IconCheck, IconX, IconStar } from '@tabler/icons-react';

export const AnswerResultScreen = ({ answerResult }) => {
    const isCorrect = answerResult.correct;

    return (
        <Box
            style={{
                minHeight: "100vh",
                background: isCorrect
                    ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)"
                    : "linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fca5a5 100%)",
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
                        <ThemeIcon
                            size={120}
                            radius="xl"
                            variant="gradient"
                            gradient={
                                isCorrect
                                    ? { from: 'teal.4', to: 'green.5' }
                                    : { from: 'red.4', to: 'pink.5' }
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
                                    color: isCorrect ? '#059669' : '#dc2626',
                                    marginBottom: 8
                                }}
                            >
                                {isCorrect ? 'Correct!' : 'Wrong!'}
                            </Title>
                            <Text size="lg" c="dimmed">
                                {isCorrect ? 'Great job!' : 'Better luck next time'}
                            </Text>
                        </div>

                        <Paper
                            p="xl"
                            radius="lg"
                            style={{
                                background: isCorrect
                                    ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                                    : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                width: '100%',
                                maxWidth: 300
                            }}
                        >
                            <Stack spacing="xs" align="center">
                                <IconStar size={32} color={isCorrect ? '#059669' : '#dc2626'} />
                                <Text size="sm" c="dimmed">
                                    Points Earned
                                </Text>
                                <Title order={1} style={{ color: isCorrect ? '#059669' : '#dc2626' }}>
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
