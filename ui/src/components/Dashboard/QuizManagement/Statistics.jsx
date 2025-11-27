import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Grid,
    Group,
    Paper,
    RingProgress,
    Stack,
    Table,
    Text,
    Title
} from "@mantine/core";
import {IconClock, IconTrophy} from "@tabler/icons-react";
import React from "react";

export default function Statistics() {
    const topQuiz = quizzes.reduce((max, quiz) =>
        quiz.plays > max.plays ? quiz : max, quizzes[0]
    );

    const recentActivity = [
        { quiz: 'World Capitals', player: 'Alex', score: 85, time: '2 hours ago' },
        { quiz: 'JavaScript Basics', player: 'Sam', score: 72, time: '3 hours ago' },
        { quiz: 'Science Facts', player: 'Jordan', score: 91, time: '5 hours ago' },
        { quiz: 'World Capitals', player: 'Taylor', score: 68, time: '6 hours ago' },
        { quiz: 'Science Facts', player: 'Morgan', score: 88, time: '8 hours ago' }
    ];

    return (
        <Stack gap="xl">
            {/* Overview Cards */}
            <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                        <Stack justify="space-between" h="100%">
                            <Box>
                                <Group justify="space-between" mb="md">
                                    <Text size="sm" fw={600} tt="uppercase" c="dimmed">
                                        Most Popular Quiz
                                    </Text>
                                    <IconTrophy size={20} color="gold" />
                                </Group>
                                <Title order={4} mb="xs">{topQuiz.title}</Title>
                                <Text size="sm" c="dimmed" mb="md">{topQuiz.category}</Text>
                                <Group>
                                    <Badge size="lg" variant="light" color="blue">
                                        {topQuiz.plays} plays
                                    </Badge>
                                    <Badge size="lg" variant="light" color="teal">
                                        {topQuiz.avgScore}% avg
                                    </Badge>
                                </Group>
                            </Box>
                        </Stack>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                        <Stack align="center" justify="center" h="100%">
                            <Text size="sm" fw={600} tt="uppercase" c="dimmed" mb="md">
                                Completion Rate
                            </Text>
                            <RingProgress
                                size={140}
                                thickness={12}
                                sections={[{ value: 82, color: 'teal' }]}
                                label={
                                    <Center>
                                        <Text size="xl" fw={700}>82%</Text>
                                    </Center>
                                }
                            />
                            <Text size="sm" c="dimmed">Players finish quizzes</Text>
                        </Stack>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                        <Stack align="center" justify="center" h="100%">
                            <Text size="sm" fw={600} tt="uppercase" c="dimmed" mb="md">
                                Avg Completion Time
                            </Text>
                            <Group gap="xs">
                                <IconClock size={32} color="gray" />
                                <Text size={32} fw={700}>4:35</Text>
                            </Group>
                            <Text size="sm" c="dimmed">Minutes per quiz</Text>
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>

            {/* Quiz Performance */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Quiz Performance</Title>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Quiz</Table.Th>
                            <Table.Th>Total Plays</Table.Th>
                            <Table.Th>Avg Score</Table.Th>
                            <Table.Th>Completion Rate</Table.Th>
                            <Table.Th>Performance</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {quizzes.filter(q => q.status === 'published').map((quiz) => {
                            const completionRate = Math.floor(Math.random() * 20) + 75;
                            return (
                                <Table.Tr key={quiz.id}>
                                    <Table.Td>
                                        <Box>
                                            <Text fw={600}>{quiz.title}</Text>
                                            <Text size="xs" c="dimmed">{quiz.category}</Text>
                                        </Box>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light">{quiz.plays}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Text fw={600}>{quiz.avgScore}%</Text>
                                            <Badge
                                                size="sm"
                                                color={quiz.avgScore >= 70 ? 'teal' : 'orange'}
                                                variant="light"
                                            >
                                                {quiz.avgScore >= 70 ? 'Good' : 'Fair'}
                                            </Badge>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Box style={{ flex: 1, maxWidth: 100 }}>
                                                <Text size="xs" c="dimmed">{completionRate}%</Text>
                                                <Box
                                                    style={{
                                                        width: '100%',
                                                        height: 6,
                                                        background: '#e9ecef',
                                                        borderRadius: 3,
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <Box
                                                        style={{
                                                            width: `${completionRate}%`,
                                                            height: '100%',
                                                            background: completionRate >= 80 ? '#20c997' : '#fd7e14',
                                                            transition: 'width 0.3s'
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Button size="xs" variant="light">
                                            View Details
                                        </Button>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Recent Activity */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Recent Activity</Title>
                <Stack gap="xs">
                    {recentActivity.map((activity, idx) => (
                        <Paper key={idx} p="md" withBorder>
                            <Group justify="space-between">
                                <Group>
                                    <Avatar color="blue" radius="xl">{activity.player[0]}</Avatar>
                                    <Box>
                                        <Text size="sm" fw={600}>{activity.player}</Text>
                                        <Text size="xs" c="dimmed">
                                            Completed "{activity.quiz}"
                                        </Text>
                                    </Box>
                                </Group>
                                <Group>
                                    <Badge color={activity.score >= 80 ? 'teal' : 'orange'}>
                                        {activity.score}%
                                    </Badge>
                                    <Text size="xs" c="dimmed">{activity.time}</Text>
                                </Group>
                            </Group>
                        </Paper>
                    ))}
                </Stack>
            </Card>
        </Stack>
    );
};