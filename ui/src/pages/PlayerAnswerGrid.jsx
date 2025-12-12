import { Box, Grid } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { PlayerAnswerCard } from "./PlayerAnswerCard.jsx";

export function PlayerAnswerGrid({ answers, selectedAnswer, onSelect }) {
    const count = answers.length;
    const isMobile = useMediaQuery("(max-width: 768px)");

    const getSpan = () => {
        if (count === 2 && isMobile) return 12;
        return 6;
    };

    const getCardHeight = () => {
        if (count === 2 && isMobile) return "45%";
        if (count === 2) return "100%";
        if (count === 3 || count === 4) return "50%";
        if (count === 5 || count === 6) return "33.333%";
        return "50%";
    };

    return (
        <Box
            style={{
                width: "100%",
                height: "100%", // 👈 критично
                padding: "0.5rem",
            }}
        >
            <Grid
                gutter="md"
                style={{
                    width: "100%",
                    height: "100%",
                    margin: 0,
                }}
            >
                {answers.map((answer, idx) => (
                    <Grid.Col
                        key={answer.id}
                        span={getSpan()}
                        style={{
                            height: getCardHeight(),
                            display: "flex",
                        }}
                    >
                        <PlayerAnswerCard
                            answer={answer}
                            index={idx}
                            selected={selectedAnswer === answer.id}
                            disabled={!!selectedAnswer && selectedAnswer !== answer.id}
                            onSelect={onSelect}
                        />
                    </Grid.Col>
                ))}
            </Grid>
        </Box>
    );
}
