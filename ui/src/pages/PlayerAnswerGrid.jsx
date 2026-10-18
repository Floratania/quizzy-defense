import { Stack } from "@mantine/core";
import { PlayerAnswerCard } from "./PlayerAnswerCard.jsx";

export function PlayerAnswerGrid({ answers, selectedAnswer, onSelect }) {
    return (
        <Stack gap="sm" w="100%">
            {answers.map((answer, index) => (
                <PlayerAnswerCard
                    key={answer.id}
                    answer={answer}
                    index={index}
                    selected={selectedAnswer === answer.id}
                    disabled={!!selectedAnswer && selectedAnswer !== answer.id}
                    onSelect={onSelect}
                />
            ))}
        </Stack>
    );
}
