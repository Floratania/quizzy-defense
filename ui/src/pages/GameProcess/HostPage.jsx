import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import PlayersList from "../../components/Host/PlayersList.jsx";
import Preview from "../../components/Host/Preview.jsx";
import Question from "../../components/Host/Question.jsx";
import HostLeaderBoard from "../../components/Host/HostLeaderBoard.jsx";

import { useSession } from "../../hooks/useSession.js";
import { useGameHost } from "../../hooks/useGameHost.js";
import { Badge, Box, Container, Group, Loader, Paper, Progress, Stack, Text, Title } from "@mantine/core";
import Result from "../../components/Host/Result.jsx";
import LeaderboardScreen from "../../components/LeaderboardScreen.jsx";
import TournamentBoard from "../../components/Host/TournamentBoard.jsx";
import SessionEventLog from '../../components/Host/SessionEventLog.jsx';


export default function HostPage() {
    console.log("HOST PAGE MOUNTED");
    const { quizId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // session is allowed to be null initially
    const [session, setSession] = useState(null);

    const { newSession, getSession } = useSession();

    // ✅ MUST be called unconditionally
    const host = useGameHost(session?.id ?? null);

    useEffect(() => {
        if (!quizId) return;

        let active = true;

        const create = async () => {
            try {
                const existingSessionId = searchParams.get('sessionId');
                if (existingSessionId) {
                    const existing = await getSession(existingSessionId);
                    if (active) setSession(existing);
                    return;
                }
                const requestedMode = searchParams.get('mode');
                const mode = ['TEAM', 'PROGRESS', 'SURVIVAL', 'TOURNAMENT'].includes(requestedMode) ? requestedMode : 'CLASSIC';
                const teamCount = Math.max(2, Math.min(Number(searchParams.get('teamCount') || 2), 8));
                const teamAssignment = searchParams.get('teamAssignment') === 'CODES' ? 'CODES' : 'AUTO';
                const sess = await newSession({
                    quizId,
                    mode,
                    ...(mode === 'SURVIVAL' ? { survivalMistakeLimit: Math.max(1, Math.min(100, Number(searchParams.get('mistakes')) || 1)) } : {}),
                    ...(mode === 'TEAM' ? { teamCount, teamAssignment } : {}),
                    ...(mode === 'TOURNAMENT' ? { tournamentTeamCount: [4, 8].includes(teamCount) ? teamCount : 4, teamAssignment } : {}),
                });
                if (active && sess) {
                    setSession(sess);
                    navigate(`/host/${quizId}?sessionId=${sess.id}`, { replace: true });
                }
            } catch (err) {
                console.error("Failed to create session:", err);
            }
        };

        create();

        return () => {
            active = false;
        };
    }, [quizId, searchParams, navigate]);

    // ⛔ session still loading OR host still initializing
    if (!session || host.loading) {
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
                <Stack spacing="md" align="center">
                    <Loader size="xl" variant="dots" color="blue.3" />
                    <Text size="lg" color="dimmed">Ініціалізація гри...</Text>
                </Stack>
            </Box>
        );
    }

    // Destructure AFTER hooks are stable
    const {
        players,
        currentQuestionIndex,
        startGame,
        preview,
        gameStarted,
        connected,
        question,
        isGameFinished,
        results,
        timeLeft,
        leaderboard,
        teamLeaderboard,
        progress,
        tournamentState,
        nextQuestion
    } = host;



    // ---------- Render UI ----------
    const renderSession = () => {

    if (isGameFinished) {
        if (session.mode === 'TOURNAMENT') {
            return <Box p="xl" mih="100vh" bg="violet.0"><Container size="md"><Stack><TournamentBoard state={tournamentState} /><HostLeaderBoard leaderboard={leaderboard || teamLeaderboard || []} nextQuestion={null} isGameFinished /></Stack></Container></Box>;
        }
        return (
            <HostLeaderBoard
                leaderboard={leaderboard || teamLeaderboard || []}
                nextQuestion={null}
                isGameFinished
            />
        );
    }

    if (session.mode === 'PROGRESS' && gameStarted && !isGameFinished) {
        return (
            <Box p="xl" mih="100vh" style={{ background: 'linear-gradient(135deg, #dbeafe, #e9d5ff)' }}>
                <Container size="md">
                    <Paper shadow="xl" radius="xl" p="xl">
                        <Title order={2} mb="xs">Автоматичне проходження</Title>
                        <Text c="dimmed" mb="xl">Кожен учень проходить питання у власному темпі.</Text>
                        <Stack>
                            {progress.map((item) => (
                                <Paper key={item.playerId} withBorder p="md">
                                    <Group justify="space-between" mb="xs">
                                        <Text fw={600}>{item.nickname}</Text>
                                        <Badge color="orange" variant="light">Виходи / фокус: {players.find((p) => p.id === item.playerId)?.integrityEvents || 0}</Badge>
                                        <Badge color={item.completed ? 'green' : 'blue'}>{item.completed ? 'Завершено' : `${item.current}/${item.total}`}</Badge>
                                    </Group>
                                    <Progress value={item.percent} color={item.completed ? 'green' : 'blue'} size="lg" animated />
                                </Paper>
                            ))}
                        </Stack>
                    </Paper>
                </Container>
            </Box>
        );
    }

    if (results) {
        return <Result results={results} />;
    }


    if (leaderboard && !isGameFinished) {
        if (session.mode === 'TOURNAMENT') {
            return (
                <Box p="xl" mih="100vh" bg="violet.0">
                    <Container size="md"><Stack>
                        <TournamentBoard state={tournamentState} />
                        <LeaderboardScreen mode="host" leaderboard={leaderboard} onNext={nextQuestion} isGameFinished={false} />
                    </Stack></Container>
                </Box>
            );
        }
        return (
            <LeaderboardScreen
                mode="host"
                leaderboard={leaderboard}
                onNext={nextQuestion}
                isGameFinished={isGameFinished}
            />
        );
    }

    if (question) {
        return (
            <Question
                question={question}
                players={players}
                currentQuestionIndex={currentQuestionIndex}
                timeLeft={timeLeft}
                teamLeaderboard={teamLeaderboard}
                tournamentState={tournamentState}
            />
        );
    }

    if (preview) {
        return <Preview preview={preview} />;
    }

    if (!gameStarted && connected) {
        return (
            <PlayersList
                players={players}
                sessionId={session.id}
                startGame={startGame}
                roomCode={session.roomCode}
                mode={session.mode}
                teams={session.teams || []}
                teamAssignment={session.settings?.teamAssignment || 'AUTO'}
            />
        );
    }

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
            <Stack spacing="md" align="center">
                <Loader size="xl" variant="dots" color="blue.3" />
                <Text size="lg" color="dimmed">Initializing game...</Text>
            </Stack>
        </Box>
    );
    };

    return <><Container size="xl" py="xs"><Text size="xs" c="dimmed">{session.settings?.trackTabSwitches ? 'Фіксація виходів і втрати фокуса ввімкнена. Події — у журналі нижче.' : 'Фіксація виходів вимкнена для цього сеансу. Увімкніть її в налаштуваннях квізу перед наступним запуском.'}</Text></Container>{renderSession()}<Container size="xl"><SessionEventLog events={host.sessionEvents} /></Container></>;
}
