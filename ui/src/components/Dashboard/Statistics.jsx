import React, { useState } from 'react';
import {
    MantineProvider,
    Title,
    Text,
    Button,
    Stack,
    Card,
    Table,
    Badge,
    Box,
    Grid,
    Paper,
    RingProgress,
    Center,
    Avatar,
    Container,
    Group,
    Progress,
    Tabs,
    Divider,
    ActionIcon,
    Accordion
} from '@mantine/core';
import {
    IconTrophy,
    IconClock,
    IconUsers,
    IconCheck,
    IconX,
    IconChartBar,
    IconList,
    IconTarget,
    IconBolt,
    IconMedal,
    IconArrowLeft
} from '@tabler/icons-react';

// Mock data
const mockSessionData = {
    sessionId: "session-123",
    quiz: {
        id: "quiz-456",
        title: "Math Quiz for Kids"
    },
    summary: {
        totalPlayers: 12,
        totalQuestions: 10,
        totalAnswers: 120,
        globalAccuracy: 0.73,
        avgAnswerTime: 2850,
        perQuestionAccuracy: [
            { questionId: "q1", accuracy: 0.75 },
            { questionId: "q2", accuracy: 0.82 },
            { questionId: "q3", accuracy: 0.65 },
            { questionId: "q4", accuracy: 0.90 },
            { questionId: "q5", accuracy: 0.58 },
            { questionId: "q6", accuracy: 0.77 },
            { questionId: "q7", accuracy: 0.83 },
            { questionId: "q8", accuracy: 0.70 },
            { questionId: "q9", accuracy: 0.68 },
            { questionId: "q10", accuracy: 0.62 }
        ]
    },
    players: [
        {
            playerId: "p1",
            nickname: "Mila",
            place: 1,
            score: 9800,
            correctCount: 9,
            accuracy: 0.90,
            avgAnswerTime: 2500,
            answers: [
                {
                    questionId: "q1",
                    questionText: "2 + 2?",
                    selectedAnswerId: "a3",
                    selectedAnswerText: "4",
                    correct: true,
                    timeTaken: 1800,
                    earnedPoints: 1000
                },
                {
                    questionId: "q2",
                    questionText: "5 × 3?",
                    selectedAnswerId: "a8",
                    selectedAnswerText: "15",
                    correct: true,
                    timeTaken: 2200,
                    earnedPoints: 1100
                },
                {
                    questionId: "q3",
                    questionText: "10 - 4?",
                    selectedAnswerId: "a12",
                    selectedAnswerText: "6",
                    correct: true,
                    timeTaken: 1900,
                    earnedPoints: 1050
                }
            ]
        },
        {
            playerId: "p2",
            nickname: "Alex",
            place: 2,
            score: 8500,
            correctCount: 8,
            accuracy: 0.80,
            avgAnswerTime: 2800,
            answers: [
                {
                    questionId: "q1",
                    questionText: "2 + 2?",
                    selectedAnswerId: "a3",
                    selectedAnswerText: "4",
                    correct: true,
                    timeTaken: 2100,
                    earnedPoints: 950
                },
                {
                    questionId: "q2",
                    questionText: "5 × 3?",
                    selectedAnswerId: "a7",
                    selectedAnswerText: "12",
                    correct: false,
                    timeTaken: 3300,
                    earnedPoints: 0
                },
                {
                    questionId: "q3",
                    questionText: "10 - 4?",
                    selectedAnswerId: "a12",
                    selectedAnswerText: "6",
                    correct: true,
                    timeTaken: 2400,
                    earnedPoints: 900
                }
            ]
        },
        {
            playerId: "p3",
            nickname: "Sam",
            place: 3,
            score: 7800,
            correctCount: 7,
            accuracy: 0.70,
            avgAnswerTime: 3100,
            answers: []
        },
        {
            playerId: "p4",
            nickname: "Jordan",
            place: 4,
            score: 7200,
            correctCount: 7,
            accuracy: 0.70,
            avgAnswerTime: 3400,
            answers: []
        },
        {
            playerId: "p5",
            nickname: "Taylor",
            place: 5,
            score: 6900,
            correctCount: 6,
            accuracy: 0.60,
            avgAnswerTime: 3200,
            answers: []
        },
        {
            playerId: "p6",
            nickname: "Morgan",
            place: 6,
            score: 6500,
            correctCount: 6,
            accuracy: 0.60,
            avgAnswerTime: 3500,
            answers: []
        },
        {
            playerId: "p7",
            nickname: "Casey",
            place: 7,
            score: 5800,
            correctCount: 5,
            accuracy: 0.50,
            avgAnswerTime: 3800,
            answers: []
        },
        {
            playerId: "p8",
            nickname: "Riley",
            place: 8,
            score: 5200,
            correctCount: 5,
            accuracy: 0.50,
            avgAnswerTime: 4000,
            answers: []
        }
    ],
    questions: [
        {
            questionId: "q1",
            text: "2 + 2?",
            correctAnswerId: "a3",
            answerStats: [
                { answerId: "a1", text: "3", count: 2, percentage: 0.17 },
                { answerId: "a2", text: "5", count: 1, percentage: 0.08 },
                { answerId: "a3", text: "4", count: 9, percentage: 0.75 }
            ],
            difficulty: "easy",
            avgAnswerTime: 2000,
            playerBreakdown: [
                {
                    playerId: "p1",
                    nickname: "Mila",
                    selectedAnswerId: "a3",
                    correct: true,
                    timeTaken: 1800,
                    earnedPoints: 1000
                },
                {
                    playerId: "p2",
                    nickname: "Alex",
                    selectedAnswerId: "a3",
                    correct: true,
                    timeTaken: 2100,
                    earnedPoints: 950
                }
            ]
        },
        {
            questionId: "q2",
            text: "5 × 3?",
            correctAnswerId: "a8",
            answerStats: [
                { answerId: "a7", text: "12", count: 2, percentage: 0.18 },
                { answerId: "a8", text: "15", count: 10, percentage: 0.82 }
            ],
            difficulty: "medium",
            avgAnswerTime: 2500,
            playerBreakdown: []
        },
        {
            questionId: "q3",
            text: "10 - 4?",
            correctAnswerId: "a12",
            answerStats: [
                { answerId: "a11", text: "5", count: 2, percentage: 0.17 },
                { answerId: "a12", text: "6", count: 8, percentage: 0.65 },
                { answerId: "a13", text: "7", count: 2, percentage: 0.18 }
            ],
            difficulty: "easy",
            avgAnswerTime: 2200,
            playerBreakdown: []
        },
        {
            questionId: "q4",
            text: "12 ÷ 3?",
            correctAnswerId: "a16",
            answerStats: [
                { answerId: "a15", text: "3", count: 1, percentage: 0.10 },
                { answerId: "a16", text: "4", count: 11, percentage: 0.90 }
            ],
            difficulty: "easy",
            avgAnswerTime: 1800,
            playerBreakdown: []
        },
        {
            questionId: "q5",
            text: "7 + 8?",
            correctAnswerId: "a20",
            answerStats: [
                { answerId: "a19", text: "14", count: 3, percentage: 0.25 },
                { answerId: "a20", text: "15", count: 7, percentage: 0.58 },
                { answerId: "a21", text: "16", count: 2, percentage: 0.17 }
            ],
            difficulty: "medium",
            avgAnswerTime: 3200,
            playerBreakdown: []
        }
    ],
    createdAt: "2025-02-12T10:03:00.000Z"
};

export default function QuizSessionStatistics() {
    return (
        <MantineProvider theme={{
            colorScheme: 'light',
            primaryColor: 'blue',
        }}>
            <StatisticsContent data={mockSessionData} />
        </MantineProvider>
    );
}

function StatisticsContent({ data }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        return `${seconds}s`;
    };

    const getMedalIcon = (place) => {
        if (place === 1) return <IconTrophy size={20} color="#FFD700" />;
        if (place === 2) return <IconMedal size={20} color="#C0C0C0" />;
        if (place === 3) return <IconMedal size={20} color="#CD7F32" />;
        return null;
    };

    const OverviewTab = () => (
        <Stack gap="xl">
            {/* Header Stats */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="lg">
                    <Box>
                        <Text size="sm" c="dimmed" mb="xs">Quiz Session</Text>
                        <Title order={2}>{data.quiz.title}</Title>
                        <Text size="sm" c="dimmed" mt="xs">
                            Session: {data.sessionId} • {new Date(data.createdAt).toLocaleString()}
                        </Text>
                    </Box>
                    <Button leftSection={<IconArrowLeft size={16} />} variant="light">
                        Back to Dashboard
                    </Button>
                </Group>

                <Grid>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Paper p="md" withBorder>
                            <Group justify="space-between">
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                        Total Players
                                    </Text>
                                    <Text size="xl" fw={700}>{data.summary.totalPlayers}</Text>
                                </Box>
                                <Avatar color="blue" variant="light" size="lg">
                                    <IconUsers size={24} />
                                </Avatar>
                            </Group>
                        </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Paper p="md" withBorder>
                            <Group justify="space-between">
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                        Global Accuracy
                                    </Text>
                                    <Text size="xl" fw={700}>{Math.round(data.summary.globalAccuracy * 100)}%</Text>
                                </Box>
                                <Avatar color="teal" variant="light" size="lg">
                                    <IconTarget size={24} />
                                </Avatar>
                            </Group>
                        </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Paper p="md" withBorder>
                            <Group justify="space-between">
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                        Avg Answer Time
                                    </Text>
                                    <Text size="xl" fw={700}>{formatTime(data.summary.avgAnswerTime)}</Text>
                                </Box>
                                <Avatar color="orange" variant="light" size="lg">
                                    <IconClock size={24} />
                                </Avatar>
                            </Group>
                        </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Paper p="md" withBorder>
                            <Group justify="space-between">
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                        Total Answers
                                    </Text>
                                    <Text size="xl" fw={700}>{data.summary.totalAnswers}</Text>
                                </Box>
                                <Avatar color="violet" variant="light" size="lg">
                                    <IconList size={24} />
                                </Avatar>
                            </Group>
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Card>

            {/* Leaderboard */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Final Leaderboard</Title>
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Rank</Table.Th>
                            <Table.Th>Player</Table.Th>
                            <Table.Th>Score</Table.Th>
                            <Table.Th>Correct</Table.Th>
                            <Table.Th>Accuracy</Table.Th>
                            <Table.Th>Avg Time</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {data.players.map((player) => (
                            <Table.Tr key={player.playerId}>
                                <Table.Td>
                                    <Group gap="xs">
                                        <Text fw={700} size="lg">#{player.place}</Text>
                                        {getMedalIcon(player.place)}
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <Avatar color="blue" radius="xl" size="sm">
                                            {player.nickname[0]}
                                        </Avatar>
                                        <Text fw={600}>{player.nickname}</Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Badge size="lg" variant="light" color="blue">
                                        {player.score.toLocaleString()}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={600}>
                                        {player.correctCount}/{data.summary.totalQuestions}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <Progress
                                            value={player.accuracy * 100}
                                            size="sm"
                                            style={{ width: 80 }}
                                            color={player.accuracy >= 0.7 ? 'teal' : 'orange'}
                                        />
                                        <Text size="sm" fw={600}>
                                            {Math.round(player.accuracy * 100)}%
                                        </Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{formatTime(player.avgAnswerTime)}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        onClick={() => {
                                            setSelectedPlayer(player);
                                            setActiveTab('players');
                                        }}
                                    >
                                        View Details
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Question Difficulty */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Question Performance</Title>
                <Stack gap="xs">
                    {data.summary.perQuestionAccuracy.map((q, idx) => {
                        const question = data.questions[idx];
                        const accuracy = Math.round(q.accuracy * 100);
                        return (
                            <Paper key={q.questionId} p="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Group>
                                        <Badge size="sm">Q{idx + 1}</Badge>
                                        <Text fw={600}>{question?.text || `Question ${idx + 1}`}</Text>
                                    </Group>
                                    <Group gap="xs">
                                        <Badge
                                            color={accuracy >= 70 ? 'teal' : accuracy >= 50 ? 'orange' : 'red'}
                                            variant="light"
                                        >
                                            {accuracy}% correct
                                        </Badge>
                                        {question?.avgAnswerTime && (
                                            <Badge variant="light" color="gray">
                                                {formatTime(question.avgAnswerTime)}
                                            </Badge>
                                        )}
                                    </Group>
                                </Group>
                                <Progress
                                    value={accuracy}
                                    color={accuracy >= 70 ? 'teal' : accuracy >= 50 ? 'orange' : 'red'}
                                    size="lg"
                                />
                            </Paper>
                        );
                    })}
                </Stack>
            </Card>
        </Stack>
    );

    const PlayersTab = () => (
        <Stack gap="xl">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Player Details</Title>

                {selectedPlayer ? (
                    <Stack gap="lg">
                        <Group justify="space-between">
                            <Group>
                                <Avatar color="blue" radius="xl" size="xl">
                                    {selectedPlayer.nickname[0]}
                                </Avatar>
                                <Box>
                                    <Group gap="xs">
                                        <Title order={2}>{selectedPlayer.nickname}</Title>
                                        {getMedalIcon(selectedPlayer.place)}
                                    </Group>
                                    <Text c="dimmed">Rank #{selectedPlayer.place} • Score: {selectedPlayer.score.toLocaleString()}</Text>
                                </Box>
                            </Group>
                            <Button variant="light" onClick={() => setSelectedPlayer(null)}>
                                Back to List
                            </Button>
                        </Group>

                        <Grid>
                            <Grid.Col span={{ base: 6, md: 3 }}>
                                <Paper p="md" withBorder ta="center">
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
                                        Correct Answers
                                    </Text>
                                    <Text size="xl" fw={700} c="teal">
                                        {selectedPlayer.correctCount}/{data.summary.totalQuestions}
                                    </Text>
                                </Paper>
                            </Grid.Col>
                            <Grid.Col span={{ base: 6, md: 3 }}>
                                <Paper p="md" withBorder ta="center">
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
                                        Accuracy
                                    </Text>
                                    <Text size="xl" fw={700} c="blue">
                                        {Math.round(selectedPlayer.accuracy * 100)}%
                                    </Text>
                                </Paper>
                            </Grid.Col>
                            <Grid.Col span={{ base: 6, md: 3 }}>
                                <Paper p="md" withBorder ta="center">
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
                                        Avg Time
                                    </Text>
                                    <Text size="xl" fw={700} c="orange">
                                        {formatTime(selectedPlayer.avgAnswerTime)}
                                    </Text>
                                </Paper>
                            </Grid.Col>
                            <Grid.Col span={{ base: 6, md: 3 }}>
                                <Paper p="md" withBorder ta="center">
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
                                        Total Score
                                    </Text>
                                    <Text size="xl" fw={700} c="violet">
                                        {selectedPlayer.score.toLocaleString()}
                                    </Text>
                                </Paper>
                            </Grid.Col>
                        </Grid>

                        {selectedPlayer.answers.length > 0 && (
                            <>
                                <Divider label="Answer Breakdown" labelPosition="center" />
                                <Stack gap="xs">
                                    {selectedPlayer.answers.map((answer, idx) => (
                                        <Paper key={idx} p="md" withBorder>
                                            <Group justify="space-between">
                                                <Box style={{ flex: 1 }}>
                                                    <Group mb="xs">
                                                        <Badge size="sm">Q{idx + 1}</Badge>
                                                        <Text fw={600}>{answer.questionText}</Text>
                                                    </Group>
                                                    <Group>
                                                        {answer.correct ? (
                                                            <Badge color="teal" leftSection={<IconCheck size={12} />}>
                                                                Correct
                                                            </Badge>
                                                        ) : (
                                                            <Badge color="red" leftSection={<IconX size={12} />}>
                                                                Incorrect
                                                            </Badge>
                                                        )}
                                                        <Text size="sm" c="dimmed">
                                                            Answer: {answer.selectedAnswerText}
                                                        </Text>
                                                    </Group>
                                                </Box>
                                                <Group>
                                                    <Paper p="xs" withBorder>
                                                        <Group gap={4}>
                                                            <IconClock size={14} color="gray" />
                                                            <Text size="xs">{formatTime(answer.timeTaken)}</Text>
                                                        </Group>
                                                    </Paper>
                                                    <Paper p="xs" withBorder>
                                                        <Group gap={4}>
                                                            <IconBolt size={14} color="orange" />
                                                            <Text size="xs" fw={600}>{answer.earnedPoints}</Text>
                                                        </Group>
                                                    </Paper>
                                                </Group>
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
                            </>
                        )}
                    </Stack>
                ) : (
                    <Grid>
                        {data.players.map((player) => (
                            <Grid.Col key={player.playerId} span={{ base: 12, sm: 6, md: 4 }}>
                                <Paper
                                    p="lg"
                                    withBorder
                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                    onClick={() => setSelectedPlayer(player)}
                                    className="hover:shadow-md"
                                >
                                    <Stack align="center" gap="sm">
                                        <Group>
                                            {getMedalIcon(player.place)}
                                            <Avatar color="blue" radius="xl" size="lg">
                                                {player.nickname[0]}
                                            </Avatar>
                                        </Group>
                                        <Text fw={700} size="lg">{player.nickname}</Text>
                                        <Badge size="lg" variant="light">
                                            {player.score.toLocaleString()} pts
                                        </Badge>
                                        <Group gap="xl">
                                            <Box ta="center">
                                                <Text size="xs" c="dimmed">Accuracy</Text>
                                                <Text fw={700}>{Math.round(player.accuracy * 100)}%</Text>
                                            </Box>
                                            <Box ta="center">
                                                <Text size="xs" c="dimmed">Correct</Text>
                                                <Text fw={700}>{player.correctCount}/{data.summary.totalQuestions}</Text>
                                            </Box>
                                        </Group>
                                        <Button size="xs" variant="light" fullWidth>
                                            View Details
                                        </Button>
                                    </Stack>
                                </Paper>
                            </Grid.Col>
                        ))}
                    </Grid>
                )}
            </Card>
        </Stack>
    );

    const QuestionsTab = () => (
        <Stack gap="xl">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Question Analysis</Title>

                <Accordion>
                    {data.questions.map((question, idx) => {
                        const accuracy = Math.round(data.summary.perQuestionAccuracy[idx]?.accuracy * 100);
                        return (
                            <Accordion.Item key={question.questionId} value={question.questionId}>
                                <Accordion.Control>
                                    <Group justify="space-between" pr="md">
                                        <Group>
                                            <Badge>Q{idx + 1}</Badge>
                                            <Text fw={600}>{question.text}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <Badge
                                                color={accuracy >= 70 ? 'teal' : accuracy >= 50 ? 'orange' : 'red'}
                                            >
                                                {accuracy}%
                                            </Badge>
                                            <Badge variant="light" color="gray">
                                                {formatTime(question.avgAnswerTime)}
                                            </Badge>
                                        </Group>
                                    </Group>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="md">
                                        <Paper p="md" withBorder>
                                            <Text size="sm" fw={600} mb="sm">Answer Distribution</Text>
                                            <Stack gap="xs">
                                                {question.answerStats.map((answer) => {
                                                    const isCorrect = answer.answerId === question.correctAnswerId;
                                                    return (
                                                        <Box key={answer.answerId}>
                                                            <Group justify="space-between" mb={4}>
                                                                <Group gap="xs">
                                                                    {isCorrect && <IconCheck size={16} color="green" />}
                                                                    <Text size="sm" fw={isCorrect ? 700 : 400}>
                                                                        {answer.text}
                                                                    </Text>
                                                                </Group>
                                                                <Text size="sm" fw={600}>
                                                                    {answer.count} ({Math.round(answer.percentage * 100)}%)
                                                                </Text>
                                                            </Group>
                                                            <Progress
                                                                value={answer.percentage * 100}
                                                                color={isCorrect ? 'teal' : 'gray'}
                                                                size="md"
                                                            />
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        </Paper>

                                        {question.playerBreakdown.length > 0 && (
                                            <Paper p="md" withBorder>
                                                <Text size="sm" fw={600} mb="sm">Player Responses</Text>
                                                <Table>
                                                    <Table.Thead>
                                                        <Table.Tr>
                                                            <Table.Th>Player</Table.Th>
                                                            <Table.Th>Result</Table.Th>
                                                            <Table.Th>Time</Table.Th>
                                                            <Table.Th>Points</Table.Th>
                                                        </Table.Tr>
                                                    </Table.Thead>
                                                    <Table.Tbody>
                                                        {question.playerBreakdown.map((pb) => (
                                                            <Table.Tr key={pb.playerId}>
                                                                <Table.Td>
                                                                    <Group gap="xs">
                                                                        <Avatar size="sm" radius="xl" color="blue">
                                                                            {pb.nickname[0]}
                                                                        </Avatar>
                                                                        <Text size="sm">{pb.nickname}</Text>
                                                                    </Group>
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    {pb.correct ? (
                                                                        <Badge color="teal" size="sm" leftSection={<IconCheck size={12} />}>
                                                                            Correct
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge color="red" size="sm" leftSection={<IconX size={12} />}>
                                                                            Wrong
                                                                        </Badge>
                                                                    )}
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <Text size="sm">{formatTime(pb.timeTaken)}</Text>
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <Text size="sm" fw={600}>{pb.earnedPoints}</Text>
                                                                </Table.Td>
                                                            </Table.Tr>
                                                        ))}
                                                    </Table.Tbody>
                                                </Table>
                                            </Paper>
                                        )}
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        );
                    })}
                </Accordion>
            </Card>
        </Stack>
    );

    return (
        <Container size="xl" py="xl">
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
                        Overview
                    </Tabs.Tab>
                    <Tabs.Tab value="players" leftSection={<IconUsers size={16} />}>
                        Players
                    </Tabs.Tab>
                    <Tabs.Tab value="questions" leftSection={<IconList size={16} />}>
                        Questions
                    </Tabs.Tab>
                </Tabs.List>

                <Box mt="xl">
                    <Tabs.Panel value="overview">
                        <OverviewTab />
                    </Tabs.Panel>

                    <Tabs.Panel value="players">
                        <PlayersTab />
                    </Tabs.Panel>

                    <Tabs.Panel value="questions">
                        <QuestionsTab />
                    </Tabs.Panel>
                </Box>
            </Tabs>
        </Container>
    );
}