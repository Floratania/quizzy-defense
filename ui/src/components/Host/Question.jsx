import {Avatar, Badge, Box, Card, Container, Grid, Group, Image, Paper, Progress, Stack, Text, Title} from "@mantine/core";
import {IconClock, IconUsers} from "@tabler/icons-react";
import React from "react";
import {TimerBadge} from "../Question/TimerBadge.jsx";
import TournamentBoard from './TournamentBoard.jsx';
import RichText from '../Question/RichText.jsx';

export default function Question({question, players, currentQuestionIndex, teamLeaderboard = [], tournamentState = null}) {
    const activePlayers = players.filter((player) => !player.eliminated);
    const answeredCount = activePlayers.filter(p => p.hasAnswered).length;
    const progressPercent = (answeredCount / activePlayers.length) * 100 || 0;

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
                    {tournamentState && <TournamentBoard state={tournamentState} compact />}
                    {/* Header */}
                    <Group position="apart">
                        <Group>
                            <Badge size="lg" variant="light" color="blue">
                                Питання {currentQuestionIndex}{question.totalQuestions ? ` із ${question.totalQuestions}` : ''}
                            </Badge>
                            <Badge
                                size="lg"
                                variant="gradient"
                                gradient={{ from: "blue.3", to: "purple.3" }}
                                leftSection={<IconUsers size={16} />}
                            >
                                {answeredCount}/{activePlayers.length}
                            </Badge>
                        </Group>
                        <TimerBadge timeLimit={question.timeLimit} endsAt={question.endsAt} />
                    </Group>

                    {question.totalQuestions > 0 && (
                        <Paper withBorder radius="md" p="md">
                            <Text size="sm" mb="xs">Прогрес квізу: {currentQuestionIndex} із {question.totalQuestions} питань</Text>
                            <Progress
                                value={Math.min(100, Math.max(0, currentQuestionIndex / question.totalQuestions * 100))}
                                aria-label={`Питання ${currentQuestionIndex} із ${question.totalQuestions}`}
                                color="violet" size="md" radius="xl"
                            />
                        </Paper>
                    )}

                    {question.personalized && <Paper withBorder p="sm"><Text size="sm">Учасники отримують різні питання. Відповіді перевіряються за особистим питанням кожного.</Text></Paper>}
                    {/* Question Card */}
                    {!question.personalized && <Paper shadow="xl" radius="xl" p={40} style={{ background: "white" }}>
                        <Stack spacing="lg">
                            <Badge size="md" color="blue.3" variant="light">
                                Питання {currentQuestionIndex}{question.totalQuestions ? ` із ${question.totalQuestions}` : ''}
                            </Badge>
                            <div style={{ fontSize: "1.5rem", color: "#1f2937" }}>
                                <RichText>{question.text}</RichText>
                            </div>
                            {question.mediaUrl && <Image src={question.mediaUrl} alt={question.text} radius="md" mah={320} fit="contain" />}
                        </Stack>
                    </Paper>}


                    {teamLeaderboard.length > 0 && (
                        <Paper shadow="sm" radius="lg" p="md">
                            <Title order={3} mb="sm">Командний рахунок наживо</Title>
                            <Group grow>
                                {teamLeaderboard.map((team) => (
                                    <Paper key={team.id} withBorder p="sm" ta="center">
                                        <Text fw={700}>{team.name}</Text>
                                        <Text size="xl">{team.totalScore}</Text>
                                    </Paper>
                                ))}
                            </Group>
                        </Paper>
                    )}

                    {/* Progress Bar */}
                    <Paper shadow="sm" radius="lg" p="md" style={{ background: "white" }}>
                        <Stack spacing="xs">
                            <Group position="apart">
                                <Text weight={600}>Гравці відповіли</Text>
                                <Text color="dimmed" size="sm">
                                    {answeredCount} / {activePlayers.length}
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
                                Активні гравці
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
                                                color={["blue", "purple", "pink", "cyan"][idx % 4]}
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
                                            <Badge size="sm" color={player.integrityEvents ? 'orange' : 'gray'} variant="light">Виходи з вкладки: {player.integrityEvents || 0}</Badge>
                                            {player.eliminated ? (
                                                <Badge size="xs" color="red" variant="light">Вибув · глядач</Badge>
                                            ) : player.hasAnswered ? (
                                                <Badge size="xs" color="green" variant="light">
                                                    Відповів
                                                </Badge>
                                            ) : (
                                                <Badge size="xs" color="gray" variant="light">
                                                    Очікування...
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
