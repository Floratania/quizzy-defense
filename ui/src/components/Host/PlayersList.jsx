import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Container,
    Divider,
    Grid,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
    Title,
    CopyButton,
} from "@mantine/core";
import { IconPlayerPlay, IconUsers, IconCopy } from "@tabler/icons-react";
import React from "react";

export default function PlayersList({ players, sessionId, startGame, roomCode }) {
    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                padding: "2rem",
            }}
        >
            <Container size="lg">
                <Paper shadow="lg" radius="xl" p="xl" style={{ background: "white" }}>
                    <Stack spacing="xl">

                        {/* ROOM CODE BLOCK */}
                        <Center>
                            <Stack spacing="xs" align="center">
                                <Text size="lg" weight={600} color="dimmed">
                                    Join with code
                                </Text>

                                <Group spacing="xs">
                                    <Badge
                                        size="xl"
                                        radius="md"
                                        color="violet"
                                        variant="filled"
                                        style={{ fontSize: "1.8rem", padding: "1rem 1.4rem" }}
                                    >
                                        {roomCode || "------"}
                                    </Badge>

                                    <CopyButton value={roomCode || ""}>
                                        {({ copied, copy }) => (
                                            <Button
                                                variant="light"
                                                size="md"
                                                color={copied ? "green" : "violet"}
                                                leftSection={<IconCopy size={16} />}
                                                onClick={copy}
                                            >
                                                {copied ? "Copied!" : "Copy"}
                                            </Button>
                                        )}
                                    </CopyButton>
                                </Group>

                                <Text color="dimmed" size="sm">
                                    Players join at:<br/>
                                    <strong>yourapp.com/play</strong>
                                </Text>
                            </Stack>
                        </Center>

                        <Divider />

                        {/* HEADER */}
                        <Group position="apart">
                            <div>
                                <Title order={2}>Waiting for Players</Title>
                                <Text color="dimmed" size="sm">
                                    Session ID: {sessionId || "Loading..."}
                                </Text>
                            </div>

                            <Badge
                                size="xl"
                                variant="gradient"
                                gradient={{ from: "blue.4", to: "purple.4" }}
                                leftSection={<IconUsers size={16} />}
                            >
                                {players?.length} Players
                            </Badge>
                        </Group>

                        {/* PLAYERS GRID */}
                        <Grid>
                            {players?.map((player, idx) => (
                                <Grid.Col key={player.id} span={6} md={4} lg={3}>
                                    <Card shadow="sm" radius="lg" p="md">
                                        <Stack spacing="xs" align="center">
                                            <Avatar
                                                size="lg"
                                                radius="xl"
                                                color={["blue", "violet", "pink", "cyan"][idx % 4]}
                                            >
                                                {player.nickname[0].toUpperCase()}
                                            </Avatar>

                                            <Text weight={600} size="sm" align="center">
                                                {player.nickname}
                                            </Text>
                                        </Stack>
                                    </Card>
                                </Grid.Col>
                            ))}
                        </Grid>

                        {/* EMPTY STATE */}
                        {players?.length === 0 && (
                            <Center py="xl">
                                <Stack spacing="sm" align="center">
                                    <Loader variant="dots" size="lg" />
                                    <Text color="dimmed">Waiting for players to join...</Text>
                                </Stack>
                            </Center>
                        )}

                        {/* START BUTTON */}
                        <Button
                            size="lg"
                            radius="lg"
                            variant="gradient"
                            gradient={{ from: "blue.4", to: "purple.4" }}
                            leftSection={<IconPlayerPlay size={20} />}
                            onClick={startGame}
                            disabled={players?.length === 0}
                            fullWidth
                        >
                            Start Game
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
