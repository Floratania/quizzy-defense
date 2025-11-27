import {
    Avatar,
    Badge,
    Box,
    Card,
    Container,
    Grid,
    Group,
    Paper,
    Progress,
    Stack,
    Text,
    Title
} from "@mantine/core";
import { IconClock, IconUsers } from "@tabler/icons-react";
import React from "react";
import {TimerBadge} from "./TimerBadge.jsx";
import {ANSWER_STYLES} from "../../constants/answerStyles.js";
import {AnswerGrid} from "./AnswerGrid.jsx";

// === MOCK DATA ========================================================
const mockQuestion = {
    id: "q1",
    text: "What is the capital of France?",
    timeLimit: 25,
    answers: [
        { id: "a1", text: "Paris" },
        { id: "a2", text: "London" },
        { id: "a3", text: "Berlin" },
        { id: "a4", text: "Madrid" },
        { id: "a5", text: "Madrid" },

    ]
};

const mockPlayers = [
    { id: "p1", nickname: "Marie", hasAnswered: true },
    { id: "p2", nickname: "Alex", hasAnswered: false },
    { id: "p3", nickname: "Sofi", hasAnswered: true },
    { id: "p4", nickname: "John", hasAnswered: false },
    { id: "p5", nickname: "Kate", hasAnswered: true },
    { id: "p6", nickname: "Ihor", hasAnswered: false }
];

const mockCurrentQuestionIndex = 1;

// ======================================================================

export default function Question() {
    const question = mockQuestion;
    const players = mockPlayers;
    const currentQuestionIndex = mockCurrentQuestionIndex;

    const answeredCount = players.filter((p) => p.hasAnswered).length;
    const progressPercent = (answeredCount / players.length) * 100 || 0;

    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                padding: "2rem"
            }}
        >
            <Container size="xl">
                <Stack spacing="xl">
                    {/* Header */}
                    <Group position="apart">
                        <Group>
                            <Badge size="lg" variant="light" color="blue">
                                Question {currentQuestionIndex}
                            </Badge>
                            <Badge
                                size="lg"
                                variant="gradient"
                                gradient={{ from: "blue.3", to: "purple.3" }}
                                leftSection={<IconUsers size={16} />}
                            >
                                {answeredCount}/{players.length}
                            </Badge>
                        </Group>
                        <TimerBadge timeLimit={question.timeLimit} />
                    </Group>

                    {/* Question Card */}
                    <Paper shadow="xl" radius="xl" p={40} style={{ background: "white" }}>
                        <Stack spacing="lg">
                            <Badge size="md" color="blue.3" variant="light">
                                Question {currentQuestionIndex}
                            </Badge>
                            <Title order={2} style={{ fontSize: "2.5rem", color: "#1f2937" }}>
                                {question.text}
                            </Title>
                        </Stack>
                    </Paper>

                    {/* Answers Grid */}
                    <AnswerGrid
                        answers={question.answers}
                        selectedAnswer={null}
                        onSelect={null}   // or omit entirely
                    />


                    {/* Progress Bar */}
                    <Paper shadow="sm" radius="lg" p="md" style={{ background: "white" }}>
                        <Stack spacing="xs">
                            <Group position="apart">
                                <Text weight={600}>Players Answered</Text>
                                <Text color="dimmed" size="sm">
                                    {answeredCount} / {players.length}
                                </Text>
                            </Group>
                            <Progress
                                value={progressPercent}
                                size="lg"
                                radius="xl"
                                color="blue.3"
                                striped
                                animate
                            />
                        </Stack>
                    </Paper>

                    {/* Players Grid */}
                    <Paper shadow="lg" radius="xl" p="xl" style={{ background: "white/80" }}>
                        <Title order={3} mb="md" style={{ color: "#1f2937" }}>
                            <Group spacing="xs">
                                <IconUsers size={24} />
                                Live Players
                            </Group>
                        </Title>

                        <Grid>
                            {players.map((player, idx) => (
                                <Grid.Col key={player.id} span={6} md={4} lg={3}>
                                    <Card shadow="sm" radius="lg" p="md">
                                        <Stack spacing="xs" align="center">
                                            <Avatar
                                                size="md"
                                                radius="xl"
                                                variant="gradient"
                                                gradient={{
                                                    from: ["blue.3", "purple.3", "pink.3", "cyan.3"][idx % 4],
                                                    to: ["blue.4", "purple.4", "pink.4", "cyan.4"][idx % 4]
                                                }}
                                            >
                                                {player.nickname[0].toUpperCase()}
                                            </Avatar>
                                            <Text weight={600} size="sm" align="center">
                                                {player.nickname}
                                            </Text>
                                            {player.hasAnswered ? (
                                                <Badge size="xs" color="green" variant="light">
                                                    Answered
                                                </Badge>
                                            ) : (
                                                <Badge size="xs" color="gray" variant="light">
                                                    Waiting...
                                                </Badge>
                                            )}
                                        </Stack>
                                    </Card>
                                </Grid.Col>
                            ))}
                        </Grid>
                    </Paper>
                </Stack>
            </Container>
        </Box>
    );
}
