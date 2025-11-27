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
    Container,
    Group,
    TextInput,
    Select,
    ActionIcon
} from '@mantine/core';
import {
    IconSearch,
    IconEye,
    IconCalendar,
    IconUsers,
    IconTarget,
    IconClock,
    IconTrophy,
    IconChevronRight
} from '@tabler/icons-react';

// Mock sessions data
const mockSessions = [
    {
        sessionId: "session-001",
        quiz: {
            id: "quiz-001",
            title: "Math Quiz for Kids"
        },
        summary: {
            totalPlayers: 12,
            globalAccuracy: 0.73,
            avgAnswerTime: 2850
        },
        createdAt: "2025-02-12T10:03:00.000Z",
        status: "completed"
    },
    {
        sessionId: "session-002",
        quiz: {
            id: "quiz-002",
            title: "World Geography Challenge"
        },
        summary: {
            totalPlayers: 8,
            globalAccuracy: 0.65,
            avgAnswerTime: 3200
        },
        createdAt: "2025-02-11T14:30:00.000Z",
        status: "completed"
    },
    {
        sessionId: "session-003",
        quiz: {
            id: "quiz-003",
            title: "JavaScript Basics"
        },
        summary: {
            totalPlayers: 15,
            globalAccuracy: 0.81,
            avgAnswerTime: 2500
        },
        createdAt: "2025-02-10T09:15:00.000Z",
        status: "completed"
    },
    {
        sessionId: "session-004",
        quiz: {
            id: "quiz-001",
            title: "Math Quiz for Kids"
        },
        summary: {
            totalPlayers: 10,
            globalAccuracy: 0.68,
            avgAnswerTime: 3100
        },
        createdAt: "2025-02-09T16:45:00.000Z",
        status: "completed"
    },
    {
        sessionId: "session-005",
        quiz: {
            id: "quiz-004",
            title: "Science Facts"
        },
        summary: {
            totalPlayers: 20,
            globalAccuracy: 0.78,
            avgAnswerTime: 2700
        },
        createdAt: "2025-02-08T11:20:00.000Z",
        status: "completed"
    },
    {
        sessionId: "session-006",
        quiz: {
            id: "quiz-005",
            title: "Movie Trivia Night"
        },
        summary: {
            totalPlayers: 6,
            globalAccuracy: 0.55,
            avgAnswerTime: 3800
        },
        createdAt: "2025-02-07T19:00:00.000Z",
        status: "completed"
    },
    {
        sessionId: "session-007",
        quiz: {
            id: "quiz-002",
            title: "World Geography Challenge"
        },
        summary: {
            totalPlayers: 14,
            globalAccuracy: 0.72,
            avgAnswerTime: 2900
        },
        createdAt: "2025-02-06T13:30:00.000Z",
        status: "completed"
    },
    {
        sessionId: "session-008",
        quiz: {
            id: "quiz-006",
            title: "History Timeline"
        },
        summary: {
            totalPlayers: 9,
            globalAccuracy: 0.61,
            avgAnswerTime: 3400
        },
        createdAt: "2025-02-05T15:10:00.000Z",
        status: "completed"
    }
];

export default function QuizReportsList() {
    return (
        <MantineProvider theme={{
            colorScheme: 'light',
            primaryColor: 'blue',
        }}>
            <ReportsListContent />
        </MantineProvider>
    );
}

function ReportsListContent() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sessions, setSessions] = useState(mockSessions);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        return `${seconds}s`;
    };

    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.sessionId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Calculate summary stats
    const totalSessions = sessions.length;
    const totalPlayers = sessions.reduce((sum, s) => sum + s.summary.totalPlayers, 0);
    const avgAccuracy = Math.round((sessions.reduce((sum, s) => sum + s.summary.globalAccuracy, 0) / sessions.length) * 100);

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                {/* Header */}
                <Box>
                    <Title order={1} mb="xs">Quiz Session Reports</Title>
                    <Text c="dimmed">View detailed statistics and analytics for all your quiz sessions</Text>
                </Box>

                {/* Summary Cards */}
                <Grid>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between">
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                        Total Sessions
                                    </Text>
                                    <Text size="xl" fw={700}>{totalSessions}</Text>
                                </Box>
                                <IconCalendar size={32} color="gray" opacity={0.6} />
                            </Group>
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between">
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                        Total Players
                                    </Text>
                                    <Text size="xl" fw={700}>{totalPlayers}</Text>
                                </Box>
                                <IconUsers size={32} color="gray" opacity={0.6} />
                            </Group>
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between">
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                        Avg Accuracy
                                    </Text>
                                    <Text size="xl" fw={700}>{avgAccuracy}%</Text>
                                </Box>
                                <IconTarget size={32} color="gray" opacity={0.6} />
                            </Group>
                        </Card>
                    </Grid.Col>
                </Grid>

                {/* Filters */}
                <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group>
                        <TextInput
                            placeholder="Search by quiz name or session ID..."
                            leftSection={<IconSearch size={16} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <Select
                            placeholder="Status"
                            value={filterStatus}
                            onChange={setFilterStatus}
                            data={[
                                { value: 'all', label: 'All Sessions' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'in-progress', label: 'In Progress' }
                            ]}
                            style={{ width: 180 }}
                        />
                    </Group>
                </Card>

                {/* Sessions Table */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Table highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Session</Table.Th>
                                <Table.Th>Quiz</Table.Th>
                                <Table.Th>Date</Table.Th>
                                <Table.Th>Players</Table.Th>
                                <Table.Th>Accuracy</Table.Th>
                                <Table.Th>Avg Time</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Action</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredSessions.map((session) => (
                                <Table.Tr key={session.sessionId}>
                                    <Table.Td>
                                        <Text size="sm" c="dimmed" ff="monospace">
                                            {session.sessionId}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={600}>{session.quiz.title}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <IconCalendar size={14} color="gray" />
                                            <Text size="sm">{formatDate(session.createdAt)}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <IconUsers size={14} color="gray" />
                                            <Text size="sm" fw={600}>{session.summary.totalPlayers}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                session.summary.globalAccuracy >= 0.7 ? 'teal' :
                                                    session.summary.globalAccuracy >= 0.5 ? 'orange' : 'red'
                                            }
                                            variant="light"
                                        >
                                            {Math.round(session.summary.globalAccuracy * 100)}%
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <IconClock size={14} color="gray" />
                                            <Text size="sm">{formatTime(session.summary.avgAnswerTime)}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={session.status === 'completed' ? 'blue' : 'yellow'}
                                            variant="light"
                                        >
                                            {session.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            rightSection={<IconChevronRight size={14} />}
                                            onClick={() => {
                                                console.log('View session:', session.sessionId);
                                                alert(`Opening session: ${session.sessionId}\n\nThis would navigate to the detailed statistics page.`);
                                            }}
                                        >
                                            View Report
                                        </Button>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    {filteredSessions.length === 0 && (
                        <Box py="xl" ta="center">
                            <Text c="dimmed">No sessions found matching your criteria</Text>
                        </Box>
                    )}
                </Card>

                {/* Quick Stats Cards */}
                <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between" mb="md">
                                <Box>
                                    <Text size="sm" fw={600}>Most Popular Quiz</Text>
                                    <Text size="xs" c="dimmed">Based on total plays</Text>
                                </Box>
                                <IconTrophy size={24} color="gold" />
                            </Group>
                            <Text fw={700} size="lg" mb="xs">Math Quiz for Kids</Text>
                            <Group gap="xs">
                                <Badge variant="light">22 players total</Badge>
                                <Badge variant="light" color="teal">71% avg accuracy</Badge>
                            </Group>
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between" mb="md">
                                <Box>
                                    <Text size="sm" fw={600}>Recent Activity</Text>
                                    <Text size="xs" c="dimmed">Last 7 days</Text>
                                </Box>
                                <IconCalendar size={24} color="gray" />
                            </Group>
                            <Text fw={700} size="lg" mb="xs">8 Sessions Completed</Text>
                            <Group gap="xs">
                                <Badge variant="light">104 players</Badge>
                                <Badge variant="light" color="blue">69% avg accuracy</Badge>
                            </Group>
                        </Card>
                    </Grid.Col>
                </Grid>
            </Stack>
        </Container>
    );
}