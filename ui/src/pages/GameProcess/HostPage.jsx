import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import PlayersList from "../../components/Host/PlayersList.jsx";
import Preview from "../../components/Host/Preview.jsx";
import Question from "../../components/Host/Question.jsx";
import HostLeaderBoard from "../../components/Host/HostLeaderBoard.jsx";

import { useSession } from "../../hooks/useSession.js";
import { useGameHost } from "../../hooks/useGameHost.js";
import { Box, Loader, Stack, Text } from "@mantine/core";
import Result from "../../components/Host/Result.jsx";
import LeaderboardScreen from "../../components/LeaderboardScreen.jsx";


export default function HostPage() {
    console.log("HOST PAGE MOUNTED");
    const { quizId } = useParams();

    // session is allowed to be null initially
    const [session, setSession] = useState(null);

    const { newSession } = useSession();

    // ✅ MUST be called unconditionally
    const host = useGameHost(session?.id ?? null);

    useEffect(() => {
        if (!quizId) return;

        let active = true;

        const create = async () => {
            try {
                const sess = await newSession({ quizId });
                if (active) setSession(sess);
            } catch (err) {
                console.error("Failed to create session:", err);
            }
        };

        create();

        return () => {
            active = false;
        };
    }, [quizId]);

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
        nextQuestion
    } = host;



    // ---------- Render UI ----------

    if (results) {
        return <Result results={results} />;
    }


    if (leaderboard && !isGameFinished) {
        return (
            <LeaderboardScreen
                mode="host"
                leaderboard={leaderboard}
                onNext={nextQuestion}
                isGameFinished={isGameFinished}
            />
        );
    }

    if (leaderboard && isGameFinished) {
        return (
            <HostLeaderBoard
                leaderboard={leaderboard}
                nextQuestion={null}
                isGameFinished={true}
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
}
