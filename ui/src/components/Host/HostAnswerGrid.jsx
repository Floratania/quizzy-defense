import { Grid } from "@mantine/core";
import { HostAnswerCard } from "./HostAnswerCard.jsx";

export function HostAnswerGrid({ answers }) {
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
        <Grid gutter="md">
            {answers.map((answer, idx) => (
                <Grid.Col
                    key={answer.id}
                    span={{
                        base: 12,
                        sm: getSpan(idx),
                        md: getSpan(idx),
                    }}
                >
                    <HostAnswerCard answer={answer} index={idx} />
                </Grid.Col>
            ))}
        </Grid>
    );
}
