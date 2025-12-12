import { Grid, Container } from "@mantine/core";
import { PlayerAnswerCard } from "./PlayerAnswerCard.jsx";

export function PlayerAnswerGrid({
                                     answers,
                                     selectedAnswer,
                                     onSelect,
                                 }) {
    return (
        <Container size="lg" style={{ width: '100%', maxWidth: 900 }}>
            <Grid
                gutter={{ base: 'lg', sm: 'xl' }}
                style={{ margin: 0 }}
            >
                {answers.map((answer, idx) => (
                    <Grid.Col
                        key={answer.id}
                        span={6}  // Always 2 per row
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
        </Container>
    );
}