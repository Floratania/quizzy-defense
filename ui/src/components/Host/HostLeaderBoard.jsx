import { Box, Container, Paper, Stack, Group, Title, ThemeIcon, Button } from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";
import {LeaderboardList} from "../Question/LeaderboardList.jsx";

export default function HostLeaderBoard({ leaderboard, nextQuestion, isGameFinished }) {
    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                padding: "2rem",
            }}
        >
            <Container size="md">
                <Paper shadow="xl" radius="xl" p="xl" style={{ background: "white" }}>
                    <Stack spacing="xl">
                        <Group justify="center">
                            <ThemeIcon size="xl" radius="xl" variant="gradient"
                                       gradient={{ from: "amber.3", to: "amber.5" }}>
                                <IconTrophy size={28} />
                            </ThemeIcon>
                            <Title order={1}>Leaderboard</Title>
                        </Group>

                        <LeaderboardList leaderboard={leaderboard} />

                        {!isGameFinished && (
                            <Button
                                size="lg"
                                radius="lg"
                                variant="gradient"
                                gradient={{ from: "blue", to: "purple" }}
                                onClick={nextQuestion}
                                fullWidth
                            >
                                Next Question
                            </Button>
                        )}
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
