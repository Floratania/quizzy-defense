import {Badge, Box, Container, Group, Paper, Progress, Stack, Table, Text, ThemeIcon, Title} from "@mantine/core";
import {IconCheck, IconX} from "@tabler/icons-react";
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

                        {results.message && <Text mb="md" c="dimmed">{results.message}</Text>}
                        <Group mb="xl" grow>
                            <Paper withBorder p="md" ta="center">
                                <Text c="dimmed">Відповіли</Text>
                                <Title order={2}>{results.totalAnswers}</Title>
                            </Paper>
                            <Paper withBorder p="md" ta="center">
                                <Text c="dimmed">Правильних</Text>
                                <Title order={2} c="green">{results.correctAnswers}</Title>
                            </Paper>
                            <Paper withBorder p="md" ta="center">
                                <Text c="dimmed">Точність</Text>
                                <Title order={2}>{Math.round((results.accuracy || 0) * 100)}%</Title>
                            </Paper>
                        </Group>

                        <Stack spacing="md">
                            {results?.answers.map((answer) => {
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

                        <Title order={3} mt="xl" mb="md">Відповіді учнів</Title>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr><Table.Th>Учень</Table.Th><Table.Th>Відповідь</Table.Th><Table.Th>Результат</Table.Th><Table.Th>Бали</Table.Th></Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {(results.playerBreakdown || []).map((player) => (
                                    <Table.Tr key={player.playerId}>
                                        <Table.Td>{player.nickname}</Table.Td>
                                        <Table.Td>{player.submittedAnswer}</Table.Td>
                                        <Table.Td>
                                            <Badge color={player.correct ? 'green' : 'red'} leftSection={player.correct ? <IconCheck size={12}/> : <IconX size={12}/> }>
                                                {player.correct ? 'Правильно' : 'Неправильно'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>{player.earnedPoints}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                </Stack>
            </Container>
        </Box>
    );
}
