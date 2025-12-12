import React from 'react';
import { Box, Container, Text, Center } from '@mantine/core';
import {PlayerGameProvider, usePlayerGameContext} from "../context/PlayerGameContext.jsx";
import {PlayerLeaderboard} from "../components/PlayerPage/PlayerLeaderboard.jsx";
import {AnswerResultScreen} from "../components/PlayerPage/AnswerResultScreen.jsx";
import {QuestionScreen} from "../components/PlayerPage/QuestionScreen.jsx";
import {PreviewScreen} from "../components/PlayerPage/PreviewScreen.jsx";
import {WaitingScreen} from "../components/PlayerPage/WaitingScreen.jsx";
import LeaderboardScreen from "../components/LeaderboardScreen.jsx";

const PlayerPageContent = () => {
    const { player, nickname, sessionId } = usePlayerGameContext();

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

    if (player.leaderboard) {
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
        return <QuestionScreen question={player.question} />;
    }

    if (player.preview) {
        return <PreviewScreen />;
    }

    return <WaitingScreen nickname={nickname} />;
};

export default function PlayerPage() {
    return (
        <PlayerGameProvider>
            <PlayerPageContent />
        </PlayerGameProvider>
    );
}