import {Badge, Box, Container, Group, Paper, Progress, Stack, Text, ThemeIcon, Title} from "@mantine/core";
import {IconCheck} from "@tabler/icons-react";
import React from "react";

export default function Result({results}) {
    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                padding: "2rem"
            }}
        >
            <Container size="lg">
                <Stack spacing="xl">
                    <Paper shadow="xl" radius="xl" p="xl" style={{ background: "white" }}>
                        <Title order={2} mb="xl" style={{ color: "#1f2937" }}>
                            Результати питання
                        </Title>

                        <Stack spacing="md">
                            {results?.answers.map((answer, idx) => {
                                const percentage = results.totalAnswers > 0
                                    ? (answer.count / results.totalAnswers) * 100
                                    : 0;

                                return (
                                    <Paper key={answer.id} shadow="sm" radius="lg" p="md">
                                        <Stack spacing="xs">
                                            <Group position="apart">
                                                <Group>
                                                    {answer.isCorrect && (
                                                        <ThemeIcon color="green" size="sm" radius="xl">
                                                            <IconCheck size={16} />
                                                        </ThemeIcon>
                                                    )}
                                                    <Text weight={600}>{answer.text}</Text>
                                                </Group>
                                                <Badge color={answer.isCorrect ? "green" : "gray"}>
                                                    {answer.count} відповідей
                                                </Badge>
                                            </Group>
                                            <Progress
                                                value={percentage}
                                                size="lg"
                                                radius="xl"
                                                color={answer.isCorrect ? "green.4" : "gray"}
                                            />
                                        </Stack>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </Paper>
                </Stack>
            </Container>
        </Box>
    );
}