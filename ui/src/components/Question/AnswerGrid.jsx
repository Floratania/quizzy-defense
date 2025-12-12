import { Grid } from "@mantine/core";
import { AnswerCardBase } from "./AnswerCardBase.jsx";

export function AnswerGrid({ answers, selectedAnswer, onSelect, hideText = false }) {
    const count = answers.length;

    const getSpan = (idx) => {
        if (count === 1) return 12;
        if (count === 2) return 6;
        if (count === 4) return 6;
        if (count === 3 || count === 6) return 4;
        if (count === 5) return idx < 3 ? 4 : 6;

        return 4;
    };

    return (
        <Grid gutter="sm">
            {answers.map((answer, idx) => (
                <Grid.Col
                    key={answer.id}
                    span={{
                        base: 6,              // ← phones: 2 per row
                        xs: 4,                // ← larger phones: 3 per row
                        sm: getSpan(idx),     // ← tablets / browser
                        md: getSpan(idx),
                    }}
                >
                    <AnswerCardBase
                        answer={answer}
                        index={idx}
                        selected={selectedAnswer === answer.id}
                        disabled={!!selectedAnswer && selectedAnswer !== answer.id}
                        onSelect={onSelect}
                        hideText={hideText}
                    />
                </Grid.Col>
            ))}
        </Grid>
    );
}
