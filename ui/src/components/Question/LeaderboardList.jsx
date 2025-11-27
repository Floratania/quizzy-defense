import { Paper, Group, Text, Avatar, Badge, Stack } from "@mantine/core";

const medals = ["🥇", "🥈", "🥉"];
const avatarColors = ["blue", "purple", "pink", "cyan", "teal", "orange"];

export function LeaderboardList({ leaderboard, highlightNickname = null }) {
    return (
        <Stack spacing="md">
            {leaderboard.map((player, idx) => {
                const isTopThree = idx < 3;
                const isCurrentPlayer = highlightNickname === player.nickname;

                return (
                    <Paper
                        key={player.id}
                        shadow="sm"
                        radius="lg"
                        p="lg"
                        style={{
                            background: isTopThree
                                ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                                : isCurrentPlayer
                                    ? "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 100%)"
                                    : "white",
                            border: isCurrentPlayer ? "2px solid #60a5fa" : "1px solid #e5e7eb",
                        }}
                    >
                        <Group justify="space-between">
                            <Group>
                                <Text
                                    size="xl"
                                    fw={700}
                                    style={{ width: 50, textAlign: "center" }}
                                >
                                    {isTopThree ? medals[idx] : `${idx + 1}.`}
                                </Text>

                                <Avatar
                                    size="lg"
                                    radius="xl"
                                    color={avatarColors[idx % avatarColors.length]}
                                    variant="gradient"
                                    gradient={{
                                        from: `${avatarColors[idx % avatarColors.length]}.3`,
                                        to: `${avatarColors[idx % avatarColors.length]}.5`,
                                    }}
                                >
                                    {player.nickname[0].toUpperCase()}
                                </Avatar>

                                <div>
                                    <Group gap="xs">
                                        <Text size="lg" fw={600}>
                                            {player.nickname}
                                        </Text>
                                        {isCurrentPlayer && (
                                            <Badge size="sm" color="blue" variant="light">
                                                You
                                            </Badge>
                                        )}
                                    </Group>

                                    <Text size="sm" c="dimmed">
                                        {player.totalScore} points
                                    </Text>
                                </div>
                            </Group>

                            <Badge
                                size="xl"
                                variant="gradient"
                                gradient={
                                    isTopThree
                                        ? { from: "amber.4", to: "yellow.5" }
                                        : { from: "gray.4", to: "gray.6" }
                                }
                            >
                                {player.totalScore}
                            </Badge>
                        </Group>
                    </Paper>
                );
            })}
        </Stack>
    );
}
