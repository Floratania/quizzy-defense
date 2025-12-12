import React, { useState } from "react";
import { Box, Stack } from "@mantine/core";
import { usePlayerGameContext } from "../../context/PlayerGameContext.jsx";
import { PlayerAnswerGrid } from "../../pages/PlayerAnswerGrid.jsx";
import { TimerBadge } from "../Question/TimerBadge.jsx";

export const QuestionScreen = ({ question }) => {
    const { submitAnswer } = usePlayerGameContext();
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const handleAnswerClick = (answerId) => {
        if (selectedAnswer) return;
        setSelectedAnswer(answerId);
        submitAnswer(answerId);
    };

    return (
        <Box
            style={{
                flex: 1, // 👈 ключове: займає простір ПІД navbar
                width: "100%",
                background:
                    "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            {/* Answers area */}
            <Box
                style={{
                    flex: 1,
                    minHeight: 0, // ⚠️ дуже важливо для Grid усередині
                }}
            >
                <PlayerAnswerGrid
                    answers={question.answers}
                    selectedAnswer={selectedAnswer}
                    onSelect={handleAnswerClick}
                />
            </Box>
        </Box>
    );
};
