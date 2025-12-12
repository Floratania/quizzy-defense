import {
    Box,
    Container,
    Paper,
    Stack,
    Group,
    Title,
    ThemeIcon,
    Button,
    Text
} from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";
import {LeaderboardList} from "./Question/LeaderboardList.jsx";

export default function LeaderboardScreen({
                                              leaderboard,
                                              mode = "player",        // "host" | "player"
                                              highlightNickname = null,
                                              onNext = null,          // only for host
                                              isGameFinished = false,
                                          }) {
    const isHost = mode === "host";
    const bg =
        mode === "player"
            ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)"
            : "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)";

    const title = "Таблиця лідерів";
    const subtitle = isHost
        ? "Гравці ранжовані за балами"
        : "Чудова робота, друзі!";

    return (
        <Box
            style={{
                minHeight: "100vh",
                background: bg,
                padding: "2rem",
            }}
        >
            <Container size="md">
                <Stack gap="xl">
                    {/* HEADER */}
                    <Paper shadow="xl" radius="xl" p="xl" style={{ background: "white", textAlign: "center" }}>
                        <Stack spacing="md" align="center">
                            <ThemeIcon size={80} radius="xl" variant="gradient"
                                       gradient={{ from: "amber.4", to: "yellow.5" }}>
                                <IconTrophy size={40} />
                            </ThemeIcon>

                            <div>
                                <Title order={1} style={{ color: "#1f2937" }}>
                                    {title}
                                </Title>
                                <Text size="lg" c="dimmed">
                                    {subtitle}
                                </Text>
                            </div>
                        </Stack>
                    </Paper>

                    {/* LIST */}
                    <Paper shadow="xl" radius="xl" p="xl" style={{ background: "white" }}>
                        <LeaderboardList
                            leaderboard={leaderboard}
                            highlightNickname={highlightNickname}
                        />
                    </Paper>

                    {/* HOST BUTTON */}
                    {isHost && !isGameFinished && (
                        <Button
                            size="lg"
                            radius="lg"
                            variant="gradient"
                            gradient={{ from: "blue", to: "purple" }}
                            onClick={onNext}
                            fullWidth
                        >
                            Продовжити
                        </Button>
                    )}

                    {/* PLAYER FOOTER */}
                    {!isHost && (
                        <Text size="sm" c="dimmed" ta="center">
                            Очікування наступного питання…
                        </Text>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}