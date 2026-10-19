import { Stack } from "@mantine/core";
import { PlayerAnswerCard } from "./PlayerAnswerCard.jsx";

export function PlayerAnswerGrid({ answers, selectedAnswer, onSelect, compact = false, disabled = false }) {
    return (
        <Stack gap={compact ? "xs" : "sm"} w="100%">
            {answers.map((answer, index) => (
                <PlayerAnswerCard
                    key={answer.id}
                    compact={compact}
                    answer={answer}
                    index={index}
                    selected={selectedAnswer === answer.id}
                    disabled={disabled || (!!selectedAnswer && selectedAnswer !== answer.id)}
                    onSelect={onSelect}
                />
            ))}
        </Stack>
    );
}
