import { useEffect, useState } from 'react';
import { Alert, Box, Button, Container, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { PlayerGameProvider, PracticeProvider, usePlayerGameContext } from '../context/PlayerGameContext.jsx';
import { QuestionScreen } from '../components/PlayerPage/QuestionScreen.jsx';
import RichText from '../components/Question/RichText.jsx';
import { gradePractice, playablePractice } from '../utils/practiceQuiz.js';

export function MistakePracticeContent({savedResult}) {
    const context = usePlayerGameContext();
    const player=context.player||{};
    const sessionId=savedResult?'saved':context.sessionId;
    const returnTo=savedResult?'/student':'/player';
    const [index, setIndex] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const [grade, setGrade] = useState(null);
    const [corrected, setCorrected] = useState({});
    const [waitExpired, setWaitExpired] = useState(false);
    useEffect(() => { const timer = setTimeout(() => setWaitExpired(true), 10000); return () => clearTimeout(timer); }, []);
    const result = savedResult || player.finalResult;
    const mistakes = result?.answers?.filter((answer) => !answer.correct) || [];
    const current = mistakes[index];
    const next = () => { setIndex((value) => value + 1); setGrade(null); setAttempt(0); };
    const retry = () => { setGrade(null); setAttempt((value) => value + 1); };

    return <Box bg="#f8f9fa" mih="100vh"><Container size="sm" py="md">
        <Stack gap="sm">
            <Group justify="space-between"><Title order={2}>Робота над помилками</Title><Button component={Link} to={returnTo} variant="default" size="sm">{savedResult?'До кабінету':'До результатів'}</Button></Group>
            <Text size="sm" c="dimmed">Повторення без таймера. Початкові бали та результати тесту не змінюються.</Text>
            {!sessionId ? <Paper withBorder p="lg"><Text>Спочатку пройди тест на цьому пристрої.</Text><Button component={Link} to="/join" mt="md">Приєднатися до тесту</Button></Paper>
                : !result ? <Paper withBorder p="lg">{!waitExpired && !player.gameFinished ? <Group><Loader size="sm" /><Text>Відновлюємо результати…</Text></Group> : <><Text>Результати поки недоступні. Дочекайся завершення сеансу або повернися до гри.</Text><Button component={Link} to={returnTo} mt="md">Повернутися до гри</Button></>}</Paper>
                : result.practiceAllowed === false ? <Alert color="gray">Робота над помилками недоступна за налаштуваннями викладача.</Alert>
                : !Array.isArray(result.answers) ? <Alert color="blue">Викладач налаштував показ лише підсумкових балів. Детальні відповіді та тренування для цього тесту недоступні.</Alert>
                : !mistakes.length ? <Paper withBorder p="lg"><Title order={3}>Помилок немає!</Title><Text mt="xs">Усі призначені питання виконано правильно.</Text></Paper>
                : !current ? <Paper withBorder p="lg"><Title order={3}>Повторення завершено</Title><Text mt="xs">Виправлено питань: {Object.keys(corrected).length} із {mistakes.length}.</Text><Button mt="md" onClick={() => { setIndex(0); setGrade(null); setAttempt(0); setCorrected({}); }}>Повторити ще раз</Button></Paper>
                : <>
                    <Text size="sm" fw={600}>Питання {index + 1} із {mistakes.length}</Text>
                    {grade === null && current.practiceQuestion ? <PracticeProvider submitAnswer={(payload) => {
                        const value = gradePractice(current.practiceQuestion, payload);
                        setGrade(value);
                        if (value === 1) setCorrected((previous) => ({ ...previous, [index]: true }));
                    }}><QuestionScreen key={`${index}:${attempt}`} question={{ ...playablePractice(current.practiceQuestion), practice: true }} /></PracticeProvider>
                        : <Paper withBorder p="md"><Stack>
                            <RichText>{current.question}</RichText>
                            {grade !== null && <Text fw={600} c={grade === 1 ? 'green' : 'orange'}>{grade === 1 ? 'Правильно!' : grade > 0 ? 'Частково правильно' : 'Поки неправильно'}</Text>}
                            <Text size="sm">У тесті ти відповів/відповіла: {current.submittedAnswer}</Text>
                            <Text size="sm" fw={600}>Правильна відповідь:</Text><RichText>{current.correctAnswer}</RichText>
                            {current.explanation && <><Text size="sm" fw={600}>Пояснення:</Text><RichText>{current.explanation}</RichText></>}
                            <Group>{current.practiceQuestion && <Button variant="light" onClick={retry}>Спробувати ще</Button>}<Button onClick={next}>{index + 1 === mistakes.length ? 'Завершити повторення' : 'Наступне питання'}</Button></Group>
                        </Stack></Paper>}
                </>}
        </Stack>
    </Container></Box>;
}

export default function MistakePracticePage() {
    return <PlayerGameProvider><MistakePracticeContent /></PlayerGameProvider>;
}
