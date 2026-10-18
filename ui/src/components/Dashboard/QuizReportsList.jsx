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
    IconChevronRight,
    IconDownload
} from '@tabler/icons-react';
import {useSessionReports} from "../../hooks/useSessionReports.js";
import {useNavigate} from "react-router";

// Mock sessions data


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
    const [selectedStudent, setSelectedStudent] = useState(null);
    const { reports, handleGetById } = useSessionReports();
    const [sessions, setSessions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (reports) {
            setSessions(reports);
        }
    }, [reports]);


    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        return `${seconds}сек.`;
    };

    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.sessionId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getPlayersCount = (session) => Number(session.summary?.totalPlayers) || 0;
    const getAccuracy = (session) => Number(session.summary?.globalAccuracy) || 0;
    const calculateWeightedAccuracy = (items) => {
        const totals = items.reduce((result, session) => {
            const players = getPlayersCount(session);
            const weight = Math.max(players, 1);
            result.weightedAccuracy += getAccuracy(session) * weight;
            result.weight += weight;
            return result;
        }, { weightedAccuracy: 0, weight: 0 });

        return totals.weight === 0
            ? 0
            : Math.round((totals.weightedAccuracy / totals.weight) * 100);
    };

    // Calculate summary stats from persisted session reports
    const totalSessions = sessions.length;
    const totalPlayers = sessions.reduce((sum, session) => sum + getPlayersCount(session), 0);
    const avgAccuracy = calculateWeightedAccuracy(sessions);

    const quizStats = sessions.reduce((stats, session) => {
        const quizId = session.quiz?.id ?? session.quiz?.title;
        if (!quizId) return stats;

        const players = getPlayersCount(session);
        const weight = Math.max(players, 1);
        const current = stats.get(quizId) ?? {
            title: session.quiz?.title || 'Без назви',
            players: 0,
            sessions: 0,
            weightedAccuracy: 0,
            accuracyWeight: 0,
        };

        current.players += players;
        current.sessions += 1;
        current.weightedAccuracy += getAccuracy(session) * weight;
        current.accuracyWeight += weight;
        stats.set(quizId, current);
        return stats;
    }, new Map());

    const mostPopularQuiz = [...quizStats.values()].sort((a, b) =>
        b.players - a.players || b.sessions - a.sessions
    )[0];
    const mostPopularAccuracy = mostPopularQuiz
        ? Math.round((mostPopularQuiz.weightedAccuracy / mostPopularQuiz.accuracyWeight) * 100)
        : 0;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentCompletedSessions = sessions.filter((session) =>
        String(session.status).toUpperCase() === 'FINISHED'
        && new Date(session.createdAt).getTime() >= sevenDaysAgo
    );
    const recentPlayers = recentCompletedSessions.reduce((sum, session) => sum + getPlayersCount(session), 0);
    const recentAccuracy = calculateWeightedAccuracy(recentCompletedSessions);
    const studentKey = (player) => player.studentId ? `student:${player.studentId}` : `guest:${player.nickname}`;
    const studentOptions = [...new Map(sessions.flatMap((s) => (s.players || []).map((p) => [studentKey(p), { value: studentKey(p), label: `${p.nickname}${p.studentId ? ' · акаунт' : ' · гість'}` }]))).values()].sort((a,b)=>a.label.localeCompare(b.label,'uk'));
    const studentHistory = selectedStudent ? sessions.flatMap((s) => (s.players || []).filter((p) => studentKey(p) === selectedStudent).map((p) => ({ quiz:s.quiz.title,date:s.createdAt,accuracy:p.accuracy,score:p.score }))).sort((a,b)=>new Date(a.date)-new Date(b.date)) : [];

    const handleViewStats = (sessionId) => {
        navigate(`/admin/reports/${sessionId}`);
    };

    const saveFile = (content, mime, name) => {
        const url = URL.createObjectURL(new Blob(['\ufeff', content], { type: mime }));
        const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
    };
    const exportReports = (format) => {
        const rows = [['Вікторина','ID сесії','Дата','Статус','Гравці','Точність %','Середній час, мс'], ...filteredSessions.map((s) => [s.quiz.title,s.sessionId,s.createdAt,s.status,getPlayersCount(s),Math.round(getAccuracy(s)*100),Math.round(Number(s.summary?.avgAnswerTime)||0)])];
        if (format === 'json') return saveFile(JSON.stringify(filteredSessions, null, 2), 'application/json', 'quizzy-statistics.json');
        if (format === 'pdf') { const win=window.open('','_blank'); win.document.write(`<h1>Статистика проходжень</h1><table border="1" cellspacing="0" cellpadding="6">${rows.map((r,i)=>`<tr>${r.map(v=>`<${i?'td':'th'}>${v}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</table>`); win.document.close(); win.print(); return; }
        const csv=rows.map((r)=>r.map((v)=>`"${String(v).replaceAll('"','""')}"`).join(';')).join('\n');
        saveFile(csv, format === 'xls' ? 'application/vnd.ms-excel' : 'text/csv', `quizzy-statistics.${format}`);
    };
    const exportDetailedReport = async (sessionId) => {
        const report = await handleGetById(sessionId);
        if (report) saveFile(JSON.stringify(report, null, 2), 'application/json', `session-${sessionId}.json`);
    };
    const exportStudentHistoryPdf = async () => {
        if (!selectedStudent) return;
        const related = sessions.filter((session) => (session.players || []).some((player) => studentKey(player) === selectedStudent));
        const reports = (await Promise.all(related.map((session) => handleGetById(session.sessionId)))).filter(Boolean);
        const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
        const tests = reports.map((report) => {
            const player = report.players.find((item) => studentKey(item) === selectedStudent);
            if (!player) return '';
            const accuracy = Math.round((player.accuracy || 0) * 100);
            const threshold = report.quiz.passThreshold ?? 60;
            const answers = (player.answers || []).map((answer, index) => `<tr><td>${index + 1}. ${safe(answer.questionText)}</td><td>${safe(answer.submittedAnswer || answer.selectedAnswerText || '—')}</td><td class="${answer.correct ? 'ok' : 'bad'}">${answer.correct ? 'Правильно' : 'Неправильно'}</td><td>${answer.earnedPoints || 0}</td></tr>`).join('');
            return `<section><h2>${safe(report.quiz.title)}</h2><p class="meta">${new Date(report.createdAt).toLocaleString('uk-UA')}</p><div class="summary"><b>${accuracy >= threshold ? 'Склав' : 'Не склав'}</b> · Точність: ${accuracy}% · Бали: ${player.score || 0} · Правильно: ${player.correctCount || 0}/${report.summary.totalQuestions} · Порушення: ${player.integrityEvents || 0}</div><table><thead><tr><th>Питання</th><th>Відповідь</th><th>Результат</th><th>Бали</th></tr></thead><tbody>${answers}</tbody></table></section>`;
        }).join('');
        const win = window.open('', '_blank'); if (!win) return;
        win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Звіт ${safe(selectedStudent)}</title><style>@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;color:#1f2937}section{page-break-inside:avoid;margin:22px 0}.summary{padding:10px;background:#f3f4f6;margin:8px 0 12px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d1d5db;padding:6px;text-align:left}th{background:#e5e7eb}.ok{color:#047857}.bad{color:#b91c1c}.meta{color:#6b7280}</style></head><body><h1>Звіт по учню: ${safe(selectedStudent)}</h1><p>Усього проходжень: ${reports.length}</p>${tests}</body></html>`); win.document.close(); win.focus(); setTimeout(()=>win.print(),200);
    };

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                {/* Header */}
                <Group justify="space-between" align="flex-end">
                <Box>
                    <Title order={1} mb="xs">Звіти Проведених Сесій</Title>
                    <Text c="dimmed">Перегляньте детальну статистику та аналітику для всіх ваших сесій вікторин.</Text>
                </Box>
                <Group gap="xs">
                    <Button variant="light" leftSection={<IconDownload size={16}/>} onClick={() => exportReports('json')}>JSON</Button>
                    <Button variant="light" onClick={() => exportReports('csv')}>CSV</Button>
                    <Button variant="light" onClick={() => exportReports('xls')}>Excel</Button>
                    <Button variant="light" onClick={() => exportReports('pdf')}>PDF</Button>
                </Group>
                </Group>

                {/* Summary Cards */}
                <Grid>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between">
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                        Усього сесій
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
                                        Усього гравців
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
                                        Середня точність
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
                            placeholder="Пошук за назвою вікторини або ID сесії..."
                            leftSection={<IconSearch size={16} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <Select
                            placeholder="Статус"
                            value={filterStatus}
                            onChange={setFilterStatus}
                            data={[
                                { value: 'all', label: 'Усі сесії' },
                                { value: 'FINISHED', label: 'Завершено' },
                                { value: 'RUNNING', label: 'У процесі' },
                                { value: 'WAITING', label: 'Очікує старту' }
                            ]}
                            style={{ width: 180 }}
                        />
                    </Group>
                </Card>

                {/* Sessions Table */}
                <Grid>
                    <Grid.Col span={{base:12,md:6}}><Card withBorder><Title order={3} mb="md">Порівняння груп вікторин</Title><Table><Table.Thead><Table.Tr><Table.Th>Вікторина</Table.Th><Table.Th>Гравці</Table.Th><Table.Th>Точність</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{[...quizStats.values()].map((q)=><Table.Tr key={q.title}><Table.Td>{q.title}</Table.Td><Table.Td>{q.players}</Table.Td><Table.Td>{Math.round(q.weightedAccuracy/q.accuracyWeight*100)||0}%</Table.Td></Table.Tr>)}</Table.Tbody></Table></Card></Grid.Col>
                    <Grid.Col span={{base:12,md:6}}><Card withBorder><Group justify="space-between" mb="md"><Title order={3}>Динаміка учня</Title><Button size="xs" leftSection={<IconDownload size={15}/>} disabled={!selectedStudent} onClick={exportStudentHistoryPdf}>PDF за всіма тестами</Button></Group><Select searchable placeholder="Оберіть учня" data={studentOptions} value={selectedStudent} onChange={setSelectedStudent} mb="md" />{studentHistory.map((x)=><Box key={`${x.date}-${x.quiz}`} mb="sm"><Group justify="space-between"><Text size="sm">{x.quiz}</Text><Text size="sm" fw={600}>{Math.round(x.accuracy*100)}% · {x.score} балів</Text></Group><Box h={8} bg="gray.2" style={{borderRadius:4}}><Box h={8} w={`${x.accuracy*100}%`} bg="teal.5" style={{borderRadius:4}} /></Box></Box>)}</Card></Grid.Col>
                </Grid>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Table highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Вікторина</Table.Th>
                                <Table.Th>Дата</Table.Th>
                                <Table.Th>Гравці</Table.Th>
                                <Table.Th>Точність</Table.Th>
                                <Table.Th>Середній час</Table.Th>
                                <Table.Th>Статус</Table.Th>
                                <Table.Th>Дія</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredSessions.map((session) => (
                                <Table.Tr key={session.sessionId}>
                                    <Table.Td>
                                        <Text fw={600}>{session.quiz.title}</Text>
                                        {session.sharedByTeacher && <Badge size="xs" color="violet">Поділився: {session.hostName || 'Викладач'}</Badge>}
                                        {!session.sharedByTeacher && session.reportSharedWithOwner && <Badge size="xs" color="teal">Доступно власнику квізу</Badge>}
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
                                            color={session.status === 'FINISHED' ? 'blue' : 'yellow'}
                                            variant="light"
                                        >
                                            {{
                                                FINISHED: 'Завершено',
                                                RUNNING: 'У процесі',
                                                WAITING: 'Очікує старту',
                                            }[session.status] || session.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            rightSection={<IconChevronRight size={14} />}
                                            onClick={() => handleViewStats(session.sessionId)}
                                        >
                                            Переглянути
                                        </Button>
                                        <ActionIcon ml="xs" variant="light" title="Експортувати детальний звіт" onClick={() => exportDetailedReport(session.sessionId)}><IconDownload size={16}/></ActionIcon>
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
                                    <Text size="sm" fw={600}>Найпопулярніша вікторина</Text>
                                    <Text size="xs" c="dimmed">На основі загальної кількості проходжень</Text>
                                </Box>
                                <IconTrophy size={24} color="gold" />
                            </Group>
                            <Text fw={700} size="lg" mb="xs">
                                {mostPopularQuiz?.title || 'Ще немає завершених сесій'}
                            </Text>
                            <Group gap="xs">
                                <Badge variant="light">Усього гравців: {mostPopularQuiz?.players || 0}</Badge>
                                <Badge variant="light" color="teal">{mostPopularAccuracy}% середня точність</Badge>
                            </Group>
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between" mb="md">
                                <Box>
                                    <Text size="sm" fw={600}>Остання активність</Text>
                                    <Text size="xs" c="dimmed">За останні 7 днів</Text>
                                </Box>
                                <IconCalendar size={24} color="gray" />
                            </Group>
                            <Text fw={700} size="lg" mb="xs">
                                {recentCompletedSessions.length} сесій завершено
                            </Text>
                            <Group gap="xs">
                                <Badge variant="light">Гравців: {recentPlayers}</Badge>
                                <Badge variant="light" color="blue">{recentAccuracy}% середня точність</Badge>
                            </Group>
                        </Card>
                    </Grid.Col>
                </Grid>
            </Stack>
        </Container>
    );
}
