import { useSessionIntegrity } from '../hooks/useSessionIntegrity.js';
import React, { useEffect } from 'react';
import { socket } from '../ws/socket.js';
import { Alert, Badge, Box, Button, Container, Text, Center, Paper, Stack, ThemeIcon, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import RichText from '../components/Question/RichText.jsx';
import { IconCircleCheck, IconEye, IconX } from '@tabler/icons-react';
import {PlayerGameProvider, usePlayerGameContext} from "../context/PlayerGameContext.jsx";
import {PlayerLeaderboard} from "../components/PlayerPage/PlayerLeaderboard.jsx";
import {AnswerResultScreen} from "../components/PlayerPage/AnswerResultScreen.jsx";
import {QuestionScreen} from "../components/PlayerPage/QuestionScreen.jsx";
import {PreviewScreen} from "../components/PlayerPage/PreviewScreen.jsx";
import {WaitingScreen} from "../components/PlayerPage/WaitingScreen.jsx";
import LeaderboardScreen from "../components/LeaderboardScreen.jsx";

const PlayerPageContent = () => {
    const { player, nickname, sessionId, teamName } = usePlayerGameContext();
    useEffect(() => {
        if (player.settings?.requireFullscreen && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    }, [player.settings?.requireFullscreen, player.settings?.trackTabSwitches]);

    useSessionIntegrity({ enabled: player.settings?.trackTabSwitches, finished: player.gameFinished || player.playerCompleted, sessionId, playerId: localStorage.getItem('playerId') });

    if (!sessionId) {
        return (
            <Box
                style={{
                    minHeight: "100vh",
                    background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                <Container size="md">
                    <Center>
                        <Text size="xl" c="dimmed">
                            No session found. Please join a game first.
                        </Text>
                    </Center>
                </Container>
            </Box>
        );
    }

    if (player.gameFinished || player.playerCompleted) {
        return (
            <Center mih="80vh" p="xl" style={{ background: 'linear-gradient(135deg, #d1fae5, #dbeafe)' }}>
                <Paper shadow="xl" radius="xl" p={50} maw={620} ta="center">
                    <Stack align="center">
                        <ThemeIcon size={90} radius="xl" color="green"><IconCircleCheck size={50}/></ThemeIcon>
                        <Title>Тест завершено!</Title>
                        {player.finalResult?.practiceAllowed && <Button component={Link} to="/mistake-practice" variant="light">Робота над помилками</Button>}
                        <Text size="xl">Дякуємо, {nickname}, за проходження тесту.</Text>
                        <Text c="dimmed">Ваші відповіді збережено. Результати доступні ведучому.</Text>
                        {player.finalResult && <Title order={2}>Ваш результат: {player.finalResult.totalScore} балів</Title>}
                        {player.finalResult && <Badge size="xl" color={player.finalResult.passed ? 'green' : 'red'}>{player.finalResult.passed ? 'Тест складено' : 'Тест не складено'} · {player.finalResult.accuracy ?? 0}%</Badge>}
                        {player.finalResult?.answers?.length > 0 && (
                            <Stack w="100%" mt="md">
                                {player.finalResult.answers.map((answer, index) => (
                                    <Paper key={index} withBorder p="md" ta="left">
                                        <Text fw={700}>{answer.question}</Text>
                                        <Text size="sm">Ваша відповідь: {answer.submittedAnswer}</Text>
                                        {answer.explanation && <RichText>{answer.explanation}</RichText>}
                                        <Text size="sm" c={answer.correct ? 'green' : 'red'}>{answer.correct ? 'Правильно' : 'Неправильно'}</Text>
                                        {!answer.correct && <Text size="sm" c="green">Правильна відповідь: {answer.correctAnswer}</Text>}
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </Paper>
            </Center>
        );
    }

    if (player.eliminated) {
        return (
            <Center mih="100vh" p="xl" style={{ background: 'linear-gradient(135deg, #fee2e2, #e9d5ff)' }}>
                <Paper shadow="xl" radius="xl" p={50} maw={620} ta="center">
                    <Stack align="center">
                        <ThemeIcon size={90} radius="xl" color="red"><IconX size={50}/></ThemeIcon>
                        <Title>Ви вибули</Title>
                        <Text size="lg">{player.eliminationReason === 'timeout' ? 'Час на відповідь завершився.' : 'Відповідь була неправильною.'}</Text>
                        <ThemeIcon size={55} radius="xl" color="violet" variant="light"><IconEye size={28}/></ThemeIcon>
                        <Text c="dimmed">Ви залишаєтеся у грі як глядач до її завершення.</Text>
                    </Stack>
                </Paper>
            </Center>
        );
    }

    if (player.leaderboard && player.settings?.showQuestionLeaderboard === true) {
        return <LeaderboardScreen
            mode="player"
            leaderboard={player.leaderboard}
            highlightNickname={nickname}
        />
            ;
    }

    if (player.answerResult) {
        return <AnswerResultScreen answerResult={player.answerResult} />;
    }

    if (player.question) {
        return <>{player.answerError && <Alert color="red">{player.answerError}</Alert>}<QuestionScreen key={`${player.question.id}:${player.retrySequence}`} question={player.question} /></>;
    }

    if (player.preview) {
        return <PreviewScreen />;
    }

    return <WaitingScreen nickname={nickname} teamName={teamName} />;
};

export default function PlayerPage() {
    return (
        <PlayerGameProvider>
            <PlayerPageContent />
        </PlayerGameProvider>
    );
}
