import React, { useState } from 'react';
import {Box, Container, Stack, Text} from '@mantine/core';
import { TimerBadge } from "./Question/TimerBadge.jsx";
import { AnswerGrid } from "./Question/AnswerGrid.jsx";
import {PlayerAnswerGrid} from "./PlayerPage/PlayerAnswerGrid.jsx";

// ⬇⬇⬇ МОК-ДАНІ ТУТ — без пропсів
const mockQuestion = {
    timeLimit: 20,
    answers: [
        { id: "a1", text: "Red" },
        { id: "a2", text: "Blue" },
        { id: "a3", text: "Green" },
        { id: "a4", text: "Yellow" }
    ]
};
// ⬆⬆⬆ МОК-ДАНІ

export default function QuestionScreenTest() {

    // мок submitAnswer замість контексту
    const submitAnswer = (answerId) => {
        console.log("MOCK submitAnswer:", answerId);
    };

    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const handleAnswerClick = (answerId) => {
        if (selectedAnswer) return;
        setSelectedAnswer(answerId);
        submitAnswer(answerId);
    };

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem'
            }}
        >
            <Container size="lg" style={{ width: '100%' }}>
                <Stack
                    gap="xl"
                    align="center"
                    style={{ width: '100%' }}>

                    {/* Answers grid - always 2 per row */}
                    <PlayerAnswerGrid
                        answers={mockQuestion.answers}
                        selectedAnswer={selectedAnswer}
                        onSelect={handleAnswerClick}
                    />
                </Stack>
            </Container>
        </Box>
    );
}
