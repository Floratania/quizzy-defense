import React, {useEffect, useState} from 'react';
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
    Accordion, Loader, Select
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
    IconArrowLeft,
    IconDownload
} from '@tabler/icons-react';
import {useParams} from "react-router-dom";
import {useSessionReports} from "../../hooks/useSessionReports.js";
import apiClient from '../../api/apiClient.js';

// Mock data


export default function QuizSessionStatistics() {
    const { id } = useParams();
    const { handleGetById } = useSessionReports();

    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const loadReport = async () => {
            try {
                const data = await handleGetById(id);
                if (isMounted) {
                    setReport(data);
                }
            } catch (e) {
                console.error("Failed to load session report", e);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadReport();

        return () => {
            isMounted = false;
        };
    }, [id]);

    // -------- GUARDS --------

    if (isLoading) {
        return (
            <MantineProvider>
                <Center h="100vh">
                    <Loader />
                </Center>
            </MantineProvider>
        );
    }

    if (!report) {
        return (
            <MantineProvider>
                <Center h="100vh">
                    <Text c="dimmed">No statistics available for this session</Text>
                </Center>
            </MantineProvider>
        );
    }

    // -------- RENDER --------

    return (
        <MantineProvider
            theme={{
                colorScheme: "light",
                primaryColor: "blue",
            }}
        >
            <StatisticsContent data={report} />
        </MantineProvider>
    );
}

function StatisticsContent({ data }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [pdfStudent, setPdfStudent] = useState('all');

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
                        <Text size="sm" c="dimmed" mb="xs">Сесія вікторини</Text>
                        <Title order={2}>{data.quiz.title}</Title>
                        <Text size="sm" c="dimmed" mt="xs">
                            Сесія: {data.sessionId} • {new Date(data.createdAt).toLocaleString()}
                        </Text>
                    </Box>
                    <Group>
                        <Select value={pdfStudent} onChange={setPdfStudent} data={[{ value: 'all', label: 'Усі учні' }, ...data.players.map((player) => ({ value: player.playerId, label: player.nickname }))]} w={190} />
                        <Button leftSection={<IconDownload size={16} />} color="teal" onClick={exportStudentsPdf}>Звіт по учнях PDF</Button>
                        <Button leftSection={<IconArrowLeft size={16} />} variant="light">Повернутися до панелі</Button>
                    </Group>
                </Group>

                <Grid>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Paper p="md" withBorder>
                            <Group justify="space-between">
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                        Всього гравців
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
                                        Глобальна точність
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
                                        Сер. час відповіді
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
                                        Всього відповідей
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
                <Title order={3} mb="md">Фінальний рейтинг</Title>
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Місце</Table.Th>
                            <Table.Th>Гравець</Table.Th>
                            <Table.Th>Бали</Table.Th>
                            <Table.Th>Правильно</Table.Th>
                            <Table.Th>Точність</Table.Th>
                            <Table.Th>Сер. час</Table.Th>
                            <Table.Th>Дії</Table.Th>
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
                                        Переглянути деталі
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Question Difficulty */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Ефективність питань</Title>
                <Stack gap="xs">
                    {data.summary.perQuestionAccuracy.map((q, idx) => {
                        const question = data.questions[idx];
                        const accuracy = Math.round(q.accuracy * 100);
                        return (
                            <Paper key={q.questionId} p="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Group>
                                        <Badge size="sm">П{idx + 1}</Badge>
                                        <Text fw={600}>{question?.text || `Питання ${idx + 1}`}</Text>
                                    </Group>
                                    <Group gap="xs">
                                        <Badge
                                            color={accuracy >= 70 ? 'teal' : accuracy >= 50 ? 'orange' : 'red'}
                                            variant="light"
                                        >
                                            {accuracy}% правильно
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
                <Title order={3} mb="md">Деталі гравця</Title>

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
                                    <Text c="dimmed">Ранг #{selectedPlayer.place} • Бали: {selectedPlayer.score.toLocaleString()}</Text>
                                </Box>
                            </Group>
                            <Button variant="light" onClick={() => setSelectedPlayer(null)}>
                                Повернутися до списку
                            </Button>
                        </Group>

                        <Grid>
                            <Grid.Col span={{ base: 6, md: 3 }}>
                                <Paper p="md" withBorder ta="center">
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
                                        Правильні відповіді
                                    </Text>
                                    <Text size="xl" fw={700} c="teal">
                                        {selectedPlayer.correctCount}/{data.summary.totalQuestions}
                                    </Text>
                                </Paper>
                            </Grid.Col>
                            <Grid.Col span={{ base: 6, md: 3 }}>
                                <Paper p="md" withBorder ta="center">
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
                                        Точність
                                    </Text>
                                    <Text size="xl" fw={700} c="blue">
                                        {Math.round(selectedPlayer.accuracy * 100)}%
                                    </Text>
                                </Paper>
                            </Grid.Col>
                            <Grid.Col span={{ base: 6, md: 3 }}>
                                <Paper p="md" withBorder ta="center">
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
                                        Середній час
                                    </Text>
                                    <Text size="xl" fw={700} c="orange">
                                        {formatTime(selectedPlayer.avgAnswerTime)}
                                    </Text>
                                </Paper>
                            </Grid.Col>
                            <Grid.Col span={{ base: 6, md: 3 }}>
                                <Paper p="md" withBorder ta="center">
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
                                        Всього очок
                                    </Text>
                                    <Text size="xl" fw={700} c="violet">
                                        {selectedPlayer.score.toLocaleString()}
                                    </Text>
                                </Paper>
                            </Grid.Col>
                        </Grid>

                        {selectedPlayer.answers.length > 0 && (
                            <>
                                <Divider label="Розподіл відповідей" labelPosition="center" />
                                <Stack gap="xs">
                                    {selectedPlayer.answers.map((answer, idx) => (
                                        <Paper key={idx} p="md" withBorder>
                                            <Group justify="space-between">
                                                <Box style={{ flex: 1 }}>
                                                    <Group mb="xs">
                                                        <Badge size="sm">П{idx + 1}</Badge>
                                                        <Text fw={600}>{answer.questionText}</Text>
                                                    </Group>
                                                    <Group>
                                                        {answer.correct ? (
                                                            <Badge color="teal" leftSection={<IconCheck size={12} />}>
                                                                Правильно
                                                            </Badge>
                                                        ) : (
                                                            <Badge color="red" leftSection={<IconX size={12} />}>
                                                                Неправильно
                                                            </Badge>
                                                        )}
                                                        <Text size="sm" c="dimmed">
                                                            Відповідь: {answer.submittedAnswer || answer.selectedAnswerText || '—'}
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
                                            {player.score.toLocaleString()} очок
                                        </Badge>
                                        <Group gap="xl">
                                            <Box ta="center">
                                                <Text size="xs" c="dimmed">Точність</Text>
                                                <Text fw={700}>{Math.round(player.accuracy * 100)}%</Text>
                                            </Box>
                                            <Box ta="center">
                                                <Text size="xs" c="dimmed">Правильно</Text>
                                                <Text fw={700}>{player.correctCount}/{data.summary.totalQuestions}</Text>
                                            </Box>
                                        </Group>
                                        <Button size="xs" variant="light" fullWidth>
                                            Переглянути деталі
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
                <Title order={3} mb="md">Аналіз питань</Title>

                <Accordion>
                    {data.questions.map((question, idx) => {
                        const accuracyEntry = data.summary.perQuestionAccuracy.find((entry) => entry.questionId === question.questionId);
                        const accuracy = Math.round((accuracyEntry?.accuracy || 0) * 100);
                        return (
                            <Accordion.Item key={question.questionId} value={question.questionId}>
                                <Accordion.Control>
                                    <Group justify="space-between" pr="md">
                                        <Group>
                                            <Badge>П{idx + 1}</Badge>
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
                                            <Text size="sm" fw={600} mb="sm">Розподіл відповідей</Text>
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
                                                <Text size="sm" fw={600} mb="sm">Відповіді гравців</Text>
                                                <Table>
                                                    <Table.Thead>
                                                        <Table.Tr>
                                                            <Table.Th>Гравець</Table.Th>
                                                            <Table.Th>Відповідь</Table.Th>
                                                            <Table.Th>Результат</Table.Th>
                                                            <Table.Th>Час</Table.Th>
                                                            <Table.Th>Бали</Table.Th>
                                                            <Table.Th>Оцінювання</Table.Th>
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
                                                                <Table.Td>{pb.submittedAnswer || '—'}</Table.Td>
                                                                <Table.Td>
                                                                    {pb.correct ? (
                                                                        <Badge color="teal" size="sm" leftSection={<IconCheck size={12} />}>
                                                                            Правильно
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge color="red" size="sm" leftSection={<IconX size={12} />}>
                                                                            Неправильно
                                                                        </Badge>
                                                                    )}
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <Text size="sm">{formatTime(pb.timeTaken)}</Text>
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <Text size="sm" fw={600}>{pb.earnedPoints}</Text>
                                                                </Table.Td>
                                                                <Table.Td><Button size="xs" variant="light" disabled={!pb.answerId} onClick={() => gradeAnswer(pb)}>Оцінити</Button></Table.Td>
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

    const MatrixTab = () => {
        const threshold = data.quiz.passThreshold ?? 60;
        return <Stack gap="lg">
            <Card withBorder><Title order={3} mb="md">Матриця помилок</Title><Table withTableBorder withColumnBorders>
                <Table.Thead><Table.Tr><Table.Th>Учень</Table.Th>{data.questions.map((q,i)=><Table.Th key={q.questionId}>П{i+1}</Table.Th>)}<Table.Th>Результат</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>{data.players.map((p)=><Table.Tr key={p.playerId}><Table.Td>{p.nickname}</Table.Td>{data.questions.map((q)=>{const a=p.answers.find((x)=>x.questionId===q.questionId);return <Table.Td key={q.questionId} bg={a?.correct?'green.0':'red.0'} ta="center">{a?.correct?'✓':'✕'}</Table.Td>})}<Table.Td><Badge color={p.accuracy*100>=threshold?'green':'red'}>{p.accuracy*100>=threshold?'Склав':'Не склав'}</Badge></Table.Td></Table.Tr>)}</Table.Tbody>
            </Table></Card>
            <Card withBorder><Title order={3} mb="md">Рекомендації учням</Title><Stack>{data.players.map((p)=>{const wrong=p.answers.filter((a)=>!a.correct);return <Paper key={p.playerId} withBorder p="sm"><Text fw={600}>{p.nickname}</Text><Text size="sm" c={wrong.length?'red':'green'}>{wrong.length ? `Повторити: ${wrong.map((a)=>a.questionText).join('; ')}` : 'Матеріал засвоєно, помилок немає'}</Text></Paper>})}</Stack></Card>
        </Stack>;
    };
    const gradeAnswer = async (answer) => {
        const value = window.prompt('Введіть кількість балів', String(answer.earnedPoints || 0));
        if (value === null) return;
        const isCorrect = window.confirm('Позначити відповідь як правильну?');
        await apiClient.patch(`/player-answers/${answer.answerId}/grade`, { earnedPoints: Number(value), isCorrect });
        window.location.reload();
    };

    const exportStudentsPdf = () => {
        const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
        const threshold = data.quiz.passThreshold ?? 60;
        const selectedStudents = pdfStudent === 'all' ? data.players : data.players.filter((player) => player.playerId === pdfStudent);
        const students = selectedStudents.map((player) => {
            const accuracy = Math.round((player.accuracy || 0) * 100);
            const rows = (player.answers || []).map((answer, index) => `<tr><td>${index + 1}. ${safe(answer.questionText)}</td><td>${safe(answer.submittedAnswer || answer.selectedAnswerText || '—')}</td><td class="${answer.correct ? 'ok' : 'bad'}">${answer.correct ? 'Правильно' : 'Неправильно'}</td><td>${answer.earnedPoints || 0}</td></tr>`).join('');
            return `<section><h2>${safe(player.nickname)}</h2><div class="summary"><b>${accuracy >= threshold ? 'Тест складено' : 'Тест не складено'}</b> · Точність: ${accuracy}% · Бали: ${player.score || 0} · Правильно: ${player.correctCount || 0}/${data.summary.totalQuestions} · Виходів із вкладки: ${player.integrityEvents || 0}</div><table><thead><tr><th>Питання</th><th>Відповідь учня</th><th>Результат</th><th>Бали</th></tr></thead><tbody>${rows}</tbody></table></section>`;
        }).join('');
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Звіт по учнях</title><style>@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;color:#1f2937}section{page-break-after:always}section:last-child{page-break-after:auto}.summary{padding:10px;background:#f3f4f6;margin:10px 0 14px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #d1d5db;padding:7px;text-align:left}th{background:#e5e7eb}.ok{color:#047857;font-weight:bold}.bad{color:#b91c1c;font-weight:bold}.meta{color:#6b7280}</style></head><body><h1>${safe(data.quiz.title)}</h1><p class="meta">Звіт по учнях · ${new Date(data.createdAt).toLocaleString('uk-UA')} · Поріг: ${threshold}%</p>${students}</body></html>`);
        win.document.close(); win.focus(); setTimeout(() => win.print(), 200);
    };

    return (
        <Container size="xl" py="xl">
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
                        Огляд
                    </Tabs.Tab>
                    <Tabs.Tab value="players" leftSection={<IconUsers size={16} />}>
                        Гравці
                    </Tabs.Tab>
                    <Tabs.Tab value="questions" leftSection={<IconList size={16} />}>
                        Питання
                    </Tabs.Tab>
                    <Tabs.Tab value="matrix" leftSection={<IconTarget size={16} />}>Матриця та рекомендації</Tabs.Tab>
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
                    <Tabs.Panel value="matrix"><MatrixTab /></Tabs.Panel>
                </Box>
            </Tabs>
        </Container>
    );
}
