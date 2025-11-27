import { Box, Container, Paper, Stack, ThemeIcon, Title, Text } from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";
import { usePlayerGameContext } from "../../context/PlayerGameContext.jsx";
import {LeaderboardList} from "../Question/LeaderboardList.jsx";

export const PlayerLeaderboard = ({ leaderboard }) => {
    const { nickname } = usePlayerGameContext();

    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)",
                padding: "2rem",
            }}
        >
            <Container size="md">
                <Stack gap="xl">

                    <Paper shadow="xl" radius="xl" p="xl" style={{ background: "white", textAlign: "center" }}>
                        <Stack spacing="md" align="center">
                            <ThemeIcon size={80} radius="xl" variant="gradient"
                                       gradient={{ from: "amber.4", to: "yellow.5" }}>
                                <IconTrophy size={40} />
                            </ThemeIcon>
                            <div>
                                <Title order={1}>Leaderboard</Title>
                                <Text size="lg" c="dimmed">Great job everyone!</Text>
                            </div>
                        </Stack>
                    </Paper>

                    <Paper shadow="xl" radius="xl" p="xl" style={{ background: "white" }}>
                        <LeaderboardList
                            leaderboard={leaderboard}
                            highlightNickname={nickname}
                        />
                    </Paper>

                    <Text size="sm" c="dimmed" ta="center">Waiting for next question…</Text>
                </Stack>
            </Container>
        </Box>
    );
};
