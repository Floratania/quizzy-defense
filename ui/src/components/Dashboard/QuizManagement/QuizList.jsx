import TournamentLaunchModal from './TournamentLaunchModal.jsx';
import {
    ActionIcon,
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    Grid,
    Group,
    Modal,
    NumberInput,
    Menu,
    Paper,
    Stack,
    Table,
    Text,
    Title
} from "@mantine/core";
import {
    IconDots,
    IconBolt,
    IconEdit,
    IconEye,
    IconList,
    IconPlayerPlay,
    IconPlus,
    IconTrash,
    IconTrophy,
    IconUsers,
    IconFlame,
    IconCopy,
    IconDownload
} from "@tabler/icons-react";
import React, { useRef, useState } from "react";
import { useQuizzes } from "../../../hooks/useQuizzes.js";
import { useSession } from "../../../hooks/useSession.js";
import { useNavigate } from "react-router";
import { useSessionReports } from '../../../hooks/useSessionReports.js';
import {checkQuizQuality} from '../../../utils/quizQuality.js';
import RichText from '../../Question/RichText.jsx';
import QuizSharingModal from './QuizSharingModal.jsx';

export default function QuizList() {


    const { quizzes, handleDelete, handleGetById, handleDuplicate, handleCreate } = useQuizzes();
    const importRef = useRef(null);
    const { activeSessions, closeSession, newSession } = useSession();
    const { reports } = useSessionReports();
    const navigate = useNavigate();
    const [tournamentQuizId,setTournamentQuizId]=useState(null);
    const [previewQuiz, setPreviewQuiz] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [quality, setQuality] = useState(null);
    const [checkingQuality, setCheckingQuality] = useState(false);
    const [sharingQuiz, setSharingQuiz] = useState(null);
    const auditQuiz = async (id) => {
        setCheckingQuality(true);
        try { const quiz=await handleGetById(id);const issues=await checkQuizQuality(quiz);setQuality({quizId:id,issues});return issues; }
        catch { const issues=[{severity:'error',message:'Не вдалося перевірити квіз'}];setQuality({quizId:id,issues});return issues; }
        finally {setCheckingQuality(false);}
    };
    const launchQuiz = async (quizId,query='') => {
        const issues=await auditQuiz(quizId);
        if(!issues.some(issue=>issue.severity==='error')) navigate(`/host/${quizId}${query}`);
    };
    const groupedQuizzes = [...quizzes].sort((a, b) =>
        (a.topic || 'Без теми').localeCompare(b.topic || 'Без теми', 'uk')
        || a.title.localeCompare(b.title, 'uk')
    );

    const totalAttempts = reports.reduce(
        (sum, report) => sum + (Number(report.summary?.totalPlayers) || 0),
        0,
    );
    const accuracyTotals = reports.reduce((totals, report) => {
        const players = Number(report.summary?.totalPlayers) || 0;
        if (players === 0) return totals;
        totals.weighted += (Number(report.summary?.globalAccuracy) || 0) * players;
        totals.players += players;
        return totals;
    }, { weighted: 0, players: 0 });
    const averageResult = accuracyTotals.players
        ? Math.round((accuracyTotals.weighted / accuracyTotals.players) * 100)
        : 0;

    // ----- ACTIONS -----

    const handleCreateQuiz = () => {
        navigate("/admin/quizzes/new");
    };

    const handleEditQuiz = (quiz) => {
        navigate(`/admin/quizzes/${quiz.id}/edit`);
    };

    const handleDeleteQuizClick = (id) => {
        handleDelete(id);
    };
    const formatCreatedAt = (value) => value ? new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—';

    const handlePreview = async (id) => {
        setPreviewLoading(true);
        const quiz = await handleGetById(id);
        setPreviewQuiz(quiz);
        setPreviewLoading(false);
    };

    const downloadQuiz = async (id, format) => {
        const quiz = await handleGetById(id);
        if (format === 'pdf') { const win=window.open('','_blank'); win.document.write(`<h1>${quiz.title}</h1>${quiz.questions.map((q,i)=>`<h3>${i+1}. ${q.text}</h3><p>Правильна відповідь: ${getCorrectAnswer(q)}</p>`).join('')}`); win.document.close(); win.print(); return; }
        let content; let type; let extension;
        if (format === 'json') { content = JSON.stringify({ ...quiz, id: undefined, userId: undefined, createdAt: undefined, updatedAt: undefined, questions: quiz.questions.map(({id: _id,quizId: _quizId,...q}) => ({...q,answers:q.answers.map(({id: _id,questionId: _questionId,...a})=>a)})) }, null, 2); type='application/json'; extension='json'; }
        else { const rows = [['Питання','Тип','Правильна відповідь'], ...quiz.questions.map((q) => [q.text,q.type,getCorrectAnswer(q)])]; content = rows.map((row) => row.map((v)=>`"${String(v).replaceAll('"','""')}"`).join(';')).join('\n'); type = format === 'xls' ? 'application/vnd.ms-excel' : 'text/csv'; extension=format; }
        const url=URL.createObjectURL(new Blob(['\ufeff',content],{type})); const a=document.createElement('a'); a.href=url; a.download=`${quiz.title}.${extension}`; a.click(); URL.revokeObjectURL(url);
    };
    const importQuiz = async (event) => {
        const file=event.target.files?.[0]; if (!file) return;
        try { const quiz=JSON.parse(await file.text()); await handleCreate({ ...quiz, title: `${quiz.title} — імпорт`, questions: quiz.questions || [] }); }
        catch { alert('Не вдалося імпортувати JSON вікторини'); }
        event.target.value='';
    };

    const getCorrectAnswer = (question) => {
        if (question.type === 'matching') {
            return (question.configuration?.pairs || []).map((pair) => `${pair.left} → ${pair.right}`).join('; ');
        }
        if (question.type === 'ordering') {
            return [...(question.configuration?.items || [])]
                .sort((a, b) => a.correctPosition - b.correctPosition)
                .map((item) => item.text)
                .join(' → ');
        }
        return question.answers?.filter((answer) => answer.isCorrect).map((answer) => answer.text).join(', ') || '—';
    };

    const handleStartSession = async (quizId) => {
        await launchQuiz(quizId);
    };

    const handleStartTeamSession = (quizId, teamCount, teamAssignment) => {
        launchQuiz(quizId,`?mode=TEAM&teamCount=${teamCount}&teamAssignment=${teamAssignment}`);
    };

    const handleStartProgressSession = (quizId) => launchQuiz(quizId,'?mode=PROGRESS');
    const [survivalQuizId, setSurvivalQuizId] = useState(null);
    const [survivalMistakes, setSurvivalMistakes] = useState(1);
    const handleStartSurvivalSession = (quizId) => {
        setSurvivalMistakes(1);
        setSurvivalQuizId(quizId);
    };
    const handleStartTournament = (quizId, teamCount, teamAssignment) =>
        launchQuiz(quizId,`?mode=TOURNAMENT&teamCount=${teamCount}&teamAssignment=${teamAssignment}`);
    const createHomework = async (quizId) => {
        const session = await newSession({ quizId, mode: 'PROGRESS' });
        if (!session?.roomCode) return;
        const link = `${window.location.origin}/join?code=${session.roomCode}`;
        await navigator.clipboard.writeText(link);
        alert(`Посилання домашнього завдання скопійовано:\n${link}`);
    };

    return (
        <Stack gap="xl">
            <QuizSharingModal quiz={sharingQuiz} onClose={() => setSharingQuiz(null)} />
            <Modal opened={checkingQuality || Boolean(quality)} onClose={()=>setQuality(null)} title="Перевірка якості квізу">
                {checkingQuality ? <Text>Перевірка питань і зображень…</Text> : <Stack>{quality?.issues.length ? quality.issues.map((issue,index)=><Text key={index} c={issue.severity==='error'?'red':'orange'}>{issue.message}</Text>):<Text c="green">Проблем не виявлено</Text>}</Stack>}
            </Modal>
            <Modal opened={Boolean(previewQuiz) || previewLoading} onClose={() => setPreviewQuiz(null)} title="Попередній перегляд вікторини" size="lg">
                {previewLoading ? <Text c="dimmed">Завантаження...</Text> : previewQuiz && (
                    <Stack>
                        <Title order={2}>{previewQuiz.title}</Title>
                        {previewQuiz.description && <Text c="dimmed">{previewQuiz.description}</Text>}
                        {previewQuiz.questions?.map((question, index) => (
                            <Paper key={question.id} withBorder p="md" radius="md">
                                <Group justify="space-between" mb="xs">
                                    <Badge>Питання {index + 1}</Badge>
                                    <Text size="sm" c="dimmed">{question.timeLimit} сек. · {question.points} балів</Text>
                                </Group>
                                <RichText>{question.text}</RichText>
                                <Text mt="sm" c="green" size="sm"><strong>Правильна відповідь:</strong> {getCorrectAnswer(question)}</Text>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Modal>
            {activeSessions.length > 0 && (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Title order={3} mb="md">Активні сесії</Title>
                    <Table highlightOnHover>
                        <Table.Thead><Table.Tr><Table.Th>Квіз</Table.Th><Table.Th>Код</Table.Th><Table.Th>Режим</Table.Th><Table.Th>Гравці</Table.Th><Table.Th /></Table.Tr></Table.Thead>
                        <Table.Tbody>
                            {activeSessions.map((session) => (
                                <Table.Tr key={session.id}>
                                    <Table.Td>{session.quiz?.title}</Table.Td>
                                    <Table.Td><Badge variant="light">{session.roomCode}</Badge></Table.Td>
                                    <Table.Td>{{ CLASSIC: 'Класичний', TEAM: 'Командний', PROGRESS: 'Автоматичний', SURVIVAL: 'Виживання', TOURNAMENT: 'Турнір' }[session.mode] || session.mode}</Table.Td>
                                    <Table.Td>{session.players?.length || 0}</Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Button size="xs" variant="light" onClick={() => navigate(`/host/${session.quizId}?sessionId=${session.id}`)}>Відкрити</Button>
                                            <Button size="xs" variant="light" color="red" onClick={() => closeSession(session.id)}>Завершити</Button>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}
            {/* Stats Cards */}
            <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                    Всі Вікторини
                                </Text>
                                <Text size="xl" fw={700}>{quizzes.length}</Text>
                            </Box>
                            <Avatar color="blue" variant="light" size="lg">
                                <IconList size={24}/>
                            </Avatar>
                        </Group>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                    Активні
                                </Text>
                                <Text size="xl" fw={700}>{activeSessions.length}</Text>
                            </Box>
                            <Avatar color="teal" variant="light" size="lg">
                                <IconPlayerPlay size={24}/>
                            </Avatar>
                        </Group>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                    Усього Проходжень
                                </Text>
                                <Text size="xl" fw={700}>{totalAttempts}</Text>
                            </Box>
                            <Avatar color="violet" variant="light" size="lg">
                                <IconUsers size={24}/>
                            </Avatar>
                        </Group>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                    Середній Результат
                                </Text>
                                <Text size="xl" fw={700}>{averageResult}%</Text>
                            </Box>
                            <Avatar color="orange" variant="light" size="lg">
                                <IconTrophy size={24}/>
                            </Avatar>
                        </Group>
                    </Card>
                </Grid.Col>
            </Grid>

            {/* Quiz List */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                    <Title order={3}>Мої Вікторини</Title>
                    <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importQuiz} />
                    <Group>
                    <Button variant="light" onClick={() => importRef.current?.click()}>Імпортувати JSON</Button>
                    <Button
                        leftSection={<IconPlus size={16}/>}
                        variant="gradient"
                        gradient={{ from: 'teal.6', to: 'green.7' }}
                        onClick={handleCreateQuiz}
                    >
                        Створити Вікторину
                    </Button>
                    </Group>
                </Group>

                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Назва</Table.Th>
                            <Table.Th>Створено</Table.Th>
                            <Table.Th>Дії</Table.Th>
                        </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                        {groupedQuizzes.map((quiz, index) => {
                            const currentTopic = quiz.topic || 'Без теми';
                            const showTopic = index === 0 || currentTopic !== (groupedQuizzes[index - 1].topic || 'Без теми');
                            return (
                            <React.Fragment key={quiz.id}>
                            {showTopic && (
                                <Table.Tr style={{ background: 'var(--mantine-color-gray-0)' }}>
                                    <Table.Td colSpan={3}><Badge size="lg" variant="light" color="teal">{currentTopic}</Badge></Table.Td>
                                </Table.Tr>
                            )}
                            <Table.Tr>
                                <Table.Td>
                                    <Text fw={600}>{quiz.title}</Text>
                                    <Badge size="xs" variant="light" color={quiz.accessRole === 'OWNER' ? 'gray' : 'violet'}>
                                        {quiz.accessRole === 'VIEWER' ? 'Спільний · перегляд і запуск' : quiz.accessRole === 'EDITOR' ? 'Спільний · редактор' : 'Власник'}
                                    </Badge>
                                </Table.Td>

                                <Table.Td>
                                    <Text size="sm" c="dimmed">{formatCreatedAt(quiz.createdAt)}</Text>
                                </Table.Td>

                                <Table.Td>
                                    <Group gap="xs">

                                        <ActionIcon
                                            variant="light"
                                            color="blue"
                                            title="Запустити тест для учнів"
                                            aria-label={`Запустити тест для учнів: ${quiz.title}`}
                                            onClick={() => handleStartSession(quiz.id)}
                                        >
                                            <IconPlayerPlay size={16}/>
                                        </ActionIcon>

                                        <Menu position="bottom-start" middlewares={{ flip: false, shift: true }}>
                                            <Menu.Target>
                                                <ActionIcon variant="light" color="violet" title="Командна гра">
                                                    <IconUsers size={16}/>
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Label>Автоматичний розподіл</Menu.Label>
                                                {[2, 3, 4].map((count) => (
                                                    <Menu.Item key={`auto-${count}`} onClick={() => handleStartTeamSession(quiz.id, count, 'AUTO')}>
                                                        {count} команди
                                                    </Menu.Item>
                                                ))}
                                                <Menu.Divider />
                                                <Menu.Label>Окремий код кожній команді</Menu.Label>
                                                {[2, 3, 4].map((count) => (
                                                    <Menu.Item key={`codes-${count}`} onClick={() => handleStartTeamSession(quiz.id, count, 'CODES')}>
                                                        {count} команди
                                                    </Menu.Item>
                                                ))}
                                            </Menu.Dropdown>
                                        </Menu>

                                        <ActionIcon variant="light" color="yellow" title="������" onClick={()=>setTournamentQuizId(quiz.id)}><IconTrophy size={16}/></ActionIcon>

                                        <ActionIcon variant="light" color="teal" title="Автоматичний режим" onClick={() => handleStartProgressSession(quiz.id)}>
                                            <IconBolt size={16}/>
                                        </ActionIcon>

                                        <ActionIcon variant="light" color="red" title="Режим виживання" onClick={() => handleStartSurvivalSession(quiz.id)}>
                                            <IconFlame size={16}/>
                                        </ActionIcon>

                                        <ActionIcon
                                            variant="light"
                                            color="blue"
                                            title="Редагувати квіз"
                                            disabled={quiz.accessRole === 'VIEWER'}
                                            onClick={() => handleEditQuiz(quiz)}
                                        >
                                            <IconEdit size={16}/>
                                        </ActionIcon>

                                        <Menu position="bottom-end" middlewares={{ flip: false, shift: true }}>
                                            <Menu.Target>
                                                <ActionIcon variant="light">
                                                    <IconDots size={16}/>
                                                </ActionIcon>
                                            </Menu.Target>

                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={16}/>} onClick={() => handlePreview(quiz.id)}>
                                                    Переглянути питання
                                                </Menu.Item>
                                                <Menu.Item leftSection={<IconUsers size={16}/>} onClick={() => setSharingQuiz(quiz)}>
                                                    {quiz.accessRole === 'OWNER' ? 'Доступ та історія' : 'Історія змін'}
                                                </Menu.Item>
                                                <Menu.Item leftSection={<IconCopy size={16}/>} onClick={() => handleDuplicate(quiz.id)}>Дублювати</Menu.Item>
                                                <Menu.Item onClick={()=>auditQuiz(quiz.id)}>Перевірити якість</Menu.Item>
                                                <Menu.Item onClick={()=>navigate(`/admin/quizzes/${quiz.id}/practice`)}>Пройти очима учня</Menu.Item>
                                                <Menu.Item onClick={() => createHomework(quiz.id)}>Створити домашнє завдання</Menu.Item>
                                                <Menu.Label>Експорт</Menu.Label>
                                                <Menu.Item leftSection={<IconDownload size={16}/>} onClick={() => downloadQuiz(quiz.id, 'json')}>JSON</Menu.Item>
                                                <Menu.Item onClick={() => downloadQuiz(quiz.id, 'pdf')}>PDF</Menu.Item>

                                                <Menu.Divider/>

                                                <Menu.Item
                                                    color="red"
                                                    disabled={quiz.accessRole !== 'OWNER'}
                                                    leftSection={<IconTrash size={16}/>}
                                                    onClick={() => handleDeleteQuizClick(quiz.id)}
                                                >
                                                    Delete
                                                </Menu.Item>
                                            </Menu.Dropdown>

                                        </Menu>

                                    </Group>
                                </Table.Td>

                            </Table.Tr>
                            </React.Fragment>
                        )})}
                    </Table.Tbody>

                </Table>
            </Card>
            <TournamentLaunchModal quizId={tournamentQuizId} onClose={()=>setTournamentQuizId(null)} onStarted={session=>{setTournamentQuizId(null);navigate(`/host/${session.quizId}?sessionId=${session.id}`);}}/>
            <Modal opened={Boolean(survivalQuizId)} onClose={() => setSurvivalQuizId(null)} title="Запуск режиму виживання" centered>
                <Stack>
                    <NumberInput label="Кількість помилок до вибування" description="Учень вибуває, коли досягне цієї кількості. Таймаут також є помилкою." value={survivalMistakes} onChange={setSurvivalMistakes} min={1} max={100} allowDecimal={false} allowNegative={false} />
                    <Button color="red" disabled={!Number.isInteger(survivalMistakes) || survivalMistakes < 1 || survivalMistakes > 100} onClick={() => {
                        const quizId = survivalQuizId;
                        setSurvivalQuizId(null);
                        launchQuiz(quizId, `?mode=SURVIVAL&mistakes=${survivalMistakes}`);
                    }}>Запустити виживання</Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
