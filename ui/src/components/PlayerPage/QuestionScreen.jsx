import React, { useState } from 'react';
import { Box, Container, Paper, Title, Stack, Group } from '@mantine/core';
import {usePlayerGameContext} from "../../context/PlayerGameContext.jsx";
import {TimerBadge} from "../Question/TimerBadge.jsx";
import {AnswerGrid} from "../Question/AnswerGrid.jsx";

const answerGradients = [
    { from: 'blue.3', to: 'blue.5', icon: '△' },
    { from: 'emerald.3', to: 'emerald.5', icon: '◇' },
    { from: 'amber.3', to: 'amber.5', icon: '○' },
    { from: 'rose.3', to: 'rose.5', icon: '□' },
    { from: 'violet.3', to: 'violet.5', icon: '⬡' },
    { from: 'pink.3', to: 'pink.5', icon: '★' }
];

export const QuestionScreen = ({ question }) => {
    console.log('time', question.timeLimit)
    const { submitAnswer } = usePlayerGameContext();
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const handleAnswerClick = (answerId) => {
        if (selectedAnswer) return; // Already answered
        setSelectedAnswer(answerId);
        submitAnswer(answerId);
    };

    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                padding: "2rem"
            }}
        >
            <Container size="lg">
                <Stack gap="lg">
                    <Group justify="center">
                        <TimerBadge timeLimit={question.timeLimit} />
                    </Group>

                    <Paper shadow="xl" radius="xl" p={40} style={{ background: "white" }}>
                        <Stack spacing="lg">
                            {question.imageUrl && (
                                <Box
                                    style={{
                                        width: '100%',
                                        height: 300,
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        marginBottom: 16
                                    }}
                                >
                                    <img
                                        src={question.imageUrl}
                                        alt="Question"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </Box>
                            )}

                            <Title order={2} style={{ fontSize: '2rem', color: '#1f2937', textAlign: 'center' }}>
                                {question.text}
                            </Title>

                            {/*<Progress*/}
                            {/*    value={timeLeft}*/}
                            {/*    size="md"*/}
                            {/*    radius="xl"*/}
                            {/*    color="blue.3"*/}
                            {/*    style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}*/}
                            {/*/>*/}
                        </Stack>
                    </Paper>

                    <AnswerGrid
                        answers={question.answers}
                        selectedAnswer={selectedAnswer}
                        onSelect={(answerId) => handleAnswerClick(answerId)}
                    />

                </Stack>
            </Container>
        </Box>
    );
};